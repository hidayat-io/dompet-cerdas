// State global harness yang bisa dibaca & diatur dari Playwright lewat window.__harness.
export interface HarnessWrite {
  op: 'set' | 'delete';
  path: string;
  data?: Record<string, unknown>;
}

export interface HarnessNotification {
  type: string;
  title: string;
  message: string;
  autoClose?: boolean;
}

export interface HarnessTransactionCall {
  id?: string;
  amount: number;
  categoryId: string;
  date: string;
  description: string;
}

export interface HarnessState {
  // Write yang sudah di-ack "server" (urut). Write lokal langsung terlihat di
  // snapshot sebelum ack, sama seperti Firestore asli.
  writes: HarnessWrite[];
  failedWrites: HarnessWrite[];
  notifications: HarnessNotification[];
  addedTransactions: HarnessTransactionCall[];
  updatedTransactions: HarnessTransactionCall[];
  // set/delete ke path yang mengandung string ini ditolak "server" (write lokal di-rollback;
  // untuk batch, SEMUA operasi di batch ikut ditolak).
  failSetDocPathIncludes: string | null;
  failDeletePathIncludes: string | null;
  // onAddTransaction gagal SEBELUM menulis apa pun (simulasi upload lampiran gagal dsb.).
  failAddTransaction: boolean;
  // Lama ack server untuk setDoc/deleteDoc/batch, dan jeda sebelum onAddTransaction
  // menulis (meniru upload lampiran di App.addTransaction).
  writeLatencyMs: number;
  addTransactionDelayMs: number;
  // Offline: write tetap diterapkan lokal, tapi ack (promise) baru selesai setelah online.
  offline: boolean;
  // URL yang dipakai registerServiceWorker & jumlah event banner update (scenario pwa-register).
  swRegistrations: string[];
  pwaUpdateEvents: number;
  ready: boolean;
}

declare global {
  interface Window {
    __harness: HarnessState;
    __harnessUnmount?: () => void;
    // Scenario confirm-dialog: ubah state isLoading dari test.
    __harnessSetConfirmLoading?: (loading: boolean) => void;
  }
}

export const harness: HarnessState = (window.__harness ??= {
  writes: [],
  failedWrites: [],
  notifications: [],
  addedTransactions: [],
  updatedTransactions: [],
  failSetDocPathIncludes: null,
  failDeletePathIncludes: null,
  failAddTransaction: false,
  writeLatencyMs: 40,
  addTransactionDelayMs: 40,
  offline: false,
  swRegistrations: [],
  pwaUpdateEvents: 0,
  ready: false,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Tunggu "ack server": latency, lalu tahan selama offline.
export const waitForServerAck = async (latencyMs: number) => {
  await sleep(latencyMs);
  while (harness.offline) {
    await sleep(20);
  }
};
