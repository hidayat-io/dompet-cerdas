import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, writeBatch, getDocs, getDoc, updateDoc, orderBy, limit
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';

import { INITIAL_CATEGORIES, APP_VERSION } from './constants';
import { Budget, Category, DebtPayment, DebtRecord, DebtStatus, FinancialAccount, Plan, PlanItem, PlanItemStatus, SharedAccountMember, Transaction } from './types';
import type { NotificationType } from './components/NotificationModal';

import IconDisplay from './components/IconDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './contexts/ThemeContext';
import { activateServiceWorkerUpdate, PWA_UPDATE_EVENT } from './utils/pwa';

const perfMark = (name: string) => {
  try {
    performance.mark(name);
    const t = Math.round(performance.now());
    console.log(`[perf] ${name} @ ${t}ms`);
  } catch {}
};

// MUI Components
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';

import {
  AccountScopedCollectionName,
  DEFAULT_ACCOUNT_NAME,
  createAccountPayload,
  getAccountDocRef,
  getAccountsCollectionRef,
  getBudgetsCollectionRef,
  getCategoriesCollectionRef,
  getDebtsCollectionRef,
  getLegacySimulationsCollectionRef,
  getPlansCollectionRef,
  getScopedCollectionRefForAccount,
  getScopedStoragePath,
  getSharedAccountDocRef,
  getSharedAccountMembersCollectionRef,
  getTransactionsCollectionRef,
  getUserDocRef
} from './services/accountService';
import { callCloudFunction, deleteFileFromStorage, getLegacyStoragePathFromUrl, uploadFileToStorage } from './services/firebaseRuntime';
import { readCachedSnapshot, writeCachedSnapshot, clearCachedSnapshot, CachedSnapshot } from './services/startupCache';
import {
  deleteOfflineAttachmentUploadJob,
  deleteOfflineAttachmentUploadJobsForTransactions,
  getOfflineAttachmentUploadJob,
  getOfflineAttachmentUploadJobId,
  getOfflineAttachmentUploadJobsForScope,
  getOfflineAttachmentUploadJobsForUser,
  type OfflineAttachmentUploadJob,
  putOfflineAttachmentUploadJob,
} from './services/offlineAttachmentQueue';
import {
  clearPendingCategoryCacheRefresh,
  enqueueStorageCleanup,
  flushStorageCleanupQueue,
  hasPendingCategoryCacheRefresh,
  hasPendingStorageCleanup,
  markCategoryCacheRefreshPending,
} from './services/offlineQueue';
import { getNormalizedBudget, getPreviousMonthKey } from './utils/budget';

// ... (skip content)

type View = 'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'PLANS' | 'BUDGETS' | 'DEBTS' | 'ROUTINE_EXPENSES' | 'AI_ADVISOR' | 'SETTINGS';

type UserMeta = {
  activeAccountId?: string;
  accountMigrationVersion?: number;
  accountMigrationCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TelegramLinkMeta = {
  defaultAccountId?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
};

type QuickAddType = 'INCOME' | 'EXPENSE';

const MIGRATION_BATCH_SIZE = 400;
// Naikkan versi ini hanya bila logika migrasi legacy berubah dan perlu
// dijalankan ulang untuk semua user. Jangan naikkan untuk perubahan biasa.
const ACCOUNT_MIGRATION_VERSION = 1;
const DEFAULT_PLAN_ITEM_STATUS: PlanItemStatus = 'PLANNED';

const Dashboard = lazy(() => import('./components/Dashboard'));
const BudgetManager = lazy(() => import('./components/BudgetManager'));
const TransactionList = lazy(() => import('./components/TransactionList'));
const CategoryManager = lazy(() => import('./components/CategoryManager'));
const PlanManager = lazy(() => import('./components/PlanManager'));
const DebtManager = lazy(() => import('./components/DebtManager'));
const RoutineExpenseManager = lazy(() => import('./components/RoutineExpenseManager'));
const Settings = lazy(() => import('./components/Settings'));
const AiAdvisor = lazy(() => import('./components/AiAdvisor'));
const LinkTelegram = lazy(() => import('./components/LinkTelegram'));
const AuthLogin = lazy(() => import('./components/AuthLogin'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const NotificationModal = lazy(() => import('./components/NotificationModal'));
const QuickAddSheetLoader = lazy(() => import('./components/QuickAddSheetLoader'));

// Prefetch high-probability next routes (called on idle after dashboard mount).
// import() hits the same module cache React.lazy uses, so a later render is instant.
const prefetchLazyRoutes = () => {
  void import('./components/TransactionList');
  void import('./components/BudgetManager');
  void import('./components/Settings');
};

const getNormalizedDebtStatus = (amount: number, paidAmount: number, status?: DebtStatus): DebtStatus => {
  if (status === 'PAID' || paidAmount >= amount) return 'PAID';
  if (status === 'PARTIAL' || paidAmount > 0) return 'PARTIAL';
  return 'UNPAID';
};

const normalizeDebtRecord = (debtId: string, rawDebt: Partial<DebtRecord>): DebtRecord => {
  const amount = typeof rawDebt.amount === 'number' ? rawDebt.amount : 0;
  const paidAmount = typeof rawDebt.paidAmount === 'number' ? Math.max(0, rawDebt.paidAmount) : 0;
  const payments = Array.isArray(rawDebt.payments)
    ? rawDebt.payments
      .map((payment) => payment as DebtPayment)
      .filter((payment) => payment && typeof payment.amount === 'number' && typeof payment.date === 'string')
      .sort((left, right) => right.date.localeCompare(left.date))
    : [];
  const normalizedPaidAmount = Math.min(amount, Math.max(paidAmount, payments.reduce((total, payment) => total + payment.amount, 0)));
  const remainingAmount = Math.max(amount - normalizedPaidAmount, 0);

  return {
    id: debtId,
    kind: rawDebt.kind === 'RECEIVABLE' ? 'RECEIVABLE' : 'DEBT',
    personName: rawDebt.personName || '',
    title: rawDebt.title || '',
    amount,
    paidAmount: normalizedPaidAmount,
    remainingAmount,
    status: getNormalizedDebtStatus(amount, normalizedPaidAmount, rawDebt.status),
    transactionDate: rawDebt.transactionDate || new Date().toISOString().split('T')[0],
    dueDate: rawDebt.dueDate,
    notes: rawDebt.notes,
    payments,
    createdAt: rawDebt.createdAt || new Date().toISOString(),
    updatedAt: rawDebt.updatedAt || rawDebt.createdAt || new Date().toISOString(),
  };
};

const commitBatchOperations = async (operations: Array<(batch: ReturnType<typeof writeBatch>) => void>) => {
  for (let index = 0; index < operations.length; index += MIGRATION_BATCH_SIZE) {
    const batch = writeBatch(db);
    operations.slice(index, index + MIGRATION_BATCH_SIZE).forEach((operation) => operation(batch));
    await batch.commit();
  }
};

const normalizePlanItem = (item: Partial<PlanItem> & { id: string }): PlanItem => ({
  id: item.id,
  name: item.name || '',
  amount: typeof item.amount === 'number' ? item.amount : 0,
  type: item.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
  categoryId: item.categoryId || '',
  status: item.status || DEFAULT_PLAN_ITEM_STATUS,
  ...(item.plannedDate !== undefined ? { plannedDate: item.plannedDate } : {}),
  ...(item.createdByUserId !== undefined ? { createdByUserId: item.createdByUserId } : {}),
  ...(item.createdByName !== undefined ? { createdByName: item.createdByName } : {}),
});

const serializePlanItemForFirestore = (item: PlanItem): PlanItem => {
  const payload: PlanItem = {
    id: item.id,
    name: item.name,
    amount: item.amount,
    type: item.type,
    categoryId: item.categoryId,
    status: item.status,
  };

  return {
    ...payload,
    ...(item.plannedDate !== undefined ? { plannedDate: item.plannedDate } : {}),
    ...(item.createdByUserId !== undefined ? { createdByUserId: item.createdByUserId } : {}),
    ...(item.createdByName !== undefined ? { createdByName: item.createdByName } : {}),
  };
};

const ViewLoadingFallback = () => (
  <Box
    sx={{
      minHeight: 280,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.secondary',
    }}
  >
    <CircularProgress size={24} />
  </Box>
);

const normalizePlan = (planId: string, rawPlan: Partial<Plan>): Plan => ({
  id: planId,
  title: rawPlan.title || 'Rencana',
  items: Array.isArray(rawPlan.items)
    ? rawPlan.items.map((item) => normalizePlanItem(item as Partial<PlanItem> & { id: string }))
    : [],
  createdAt: rawPlan.createdAt || new Date().toISOString(),
  useCurrentMonthBalance: !!rawPlan.useCurrentMonthBalance,
  createdByUserId: rawPlan.createdByUserId,
  createdByName: rawPlan.createdByName,
});

function App() {
  useEffect(() => { perfMark('dc-app-mount'); }, []);
  const { theme, isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check if current path is /link-telegram
  const isLinkTelegramRoute = window.location.pathname === '/link-telegram';

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('EXPENSE');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showReconnectToast, setShowReconnectToast] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [showSyncCompletedToast, setShowSyncCompletedToast] = useState(false);
  const [attachmentQueueVersion, setAttachmentQueueVersion] = useState(0);
  const [pendingAttachmentUploads, setPendingAttachmentUploads] = useState<Record<string, OfflineAttachmentUploadJob>>({});
  const [attachmentQueueLoaded, setAttachmentQueueLoaded] = useState(false);
  const wasOfflineRef = useRef(isOffline);
  const isApplyingUpdateRef = useRef(false);
  const hadPendingWritesRef = useRef(false);
  const pendingSyncKeysRef = useRef(new Set<string>());
  const isFlushingAttachmentQueueRef = useRef(false);
  const isBackfillingPlanCreatorsRef = useRef(false);
  const backfilledPlanIdsRef = useRef<Set<string>>(new Set());

  // Data States (Synced with Firestore)
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [hydratedFromCache, setHydratedFromCache] = useState(false);
  const preservedCacheOnceRef = useRef(false);
  const cacheWriteTimeoutRef = useRef<number | null>(null);
  const pendingCacheSnapshotRef = useRef<CachedSnapshot | null>(null);
  const [telegramDefaultAccountId, setTelegramDefaultAccountId] = useState<string | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramReminderEnabled, setTelegramReminderEnabled] = useState<boolean>(false);
  const [telegramReminderTime, setTelegramReminderTime] = useState<string>('20:00');
  const [sharedAccountMembers, setSharedAccountMembers] = useState<SharedAccountMember[]>([]);
  const [activeSharedInviteCode, setActiveSharedInviteCode] = useState<string | null>(null);
  const activeAccountRef = useRef<FinancialAccount | null>(null);
  const lastCategorySeededAccountRef = useRef<string | null>(null);

  const normalizedBudgets = useMemo(
    () => budgets.map((budget) => getNormalizedBudget(budget, categories)),
    [budgets, categories]
  );
  const activeAccount = useMemo(
    () => accounts.find((account) => account.id === activeAccountId) || null,
    [accounts, activeAccountId]
  );
  const isOperationalSharedAccount = useMemo(
    () => !!activeAccount?.sharedAccountId && sharedAccountMembers.length > 1,
    [activeAccount?.sharedAccountId, sharedAccountMembers.length]
  );
  useEffect(() => {
    activeAccountRef.current = activeAccount;
  }, [activeAccount]);
  const currentUserLabel = user?.displayName || user?.email || 'Member';
  const themeToggleButton = (
    <Tooltip title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'} arrow>
      <IconButton
        size="small"
        onClick={toggleTheme}
        aria-label={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          bgcolor: isDark ? 'rgba(148, 163, 184, 0.14)' : theme.colors.accentLight,
          color: isDark ? '#f8fafc' : theme.colors.accent,
          border: `1px solid ${theme.colors.border}`,
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(148, 163, 184, 0.22)' : theme.colors.accentLight,
            transform: 'translateY(-1px)',
          },
        }}
      >
        <IconDisplay name={isDark ? 'Sun' : 'Moon'} size={18} />
      </IconButton>
    </Tooltip>
  );
  const themeToggleTextButton = (
    <Button
      size="small"
      onClick={toggleTheme}
      startIcon={<IconDisplay name={isDark ? 'Sun' : 'Moon'} size={14} />}
      sx={{
        minWidth: 'auto',
        px: 1.2,
        py: 0.35,
        borderRadius: 999,
        textTransform: 'none',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: 0,
        color: isDark ? theme.colors.textPrimary : theme.colors.accent,
        bgcolor: isDark ? 'rgba(148, 163, 184, 0.14)' : theme.colors.accentLight,
        border: `1px solid ${theme.colors.border}`,
        alignSelf: 'flex-start',
        '&:hover': {
          bgcolor: isDark ? 'rgba(148, 163, 184, 0.22)' : theme.colors.accentLight,
          transform: 'translateY(-1px)',
        },
      }}
    >
      {isDark ? 'Mode terang' : 'Mode gelap'}
    </Button>
  );

  useEffect(() => {
    if (!user || !activeAccountId || accountLoading) {
      return;
    }

    if (categories.length > 0) {
      lastCategorySeededAccountRef.current = activeAccountId;
      return;
    }

    if (lastCategorySeededAccountRef.current === activeAccountId) {
      return;
    }

    let cancelled = false;

    const seedCategoriesIfNeeded = async () => {
      try {
        await callCloudFunction('refreshCategoryCache', {});
        if (!cancelled) {
          lastCategorySeededAccountRef.current = activeAccountId;
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to seed default categories for active account:', error);
        }
      }
    };

    void seedCategoriesIfNeeded();

    return () => {
      cancelled = true;
    };
  }, [user, activeAccountId, accountLoading, categories.length]);

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    autoClose?: boolean;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  const showNotification = (type: NotificationType, title: string, message: string, autoClose = true) => {
    setNotification({ isOpen: true, type, title, message, autoClose });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const updatePendingSyncKey = (key: string, hasPending: boolean) => {
    if (hasPending) {
      pendingSyncKeysRef.current.add(key);
    } else {
      pendingSyncKeysRef.current.delete(key);
    }

    const nextHasPendingWrites = pendingSyncKeysRef.current.size > 0;
    setHasPendingWrites(nextHasPendingWrites);

    if (hadPendingWritesRef.current && !nextHasPendingWrites) {
      setShowSyncCompletedToast(true);
    }

    hadPendingWritesRef.current = nextHasPendingWrites;
  };

  const requireOnline = (title: string, message: string) => {
    if (!isOffline) return true;
    showNotification('warning', title, message, true);
    return false;
  };

  const queueAttachmentCleanup = (...paths: Array<string | null | undefined>) => {
    const validPaths = paths.filter((path): path is string => typeof path === 'string' && path.length > 0);
    if (!validPaths.length) return 0;
    return enqueueStorageCleanup(validPaths);
  };

  const bumpAttachmentQueueVersion = () => {
    setAttachmentQueueVersion((currentVersion) => currentVersion + 1);
  };

  const deleteAttachmentPath = async (path?: string | null) => {
    if (!path) return false;

    if (isOffline) {
      queueAttachmentCleanup(path);
      return false;
    }

    try {
      await deleteFileFromStorage(path);
      return true;
    } catch (error) {
      console.error('Failed to delete attachment, queued for retry:', error);
      queueAttachmentCleanup(path);
      return false;
    }
  };

  const isPermissionDeniedError = (error: unknown) => {
    if (typeof error === 'object' && error && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
      const code = String((error as { code?: string }).code);
      if (/permission-denied/i.test(code)) return true;
    }
    const message = error instanceof Error ? error.message : String(error);
    return /permission-denied|missing or insufficient permissions/i.test(message);
  };

  const pickFallbackAccount = (accountList: FinancialAccount[], excludedAccountId?: string | null) =>
    accountList.find((account) => account.id !== excludedAccountId && !account.sharedAccountId) ||
    accountList.find((account) => account.id !== excludedAccountId) ||
    null;

  const getFallbackAccessibleAccount = () =>
    pickFallbackAccount(accounts, activeAccountRef.current?.id);

  const persistActiveAccountSelection = async (accountId: string) => {
    if (!user || !accountId) return;
    await setDoc(getUserDocRef(db, user.uid), {
      activeAccountId: accountId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  };

  const getAttachmentPathFromTransaction = (transaction?: Transaction | null) => {
    if (transaction?.attachment?.path) return transaction.attachment.path;
    if (transaction?.attachmentUrl) return getLegacyStoragePathFromUrl(transaction.attachmentUrl);
    return null;
  };

  const queueOfflineAttachmentUpload = async (
    transactionId: string,
    attachment: { file: File; type: 'image' | 'pdf' },
    previousAttachmentPath?: string | null
  ) => {
    if (!user || !activeAccount) return;

    const existingJob = await getOfflineAttachmentUploadJob(user.uid, activeAccount.id, transactionId);
    const queuedAt = existingJob?.queuedAt || new Date().toISOString();

    await putOfflineAttachmentUploadJob({
      id: getOfflineAttachmentUploadJobId(user.uid, activeAccount.id, transactionId),
      userId: user.uid,
      accountId: activeAccount.id,
      sharedAccountId: activeAccount.sharedAccountId || null,
      transactionId,
      file: attachment.file,
      fileName: attachment.file.name,
      fileSize: attachment.file.size,
      mimeType: attachment.file.type,
      attachmentType: attachment.type,
      previousAttachmentPath: previousAttachmentPath ?? existingJob?.previousAttachmentPath ?? null,
      queuedAt,
      updatedAt: new Date().toISOString(),
    });

    bumpAttachmentQueueVersion();
  };

  const clearOfflineAttachmentUpload = async (transactionId: string, accountId = activeAccountId) => {
    if (!user || !accountId) return;
    await deleteOfflineAttachmentUploadJob(getOfflineAttachmentUploadJobId(user.uid, accountId, transactionId));
    bumpAttachmentQueueVersion();
  };

  const retryOfflineAttachmentUpload = async (transactionId: string) => {
    if (!user || !activeAccountId) return;

    const job = pendingAttachmentUploads[transactionId];
    if (!job) return;

    await putOfflineAttachmentUploadJob({
      ...job,
      retryCount: 0,
      status: 'pending',
      updatedAt: new Date().toISOString(),
    });
    bumpAttachmentQueueVersion();
  };

  const cancelOfflineAttachmentUpload = async (transactionId: string) => {
    if (!user || !activeAccountId) return;

    await clearOfflineAttachmentUpload(transactionId);
    showNotification('info', 'Upload Dibatalkan', 'Antrean upload lampiran sudah dihapus. Transaksi tetap tersimpan.', true);
  };

  const getActiveScopedCollection = <T,>(collectionName: AccountScopedCollectionName) => {
    if (!user || !activeAccount) return null;
    return getScopedCollectionRefForAccount<T>(db, user.uid, activeAccount, collectionName);
  };

  useEffect(() => {
    if (!user || !activeAccount?.sharedAccountId || activeAccount.role !== 'OWNER') {
      return;
    }

    if (isBackfillingPlanCreatorsRef.current) {
      return;
    }

    const legacyPlans = plans.filter((plan) => (
      !backfilledPlanIdsRef.current.has(plan.id) && (
        !plan.createdByUserId || plan.items.some((item) => !item.createdByUserId)
      )
    ));

    if (legacyPlans.length === 0) {
      return;
    }

    let cancelled = false;
    isBackfillingPlanCreatorsRef.current = true;
    legacyPlans.forEach((plan) => backfilledPlanIdsRef.current.add(plan.id));

    const backfillPlanCreators = async () => {
      try {
        const plansRef = getActiveScopedCollection<Plan>('plans');
        if (!plansRef) return;

        const batch = writeBatch(db);
        legacyPlans.forEach((plan) => {
          const nextItems = plan.items.map((item) => (
            item.createdByUserId
              ? item
              : {
                ...item,
                createdByUserId: user.uid,
                createdByName: item.createdByName || currentUserLabel,
              }
          )).map(serializePlanItemForFirestore);

          batch.set(doc(plansRef, plan.id), {
            createdByUserId: plan.createdByUserId || user.uid,
            createdByName: plan.createdByName || currentUserLabel,
            items: nextItems,
          }, { merge: true });
        });

        await batch.commit();
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to backfill legacy plan creators:', error);
        }
      } finally {
        isBackfillingPlanCreatorsRef.current = false;
      }
    };

    void backfillPlanCreators();

    return () => {
      cancelled = true;
    };
  }, [user, activeAccount, plans, currentUserLabel]);

  const handleFirestoreListenerError = (source: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!isPermissionDeniedError(error)) {
      console.error(`Firestore listener error (${source}):`, error);
      return;
    }

    const currentAccount = activeAccountRef.current;
    if (!currentAccount?.sharedAccountId) {
      return;
    }

    const fallbackAccount = pickFallbackAccount(accounts, currentAccount.id);
    if (fallbackAccount) {
      setActiveAccountId(fallbackAccount.id);
      void persistActiveAccountSelection(fallbackAccount.id);
    }
    setSharedAccountMembers([]);
    setActiveSharedInviteCode(null);
  };

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      perfMark(currentUser ? 'dc-auth-yes' : 'dc-auth-no');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || currentView !== 'DASHBOARD') return;
    const idleWindow = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const handle = idleWindow.requestIdleCallback(prefetchLazyRoutes, { timeout: 4000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(prefetchLazyRoutes, 2000);
    return () => window.clearTimeout(timer);
  }, [user, currentView]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOffline(true);
      setShowReconnectToast(false);
      setShowSyncCompletedToast(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      if (wasOfflineRef.current) {
        setShowReconnectToast(true);
        wasOfflineRef.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!user || !activeAccountId) {
      setPendingAttachmentUploads({});
      setAttachmentQueueLoaded(false);
      return undefined;
    }

    let cancelled = false;
    setAttachmentQueueLoaded(false);

    const loadPendingAttachmentUploads = async () => {
      try {
        const jobs = await getOfflineAttachmentUploadJobsForScope(user.uid, activeAccountId);
        if (cancelled) return;

        setPendingAttachmentUploads(
          jobs.reduce<Record<string, OfflineAttachmentUploadJob>>((accumulator, job) => {
            accumulator[job.transactionId] = job;
            return accumulator;
          }, {})
        );
        setAttachmentQueueLoaded(true);
      } catch (error) {
        console.error('Failed to load pending attachment uploads:', error);
        if (!cancelled) setAttachmentQueueLoaded(true);
      }
    };

    void loadPendingAttachmentUploads();

    return () => {
      cancelled = true;
    };
  }, [user, activeAccountId, attachmentQueueVersion]);

  useEffect(() => {
    if (isOffline || !user) return undefined;

    let cancelled = false;
    const MAX_RETRY_COUNT = 5;

    const flushOfflineQueues = async () => {
      if (isFlushingAttachmentQueueRef.current) return;
      isFlushingAttachmentQueueRef.current = true;

      try {
        const jobs = await getOfflineAttachmentUploadJobsForUser(user.uid);
        let anyChange = false;

        for (const job of jobs) {
          if (cancelled) break;

          const accountScope = { id: job.accountId, sharedAccountId: job.sharedAccountId || undefined };
          const transactionsRef = getScopedCollectionRefForAccount<Transaction>(db, user.uid, accountScope, 'transactions');
          const txRef = doc(transactionsRef, job.transactionId);
          const txSnap = await getDoc(txRef);

          if (!txSnap.exists()) {
            // Keep the job visible when its transaction cannot be found. The
            // user must explicitly cancel it; silently deleting the job hides
            // a failed upload and makes the dashboard look falsely synced.
            if (job.status !== 'failed') {
              await putOfflineAttachmentUploadJob({
                ...job,
                retryCount: Math.max(job.retryCount || 0, MAX_RETRY_COUNT),
                status: 'failed',
                updatedAt: new Date().toISOString(),
              });
              anyChange = true;
            }
            continue;
          }

          // Failed jobs stay visible until the user retries or cancels them.
          if (job.status === 'failed') continue;

          try {
            const fileExt = job.fileName.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const fileToUpload = new File([job.file], job.fileName, {
              type: job.mimeType,
              lastModified: Date.now(),
            });

            const uploadedFile = await uploadFileToStorage(
              getScopedStoragePath(user.uid, accountScope, fileName),
              fileToUpload
            );

            await updateDoc(txRef, {
              attachment: {
                url: uploadedFile.url,
                path: uploadedFile.path,
                type: job.attachmentType,
                name: job.fileName,
                size: job.fileSize,
              },
            });

            if (job.previousAttachmentPath) {
              await deleteAttachmentPath(job.previousAttachmentPath);
            }

            await deleteOfflineAttachmentUploadJob(job.id);
            anyChange = true;
          } catch (uploadError) {
            console.error(`Failed to upload attachment for transaction ${job.transactionId}:`, uploadError);
            console.error("Upload error details:", {
              message: uploadError instanceof Error ? uploadError.message : String(uploadError),
              code: (uploadError as any)?.code,
              name: (uploadError as any)?.name,
              jobId: job.id,
              accountId: job.accountId,
              sharedAccountId: job.sharedAccountId,
              fileName: job.fileName
            });

            const retryCount = (job.retryCount || 0) + 1;
            if (retryCount >= MAX_RETRY_COUNT) {
              await putOfflineAttachmentUploadJob({
                ...job,
                retryCount,
                status: 'failed',
                updatedAt: new Date().toISOString(),
              });
              anyChange = true;
              showNotification(
                'error',
                'Upload Lampiran Gagal',
                `Upload lampiran untuk transaksi gagal setelah ${MAX_RETRY_COUNT} percobaan. Silakan upload ulang secara manual.`,
                true
              );
            } else {
              await putOfflineAttachmentUploadJob({
                ...job,
                retryCount,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        // Only bump version if something actually changed, to avoid infinite loop
        if (anyChange && !cancelled) {
          bumpAttachmentQueueVersion();
        }
      } catch (error) {
        console.error('Failed to flush pending attachment uploads:', error);
      } finally {
        isFlushingAttachmentQueueRef.current = false;
      }

      if (hasPendingStorageCleanup()) {
        await flushStorageCleanupQueue(async (path) => {
          await deleteFileFromStorage(path);
        });
      }

      if (!cancelled && hasPendingCategoryCacheRefresh()) {
        try {
          await callCloudFunction<void, unknown>('refreshCategoryCache');
          clearPendingCategoryCacheRefresh();
        } catch (error) {
          console.error('Failed to flush pending category cache refresh:', error);
        }
      }
    };

    void flushOfflineQueues();

    return () => {
      cancelled = true;
    };
  }, [isOffline, user, attachmentQueueVersion]);

  useEffect(() => {
    if (!user || isLinkTelegramRoute) return;

    const pendingToken = sessionStorage.getItem('telegram_link_token');
    if (!pendingToken) return;

    window.location.replace(`/link-telegram?token=${encodeURIComponent(pendingToken)}`);
  }, [user, isLinkTelegramRoute]);

  // --- Update Banner State ---
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handlePwaUpdateAvailable = () => {
      setShowUpdateBanner(true);
      setIsApplyingUpdate(false);
      isApplyingUpdateRef.current = false;
    };

    const handleControllerChange = () => {
      if (isApplyingUpdateRef.current) {
        window.location.reload();
      }
    };

    window.addEventListener(PWA_UPDATE_EVENT, handlePwaUpdateAvailable as EventListener);
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      window.removeEventListener(PWA_UPDATE_EVENT, handlePwaUpdateAvailable as EventListener);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Handle update action
  const handleUpdate = async () => {
    setIsApplyingUpdate(true);
    isApplyingUpdateRef.current = true;

    try {
      // Set a failsafe timeout to force reload if the SW update hangs
      window.setTimeout(() => {
        if (isApplyingUpdateRef.current) {
          window.location.reload();
        }
      }, 1800);

      await activateServiceWorkerUpdate();
    } catch (error) {
      console.error('Failed to apply service worker update:', error);
      setIsApplyingUpdate(false);
      isApplyingUpdateRef.current = false;
      window.location.reload();
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdateBanner(false);
    setIsApplyingUpdate(false);
    isApplyingUpdateRef.current = false;
  };

  // --- Account Bootstrap & Legacy Migration ---
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setActiveAccountId(null);
      setAccountLoading(false);
      return;
    }

    let cancelled = false;

    const bootstrapAccounts = async () => {
      setAccountLoading(true);

      // Cache-first: hydrate shell immediately from IndexedDB so returning
      // users see their dashboard before the network round-trip completes.
      const cached = await readCachedSnapshot(user.uid);
      if (!cancelled && cached) {
        const cacheMatchesActiveAccount = !cached.dataAccountId || cached.dataAccountId === cached.activeAccountId;
        setAccounts((cached.accounts as unknown) as FinancialAccount[]);
        if (cached.activeAccountId) setActiveAccountId(cached.activeAccountId);
        if (cacheMatchesActiveAccount) {
          if (cached.categories.length > 0) setCategories((cached.categories as unknown) as Category[]);
          if (cached.transactions.length > 0) setTransactions((cached.transactions as unknown) as Transaction[]);
          if (cached.plans && cached.plans.length > 0) setPlans((cached.plans as unknown) as Plan[]);
          if (cached.budgets && cached.budgets.length > 0) setBudgets((cached.budgets as unknown) as Budget[]);
          if (cached.debts && cached.debts.length > 0) setDebts((cached.debts as unknown) as DebtRecord[]);
        }
        setHydratedFromCache(true);
        setAccountLoading(false);
        perfMark('dc-cache-hydrated');
      }

      const userRef = getUserDocRef(db, user.uid);
      const accountsRef = getAccountsCollectionRef(db, user.uid);
      const [userSnap, accountsSnap] = await Promise.all([
        getDoc(userRef),
        getDocs(accountsRef),
      ]);
      const userMeta = (userSnap.data() || {}) as UserMeta;
      const existingAccounts = accountsSnap.docs.map((accountDoc) => ({
        id: accountDoc.id,
        ...(accountDoc.data() as Omit<FinancialAccount, 'id'>)
      }));

      let resolvedAccountId = userMeta.activeAccountId;
      let resolvedAccount: FinancialAccount | null = null;

      if (accountsSnap.empty) {
        const now = new Date().toISOString();
        const defaultAccountRef = doc(accountsRef);
        const batch = writeBatch(db);
        batch.set(defaultAccountRef, createAccountPayload(DEFAULT_ACCOUNT_NAME, now, { ownerUserId: user.uid }));
        batch.set(userRef, {
          activeAccountId: defaultAccountRef.id,
          accountMigrationVersion: 1,
          updatedAt: now,
          createdAt: userMeta.createdAt || now
        }, { merge: true });
        await batch.commit();
        resolvedAccountId = defaultAccountRef.id;
        resolvedAccount = {
          id: defaultAccountRef.id,
          ...createAccountPayload(DEFAULT_ACCOUNT_NAME, now, { ownerUserId: user.uid })
        };
      } else if (!resolvedAccountId || !existingAccounts.some((account) => account.id === resolvedAccountId)) {
        resolvedAccountId = existingAccounts[0].id;
        await setDoc(userRef, {
          activeAccountId: resolvedAccountId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (!resolvedAccount && resolvedAccountId) {
        resolvedAccount = existingAccounts.find((account) => account.id === resolvedAccountId) || null;
      }

      if (resolvedAccount?.sharedAccountId) {
        try {
          const sharedMemberRef = doc(db, 'sharedAccounts', resolvedAccount.sharedAccountId, 'members', user.uid);
          const sharedMemberSnap = await getDoc(sharedMemberRef);

          if (!sharedMemberSnap.exists()) {
            const fallbackAccount = pickFallbackAccount(existingAccounts, resolvedAccount.id);
            if (fallbackAccount) {
              resolvedAccountId = fallbackAccount.id;
              resolvedAccount = fallbackAccount;
              await setDoc(userRef, {
                activeAccountId: fallbackAccount.id,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (error) {
          if (isPermissionDeniedError(error)) {
            const fallbackAccount = pickFallbackAccount(existingAccounts, resolvedAccount.id);
            if (fallbackAccount) {
              resolvedAccountId = fallbackAccount.id;
              resolvedAccount = fallbackAccount;
              await setDoc(userRef, {
                activeAccountId: fallbackAccount.id,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          } else {
            throw error;
          }
        }
      }

      // One-time gate: without it every launch re-scanned legacy collections,
      // downloading the full transaction history twice on mobile networks.
      const migrationDone = (userMeta.accountMigrationVersion ?? 0) >= ACCOUNT_MIGRATION_VERSION;
      if (resolvedAccountId && resolvedAccount && !resolvedAccount.sharedAccountId && !migrationDone) {
        const targetCategoriesRef = getScopedCollectionRefForAccount<Category>(db, user.uid, resolvedAccount, 'categories');
        const targetTransactionsRef = getScopedCollectionRefForAccount<Transaction>(db, user.uid, resolvedAccount, 'transactions');
        const targetPlansRef = getScopedCollectionRefForAccount<Plan>(db, user.uid, resolvedAccount, 'plans');
        const accountLegacySimulationsRef = getLegacySimulationsCollectionRef(db, user.uid, resolvedAccountId);

        const [
          targetCategoriesSnap,
          targetTransactionsSnap,
          targetPlansSnap,
          accountLegacySimulationsSnap,
          legacyCategoriesSnap,
          legacyTransactionsSnap,
          legacySimulationsSnap,
        ] = await Promise.all([
          getDocs(targetCategoriesRef),
          getDocs(targetTransactionsRef),
          getDocs(targetPlansRef),
          getDocs(accountLegacySimulationsRef),
          getDocs(collection(db, 'users', user.uid, 'categories')),
          getDocs(collection(db, 'users', user.uid, 'transactions')),
          getDocs(collection(db, 'users', user.uid, 'simulations')),
        ]);

        const migrationOperations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

        if (targetCategoriesSnap.empty) {
          if (!legacyCategoriesSnap.empty) {
            legacyCategoriesSnap.docs.forEach((legacyDoc) => {
              migrationOperations.push((batch) => {
                batch.set(doc(targetCategoriesRef, legacyDoc.id), legacyDoc.data());
              });
            });
          } else {
            INITIAL_CATEGORIES.forEach((category) => {
              migrationOperations.push((batch) => {
                batch.set(doc(targetCategoriesRef, category.id), category);
              });
            });
          }
        }

        if (targetTransactionsSnap.empty && !legacyTransactionsSnap.empty) {
          legacyTransactionsSnap.docs.forEach((legacyDoc) => {
            migrationOperations.push((batch) => {
              batch.set(doc(targetTransactionsRef, legacyDoc.id), legacyDoc.data());
            });
          });
        }

        const migratedPlanIds = new Set(targetPlansSnap.docs.map((planDoc) => planDoc.id));
        [accountLegacySimulationsSnap, legacySimulationsSnap].forEach((legacySnapshot) => {
          legacySnapshot.docs.forEach((legacyDoc) => {
            if (migratedPlanIds.has(legacyDoc.id)) return;
            migratedPlanIds.add(legacyDoc.id);
            migrationOperations.push((batch) => {
              batch.set(doc(targetPlansRef, legacyDoc.id), legacyDoc.data());
            });
          });
        });

        if (migrationOperations.length > 0) {
          await commitBatchOperations(migrationOperations);
        }

        await setDoc(userRef, {
          activeAccountId: resolvedAccountId,
          accountMigrationVersion: 1,
          accountMigrationCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (!cancelled) {
        setActiveAccountId(resolvedAccountId || null);
        setAccountLoading(false);
      }
    };

    bootstrapAccounts().catch((error) => {
      console.error('Failed to bootstrap accounts:', error);
      if (!cancelled) {
        setAccountLoading(false);
        showNotification('error', 'Gagal Memuat Akun', 'Akun Keuangan belum bisa disiapkan. Silakan refresh halaman.', false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- Account Listeners ---
  useEffect(() => {
    if (!user) {
      updatePendingSyncKey('user-meta', false);
      updatePendingSyncKey('accounts', false);
      return;
    }

    const userRef = getUserDocRef(db, user.uid);
    const accountsRef = query(getAccountsCollectionRef(db, user.uid));

    const unsubUser = onSnapshot(userRef, { includeMetadataChanges: true }, (snapshot) => {
      updatePendingSyncKey('user-meta', snapshot.metadata.hasPendingWrites);
      const data = snapshot.data() as UserMeta | undefined;
      if (data?.activeAccountId) {
        setActiveAccountId(data.activeAccountId);
      }
    });

    const unsubAccounts = onSnapshot(accountsRef, { includeMetadataChanges: true }, (snapshot) => {
      updatePendingSyncKey('accounts', snapshot.metadata.hasPendingWrites);
      if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
      const data = snapshot.docs
        .map((accountDoc) => ({ id: accountDoc.id, ...accountDoc.data() } as FinancialAccount))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setAccounts(data);
    });

    return () => {
      updatePendingSyncKey('user-meta', false);
      updatePendingSyncKey('accounts', false);
      unsubUser();
      unsubAccounts();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      updatePendingSyncKey('telegram-link', false);
      setTelegramDefaultAccountId(null);
      setTelegramLinked(false);
      setTelegramReminderEnabled(false);
      setTelegramReminderTime('20:00');
      return;
    }

    const telegramLinkRef = doc(db, 'users', user.uid, 'telegram_link', 'main');
    const unsubscribe = onSnapshot(telegramLinkRef, { includeMetadataChanges: true }, (snapshot) => {
      updatePendingSyncKey('telegram-link', snapshot.metadata.hasPendingWrites);
      setTelegramLinked(snapshot.exists());
      const data = snapshot.data() as TelegramLinkMeta | undefined;
      setTelegramDefaultAccountId(data?.defaultAccountId || null);
      setTelegramReminderEnabled(data?.reminderEnabled ?? false);
      setTelegramReminderTime(data?.reminderTime || '20:00');
    });

    return () => {
      updatePendingSyncKey('telegram-link', false);
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!activeAccount?.sharedAccountId) {
      updatePendingSyncKey('shared-account-meta', false);
      updatePendingSyncKey('shared-account-members', false);
      setSharedAccountMembers([]);
      setActiveSharedInviteCode(null);
      return;
    }

    const sharedAccountRef = getSharedAccountDocRef(db, activeAccount.sharedAccountId);
    const membersRef = query(getSharedAccountMembersCollectionRef(db, activeAccount.sharedAccountId));
    const listenerAccountId = activeAccount.id;
    const listenerSharedAccountId = activeAccount.sharedAccountId;
    const isCurrentListener = () => {
      const currentAccount = activeAccountRef.current;
      return (
        currentAccount?.id === listenerAccountId &&
        currentAccount.sharedAccountId === listenerSharedAccountId
      );
    };

    let unsubSharedAccount: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;
    let cancelled = false;

    const attachListeners = async () => {
      try {
        const preflightSnap = await getDoc(sharedAccountRef);
        if (!preflightSnap.exists()) {
          throw new Error('permission-denied: shared account does not exist or is no longer accessible');
        }
      } catch (error) {
        if (cancelled || !isCurrentListener()) return;
        handleFirestoreListenerError('shared-account-preflight', error);
        return;
      }

      if (cancelled || !isCurrentListener()) return;

      unsubSharedAccount = onSnapshot(
        sharedAccountRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('shared-account-meta', snapshot.metadata.hasPendingWrites);
          const data = snapshot.data();
          setActiveSharedInviteCode(typeof data?.inviteCode === 'string' ? data.inviteCode : null);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('shared-account-meta', error);
        }
      );

      unsubMembers = onSnapshot(
        membersRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('shared-account-members', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const members = snapshot.docs
            .map((memberDoc) => ({
              id: memberDoc.id,
              ...(memberDoc.data() as Omit<SharedAccountMember, 'id'>)
            }))
            .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
          setSharedAccountMembers(members);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('shared-account-members', error);
        }
      );
    };

    void attachListeners();

    return () => {
      cancelled = true;
      updatePendingSyncKey('shared-account-meta', false);
      updatePendingSyncKey('shared-account-members', false);
      unsubSharedAccount?.();
      unsubMembers?.();
    };
  }, [activeAccount?.sharedAccountId]);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user || !activeAccount) {
      updatePendingSyncKey('categories', false);
      updatePendingSyncKey('transactions', false);
      updatePendingSyncKey('plans', false);
      updatePendingSyncKey('budgets', false);
      updatePendingSyncKey('debts', false);
      setCategories([]);
      setTransactions([]);
      setPlans([]);
      setBudgets([]);
      setDebts([]);
      return;
    }

    const categoriesRef = getActiveScopedCollection<Category>('categories');
    const transactionsRef = getActiveScopedCollection<Transaction>('transactions');
    const plansRef = getActiveScopedCollection<Plan>('plans');
    const budgetsRef = getActiveScopedCollection<Budget>('budgets');
    const debtsRef = getActiveScopedCollection<DebtRecord>('debts');
    const listenerAccountId = activeAccount.id;
    const listenerSharedAccountId = activeAccount.sharedAccountId || null;
    const isCurrentListener = () => {
      const currentAccount = activeAccountRef.current;
      return (
        currentAccount?.id === listenerAccountId &&
        (currentAccount.sharedAccountId || null) === listenerSharedAccountId
      );
    };

    if (!categoriesRef || !transactionsRef || !plansRef || !budgetsRef || !debtsRef) {
      return;
    }

    // Keep cached data visible while the first network snapshot arrives.
    // Only applies on the very first mount after cache hydration; switching
    // accounts must reset immediately so stale data from the previous account
    // is never shown.
    const preserveCached = !preservedCacheOnceRef.current && hydratedFromCache;
    preservedCacheOnceRef.current = true;
    setCategories((current) => (preserveCached && current.length > 0 ? current : []));
    setTransactions((current) => (preserveCached && current.length > 0 ? current : []));
    setPlans((current) => (preserveCached && current.length > 0 ? current : []));
    setBudgets((current) => (preserveCached && current.length > 0 ? current : []));
    setDebts((current) => (preserveCached && current.length > 0 ? current : []));

    let unsubCat: (() => void) | null = null;
    let unsubTx: (() => void) | null = null;
    let unsubPlans: (() => void) | null = null;
    let unsubBudgets: (() => void) | null = null;
    let unsubDebts: (() => void) | null = null;
    let cancelled = false;

    const attachListeners = async () => {
      if (activeAccount.sharedAccountId) {
        try {
          const preflightSnap = await getDoc(getSharedAccountDocRef(db, activeAccount.sharedAccountId));
          if (!preflightSnap.exists()) {
            throw new Error('permission-denied: shared account does not exist or is no longer accessible');
          }
        } catch (error) {
          if (cancelled || !isCurrentListener()) return;
          handleFirestoreListenerError('scoped-data-preflight', error);
          return;
        }
      }

      if (cancelled || !isCurrentListener()) return;

      const catQuery = query(categoriesRef);
      unsubCat = onSnapshot(
        catQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('categories', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const data = snapshot.docs.map((categoryDoc) => ({ id: categoryDoc.id, ...categoryDoc.data() } as Category))
            .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
          setCategories(data);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('categories', error);
        }
      );

      // Limit to most recent 300 to keep cold start fast for accounts with
      // hundreds of transactions (hidayat.omega: 657). Dashboard & current-month
      // views only need recent data; older months are fetched on demand via
      // TransactionList pagination. Full balance is derived from cached data
      // plus recent sync, with background reconciliation for older docs.
      const txQuery = query(transactionsRef, orderBy('date', 'desc'), limit(300));
      unsubTx = onSnapshot(
        txQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('transactions', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const data = snapshot.docs.map((transactionDoc) => ({ id: transactionDoc.id, ...transactionDoc.data() } as Transaction));
          // Preserve older cached transactions that are outside the 300 window
          // so balance & history remain correct after the limit.
          setTransactions((prev) => {
            if (prev.length <= 300) return data;
            const recentIds = new Set(data.map((d) => d.id));
            const older = prev.filter((p) => !recentIds.has(p.id));
            return [...data, ...older].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('transactions', error);
        }
      );

      const planQuery = query(plansRef);
      unsubPlans = onSnapshot(
        planQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('plans', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const data = snapshot.docs.map((planDoc) => normalizePlan(planDoc.id, planDoc.data() as Partial<Plan>));
          setPlans(data);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('plans', error);
        }
      );

      const budgetQuery = query(budgetsRef);
      unsubBudgets = onSnapshot(
        budgetQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('budgets', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const data = snapshot.docs.map((budgetDoc) => ({ id: budgetDoc.id, ...(budgetDoc.data() as Partial<Budget>) } as Budget));
          setBudgets(data);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('budgets', error);
        }
      );

      const debtQuery = query(debtsRef);
      unsubDebts = onSnapshot(
        debtQuery,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isCurrentListener()) return;
          updatePendingSyncKey('debts', snapshot.metadata.hasPendingWrites);
          if (snapshot.docChanges({ includeMetadataChanges: false }).length === 0) return;
          const data = snapshot.docs.map((debtDoc) => normalizeDebtRecord(debtDoc.id, debtDoc.data() as Partial<DebtRecord>));
          setDebts(data);
        },
        (error) => {
          if (!isCurrentListener()) return;
          handleFirestoreListenerError('debts', error);
        }
      );
    };

    void attachListeners();

    return () => {
      cancelled = true;
      updatePendingSyncKey('categories', false);
      updatePendingSyncKey('transactions', false);
      updatePendingSyncKey('plans', false);
      updatePendingSyncKey('budgets', false);
      updatePendingSyncKey('debts', false);
      unsubCat?.();
      unsubTx?.();
      unsubPlans?.();
      unsubBudgets?.();
      unsubDebts?.();
    };
  }, [user, activeAccount, hydratedFromCache]);

  // --- Cache-first background writer ---
  // Mirrors core data to IndexedDB so the next startup can render instantly.
  // dataAccountId guards against writing the previous account's data while a
  // switch is still in flight.
  useEffect(() => {
    if (!user) return;

    const flushPendingCache = () => {
      const snapshot = pendingCacheSnapshotRef.current;
      if (!snapshot) return;
      pendingCacheSnapshotRef.current = null;
      if (cacheWriteTimeoutRef.current !== null) {
        window.clearTimeout(cacheWriteTimeoutRef.current);
        cacheWriteTimeoutRef.current = null;
      }
      void writeCachedSnapshot(user.uid, snapshot);
    };

    pendingCacheSnapshotRef.current = {
      activeAccountId,
      dataAccountId: activeAccountId,
      accounts: (accounts as unknown) as CachedSnapshot['accounts'],
      categories: (categories as unknown) as CachedSnapshot['categories'],
      transactions: (transactions as unknown) as CachedSnapshot['transactions'],
      plans: (plans as unknown) as CachedSnapshot['plans'],
      budgets: (budgets as unknown) as CachedSnapshot['budgets'],
      debts: (debts as unknown) as CachedSnapshot['debts'],
      cachedAt: Date.now(),
    };

    if (cacheWriteTimeoutRef.current !== null) window.clearTimeout(cacheWriteTimeoutRef.current);
    cacheWriteTimeoutRef.current = window.setTimeout(() => {
      cacheWriteTimeoutRef.current = null;
      flushPendingCache();
    }, 1200);

    const handleVisibilityHidden = () => {
      if (document.visibilityState === 'hidden') flushPendingCache();
    };

    document.addEventListener('visibilitychange', handleVisibilityHidden);
    window.addEventListener('pagehide', flushPendingCache);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityHidden);
      window.removeEventListener('pagehide', flushPendingCache);
    };
  }, [user, activeAccountId, accounts, categories, transactions, plans, budgets, debts]);

  useEffect(() => {
    return () => {
      if (cacheWriteTimeoutRef.current !== null) {
        window.clearTimeout(cacheWriteTimeoutRef.current);
        cacheWriteTimeoutRef.current = null;
      }
    };
  }, []);

  // --- CRUD Handlers (Firestore) ---

  const createPrivateAccount = async (name: string) => {
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showNotification('warning', 'Nama Akun Wajib Diisi', 'Isi nama Akun Keuangan terlebih dahulu.', true);
      return;
    }

    const now = new Date().toISOString();
    const accountsRef = getAccountsCollectionRef(db, user.uid);
    const accountRef = doc(accountsRef);
    const userRef = getUserDocRef(db, user.uid);
    const categoriesRef = getCategoriesCollectionRef(db, user.uid, accountRef.id);
    const batch = writeBatch(db);

    batch.set(accountRef, createAccountPayload(trimmedName, now, { ownerUserId: user.uid }));
    INITIAL_CATEGORIES.forEach((category) => {
      batch.set(doc(categoriesRef, category.id), category);
    });
    batch.set(userRef, {
      activeAccountId: accountRef.id,
      updatedAt: now
    }, { merge: true });

    await batch.commit();
    showNotification('success', 'Akun Ditambahkan', `Akun Keuangan "${trimmedName}" siap digunakan.`, true);
  };

  const createSharedAccount = async (name: string) => {
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showNotification('warning', 'Nama Akun Wajib Diisi', 'Isi nama Akun Keuangan terlebih dahulu.', true);
      return;
    }

    if (!requireOnline('Perlu Koneksi Internet', 'Akun bersama dibuat lewat server, jadi internet perlu aktif dulu.')) return;
    await callCloudFunction<{ name: string }, unknown>('createSharedAccount', { name: trimmedName });
    showNotification('success', 'Akun Bersama Dibuat', `Akun Keuangan bersama "${trimmedName}" siap dipakai bareng.`, true);
  };

  const shareAccount = async (accountId: string) => {
    if (!user || !accountId) return;

    const targetAccount = accounts.find((account) => account.id === accountId);
    if (!targetAccount) return;

    if (targetAccount.sharedAccountId) {
      showNotification('info', 'Akun Sudah Dibagikan', `Akun "${targetAccount.name}" sudah berada di mode kolaborasi.`, true);
      return;
    }

    if (!requireOnline('Perlu Koneksi Internet', 'Membagikan akun perlu internet aktif karena data harus dipindahkan ke shared workspace.')) return;

    await callCloudFunction<{ accountId: string }, { success: boolean; sharedAccountId?: string; name?: string }>('shareExistingAccount', { accountId });

    showNotification(
      'success',
      'Akun Dibagikan',
      `Akun "${targetAccount.name}" sekarang bisa dipakai bareng. Buka pengaturan akun itu untuk buat kode gabung.`,
      true
    );
  };

  const generateSharedInviteCode = async () => {
    if (!activeAccountId || !activeAccount?.sharedAccountId) return;
    if (!requireOnline('Perlu Koneksi Internet', 'Kode gabung baru bisa dibuat saat internet aktif.')) return;

    const data = await callCloudFunction<{ accountId: string }, { code?: string }>('createSharedInviteCode', { accountId: activeAccountId });

    if (data.code) {
      setActiveSharedInviteCode(data.code);
      showNotification('success', 'Kode Gabung Diperbarui', `Kode gabung baru: ${data.code}`, true);
    }
  };

  const joinSharedAccount = async (rawCode: string) => {
    if (!user) return;

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      showNotification('warning', 'Kode Belum Diisi', 'Masukkan kode gabung terlebih dahulu.', true);
      return;
    }
    if (!requireOnline('Perlu Koneksi Internet', 'Gabung ke akun bersama perlu internet aktif.')) return;

    const data = await callCloudFunction<{ code: string }, { name?: string }>('joinSharedAccountByCode', { code });
    showNotification('success', 'Berhasil Gabung', `Sekarang kamu bergabung ke akun bersama "${data.name || 'Keuangan Bersama'}".`, true);
  };

  const switchAccount = async (accountId: string) => {
    if (!user || !accountId || accountId === activeAccountId) return;

    const nextAccount = accounts.find((account) => account.id === accountId) || null;
    setActiveAccountId(accountId);
    setSharedAccountMembers([]);
    setActiveSharedInviteCode(null);
    setCategories([]);
    setTransactions([]);
    setPlans([]);
    setBudgets([]);
    setDebts([]);

    await setDoc(getUserDocRef(db, user.uid), {
      activeAccountId: accountId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const updateTelegramDefaultAccount = async (accountId: string) => {
    if (!user || !accountId) return;

    await setDoc(doc(db, 'users', user.uid, 'telegram_link', 'main'), {
      defaultAccountId: accountId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const selectedAccount = accounts.find((account) => account.id === accountId);
    if (selectedAccount) {
      showNotification('success', 'Akun Telegram Diperbarui', `Bot Telegram sekarang memakai akun "${selectedAccount.name}".`, true);
    }
  };

  const updateTelegramReminderSettings = async (enabled: boolean, time: string) => {
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid, 'telegram_link', 'main'), {
      reminderEnabled: enabled,
      reminderTime: time,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    showNotification('success', 'Pengaturan Pengingat Diperbarui', 'Konfigurasi pengingat harian Telegram Anda berhasil disimpan.', true);
  };

  const deleteAccount = async (accountId: string) => {
    if (!user) return;

    const targetAccount = accounts.find((account) => account.id === accountId);
    if (!targetAccount) return;

    if (accounts.length <= 1) {
      showNotification('warning', 'Akun Terakhir Tidak Bisa Dihapus', 'Minimal harus ada satu Akun Keuangan yang tersisa.', true);
      return;
    }

    const fallbackAccount = accounts.find((account) => account.id !== targetAccount.id) || null;
    if (!fallbackAccount) {
      showNotification('warning', 'Akun Terakhir Tidak Bisa Dihapus', 'Minimal harus ada satu Akun Keuangan yang tersisa.', true);
      return;
    }

    const now = new Date().toISOString();
    const previousActiveAccountId = activeAccountId;
    const previousAccounts = accounts;
    const previousCategories = categories;
    const previousTransactions = transactions;
    const previousPlans = plans;
    const previousBudgets = budgets;
    const previousDebts = debts;
    const previousSharedAccountMembers = sharedAccountMembers;
    const previousActiveSharedInviteCode = activeSharedInviteCode;
    try {
      const removeAccountFromLocalState = () => {
        setAccounts((currentAccounts) => currentAccounts.filter((account) => account.id !== targetAccount.id));
      };

      const switchToFallbackLocally = async () => {
        setActiveAccountId(fallbackAccount.id);
        setSharedAccountMembers([]);
        setActiveSharedInviteCode(null);
        setCategories([]);
        setTransactions([]);
        setPlans([]);
        setBudgets([]);
        setDebts([]);
        await setDoc(getUserDocRef(db, user.uid), {
          activeAccountId: fallbackAccount.id,
          updatedAt: now,
        }, { merge: true });
      };

      if (targetAccount.sharedAccountId) {
        if (
          targetAccount.role === 'OWNER' &&
          activeAccountId === targetAccount.id &&
          sharedAccountMembers.length > 1
        ) {
          showNotification(
            'warning',
            'Akun Bersama Masih Punya Anggota',
            `Ada ${sharedAccountMembers.length - 1} anggota lain di akun ini. Minta mereka keluar dulu sebelum akun bisa dihapus.`,
            true
          );
          return;
        }

        removeAccountFromLocalState();
        if (activeAccountId === targetAccount.id) {
          await switchToFallbackLocally();
        }

        const result = await callCloudFunction<{ accountId: string }, { success: boolean; action: 'LEFT' | 'DELETED'; name?: string }>(
          'deleteSharedAccountAccess',
          { accountId }
        );

        if (telegramDefaultAccountId === targetAccount.id) {
          await setDoc(doc(db, 'users', user.uid, 'telegram_link', 'main'), {
            defaultAccountId: fallbackAccount.id,
            updatedAt: now,
          }, { merge: true });
        }

        if (result.action === 'LEFT') {
          showNotification('success', 'Keluar dari Akun Bersama', `Kamu keluar dari akun bersama "${result.name || targetAccount.name}".`, true);
        } else {
          showNotification('success', 'Akun Bersama Dihapus', `Akun bersama "${result.name || targetAccount.name}" berhasil dihapus.`, true);
        }
        return;
      }

      removeAccountFromLocalState();
      if (activeAccountId === targetAccount.id) {
        await switchToFallbackLocally();
      }

      const transactionsSnap = await getDocs(getTransactionsCollectionRef(db, user.uid, targetAccount.id));
      if (!transactionsSnap.empty) {
        setAccounts(previousAccounts);
        setCategories(previousCategories);
        setTransactions(previousTransactions);
        setPlans(previousPlans);
        setBudgets(previousBudgets);
        setDebts(previousDebts);
        setSharedAccountMembers(previousSharedAccountMembers);
        setActiveSharedInviteCode(previousActiveSharedInviteCode);
        if (previousActiveAccountId) {
          setActiveAccountId(previousActiveAccountId);
        }
        showNotification('warning', 'Akun Tidak Bisa Dihapus', 'Akun ini sudah punya transaksi. Hapus semua transaksi di akun tersebut terlebih dahulu.', true);
        return;
      }

      // Clean up offline attachment queue for this account
      const pendingJobs = await getOfflineAttachmentUploadJobsForScope(user.uid, targetAccount.id);
      await Promise.all(pendingJobs.map((job) => deleteOfflineAttachmentUploadJob(job.id)));

      const collectionsToClear = [
        getCategoriesCollectionRef(db, user.uid, targetAccount.id),
        getPlansCollectionRef(db, user.uid, targetAccount.id),
        getBudgetsCollectionRef(db, user.uid, targetAccount.id),
        getLegacySimulationsCollectionRef(db, user.uid, targetAccount.id),
        getDebtsCollectionRef(db, user.uid, targetAccount.id),
      ];

      for (const collectionRef of collectionsToClear) {
        const snapshot = await getDocs(collectionRef);
        await Promise.all(snapshot.docs.map((itemDoc) => deleteDoc(itemDoc.ref)));
      }

      await deleteDoc(getAccountDocRef(db, user.uid, targetAccount.id));

      if (telegramDefaultAccountId === targetAccount.id) {
        await setDoc(doc(db, 'users', user.uid, 'telegram_link', 'main'), {
          defaultAccountId: fallbackAccount.id,
          updatedAt: now,
        }, { merge: true });
      }

      bumpAttachmentQueueVersion();
      showNotification('success', 'Akun Dihapus', `Akun Keuangan "${targetAccount.name}" berhasil dihapus.`, true);
    } catch (error) {
      setAccounts(previousAccounts);
      setCategories(previousCategories);
      setTransactions(previousTransactions);
      setPlans(previousPlans);
      setBudgets(previousBudgets);
      setDebts(previousDebts);
      setSharedAccountMembers(previousSharedAccountMembers);
      setActiveSharedInviteCode(previousActiveSharedInviteCode);
      if (previousActiveAccountId) {
        setActiveAccountId(previousActiveAccountId);
        await setDoc(getUserDocRef(db, user.uid), {
          activeAccountId: previousActiveAccountId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus akun.';
      showNotification('error', 'Gagal Menghapus Akun', errorMessage, true);
    }
  };

  const addTransaction = async (
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' }
  ) => {
    if (!user || !activeAccount) return;

    let attachmentData = null;
    const transactionsRef = getActiveScopedCollection<Transaction>('transactions');
    if (!transactionsRef) return;
    const txRef = doc(transactionsRef);

    // Upload attachment if exists
    if (attachment) {
      try {
        if (isOffline) {
          await queueOfflineAttachmentUpload(txRef.id, attachment);
          showNotification('info', 'Lampiran Akan Diupload Nanti', 'Transaksi sudah disimpan. Lampiran akan otomatis diupload saat koneksi kembali.', true);
        } else {
          const fileExt = attachment.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const uploadedFile = await uploadFileToStorage(
            getScopedStoragePath(user.uid, activeAccount, fileName),
            attachment.file
          );

          attachmentData = {
            url: uploadedFile.url,
            path: uploadedFile.path,
            type: attachment.type,
            name: attachment.file.name,
            size: attachment.file.size
          };
        }
      } catch (err) {
        console.error("Upload failed:", err);
        console.error("Error details:", {
          message: err instanceof Error ? err.message : String(err),
          code: (err as any)?.code,
          name: (err as any)?.name,
          stack: err instanceof Error ? err.stack : undefined
        });
        await queueOfflineAttachmentUpload(txRef.id, attachment);
        showNotification('warning', 'Upload Lampiran Ditunda', 'Transaksi sudah disimpan. Lampiran akan dicoba lagi otomatis saat koneksi lebih stabil.', true);
      }
    }

    await setDoc(txRef as any, {
      amount,
      categoryId,
      date,
      description,
      createdByUserId: user.uid,
      createdByName: currentUserLabel,
      createdAt: new Date().toISOString(),
      source: 'app',
      attachment: attachmentData
    });
  };

  const updateTransaction = async (
    id: string,
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' } | null
  ) => {
    if (!user || !activeAccount) return;

    const transactionsRef = getActiveScopedCollection<Transaction>('transactions');
    if (!transactionsRef) return;

    const txRef = doc(transactionsRef, id);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return;

    const currentData = txSnap.data() as unknown as Transaction;
    let attachmentData = currentData.attachment;
    const currentAttachmentPath = getAttachmentPathFromTransaction(currentData);

    // Handle Attachment Logic
    if (attachment === null) {
      await clearOfflineAttachmentUpload(id);

      if (currentData.attachment && currentData.attachment.path) {
        try {
          await deleteAttachmentPath(currentData.attachment.path);
        } catch (e) { console.error("Failed to delete old attachment", e); }
      }
      else if (currentData.attachmentUrl) {
        try {
          const filePath = getLegacyStoragePathFromUrl(currentData.attachmentUrl);
          if (filePath) await deleteAttachmentPath(filePath);
        } catch (e) {
          console.error("Failed to delete legacy attachment", e);
        }
      }
      attachmentData = undefined;
    }
    else if (attachment) {
      if (isOffline) {
        await queueOfflineAttachmentUpload(id, attachment, currentAttachmentPath);
        showNotification('info', 'Perubahan Lampiran Ditunda', 'Perubahan transaksi sudah disimpan. Lampiran baru akan diupload saat koneksi kembali.', true);
      } else {
        if (currentData.attachment && currentData.attachment.path) {
          try {
            await deleteAttachmentPath(currentData.attachment.path);
          } catch (e) { console.error("Failed to delete old attachment", e); }
        }
        else if (currentData.attachmentUrl) {
          try {
            const filePath = getLegacyStoragePathFromUrl(currentData.attachmentUrl);
            if (filePath) await deleteAttachmentPath(filePath);
          } catch (e) {
            console.error("Failed to delete legacy attachment", e);
          }
        }

        try {
          const fileExt = attachment.file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const uploadedFile = await uploadFileToStorage(
            getScopedStoragePath(user.uid, activeAccount, fileName),
            attachment.file
          );

          attachmentData = {
            url: uploadedFile.url,
            path: uploadedFile.path,
            type: attachment.type,
            name: attachment.file.name,
            size: attachment.file.size
          };
          await clearOfflineAttachmentUpload(id);
        } catch (err) {
          console.error("Upload update failed:", err);
          console.error("Error details:", {
            message: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code,
            name: (err as any)?.name,
            stack: err instanceof Error ? err.stack : undefined
          });
          await queueOfflineAttachmentUpload(id, attachment, currentAttachmentPath);
          showNotification('warning', 'Upload Lampiran Ditunda', 'Perubahan transaksi sudah disimpan. Lampiran baru akan dicoba lagi otomatis saat koneksi lebih stabil.', true);
        }
      }
    }

    await updateDoc(txRef, {
      amount,
      categoryId,
      date,
      description,
      attachment: attachmentData || null,
      updatedByUserId: user.uid,
      updatedByName: currentUserLabel
    });
  };


  const deleteTransaction = async (id: string) => {
    if (!user || !activeAccount) return;

    // Check for attachment to delete from storage
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      const attachmentPath = getAttachmentPathFromTransaction(tx);
      if (attachmentPath) {
        try {
          await deleteAttachmentPath(attachmentPath);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }
    }

    await clearOfflineAttachmentUpload(id);

    const transactionsRef = getActiveScopedCollection<Transaction>('transactions');
    if (!transactionsRef) return;

    await deleteDoc(doc(transactionsRef, id));
  };

  const refreshCategoryCache = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (isOffline) {
      markCategoryCacheRefreshPending();
      if (!silent) {
        showNotification('info', 'Sinkronisasi Kategori Ditunda', 'Perubahan kategori sudah disimpan. Penyegaran data tambahan akan lanjut saat koneksi kembali.', true);
      }
      return;
    }

    try {
      await callCloudFunction<void, unknown>('refreshCategoryCache');
      clearPendingCategoryCacheRefresh();
    } catch (error) {
      console.error('Failed to refresh category cache:', error);
      markCategoryCacheRefreshPending();
      if (!silent) {
        showNotification('warning', 'Sinkronisasi Kategori Belum Selesai', 'Kategori sudah berubah. Penyegaran data tambahan akan dicoba lagi sebentar lagi.', true);
      }
    }
  };

  const addCategory = async (cat: Omit<Category, 'id'>): Promise<string | undefined> => {
    if (!user || !activeAccount) return;
    const categoriesRef = getActiveScopedCollection<Category>('categories');
    if (!categoriesRef) return;
    const docRef = doc(categoriesRef);
    await setDoc(docRef, {
      id: docRef.id,
      ...cat,
      createdByUserId: user.uid,
      createdByName: currentUserLabel,
    });
    await refreshCategoryCache();
    return docRef.id;
  };

  const updateCategory = async (id: string, cat: Omit<Category, 'id'>) => {
    if (!user || !activeAccount) return;
    const categoriesRef = getActiveScopedCollection<Category>('categories');
    if (!categoriesRef) return;
    const catRef = doc(categoriesRef, id);
    await updateDoc(catRef, cat);
    await refreshCategoryCache();
  };

  const deleteCategory = async (id: string) => {
    if (!user || !activeAccount) return;
    const isUsed = transactions.some(t => t.categoryId === id);
    if (isUsed) {
      showNotification('error', 'Tidak Dapat Dihapus', 'Kategori ini tidak bisa dihapus karena masih digunakan dalam transaksi.', true);
      return;
    }
    const categoriesRef = getActiveScopedCollection<Category>('categories');
    if (!categoriesRef) return;
    await deleteDoc(doc(categoriesRef, id));
    await refreshCategoryCache();
  };

  const reorderCategories = async (orderedCategories: Category[]) => {
    if (!user || !activeAccount) return;
    const categoriesRef = getActiveScopedCollection<Category>('categories');
    if (!categoriesRef) return;
    
    const batch = writeBatch(db);
    orderedCategories.forEach((cat, index) => {
      const catRef = doc(categoriesRef, cat.id);
      batch.update(catRef as any, { order: index });
    });
    await batch.commit();
    await refreshCategoryCache();
  };

  // --- Plan Handlers (Firestore) ---
  const createPlan = async (title: string) => {
    if (!user || !activeAccount) return;
    const plansRef = getActiveScopedCollection<Plan>('plans');
    if (!plansRef) return;
    await addDoc(plansRef as any, {
      title,
      items: [],
      createdAt: new Date().toISOString(),
      createdByUserId: user.uid,
      createdByName: currentUserLabel,
    });
  };

  const deletePlan = async (id: string) => {
    if (!user || !activeAccount) return;
    try {
      const plansRef = getActiveScopedCollection<Plan>('plans');
      if (!plansRef) return;
      await deleteDoc(doc(plansRef, id));
    } catch (e) { console.error(e); }
  };

  const addPlanItem = async (planId: string, item: Omit<PlanItem, 'id'>) => {
    if (!user || !activeAccount) return;
    const plansRef = getActiveScopedCollection<Plan>('plans');
    if (!plansRef) return;
    const planRef = doc(plansRef, planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (plan) {
      const newItem: PlanItem = {
        ...item,
        id: Date.now().toString(),
        createdByUserId: user.uid,
        createdByName: currentUserLabel,
      };
      const updatedItems = [...plan.items, newItem].map(serializePlanItemForFirestore);
      await setDoc(planRef, { items: updatedItems }, { merge: true });
    }
  };

  const updatePlanItem = async (planId: string, itemId: string, updatedItem: Omit<PlanItem, 'id'>) => {
    if (!user || !activeAccount) return;
    const plansRef = getActiveScopedCollection<Plan>('plans');
    if (!plansRef) return;
    const planRef = doc(plansRef, planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (plan) {
      const updatedItems = plan.items.map((item) =>
        item.id === itemId ? { ...updatedItem, id: itemId, createdByUserId: item.createdByUserId, createdByName: item.createdByName } : item
      );
      await setDoc(planRef, { items: updatedItems.map(serializePlanItemForFirestore) }, { merge: true });
    }
  };

  const updatePlanSettings = async (planId: string, useCurrentMonthBalance: boolean) => {
    if (!user || !activeAccount) return;
    const plansRef = getActiveScopedCollection<Plan>('plans');
    if (!plansRef) return;
    const planRef = doc(plansRef, planId);
    await setDoc(planRef, { useCurrentMonthBalance }, { merge: true });
  };

  const deletePlanItem = async (planId: string, itemId: string) => {
    if (!user || !activeAccount) return;
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return;

    const item = plan.items.find((i) => i.id === itemId);
    if (!item) return;

    const isPrivateAccount = !isOperationalSharedAccount;
    const isSharedOwner = activeAccount.role === 'OWNER';
    const canEditLegacySharedRecord = !isPrivateAccount && isSharedOwner;
    const canEditPlan = (p: Plan) => {
      if (isPrivateAccount) return true;
      if (!p.createdByUserId) return canEditLegacySharedRecord;
      return p.createdByUserId === user.uid;
    };
    const canEditItem = () => {
      if (isPrivateAccount) return true;
      if (!canEditPlan(plan)) return false;
      if (!item.createdByUserId) return canEditLegacySharedRecord;
      return item.createdByUserId === user.uid;
    };

    if (!canEditItem()) {
      showNotification(
        'error',
        'Tidak Punya Akses',
        'Item rencana ini tidak bisa dihapus karena bukan milik Anda.',
        true
      );
      return;
    }

    const updatedItems = plan.items.filter((i) => i.id !== itemId);

    const privatePlansRef = getPlansCollectionRef(db, user.uid, activeAccount.id);
    const privatePlanRef = doc(privatePlansRef, planId);

    const activeScopedPlansRef = getActiveScopedCollection<Plan>('plans');
    const activePlanRef = activeScopedPlansRef ? doc(activeScopedPlansRef, planId) : null;

    const candidateRefs = [privatePlanRef, activePlanRef]
      .filter((ref): ref is NonNullable<typeof ref> => !!ref)
      .filter((ref, index, arr) => arr.findIndex((other) => other.path === ref.path) === index);

    const attemptErrors: unknown[] = [];

    for (const targetRef of candidateRefs) {
      try {
        const snap = await getDoc(targetRef);
        if (!snap.exists()) continue;
        await setDoc(targetRef, {
          items: updatedItems.map(serializePlanItemForFirestore),
        }, { merge: true });
        return;
      } catch (error) {
        attemptErrors.push(error);
      }
    }

    const firstError = attemptErrors[0];
    try {
      if (isPermissionDeniedError(firstError)) {
        const permissionMessage = isOperationalSharedAccount
          ? 'Item rencana ini tidak bisa dihapus karena bukan milik Anda atau hak akses akun bersama terbatas.'
          : 'Akses ditolak saat menghapus item rencana. Coba refresh halaman lalu ulangi lagi.';
        showNotification(
          'error',
          'Tidak Punya Akses',
          permissionMessage,
          true
        );
      } else {
        showNotification('error', 'Gagal Menghapus Item', 'Terjadi kesalahan saat menghapus item rencana.', true);
      }
      if (firstError) {
        console.error('Failed to delete plan item from all candidate paths:', firstError);
      }
      return;
    } catch (error) {
      console.error('Unexpected failure while handling delete plan item:', error);
      showNotification('error', 'Gagal Menghapus Item', 'Terjadi kesalahan saat menghapus item rencana.', true);
      return;
    }
  };

  const updatePlanItemStatus = async (planId: string, itemId: string, status: PlanItemStatus) => {
    if (!user || !activeAccount) return;
    const plansRef = getActiveScopedCollection<Plan>('plans');
    if (!plansRef) return;
    const planRef = doc(plansRef, planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return;

    const updatedItems = plan.items.map((item) => (
      item.id === itemId ? { ...item, status } : item
    ));

    await setDoc(planRef, { items: updatedItems.map(serializePlanItemForFirestore) }, { merge: true });
  };

  const applyPlanItemToTransaction = async (planId: string, itemId: string, item: PlanItem, date: string) => {
    await addTransaction(item.amount, item.categoryId, date, `[Dari Rencana] ${item.name}`);
    await updatePlanItemStatus(planId, itemId, 'DONE');
    showNotification('success', 'Berhasil!', 'Transaksi berhasil dicatat dari rencana ini.', true);
  };

  const saveBudget = async (payload: {
    budgetId?: string;
    month: string;
    name: string;
    categoryIds: string[];
    limitAmount: number;
  }) => {
    if (!user || !activeAccount) return;

    const budgetsRef = getActiveScopedCollection<Budget>('budgets');
    if (!budgetsRef) return;

    const budgetId = payload.budgetId || doc(budgetsRef).id;
    const now = new Date().toISOString();
    await setDoc(doc(budgetsRef, budgetId) as any, {
      month: payload.month,
      name: payload.name.trim(),
      categoryIds: payload.categoryIds,
      limitAmount: payload.limitAmount,
      createdAt: normalizedBudgets.find((budget) => budget.id === budgetId)?.createdAt || now,
      updatedAt: now,
      createdByUserId: normalizedBudgets.find((budget) => budget.id === budgetId)?.createdByUserId || user.uid,
      createdByName: normalizedBudgets.find((budget) => budget.id === budgetId)?.createdByName || currentUserLabel,
    });
    showNotification('success', 'Anggaran Disimpan', `Anggaran "${payload.name.trim()}" untuk ${payload.month} berhasil diperbarui.`, true);
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user || !activeAccount) return;
    const budgetsRef = getActiveScopedCollection<Budget>('budgets');
    if (!budgetsRef) return;
    await deleteDoc(doc(budgetsRef, budgetId));
    showNotification('success', 'Anggaran Dihapus', 'Anggaran berhasil dihapus.', true);
  };

  const copyBudgetsFromPreviousMonth = async (targetMonth: string) => {
    if (!user || !activeAccount) return;

    const previousMonth = getPreviousMonthKey(targetMonth);
    const sourceBudgets = normalizedBudgets.filter((budget) => budget.month === previousMonth);
    const targetBudgets = normalizedBudgets.filter((budget) => budget.month === targetMonth);
    const usedCategoryIds = new Set(targetBudgets.flatMap((budget) => budget.categoryIds));

    const copyCandidates = sourceBudgets.filter((budget) => (
      budget.categoryIds.every((categoryId) => !usedCategoryIds.has(categoryId))
    ));

    if (copyCandidates.length === 0) {
      showNotification('info', 'Tidak Ada Anggaran Disalin', `Belum ada anggaran ${previousMonth} yang bisa disalin ke ${targetMonth}.`, true);
      return;
    }

    const batch = writeBatch(db);
    const now = new Date().toISOString();
    copyCandidates.forEach((budget) => {
      const budgetsRef = getActiveScopedCollection<Budget>('budgets');
      if (!budgetsRef) return;
      const budgetRef = doc(budgetsRef);
      batch.set(budgetRef as any, {
        month: targetMonth,
        name: budget.name,
        categoryIds: budget.categoryIds,
        limitAmount: budget.limitAmount,
        createdAt: now,
        updatedAt: now,
        createdByUserId: user.uid,
        createdByName: currentUserLabel,
      });
    });
    await batch.commit();
    showNotification('success', 'Anggaran Disalin', `${copyCandidates.length} anggaran dari ${previousMonth} berhasil disalin.`, true);
  };

  const saveDebt = async (payload: {
    debtId?: string;
    kind: 'DEBT' | 'RECEIVABLE';
    personName: string;
    title: string;
    amount: number;
    transactionDate: string;
    dueDate?: string;
    notes?: string;
  }) => {
    if (!user || !activeAccount) return;

    const debtsRef = getActiveScopedCollection<DebtRecord>('debts');
    if (!debtsRef) return;

    const debtId = payload.debtId || doc(debtsRef).id;
    const now = new Date().toISOString();
    const existingDebt = debts.find((entry) => entry.id === debtId);

    await setDoc(doc(debtsRef, debtId), {
      id: debtId,
      kind: payload.kind,
      personName: payload.personName.trim(),
      title: payload.title.trim(),
      amount: payload.amount,
      paidAmount: existingDebt?.paidAmount || 0,
      remainingAmount: Math.max(payload.amount - (existingDebt?.paidAmount || 0), 0),
      status: getNormalizedDebtStatus(payload.amount, existingDebt?.paidAmount || 0, existingDebt?.status),
      transactionDate: payload.transactionDate,
      dueDate: payload.dueDate || null,
      notes: payload.notes || null,
      payments: existingDebt?.payments || [],
      createdAt: existingDebt?.createdAt || now,
      updatedAt: now,
      createdByUserId: existingDebt?.createdByUserId || user.uid,
      createdByName: existingDebt?.createdByName || currentUserLabel,
    });

    showNotification(
      'success',
      payload.kind === 'DEBT' ? 'Hutang Disimpan' : 'Piutang Disimpan',
      `"${payload.title.trim()}" berhasil diperbarui.`,
      true
    );
  };

  const deleteDebt = async (debtId: string) => {
    if (!user || !activeAccount) return;
    const debtsRef = getActiveScopedCollection<DebtRecord>('debts');
    if (!debtsRef) return;
    await deleteDoc(doc(debtsRef, debtId));
    showNotification('success', 'Catatan Dihapus', 'Catatan hutang piutang berhasil dihapus.', true);
  };

  const recordDebtPayment = async (debtId: string, payload: { amount: number; date: string; note?: string }) => {
    if (!user || !activeAccount) return;

    const currentDebt = debts.find((entry) => entry.id === debtId);
    if (!currentDebt) return;

    const nextPaidAmount = Math.min(currentDebt.amount, currentDebt.paidAmount + payload.amount);
    const nextRemainingAmount = Math.max(currentDebt.amount - nextPaidAmount, 0);
    const nextStatus = getNormalizedDebtStatus(currentDebt.amount, nextPaidAmount);
    const paymentEntry: DebtPayment = {
      id: `${Date.now()}`,
      amount: payload.amount,
      date: payload.date,
      createdAt: new Date().toISOString(),
      ...(payload.note ? { note: payload.note } : {}),
    };

    const debtsRef = getActiveScopedCollection<DebtRecord>('debts');
    if (!debtsRef) return;

    await updateDoc(doc(debtsRef, debtId), {
      paidAmount: nextPaidAmount,
      remainingAmount: nextRemainingAmount,
      status: nextStatus,
      payments: [paymentEntry, ...(currentDebt.payments || [])],
      updatedAt: new Date().toISOString(),
    });

    showNotification('success', 'Pembayaran Disimpan', 'Pembayaran berhasil dicatat.', true);
  };

  const markDebtAsPaid = async (debtId: string) => {
    if (!user || !activeAccount) return;

    const currentDebt = debts.find((entry) => entry.id === debtId);
    if (!currentDebt) return;

    const debtsRef = getActiveScopedCollection<DebtRecord>('debts');
    if (!debtsRef) return;

    await updateDoc(doc(debtsRef, debtId), {
      paidAmount: currentDebt.amount,
      remainingAmount: 0,
      status: 'PAID',
      updatedAt: new Date().toISOString(),
    });

    showNotification('success', 'Status Diperbarui', 'Catatan berhasil ditandai lunas.', true);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Delete all transactions
  const deleteAllTransactions = async () => {
    if (!user || !activeAccount) return;
    const transactionsRef = getActiveScopedCollection<Transaction>('transactions');
    if (!transactionsRef) return;

    const attachmentPaths = transactions
      .map((transaction) => getAttachmentPathFromTransaction(transaction))
      .filter((path): path is string => typeof path === 'string' && path.length > 0);

    if (attachmentPaths.length > 0) {
      if (isOffline) {
        queueAttachmentCleanup(...attachmentPaths);
      } else {
        await Promise.all(
          attachmentPaths.map(async (path) => {
            await deleteAttachmentPath(path);
          })
        );
      }
    }

    const txQuery = query(transactionsRef);
    const snapshot = await getDocs(txQuery);
    await deleteOfflineAttachmentUploadJobsForTransactions(user.uid, activeAccount.id, snapshot.docs.map((document) => document.id));
    bumpAttachmentQueueVersion();
    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  };


  const currentBalance = transactions.reduce((acc, t) => {
    const type = categories.find(c => c.id === t.categoryId)?.type;
    return type === 'INCOME' ? acc + t.amount : acc - t.amount;
  }, 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthBalance = transactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const [yearStr, monthStr] = t.date.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (year !== currentYear || month !== currentMonth) return acc;

    const type = categories.find(c => c.id === t.categoryId)?.type;
    return type === 'INCOME' ? acc + t.amount : acc - t.amount;
  }, 0);

  const formatBalance = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const onboardingStorageKey = user && activeAccountId
    ? `dompetcerdas_onboarding_seen_${user.uid}_${activeAccountId}`
    : null;
  const gettingStartedStorageKey = user && activeAccountId
    ? `dompetcerdas_getting_started_seen_${user.uid}_${activeAccountId}`
    : null;
  const hasSeenOnboarding = onboardingStorageKey
    ? localStorage.getItem(onboardingStorageKey) === '1'
    : false;
  const isGettingStartedDismissed = gettingStartedStorageKey
    ? localStorage.getItem(gettingStartedStorageKey) === '1'
    : false;
  const hasStarterData = transactions.length > 0 || plans.length > 0 || budgets.length > 0 || debts.length > 0;
  const attachmentUploadJobs = Object.values(pendingAttachmentUploads);
  const failedAttachmentUploadCount = attachmentUploadJobs.filter((job) => job.status === 'failed').length;
  const pendingAttachmentUploadCount = attachmentUploadJobs.length - failedAttachmentUploadCount;

  useEffect(() => {
    if (!user || !activeAccountId || accountLoading || !onboardingStorageKey) return;

    const hasSeen = localStorage.getItem(onboardingStorageKey) === '1';
    if (!hasSeen && !hasStarterData) {
      setShowOnboarding(true);
    }
  }, [user, activeAccountId, accountLoading, onboardingStorageKey, hasStarterData]);

  const openOnboarding = () => {
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    if (onboardingStorageKey) {
      localStorage.setItem(onboardingStorageKey, '1');
    }
    if (gettingStartedStorageKey) {
      localStorage.setItem(gettingStartedStorageKey, '1');
    }
    setShowOnboarding(false);
  };

  const navigateFromOnboarding = (view: View) => {
    closeOnboarding();
    setCurrentView(view);
  };


  // --- RENDER ---

  // Handle link-telegram route
  if (isLinkTelegramRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ViewLoadingFallback />}>
          <LinkTelegram />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (authLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ViewLoadingFallback />}>
          <AuthLogin />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (accountLoading && !hydratedFromCache) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, bgcolor: 'background.default' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Menyiapkan Akun Keuangan...</Typography>
      </Box>
    );
  }

  const SIDEBAR_WIDTH = 264;

  const NAV_ITEMS: Array<{ view: View; label: string; icon: string }> = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: 'Home' },
    { view: 'TRANSACTIONS', label: 'Transaksi', icon: 'BookOpen' },
    { view: 'PLANS', label: 'Rencana', icon: 'CalendarDays' },
    { view: 'BUDGETS', label: 'Anggaran', icon: 'PiggyBank' },
    { view: 'DEBTS', label: 'Hutang Piutang', icon: 'Handshake' },
    { view: 'ROUTINE_EXPENSES', label: 'Pengeluaran Rutin', icon: 'RefreshCw' },
    { view: 'CATEGORIES', label: 'Kategori', icon: 'Briefcase' },
  ];

  const BOTTOM_NAV_ITEMS: Array<{ view: View | 'MORE' | 'ADD'; label: string; icon: string }> = [
    { view: 'DASHBOARD', label: 'Beranda', icon: 'Home' },
    { view: 'TRANSACTIONS', label: 'Riwayat', icon: 'BookOpen' },
    { view: 'ADD', label: 'Tambah', icon: 'Plus' },
    { view: 'BUDGETS', label: 'Anggaran', icon: 'PiggyBank' },
    { view: 'MORE', label: 'Lainnya', icon: 'MoreHorizontal' },
  ];

  const bottomNavIndex = BOTTOM_NAV_ITEMS.findIndex((item) => item.view === currentView);
  const activeBottomNavIndex = bottomNavIndex !== -1 ? bottomNavIndex : 4;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>

      {/* Update Banner */}
      {showUpdateBanner && (
        <Snackbar
          open={showUpdateBanner}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: 0, zIndex: 1400 }}
        >
          <Paper
            elevation={6}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2, py: 1.5,
              borderRadius: 2,
              bgcolor: theme.colors.accent,
              color: '#fff',
            }}
          >
            <IconDisplay name="RefreshCw" size={18} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Versi baru siap dipasang (v{APP_VERSION})
            </Typography>
            <Button size="small" onClick={handleDismissUpdate} disabled={isApplyingUpdate} sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 'auto', textTransform: 'none' }}>
              Nanti
            </Button>
            <Button size="small" variant="contained" onClick={handleUpdate} disabled={isApplyingUpdate} sx={{ bgcolor: '#fff', color: theme.colors.accent, textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
              {isApplyingUpdate ? 'Memasang...' : 'Pasang'}
            </Button>
          </Paper>
        </Snackbar>
      )}

      {isOffline && (
        <Snackbar
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 96, md: 32 } }}
        >
          <Alert severity="warning" variant="filled" sx={{ fontWeight: 600, alignItems: 'center' }}>
            Mode offline aktif. Data yang sudah pernah dibuka tetap bisa dilihat, lalu perubahan akan disinkronkan saat online lagi.
          </Alert>
        </Snackbar>
      )}

      <Snackbar
        open={showReconnectToast}
        autoHideDuration={2400}
        onClose={() => setShowReconnectToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 96, md: 32 } }}
      >
        <Alert onClose={() => setShowReconnectToast(false)} severity="success" variant="filled" sx={{ fontWeight: 600, alignItems: 'center' }}>
          Koneksi kembali. Sinkronisasi dilanjutkan.
        </Alert>
      </Snackbar>

      {/* Desktop Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            bgcolor: theme.colors.sidebarBg,
            borderRight: `1px solid ${theme.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* App Logo */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${theme.colors.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: theme.colors.accent, color: '#fff', display: 'flex' }}>
              <IconDisplay name="Wallet" size={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: theme.colors.textPrimary, whiteSpace: 'nowrap' }}>
              DompetCerdas <Typography component="span" variant="caption" sx={{ opacity: 0.6 }}>v{APP_VERSION}</Typography>
            </Typography>
          </Box>
        </Box>

        {/* User Info */}
        <Box sx={{ px: 2, py: 2 }}>
          <Paper
            elevation={0}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 3, bgcolor: theme.colors.bgHover, border: `1px solid ${theme.colors.border}` }}
          >
            <Avatar src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName || 'User'} sx={{ width: 40, height: 40 }} />
            <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.colors.textPrimary }}>
                {user.displayName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                <Button size="small" onClick={handleLogout} sx={{ p: 0, minWidth: 'auto', color: theme.colors.expense, textTransform: 'none', fontSize: '0.75rem', fontWeight: 500 }}>
                  Keluar
                </Button>
                {themeToggleTextButton}
              </Box>
            </Box>
          </Paper>

          {/* Active Account */}
          <Paper
            elevation={0}
            sx={{ mt: 1.5, p: 1.5, borderRadius: 3, bgcolor: theme.colors.bgHover, border: `1px solid ${theme.colors.border}` }}
          >
            <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.16em', color: theme.colors.textMuted, fontSize: '0.65rem' }}>
              Akun Aktif
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: theme.colors.textPrimary }}>
              {activeAccount?.name || 'Pilih Akun'}
            </Typography>
            <Select
              value={activeAccountId || ''}
              onChange={(e) => switchAccount(e.target.value as string)}
              size="small"
              fullWidth
              sx={{
                mt: 1.5,
                borderRadius: 2,
                bgcolor: theme.colors.bgCard,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.colors.border },
              }}
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Select>
          </Paper>
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1, px: 1, py: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.view}
              selected={currentView === item.view}
              onClick={() => setCurrentView(item.view)}
              data-testid={`nav-${item.view.toLowerCase()}`}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: theme.colors.sidebarActiveBg,
                  color: theme.colors.sidebarActive,
                  '&:hover': { bgcolor: theme.colors.sidebarActiveBg },
                },
                color: theme.colors.sidebarText,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <IconDisplay name={item.icon} size={18} />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2', fontWeight: currentView === item.view ? 600 : 500 }} />
            </ListItemButton>
          ))}
          <Divider sx={{ my: 1, borderColor: theme.colors.border }} />
          <ListItemButton
            selected={currentView === 'AI_ADVISOR'}
            onClick={() => setCurrentView('AI_ADVISOR')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': { bgcolor: theme.colors.sidebarActiveBg, color: theme.colors.sidebarActive, '&:hover': { bgcolor: theme.colors.sidebarActiveBg } },
              color: theme.colors.sidebarText,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: theme.colors.accent }}>
              <IconDisplay name="Zap" size={18} />
            </ListItemIcon>
            <ListItemText primary="Analisis AI" primaryTypographyProps={{ variant: 'body2', fontWeight: currentView === 'AI_ADVISOR' ? 600 : 500 }} />
          </ListItemButton>
          <ListItemButton
            selected={currentView === 'SETTINGS'}
            onClick={() => setCurrentView('SETTINGS')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': { bgcolor: theme.colors.sidebarActiveBg, color: theme.colors.sidebarActive, '&:hover': { bgcolor: theme.colors.sidebarActiveBg } },
              color: theme.colors.sidebarText,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <IconDisplay name="Settings" size={18} />
            </ListItemIcon>
            <ListItemText primary="Pengaturan" primaryTypographyProps={{ variant: 'body2', fontWeight: currentView === 'SETTINGS' ? 600 : 500 }} />
          </ListItemButton>
        </List>

        {/* Balance Card */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.colors.border}` }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 2,
              background: `linear-gradient(135deg, ${theme.colors.accent} 0%, ${theme.name === 'dark' ? '#8B5CF6' : '#7C3AED'} 100%)`,
              color: '#fff',
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Saldo Saat Ini</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatBalance(currentBalance)}</Typography>
          </Paper>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile Header - Compact single row */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            display: { xs: 'flex', md: 'none' },
            bgcolor: theme.colors.bgCard,
            borderBottom: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: 2, minHeight: '56px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
              <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: theme.colors.accent, color: '#fff', display: 'flex', flexShrink: 0 }}>
                <IconDisplay name="Wallet" size={18} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.2 }}>
                  DompetCerdas
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: theme.colors.textMuted, fontSize: 10, display: 'block' }}>
                  {activeAccount?.name || 'Akun Keuangan'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setCurrentView('SETTINGS')}
                sx={{
                  bgcolor: currentView === 'SETTINGS' ? theme.colors.accentLight : 'transparent',
                  color: currentView === 'SETTINGS' ? theme.colors.accent : theme.colors.textMuted,
                }}
              >
                <IconDisplay name="Settings" size={18} />
              </IconButton>
              <Avatar
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                alt={user.displayName || 'User'}
                sx={{ width: 32, height: 32, border: `1px solid ${theme.colors.border}`, ml: 0.5 }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 }, pb: { xs: '100px', md: 4 } }}>
          <Container maxWidth="lg" disableGutters>
            <ErrorBoundary key={currentView}>
              <Suspense fallback={<ViewLoadingFallback />}>
                {currentView === 'DASHBOARD' && (
                <Dashboard
                  transactions={transactions}
                  categories={categories}
                  budgets={normalizedBudgets}
                  debts={debts}
                  plans={plans}
                  isOffline={isOffline}
                  hasPendingWrites={hasPendingWrites}
                  pendingAttachmentCount={pendingAttachmentUploadCount}
                  failedAttachmentCount={failedAttachmentUploadCount}
                  attachmentQueueLoading={!attachmentQueueLoaded && !!user && !!activeAccountId}
                  showGettingStarted={!hasStarterData}
                  isGettingStartedDismissed={isGettingStartedDismissed || hasSeenOnboarding}
                  activeAccountName={activeAccount?.name || 'Akun Keuangan'}
                  telegramLinked={telegramLinked}
                  onGoToTransactions={() => setCurrentView('TRANSACTIONS')}
                  onGoToBudgets={() => setCurrentView('BUDGETS')}
                  onGoToDebts={() => setCurrentView('DEBTS')}
                  onGoToSettings={() => setCurrentView('SETTINGS')}
                  onOpenOnboarding={openOnboarding}
                  onQuickAdd={(type) => { setQuickAddType(type); setShowQuickAdd(true); }}
                  onScanReceipt={() => { setQuickAddType('EXPENSE'); setShowQuickAdd(true); }}
                />
              )}
              {currentView === 'TRANSACTIONS' && (
                <TransactionList
                  transactions={transactions}
                  categories={categories}
                  currentUserId={user?.uid}
                  activeAccountRole={activeAccount?.role}
                  pendingAttachmentUploads={pendingAttachmentUploads}
                  onRetryAttachmentUpload={retryOfflineAttachmentUpload}
                  onCancelAttachmentUpload={cancelOfflineAttachmentUpload}
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                  onAddCategory={addCategory}
                  onShowNotification={showNotification}
                />
              )}
              {currentView === 'PLANS' && (
                <PlanManager
                  plans={plans}
                  categories={categories}
                  currentUserId={user.uid}
                  isSharedAccount={isOperationalSharedAccount}
                  isSharedOwner={activeAccount?.role === 'OWNER'}
                  currentBalance={currentBalance}
                  currentMonthBalance={currentMonthBalance}
                  onCreatePlan={createPlan}
                  onDeletePlan={deletePlan}
                  onAddPlanItem={addPlanItem}
                  onUpdatePlanItem={updatePlanItem}
                  onDeletePlanItem={deletePlanItem}
                  onApplyPlanItemToTransaction={applyPlanItemToTransaction}
                  onUpdatePlanSettings={updatePlanSettings}
                  onUpdatePlanItemStatus={updatePlanItemStatus}
                />
              )}
              {currentView === 'BUDGETS' && (
                <BudgetManager
                  budgets={normalizedBudgets}
                  transactions={transactions}
                  categories={categories}
                  currentUserId={user.uid}
                  onSaveBudget={saveBudget}
                  onDeleteBudget={deleteBudget}
                  onCopyBudgetsFromPreviousMonth={copyBudgetsFromPreviousMonth}
                />
              )}
              {currentView === 'DEBTS' && (
                <DebtManager
                  debts={debts}
                  currentUserId={user.uid}
                  onSaveDebt={saveDebt}
                  onDeleteDebt={deleteDebt}
                  onRecordPayment={recordDebtPayment}
                  onMarkAsPaid={markDebtAsPaid}
                />
              )}
              {currentView === 'ROUTINE_EXPENSES' && activeAccount && (
                <RoutineExpenseManager
                  activeAccount={activeAccount}
                  currentUserId={user.uid}
                  categories={categories}
                  onAddTransaction={addTransaction}
                  onAddCategory={addCategory}
                  onShowNotification={showNotification}
                />
              )}
              {currentView === 'CATEGORIES' && (
                <CategoryManager
                  categories={categories}
                  currentUserId={user.uid}
                  onAddCategory={addCategory}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={deleteCategory}
                  onReorderCategories={reorderCategories}
                />
              )}
              {currentView === 'AI_ADVISOR' && (
                <AiAdvisor
                  transactions={transactions}
                  categories={categories}
                  onShowNotification={showNotification}
                />
              )}
              {currentView === 'SETTINGS' && (
                <Settings
                  accounts={accounts}
                  activeAccountId={activeAccountId}
                  activeAccountName={activeAccount?.name || null}
                  telegramLinked={telegramLinked}
                  telegramDefaultAccountId={telegramDefaultAccountId}
                  telegramReminderEnabled={telegramReminderEnabled}
                  telegramReminderTime={telegramReminderTime}
                  activeSharedInviteCode={activeSharedInviteCode}
                  sharedAccountMembers={sharedAccountMembers}
                  onOpenOnboarding={openOnboarding}
                  onUpdateTelegramAccount={updateTelegramDefaultAccount}
                  onUpdateTelegramReminderSettings={updateTelegramReminderSettings}
                  onCreateAccount={createPrivateAccount}
                  onCreateSharedAccount={createSharedAccount}
                  onShareAccount={shareAccount}
                  onGenerateSharedInviteCode={generateSharedInviteCode}
                  onJoinSharedAccount={joinSharedAccount}
                  onSwitchAccount={switchAccount}
                  onDeleteAccount={deleteAccount}
                  onDeleteAllTransactions={deleteAllTransactions}
                  transactionCount={transactions.length}
                  transactions={transactions}
                  categories={categories}
                />
              )}
            </Suspense>
            </ErrorBoundary>
          </Container>
        </Box>

        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <OnboardingModal
              isOpen={showOnboarding}
              accountName={activeAccount?.name || 'Akun Keuangan'}
              telegramLinked={telegramLinked}
              onClose={closeOnboarding}
              onGoToTransactions={() => navigateFromOnboarding('TRANSACTIONS')}
              onGoToBudgets={() => navigateFromOnboarding('BUDGETS')}
              onGoToSettings={() => navigateFromOnboarding('SETTINGS')}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Mobile Bottom Navigation */}
        <Paper
          elevation={8}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            borderTop: `1px solid ${theme.colors.border}`,
          }}
        >
          <BottomNavigation
            showLabels
            value={activeBottomNavIndex}
            onChange={(event, newValue) => {
              if (newValue === 4) {
                setMoreMenuAnchorEl(event.currentTarget as HTMLElement);
              } else if (newValue === 2) {
                setQuickAddType('EXPENSE');
                setShowQuickAdd(true);
              } else if (newValue >= 0 && newValue < BOTTOM_NAV_ITEMS.length) {
                setCurrentView(BOTTOM_NAV_ITEMS[newValue].view as View);
              }
            }}
            sx={{
              bgcolor: theme.colors.bgCard,
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                color: theme.colors.textMuted,
                minWidth: 'auto',
                py: 1,
                '&.Mui-selected': {
                  color: theme.colors.accent,
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
                mt: 0.25,
                '&.Mui-selected': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
              },
            }}
          >
            {BOTTOM_NAV_ITEMS.map((item, index) => {
              const isAddButton = item.view === 'ADD';
              return (
                <BottomNavigationAction
                  key={item.view}
                  value={index}
                  label={item.label}
                  icon={
                    isAddButton ? (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: theme.colors.accent,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          mt: -3,
                          transition: 'transform 0.15s',
                          '&:active': { transform: 'scale(0.95)' },
                        }}
                      >
                        <IconDisplay name={item.icon} size={24} />
                      </Box>
                    ) : (
                      <IconDisplay name={item.icon} size={20} />
                    )
                  }
                  sx={isAddButton ? { transform: 'translateY(-4px)' } : undefined}
                />
              );
            })}
          </BottomNavigation>
        </Paper>

        {/* Desktop FAB */}
        {(currentView === 'TRANSACTIONS' || currentView === 'DASHBOARD') && (
          <Fab
            color="primary"
            onClick={() => { setQuickAddType('EXPENSE'); setShowQuickAdd(true); }}
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 40,
              width: 56,
              height: 56,
              bgcolor: theme.colors.accent,
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
              transition: 'transform 0.2s ease',
              '&:hover': { bgcolor: theme.colors.accentHover, transform: 'scale(1.05)' },
            }}
          >
            <IconDisplay name="Plus" size={28} />
          </Fab>
        )}

        {/* Quick Add Sheet */}
        {showQuickAdd && (
          <ErrorBoundary
            fallback={null}
            onError={() => {
              setShowQuickAdd(false);
              showNotification('error', 'Gagal memuat form', 'Form transaksi gagal dimuat. Periksa koneksi internet lalu coba lagi.');
            }}
          >
            <Suspense fallback={null}>
              <QuickAddSheetLoader
                quickAddType={quickAddType}
                categories={categories}
                transactions={transactions}
                onClose={() => setShowQuickAdd(false)}
                onAdd={addTransaction}
                onAddCategory={addCategory}
                onShowNotification={showNotification}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Notification Modal */}
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <NotificationModal
              isOpen={notification.isOpen}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onClose={closeNotification}
              autoClose={notification.autoClose}
            />
          </Suspense>
        </ErrorBoundary>
        {/* More Menu Bottom Sheet (Mobile) */}
        {moreMenuAnchorEl && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-end',
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
            }}
            onClick={() => setMoreMenuAnchorEl(null)}
          >
            <Box
              sx={{
                width: '100%',
                bgcolor: 'background.paper',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '85vh',
                overflow: 'auto',
                animation: 'slideUp 0.25s ease-out',
                '@keyframes slideUp': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
              </Box>

              <Box sx={{ px: 3, pb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Menu Lainnya
                </Typography>
              </Box>

              <List disablePadding sx={{ pb: 2 }}>
                {[
                  { view: 'CATEGORIES' as View, label: 'Kategori', icon: 'Briefcase', desc: 'Kelola kategori transaksi' },
                  { view: 'PLANS' as View, label: 'Rencana', icon: 'CalendarDays', desc: 'Rencana pemasukan & pengeluaran' },
                  { view: 'ROUTINE_EXPENSES' as View, label: 'Pengeluaran Rutin', icon: 'RefreshCw', desc: 'Atur pengeluaran berulang' },
                  { view: 'AI_ADVISOR' as View, label: 'Analisis AI', icon: 'Zap', desc: 'Insight keuangan dengan AI' },
                  { view: 'SETTINGS' as View, label: 'Pengaturan', icon: 'Settings', desc: 'Akun, tema, dan preferensi' },
                ].map((item) => (
                  <ListItemButton
                    key={item.view}
                    selected={currentView === item.view}
                    onClick={() => {
                      setCurrentView(item.view);
                      setMoreMenuAnchorEl(null);
                    }}
                    sx={{
                      px: 3,
                      py: 2,
                      '&.Mui-selected': { bgcolor: theme.colors.accentLight },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 44 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: currentView === item.view ? theme.colors.accent : 'action.hover',
                          color: currentView === item.view ? '#fff' : 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconDisplay name={item.icon} size={20} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.desc}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <IconDisplay name="ChevronRight" size={18} sx={{ color: 'text.disabled' }} />
                  </ListItemButton>
                ))}
              </List>

              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box
                  component="button"
                  onClick={() => setMoreMenuAnchorEl(null)}
                  sx={{
                    width: '100%',
                    py: 1.5,
                    border: 'none',
                    borderRadius: 3,
                    bgcolor: 'action.hover',
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  Tutup
                </Box>
              </Box>
            </Box>
          </Box>
        )}

      </Box>
      {/* Perf overlay — visible only with ?perf=1 */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf') && (
        <Box sx={{ position: 'fixed', bottom: 8, left: 8, right: 8, zIndex: 9999, bgcolor: 'rgba(0,0,0,0.85)', color: '#fff', p: 1.2, borderRadius: 2, fontSize: 11, fontFamily: 'monospace', lineHeight: 1.4, maxWidth: 360, mx: 'auto' }}>
          <Box sx={{ fontWeight: 700, mb: 0.5 }}>perf {Math.round(performance.now())}ms</Box>
          <Box>
            {(() => {
              try {
                return performance.getEntriesByType('mark').map((m: any) => `${m.name.replace('dc-','')}:${Math.round(m.startTime)}ms`).join(' → ');
              } catch { return ''; }
            })()}
          </Box>
          <Box sx={{ opacity: 0.7, mt: 0.5, fontSize: 10 }}>cache:{hydratedFromCache ? 'hit' : 'miss'} tx:{transactions.length} cat:{categories.length} acct:{activeAccount?.id?.slice(0,6) || '-'}</Box>
        </Box>
      )}
    </Box>
  );
}

export default App;
