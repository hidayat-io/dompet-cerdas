import React from 'react';
import ReactDOM from 'react-dom/client';
import { harness, waitForServerAck } from './harnessState';
import { collection as fakeCollection, doc as fakeDoc, seedCollection } from './fakes/firestore';
import { commitTransactionWrite } from '../../services/transactionWrite';
import { ThemeProvider } from '../../contexts/ThemeContext';
import QuickAddSheetLoader from '../../components/QuickAddSheetLoader';
import TransactionList from '../../components/TransactionList';
import RoutineExpenseManager from '../../components/RoutineExpenseManager';
import BudgetManager from '../../components/BudgetManager';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PWA_UPDATE_EVENT, registerServiceWorker } from '../../utils/pwa';
import type { AddTransactionOptions, Attachment, Budget, Category, Transaction, RoutineExpense } from '../../types';
import type { NotificationType } from '../../components/NotificationModal';
import type { OfflineAttachmentUploadJob } from '../../services/offlineAttachmentQueue';
import { FIXTURE_TEXT } from './fixtureText';

const params = new URLSearchParams(window.location.search);
const scenario = params.get('scenario');
// ThemeProvider membaca tema dari localStorage saat inisialisasi.
const themeParam = params.get('theme');
if (themeParam === 'dark' || themeParam === 'light') {
  localStorage.setItem('dompetcerdas_theme', themeParam);
} else {
  localStorage.removeItem('dompetcerdas_theme');
}

const pad = (value: number) => String(value).padStart(2, '0');
const now = new Date();
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const categories: Category[] = [
  { id: 'c-belanja', name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingCart', color: '#ef4444' },
  { id: 'c-makan', name: 'Makanan', type: 'EXPENSE', icon: 'Utensils', color: '#f97316' },
  { id: 'c-transport', name: 'Transportasi', type: 'EXPENSE', icon: 'Car', color: '#3b82f6' },
  { id: 'c-tagihan', name: 'Tagihan', type: 'EXPENSE', icon: 'Receipt', color: '#8b5cf6' },
  { id: 'c-kesehatan', name: 'Kesehatan', type: 'EXPENSE', icon: 'Heart', color: '#ec4899' },
  { id: 'c-hiburan', name: 'Hiburan', type: 'EXPENSE', icon: 'Film', color: '#14b8a6' },
  { id: 'c-pendidikan', name: 'Pendidikan', type: 'EXPENSE', icon: 'GraduationCap', color: '#0ea5e9' },
  { id: 'c-panjang', name: FIXTURE_TEXT.longCategory, type: 'EXPENSE', icon: 'Wallet', color: '#64748b' },
  // Tanpa transaksi, jadi muncul di grid "Semua kategori" (bukan di "Sering dipakai").
  { id: 'c-langganan', name: FIXTURE_TEXT.longGridCategory, type: 'EXPENSE', icon: 'Tv', color: '#a855f7' },
  { id: 'c-gaji', name: 'Gaji', type: 'INCOME', icon: 'Briefcase', color: '#22c55e' },
];

const tx = (id: string, categoryId: string, amount: number, description: string, createdAt: string, createdByUserId = 'u1'): Transaction => ({
  id,
  categoryId,
  amount,
  description,
  date: today,
  createdAt,
  createdByUserId,
  createdByName: createdByUserId === 'u1' ? 'Saya' : 'Anggota Lain',
});

const transactions: Transaction[] = [
  tx('t-short', 'c-makan', 25000, FIXTURE_TEXT.short, `${today}T10:00:00.000Z`),
  tx('t-medium', 'c-makan', 75000, FIXTURE_TEXT.medium, `${today}T09:30:00.000Z`),
  tx('t-long', 'c-belanja', 1250000, FIXTURE_TEXT.long, `${today}T09:00:00.000Z`),
  tx('t-unbroken', 'c-tagihan', 99000, FIXTURE_TEXT.unbroken, `${today}T08:30:00.000Z`),
  tx('t-longcat', 'c-panjang', 15000, 'Parkir', `${today}T08:00:00.000Z`),
  tx('t-24', 'c-transport', 20000, FIXTURE_TEXT.len24, `${today}T07:30:00.000Z`),
  tx('t-25', 'c-transport', 21000, FIXTURE_TEXT.len25, `${today}T07:00:00.000Z`),
  tx('t-48', 'c-transport', 22000, FIXTURE_TEXT.len48, `${today}T06:30:00.000Z`),
  tx('t-49', 'c-transport', 23000, FIXTURE_TEXT.len49, `${today}T06:00:00.000Z`),
];

const otherMemberTransaction = tx('t-other', 'c-belanja', 50000, 'Belanja titipan', `${today}T05:00:00.000Z`, 'u2');

// Lampiran tersimpan dengan nama file panjang (seperti nama file kamera/WhatsApp).
const longAttachment: Attachment = {
  url: 'https://example.com/struk.jpg',
  path: 'u1/a1/struk.jpg',
  name: FIXTURE_TEXT.longFileName,
  type: 'image',
  size: 1,
};
const withAttachment = (transaction: Transaction): Transaction => ({ ...transaction, attachment: longAttachment });

// Kategori bernama satu kata panjang tanpa spasi (hanya dipakai scenario khusus).
const unbrokenCategory: Category = { id: 'c-tanpa-spasi', name: FIXTURE_TEXT.unbrokenCategory, type: 'EXPENSE', icon: 'Tag', color: '#475569' };
const unbrokenGridCategory: Category = { id: 'c-tanpa-spasi-grid', name: FIXTURE_TEXT.unbrokenGridCategory, type: 'EXPENSE', icon: 'Tag', color: '#0f766e' };
const unbrokenCategoryTransaction = tx('t-tanpa-spasi', unbrokenCategory.id, 30000, 'Langganan', `${today}T10:00:00.000Z`);
// Nama kategori satu kata yang umum tapi panjang (11–14 huruf): tidak boleh pecah di tengah kata.
const longWordCategories = [...FIXTURE_TEXT.longWordCategories, ...FIXTURE_TEXT.slashCategories].map((name, index): Category => ({
  id: `c-kata-panjang-${index}`,
  name,
  type: 'EXPENSE',
  icon: 'Tag',
  color: '#0369a1',
}));

// Transaksi dengan lampiran bernama panjang tanpa spasi (nama file kamera). URL berupa data URL 1x1 px
// supaya preview tidak membuat request jaringan; path kosong = tidak perlu resolve lewat Storage.
const ONE_PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const cameraAttachmentTransaction: Transaction = {
  ...tx('t-lampiran', 'c-belanja', 45000, 'Belanja sayur', `${today}T10:00:00.000Z`),
  attachment: { url: ONE_PIXEL_PNG, path: '', name: FIXTURE_TEXT.longUnbrokenFileName, type: 'image', size: 1 },
};

// ConfirmDialog sendirian, label & pesan dari URL; isLoading diubah test lewat window.__harnessSetConfirmLoading.
const ConfirmDialogScenario: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    window.__harnessSetConfirmLoading = setLoading;
  }, []);
  return (
    <ConfirmDialog
      isOpen
      onClose={() => notify('info', 'closed', 'confirm')}
      onConfirm={() => notify('info', 'confirmed', 'confirm')}
      title="Konfirmasi"
      message={params.get('message') ?? 'Lanjutkan tindakan ini?'}
      confirmText={params.get('confirm') ?? undefined}
      cancelText={params.get('cancel') ?? undefined}
      isLoading={loading}
    />
  );
};

const uploadJob = (transactionId: string, fileName: string): OfflineAttachmentUploadJob => ({
  id: `u1:a1:${transactionId}`,
  userId: 'u1',
  accountId: 'a1',
  transactionId,
  file: new Blob(['x'], { type: 'image/jpeg' }),
  fileName,
  fileSize: 1,
  mimeType: 'image/jpeg',
  attachmentType: 'image',
  queuedAt: `${today}T08:00:00.000Z`,
  updatedAt: `${today}T08:00:00.000Z`,
  status: 'failed',
});

const notify = (type: NotificationType, title: string, message: string, autoClose?: boolean) => {
  harness.notifications.push({ type, title, message, autoClose });
};

const transactionsCollection = fakeCollection(
  {},
  ...(scenario === 'routine-shared' ? ['sharedAccounts', 's1', 'transactions'] : ['users', 'u1', 'accounts', 'a1', 'transactions'])
);

// Meniru App.addTransaction: jeda (upload lampiran) → tulis transaksi lewat helper yang
// SAMA dengan App (commitTransactionWrite; firebase/firestore di-alias ke fake).
const recordTransaction = async (
  amount: number,
  categoryId: string,
  date: string,
  description: string,
  _attachment?: { file: File; type: 'image' | 'pdf' },
  options?: AddTransactionOptions
) => {
  await new Promise((resolve) => setTimeout(resolve, harness.addTransactionDelayMs));
  if (harness.failAddTransaction) throw new Error('harness: upload/simpan transaksi gagal (disengaja)');
  const txRef = fakeDoc(transactionsCollection);
  await commitTransactionWrite({} as never, txRef as never, { amount, categoryId, date, description }, options);
  harness.addedTransactions.push({ amount, categoryId, date, description });
};

const recordUpdate = async (id: string, amount: number, categoryId: string, date: string, description: string) => {
  await waitForServerAck(harness.addTransactionDelayMs);
  harness.updatedTransactions.push({ id, amount, categoryId, date, description });
};

const PERSONAL_ACCOUNT = { id: 'a1' };
const SHARED_ACCOUNT = { id: 'a1', sharedAccountId: 's1' };
// Akun terpisah supaya tagihan bernama panjang tidak mengubah data scenario routine lain.
const LONG_NAME_ACCOUNT = { id: 'a2' };
const routineExpenses: RoutineExpense[] = [
  { id: 'r-listrik', name: 'Listrik PLN', amount: 350000, categoryId: 'c-tagihan', createdAt: '2026-01-01T00:00:00.000Z', createdByUserId: 'u1' },
  { id: 'r-internet', name: 'Internet', amount: 400000, categoryId: 'c-tagihan', createdAt: '2026-01-01T00:00:00.000Z', createdByUserId: 'u1' },
];

const budgets: Budget[] = [
  {
    id: 'b-harian',
    month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    name: 'Belanja Harian',
    categoryIds: ['c-belanja', 'c-makan'],
    limitAmount: 2000000,
    createdAt: `${today}T00:00:00.000Z`,
    updatedAt: `${today}T00:00:00.000Z`,
    createdByUserId: 'u1',
  },
];

const editSheet = (initialData: Transaction, latestData: Transaction, role: 'OWNER' | 'MEMBER' = 'OWNER') => (
  <QuickAddSheetLoader
    quickAddType="EXPENSE"
    categories={categories}
    transactions={transactions}
    initialData={initialData}
    latestData={latestData}
    currentUserId="u1"
    activeAccountRole={role}
    onClose={() => notify('info', 'closed', 'edit')}
    onAdd={recordTransaction}
    onUpdate={recordUpdate}
    onDelete={() => undefined}
    onShowNotification={notify}
  />
);

const quickAddSheet = (
  <QuickAddSheetLoader
    quickAddType="EXPENSE"
    categories={categories}
    transactions={transactions}
    onClose={() => notify('info', 'closed', 'quick-add')}
    onAdd={recordTransaction}
    onShowNotification={notify}
  />
);

const Scenario: React.FC<{ name: string | null }> = ({ name }) => {
  switch (name) {
    case 'quick-add':
      return quickAddSheet;
    case 'quick-add-edit':
      return editSheet(transactions[2], transactions[2]);
    case 'quick-add-conflict':
      // Versi di server berubah (nominal beda) sejak form edit dibuka.
      return editSheet(transactions[2], { ...transactions[2], amount: 999000 });
    case 'quick-add-conflict-unbroken':
      // Sama, tapi catatannya URL panjang tanpa spasi.
      return editSheet(transactions[3], { ...transactions[3], amount: 999000 });
    case 'quick-add-readonly':
      return editSheet(otherMemberTransaction, otherMemberTransaction, 'MEMBER');
    case 'quick-add-long-names':
      // Satu-satunya transaksi memakai kategori tanpa spasi → kategori itu jadi chip "Sering dipakai";
      // kategori lain (belum dipakai, termasuk nama satu kata panjang) masuk grid "Semua kategori".
      return (
        <QuickAddSheetLoader
          quickAddType="EXPENSE"
          categories={[...categories, unbrokenCategory, unbrokenGridCategory, ...longWordCategories]}
          transactions={[unbrokenCategoryTransaction]}
          onClose={() => notify('info', 'closed', 'quick-add')}
          onAdd={recordTransaction}
          onShowNotification={notify}
        />
      );
    case 'quick-add-edit-attachment':
      return editSheet(withAttachment(transactions[2]), withAttachment(transactions[2]));
    case 'quick-add-readonly-attachment':
      return editSheet(withAttachment(otherMemberTransaction), withAttachment(otherMemberTransaction), 'MEMBER');
    case 'two-sheets':
      // Dua sheet ter-mount bersamaan (edit di bawah, quick add di atas).
      return (
        <>
          <div data-sheet="edit">{editSheet(transactions[2], transactions[2])}</div>
          <div data-sheet="quick-add">{quickAddSheet}</div>
        </>
      );
    case 'transactions':
      return (
        <div style={{ padding: 16 }}>
          <TransactionList
            transactions={transactions}
            categories={categories}
            currentUserId="u1"
            activeAccountRole="OWNER"
            pendingAttachmentUploads={{
              't-long': uploadJob('t-long', 'struk.jpg'),
              't-missing': uploadJob('t-missing', FIXTURE_TEXT.longFileName),
            }}
            onRetryAttachmentUpload={async () => undefined}
            onCancelAttachmentUpload={async () => undefined}
            onDelete={() => undefined}
            onUpdate={async () => undefined}
            onShowNotification={notify}
          />
        </div>
      );
    case 'transactions-attachment':
      return (
        <div style={{ padding: 16 }}>
          <TransactionList
            transactions={[cameraAttachmentTransaction]}
            categories={categories}
            currentUserId="u1"
            activeAccountRole="OWNER"
            onDelete={() => undefined}
            onUpdate={async () => undefined}
            onShowNotification={notify}
          />
        </div>
      );
    case 'confirm-dialog':
      return <ConfirmDialogScenario />;
    case 'routine-long-name':
      return (
        <div style={{ padding: 16 }}>
          <RoutineExpenseManager
            activeAccount={LONG_NAME_ACCOUNT}
            currentUserId="u1"
            categories={categories}
            onAddTransaction={recordTransaction}
            onShowNotification={notify}
          />
        </div>
      );
    case 'transactions-unbroken-category':
      return (
        <div style={{ padding: 16 }}>
          <TransactionList
            transactions={[unbrokenCategoryTransaction]}
            categories={[...categories, unbrokenCategory]}
            currentUserId="u1"
            activeAccountRole="OWNER"
            onDelete={() => undefined}
            onUpdate={async () => undefined}
            onShowNotification={notify}
          />
        </div>
      );
    case 'routine':
    case 'routine-shared':
      return (
        <div style={{ padding: 16 }}>
          <RoutineExpenseManager
            activeAccount={name === 'routine-shared' ? SHARED_ACCOUNT : PERSONAL_ACCOUNT}
            currentUserId="u1"
            categories={categories}
            onAddTransaction={recordTransaction}
            onShowNotification={notify}
          />
        </div>
      );
    case 'budgets':
      return (
        <div style={{ padding: 16 }}>
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            categories={categories}
            currentUserId="u1"
            onSaveBudget={async () => undefined}
            onDeleteBudget={async () => undefined}
            onCopyBudgetsFromPreviousMonth={async () => undefined}
          />
        </div>
      );
    case 'pwa-register':
      return <p>pwa-register</p>;
    default:
      return <p>Scenario tidak dikenal: {String(name)}</p>;
  }
};

if (scenario === 'pwa-register') {
  // navigator.serviceWorker fake: catat URL registrasi, worker baru mencapai "installed"
  // saat sudah ada controller (kondisi banner update), dan update() gagal seperti saat offline.
  // `from`: URL SW yang aktif sebelumnya ('versioned' = URL lama /sw.js?v=..., selain itu /sw.js).
  const previousUrl = params.get('from') === 'versioned' ? 'https://app.test/sw.js?v=3.2.3' : 'https://app.test/sw.js';
  const stateListeners: Array<() => void> = [];
  const installingWorker = {
    state: 'installing',
    addEventListener: (_type: string, listener: () => void) => { stateListeners.push(listener); },
  };
  const fakeRegistration = {
    waiting: null,
    installing: installingWorker,
    addEventListener: () => undefined,
    update: () => Promise.reject(new Error('harness: update gagal (offline)')),
  };
  window.addEventListener(PWA_UPDATE_EVENT, () => { harness.pwaUpdateEvents += 1; });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller: {},
      getRegistration: async () => ({ active: { scriptURL: previousUrl } }),
      register: async (url: string) => {
        harness.swRegistrations.push(url);
        setTimeout(() => {
          installingWorker.state = 'installed';
          stateListeners.forEach((listener) => listener());
        }, 30);
        return fakeRegistration;
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
  void registerServiceWorker();
}

seedCollection('users/u1/accounts/a1/routine_expenses', routineExpenses.map((expense) => ({ ...expense })));
seedCollection('sharedAccounts/s1/routine_expenses', routineExpenses.map((expense) => ({ ...expense })));
seedCollection('users/u1/accounts/a2/routine_expenses', [
  { id: 'r-panjang', name: FIXTURE_TEXT.unbrokenBillName, amount: 250000, categoryId: 'c-tagihan', createdAt: '2026-01-01T00:00:00.000Z', createdByUserId: 'u1' },
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('root tidak ditemukan');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Scenario name={scenario} />
    </ThemeProvider>
  </React.StrictMode>
);
window.__harnessUnmount = () => root.unmount();

document.fonts.ready.then(() => {
  harness.ready = true;
});
