export type OfflineAttachmentUploadJob = {
  id: string;
  userId: string;
  accountId: string;
  sharedAccountId?: string | null;
  transactionId: string;
  file: Blob;
  fileName: string;
  fileSize: number;
  mimeType: string;
  attachmentType: 'image' | 'pdf';
  previousAttachmentPath?: string | null;
  queuedAt: string;
  updatedAt: string;
  retryCount?: number;
  status?: 'pending' | 'failed';
};

const DB_NAME = 'dompetcerdas-offline-attachments';
const DB_VERSION = 1;
const STORE_NAME = 'attachmentUploads';

const isBrowser = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

const openDatabase = async (): Promise<IDBDatabase> => {
  if (!isBrowser()) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('scope', ['userId', 'accountId'], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> => {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    Promise.resolve(executor(store))
      .then((result) => {
        transaction.oncomplete = () => {
          database.close();
          resolve(result);
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
        };
      })
      .catch((error) => {
        database.close();
        reject(error);
      });
  });
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

export const getOfflineAttachmentUploadJobId = (userId: string, accountId: string, transactionId: string) =>
  `${userId}:${accountId}:${transactionId}`;

export const putOfflineAttachmentUploadJob = async (job: OfflineAttachmentUploadJob) => {
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.put(job));
  });
};

export const getOfflineAttachmentUploadJob = async (
  userId: string,
  accountId: string,
  transactionId: string
) => {
  const jobId = getOfflineAttachmentUploadJobId(userId, accountId, transactionId);

  return withStore('readonly', async (store) => {
    try {
      return await requestToPromise(store.get(jobId) as IDBRequest<OfflineAttachmentUploadJob | undefined>);
    } catch (error) {
      console.error('Failed to get offline attachment upload job:', error);
      return undefined;
    }
  });
};

export const getOfflineAttachmentUploadJobsForScope = async (userId: string, accountId: string) => {
  return withStore('readonly', async (store) => {
    const index = store.index('scope');
    const jobs = await requestToPromise(index.getAll([userId, accountId]) as IDBRequest<OfflineAttachmentUploadJob[]>);
    return jobs.sort((left, right) => left.queuedAt.localeCompare(right.queuedAt));
  });
};

export const getOfflineAttachmentUploadJobsForUser = async (userId: string) => {
  return withStore('readonly', async (store) => {
    const index = store.index('userId');
    const jobs = await requestToPromise(index.getAll(userId) as IDBRequest<OfflineAttachmentUploadJob[]>);
    return jobs.sort((left, right) => left.queuedAt.localeCompare(right.queuedAt));
  });
};

export const deleteOfflineAttachmentUploadJob = async (jobId: string) => {
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(jobId));
  });
};

export const deleteOfflineAttachmentUploadJobsForTransactions = async (
  userId: string,
  accountId: string,
  transactionIds: string[]
) => {
  if (transactionIds.length === 0) return;

  await withStore('readwrite', async (store) => {
    await Promise.all(
      transactionIds.map((transactionId) => (
        requestToPromise(store.delete(getOfflineAttachmentUploadJobId(userId, accountId, transactionId)))
      ))
    );
  });
};
