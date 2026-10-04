import { setDoc, writeBatch, type DocumentReference, type Firestore } from 'firebase/firestore';
import type { AddTransactionOptions } from '../types';

// Tulis dokumen transaksi. Kalau ada extraWrites (mis. tanda lunas pengeluaran rutin),
// semuanya di-commit ATOMIC dalam satu batch: tersimpan semua atau tidak sama sekali.
export const commitTransactionWrite = async (
  db: Firestore,
  transactionRef: DocumentReference,
  data: Record<string, unknown>,
  options?: AddTransactionOptions
) => {
  if (options?.extraWrites) {
    const batch = writeBatch(db);
    batch.set(transactionRef, data);
    options.extraWrites(batch);
    await batch.commit();
    return;
  }
  await setDoc(transactionRef, data);
};
