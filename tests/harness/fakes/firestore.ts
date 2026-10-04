// Pengganti in-memory untuk 'firebase/firestore' di harness. Hanya API yang
// dipakai component yang diuji. Perilaku Firestore asli yang ditiru:
// - data divalidasi SINKRON (field `undefined` langsung throw, seperti SDK tanpa
//   ignoreUndefinedProperties);
// - write diterapkan lokal SEKETIKA dan snapshot langsung terpancar (latency compensation);
// - promise baru selesai setelah ack server, dan tidak selesai selama offline;
// - write yang ditolak server di-rollback dari state lokal lalu promise-nya reject;
// - writeBatch atomic: semua operasinya diterapkan/di-rollback bersama.
import { harness, waitForServerAck } from '../harnessState';

type DocData = Record<string, unknown>;
type Snapshot = { docs: Array<{ id: string; data: () => DocData }> };
type Listener = (snapshot: Snapshot) => void;

interface CollectionRef {
  type: 'collection';
  path: string;
}

interface DocumentRef {
  type: 'document';
  id: string;
  path: string;
  parentPath: string;
}

type Operation = { op: 'set'; ref: DocumentRef; data: DocData } | { op: 'delete'; ref: DocumentRef };

const store = new Map<string, Map<string, DocData>>();
const listeners = new Map<string, Set<Listener>>();

const collectionDocs = (collectionPath: string) => {
  const docs = store.get(collectionPath) ?? new Map<string, DocData>();
  store.set(collectionPath, docs);
  return docs;
};

const emit = (collectionPath: string) => {
  const docs = [...collectionDocs(collectionPath).entries()].map(([id, data]) => ({ id, data: () => data }));
  listeners.get(collectionPath)?.forEach((listener) => listener({ docs }));
};

const assertValidData = (value: unknown, fieldPath: string) => {
  if (value === undefined) {
    throw new Error(`invalid-argument: Unsupported field value: undefined (found in field ${fieldPath})`);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => assertValidData(child, fieldPath ? `${fieldPath}.${key}` : key));
  }
};

const isRejected = (operation: Operation) =>
  operation.op === 'set'
    ? !!harness.failSetDocPathIncludes && operation.ref.path.includes(harness.failSetDocPathIncludes)
    : !!harness.failDeletePathIncludes && operation.ref.path.includes(harness.failDeletePathIncludes);

// Terapkan operasi secara lokal, tunggu "ack server", rollback semuanya kalau ada yang ditolak.
const commitOperations = (operations: Operation[]): Promise<void> => {
  operations.forEach((operation) => {
    if (operation.op === 'set') assertValidData(operation.data, '');
  });

  const previous = operations.map((operation) => ({
    operation,
    before: collectionDocs(operation.ref.parentPath).get(operation.ref.id),
  }));
  const touched = new Set<string>();
  operations.forEach((operation) => {
    const docs = collectionDocs(operation.ref.parentPath);
    if (operation.op === 'set') docs.set(operation.ref.id, operation.data);
    else docs.delete(operation.ref.id);
    touched.add(operation.ref.parentPath);
  });
  touched.forEach(emit);

  return (async () => {
    await waitForServerAck(harness.writeLatencyMs);
    if (operations.some(isRejected)) {
      [...previous].reverse().forEach(({ operation, before }) => {
        const docs = collectionDocs(operation.ref.parentPath);
        if (before === undefined) docs.delete(operation.ref.id);
        else docs.set(operation.ref.id, before);
      });
      touched.forEach(emit);
      operations.forEach((operation) => harness.failedWrites.push({ op: operation.op, path: operation.ref.path }));
      throw new Error('harness: write ditolak server (disengaja)');
    }
    operations.forEach((operation) => {
      harness.writes.push(operation.op === 'set'
        ? { op: 'set', path: operation.ref.path, data: operation.data }
        : { op: 'delete', path: operation.ref.path });
    });
  })();
};

export const seedCollection = (collectionPath: string, docs: Array<DocData & { id: string }>) => {
  const target = collectionDocs(collectionPath);
  docs.forEach((data) => target.set(data.id, data));
};

export const collection = (_db: unknown, ...segments: string[]): CollectionRef => ({
  type: 'collection',
  path: segments.join('/'),
});

export const doc = (parent: CollectionRef, id?: string): DocumentRef => {
  const docId = id ?? `auto_${Math.random().toString(36).slice(2, 10)}`;
  return { type: 'document', id: docId, path: `${parent.path}/${docId}`, parentPath: parent.path };
};

// Sengaja bukan `async`: validasi gagal harus throw sinkron seperti SDK asli.
export const setDoc = (ref: DocumentRef, data: DocData): Promise<void> => commitOperations([{ op: 'set', ref, data }]);

export const deleteDoc = (ref: DocumentRef): Promise<void> => commitOperations([{ op: 'delete', ref }]);

export const writeBatch = (_db: unknown) => {
  const operations: Operation[] = [];
  const batch = {
    set(ref: DocumentRef, data: DocData) {
      assertValidData(data, '');
      operations.push({ op: 'set', ref, data });
      return batch;
    },
    delete(ref: DocumentRef) {
      operations.push({ op: 'delete', ref });
      return batch;
    },
    commit: () => commitOperations(operations),
  };
  return batch;
};

export const onSnapshot = (ref: CollectionRef, onNext: Listener): (() => void) => {
  const set = listeners.get(ref.path) ?? new Set<Listener>();
  set.add(onNext);
  listeners.set(ref.path, set);
  queueMicrotask(() => emit(ref.path));
  return () => {
    set.delete(onNext);
  };
};
