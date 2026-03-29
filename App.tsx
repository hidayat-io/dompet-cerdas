import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, writeBatch, getDocs, getDoc, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db, storage, firebaseApp } from './firebase';

import { INITIAL_CATEGORIES, APP_VERSION } from './constants';
import { AccountType, Budget, Category, DebtPayment, DebtRecord, DebtStatus, FinancialAccount, Plan, PlanItem, PlanItemStatus, Transaction } from './types';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import TransactionList from './components/TransactionList';
import CategoryManager from './components/CategoryManager';
import TransactionForm from './components/TransactionForm';
import PlanManager from './components/PlanManager';
import DebtManager from './components/DebtManager';
import OnboardingModal from './components/OnboardingModal';
import AuthLogin from './components/AuthLogin';
import Settings from './components/Settings';
import LinkTelegram from './components/LinkTelegram';
import AiAdvisor from './components/AiAdvisor';

import IconDisplay from './components/IconDisplay';
import { useTheme } from './contexts/ThemeContext';
import NotificationModal, { NotificationType } from './components/NotificationModal';

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
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Fab from '@mui/material/Fab';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Snackbar from '@mui/material/Snackbar';

import {
  DEFAULT_ACCOUNT_NAME,
  DEFAULT_ACCOUNT_TYPE,
  createAccountPayload,
  getAccountsCollectionRef,
  getBudgetsCollectionRef,
  getCategoriesCollectionRef,
  getDebtsCollectionRef,
  getLegacySimulationsCollectionRef,
  getPlansCollectionRef,
  getTransactionsCollectionRef,
  getUserDocRef
} from './services/accountService';
import { getAccountTypeLabel } from './utils/accountLabels';
import { getNormalizedBudget, getPreviousMonthKey } from './utils/budget';

// ... (skip content)

type View = 'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'PLANS' | 'BUDGETS' | 'DEBTS' | 'AI_ADVISOR' | 'SETTINGS';

type UserMeta = {
  activeAccountId?: string;
  accountMigrationVersion?: number;
  accountMigrationCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TelegramLinkMeta = {
  defaultAccountId?: string;
};

const functions = getFunctions(firebaseApp, 'asia-southeast1');
const MIGRATION_BATCH_SIZE = 400;
const DEFAULT_PLAN_ITEM_STATUS: PlanItemStatus = 'PLANNED';

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
  plannedDate: item.plannedDate,
  status: item.status || DEFAULT_PLAN_ITEM_STATUS,
});

const normalizePlan = (planId: string, rawPlan: Partial<Plan>): Plan => ({
  id: planId,
  title: rawPlan.title || 'Rencana',
  items: Array.isArray(rawPlan.items)
    ? rawPlan.items.map((item) => normalizePlanItem(item as Partial<PlanItem> & { id: string }))
    : [],
  createdAt: rawPlan.createdAt || new Date().toISOString(),
  useCurrentMonthBalance: !!rawPlan.useCurrentMonthBalance,
});

function App() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check if current path is /link-telegram
  const isLinkTelegramRoute = window.location.pathname === '/link-telegram';

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Data States (Synced with Firestore)
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [telegramDefaultAccountId, setTelegramDefaultAccountId] = useState<string | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);

  const normalizedBudgets = useMemo(
    () => budgets.map((budget) => getNormalizedBudget(budget, categories)),
    [budgets, categories]
  );

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

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || isLinkTelegramRoute) return;

    const pendingToken = sessionStorage.getItem('telegram_link_token');
    if (!pendingToken) return;

    window.location.replace(`/link-telegram?token=${encodeURIComponent(pendingToken)}`);
  }, [user, isLinkTelegramRoute]);

  // --- Update Banner State ---
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // --- Auto-Update Check for PWA ---
  useEffect(() => {
    const STORED_VERSION_KEY = 'dompetcerdas_version';
    const storedVersion = localStorage.getItem(STORED_VERSION_KEY);

    if (storedVersion && storedVersion !== APP_VERSION) {
      // New version detected - show banner
      console.log(`New version available: ${storedVersion} → ${APP_VERSION}`);
      setShowUpdateBanner(true);
    } else if (!storedVersion) {
      // First time - store current version
      localStorage.setItem(STORED_VERSION_KEY, APP_VERSION);
    }
  }, []);

  // Handle update action
  const handleUpdate = () => {
    const STORED_VERSION_KEY = 'dompetcerdas_version';
    localStorage.setItem(STORED_VERSION_KEY, APP_VERSION);

    // Clear caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    // Reload to get new version
    window.location.reload();
  };

  const handleDismissUpdate = () => {
    setShowUpdateBanner(false);
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

      const userRef = getUserDocRef(db, user.uid);
      const accountsRef = getAccountsCollectionRef(db, user.uid);
      const userSnap = await getDoc(userRef);
      const userMeta = (userSnap.data() || {}) as UserMeta;
      const accountsSnap = await getDocs(accountsRef);

      let resolvedAccountId = userMeta.activeAccountId;

      if (accountsSnap.empty) {
        const now = new Date().toISOString();
        const defaultAccountRef = doc(accountsRef);
        const batch = writeBatch(db);
        batch.set(defaultAccountRef, createAccountPayload(DEFAULT_ACCOUNT_NAME, DEFAULT_ACCOUNT_TYPE, now));
        batch.set(userRef, {
          activeAccountId: defaultAccountRef.id,
          accountMigrationVersion: 1,
          updatedAt: now,
          createdAt: userMeta.createdAt || now
        }, { merge: true });
        await batch.commit();
        resolvedAccountId = defaultAccountRef.id;
      } else if (!resolvedAccountId || !accountsSnap.docs.some((accountDoc) => accountDoc.id === resolvedAccountId)) {
        resolvedAccountId = accountsSnap.docs[0].id;
        await setDoc(userRef, {
          activeAccountId: resolvedAccountId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (resolvedAccountId) {
        const targetCategoriesRef = getCategoriesCollectionRef(db, user.uid, resolvedAccountId);
        const targetTransactionsRef = getTransactionsCollectionRef(db, user.uid, resolvedAccountId);
        const targetPlansRef = getPlansCollectionRef(db, user.uid, resolvedAccountId);
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
    if (!user) return;

    const userRef = getUserDocRef(db, user.uid);
    const accountsRef = query(getAccountsCollectionRef(db, user.uid));

    const unsubUser = onSnapshot(userRef, (snapshot) => {
      const data = snapshot.data() as UserMeta | undefined;
      if (data?.activeAccountId) {
        setActiveAccountId(data.activeAccountId);
      }
    });

    const unsubAccounts = onSnapshot(accountsRef, (snapshot) => {
      const data = snapshot.docs
        .map((accountDoc) => ({ id: accountDoc.id, ...accountDoc.data() } as FinancialAccount))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setAccounts(data);
    });

    return () => {
      unsubUser();
      unsubAccounts();
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTelegramDefaultAccountId(null);
      setTelegramLinked(false);
      return;
    }

    const telegramLinkRef = doc(db, 'users', user.uid, 'telegram_link', 'main');
    const unsubscribe = onSnapshot(telegramLinkRef, (snapshot) => {
      setTelegramLinked(snapshot.exists());
      const data = snapshot.data() as TelegramLinkMeta | undefined;
      setTelegramDefaultAccountId(data?.defaultAccountId || null);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user || !activeAccountId) {
      setCategories([]);
      setTransactions([]);
      setPlans([]);
      setBudgets([]);
      setDebts([]);
      return;
    }

    const catQuery = query(getCategoriesCollectionRef(db, user.uid, activeAccountId));
    const unsubCat = onSnapshot(catQuery, (snapshot) => {
      const data = snapshot.docs.map((categoryDoc) => ({ id: categoryDoc.id, ...categoryDoc.data() } as Category));
      setCategories(data);
    });

    const txQuery = query(getTransactionsCollectionRef(db, user.uid, activeAccountId));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const data = snapshot.docs.map((transactionDoc) => ({ id: transactionDoc.id, ...transactionDoc.data() } as Transaction));
      setTransactions(data);
    });

    const planQuery = query(getPlansCollectionRef(db, user.uid, activeAccountId));
    const unsubPlans = onSnapshot(planQuery, (snapshot) => {
      const data = snapshot.docs.map((planDoc) => normalizePlan(planDoc.id, planDoc.data() as Partial<Plan>));
      setPlans(data);
    });

    const budgetQuery = query(getBudgetsCollectionRef(db, user.uid, activeAccountId));
    const unsubBudgets = onSnapshot(budgetQuery, (snapshot) => {
      const data = snapshot.docs.map((budgetDoc) => ({ id: budgetDoc.id, ...(budgetDoc.data() as Partial<Budget>) } as Budget));
      setBudgets(data);
    });

    const debtQuery = query(getDebtsCollectionRef(db, user.uid, activeAccountId));
    const unsubDebts = onSnapshot(debtQuery, (snapshot) => {
      const data = snapshot.docs.map((debtDoc) => normalizeDebtRecord(debtDoc.id, debtDoc.data() as Partial<DebtRecord>));
      setDebts(data);
    });

    return () => {
      unsubCat();
      unsubTx();
      unsubPlans();
      unsubBudgets();
      unsubDebts();
    };
  }, [user, activeAccountId]);

  // --- CRUD Handlers (Firestore) ---

  const createAccount = async (name: string, type: AccountType) => {
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

    batch.set(accountRef, createAccountPayload(trimmedName, type, now));
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

  const switchAccount = async (accountId: string) => {
    if (!user || !accountId || accountId === activeAccountId) return;

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

  const addTransaction = async (
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' }
  ) => {
    if (!user || !activeAccountId) return;

    let attachmentData = null;

    // Upload attachment if exists
    if (attachment) {
      try {
        // Create ref
        const fileExt = attachment.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `users/${user.uid}/accounts/${activeAccountId}/attachments/${fileName}`);

        // Upload
        const snapshot = await uploadBytes(storageRef, attachment.file);
        const url = await getDownloadURL(snapshot.ref);

        attachmentData = {
          url,
          path: snapshot.ref.fullPath,
          type: attachment.type,
          name: attachment.file.name,
          size: attachment.file.size
        };
      } catch (err) {
        console.error("Upload failed", err);
        showNotification('error', 'Upload Gagal', 'Gagal mengupload lampiran, transaksi tetap disimpan tanpa lampiran.');
      }
    }

    await addDoc(getTransactionsCollectionRef(db, user.uid, activeAccountId), {
      amount,
      categoryId,
      date,
      description,
      createdAt: new Date().toISOString(),
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
    if (!user || !activeAccountId) return;

    const txRef = doc(getTransactionsCollectionRef(db, user.uid, activeAccountId), id);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return;

    const currentData = txSnap.data() as unknown as Transaction;
    let attachmentData = currentData.attachment;

    // Handle Attachment Logic
    if (attachment === null) {
      if (currentData.attachment && currentData.attachment.path) {
        try {
          await deleteObject(ref(storage, currentData.attachment.path));
        } catch (e) { console.error("Failed to delete old attachment", e); }
      }
      else if (currentData.attachmentUrl) {
        // Try to delete legacy attachment by extracting path from URL
        try {
          // Extract path from Firebase Storage URL
          const urlPattern = /\/o\/(.+?)\?/;
          const match = currentData.attachmentUrl.match(urlPattern);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            await deleteObject(ref(storage, filePath));
          }
        } catch (e) {
          console.error("Failed to delete legacy attachment", e);
        }
      }
      attachmentData = undefined;
    }
    else if (attachment) {
      if (currentData.attachment && currentData.attachment.path) {
        try {
          await deleteObject(ref(storage, currentData.attachment.path));
        } catch (e) { console.error("Failed to delete old attachment", e); }
      }
      else if (currentData.attachmentUrl) {
        // Try to delete legacy attachment by extracting path from URL
        try {
          const urlPattern = /\/o\/(.+?)\?/;
          const match = currentData.attachmentUrl.match(urlPattern);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            await deleteObject(ref(storage, filePath));
          }
        } catch (e) {
          console.error("Failed to delete legacy attachment", e);
        }
      }

      try {
        const fileExt = attachment.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `users/${user.uid}/accounts/${activeAccountId}/attachments/${fileName}`);

        const snapshot = await uploadBytes(storageRef, attachment.file);
        const url = await getDownloadURL(snapshot.ref);

        attachmentData = {
          url,
          path: snapshot.ref.fullPath,
          type: attachment.type,
          name: attachment.file.name,
          size: attachment.file.size
        };
      } catch (err) {
        console.error("Upload update failed", err);
        showNotification('error', 'Upload Gagal', 'Gagal mengupload lampiran baru.');
        return;
      }
    }

    await updateDoc(txRef, {
      amount,
      categoryId,
      date,
      description,
      attachment: attachmentData || null
    });
  };


  const deleteTransaction = async (id: string) => {
    if (!user || !activeAccountId) return;

    // Check for attachment to delete from storage
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      if (tx.attachment && tx.attachment.path) {
        try {
          await deleteObject(ref(storage, tx.attachment.path));
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }
      else if (tx.attachmentUrl) {
        // Try to delete legacy attachment by extracting path from URL
        try {
          const urlPattern = /\/o\/(.+?)\?/;
          const match = tx.attachmentUrl.match(urlPattern);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            await deleteObject(ref(storage, filePath));
          }
        } catch (error) {
          console.error("Error deleting legacy attachment:", error);
        }
      }
    }

    await deleteDoc(doc(getTransactionsCollectionRef(db, user.uid, activeAccountId), id));
  };

  const refreshCategoryCache = async () => {
    try {
      const callable = httpsCallable(functions, 'refreshCategoryCache');
      await callable();
    } catch (error) {
      console.error('Failed to refresh category cache:', error);
    }
  };

  const addCategory = async (cat: Omit<Category, 'id'>): Promise<string | undefined> => {
    if (!user || !activeAccountId) return;
    const docRef = await addDoc(getCategoriesCollectionRef(db, user.uid, activeAccountId), cat);
    await refreshCategoryCache();
    return docRef.id;
  };

  const updateCategory = async (id: string, cat: Omit<Category, 'id'>) => {
    if (!user || !activeAccountId) return;
    const catRef = doc(getCategoriesCollectionRef(db, user.uid, activeAccountId), id);
    await updateDoc(catRef, cat);
    await refreshCategoryCache();
  };

  const deleteCategory = async (id: string) => {
    if (!user || !activeAccountId) return;
    const isUsed = transactions.some(t => t.categoryId === id);
    if (isUsed) {
      showNotification('error', 'Tidak Dapat Dihapus', 'Kategori ini tidak bisa dihapus karena masih digunakan dalam transaksi.', true);
      return;
    }
    await deleteDoc(doc(getCategoriesCollectionRef(db, user.uid, activeAccountId), id));
    await refreshCategoryCache();
  };

  // --- Plan Handlers (Firestore) ---
  const createPlan = async (title: string) => {
    if (!user || !activeAccountId) return;
    await addDoc(getPlansCollectionRef(db, user.uid, activeAccountId), {
      title,
      items: [],
      createdAt: new Date().toISOString()
    });
  };

  const deletePlan = async (id: string) => {
    if (!user || !activeAccountId) return;
    try {
      await deleteDoc(doc(getPlansCollectionRef(db, user.uid, activeAccountId), id));
    } catch (e) { console.error(e); }
  };

  const addPlanItem = async (planId: string, item: Omit<PlanItem, 'id'>) => {
    if (!user || !activeAccountId) return;
    const planRef = doc(getPlansCollectionRef(db, user.uid, activeAccountId), planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (plan) {
      const newItem: PlanItem = { ...item, id: Date.now().toString() };
      const updatedItems = [...plan.items, newItem];
      await setDoc(planRef, { items: updatedItems }, { merge: true });
    }
  };

  const updatePlanItem = async (planId: string, itemId: string, updatedItem: Omit<PlanItem, 'id'>) => {
    if (!user || !activeAccountId) return;
    const planRef = doc(getPlansCollectionRef(db, user.uid, activeAccountId), planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (plan) {
      const updatedItems = plan.items.map((item) =>
        item.id === itemId ? { ...updatedItem, id: itemId } : item
      );
      await setDoc(planRef, { items: updatedItems }, { merge: true });
    }
  };

  const updatePlanSettings = async (planId: string, useCurrentMonthBalance: boolean) => {
    if (!user || !activeAccountId) return;
    const planRef = doc(getPlansCollectionRef(db, user.uid, activeAccountId), planId);
    await setDoc(planRef, { useCurrentMonthBalance }, { merge: true });
  };

  const deletePlanItem = async (planId: string, itemId: string) => {
    if (!user || !activeAccountId) return;
    const planRef = doc(getPlansCollectionRef(db, user.uid, activeAccountId), planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (plan) {
      const updatedItems = plan.items.filter((item) => item.id !== itemId);
      await setDoc(planRef, { items: updatedItems }, { merge: true });
    }
  };

  const updatePlanItemStatus = async (planId: string, itemId: string, status: PlanItemStatus) => {
    if (!user || !activeAccountId) return;
    const planRef = doc(getPlansCollectionRef(db, user.uid, activeAccountId), planId);
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return;

    const updatedItems = plan.items.map((item) => (
      item.id === itemId ? { ...item, status } : item
    ));

    await setDoc(planRef, { items: updatedItems }, { merge: true });
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
    if (!user || !activeAccountId) return;

    const budgetId = payload.budgetId || doc(getBudgetsCollectionRef(db, user.uid, activeAccountId)).id;
    const now = new Date().toISOString();
    await setDoc(doc(getBudgetsCollectionRef(db, user.uid, activeAccountId), budgetId), {
      month: payload.month,
      name: payload.name.trim(),
      categoryIds: payload.categoryIds,
      limitAmount: payload.limitAmount,
      createdAt: normalizedBudgets.find((budget) => budget.id === budgetId)?.createdAt || now,
      updatedAt: now,
    });
    showNotification('success', 'Anggaran Disimpan', `Anggaran "${payload.name.trim()}" untuk ${payload.month} berhasil diperbarui.`, true);
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user || !activeAccountId) return;
    await deleteDoc(doc(getBudgetsCollectionRef(db, user.uid, activeAccountId), budgetId));
    showNotification('success', 'Anggaran Dihapus', 'Anggaran berhasil dihapus.', true);
  };

  const copyBudgetsFromPreviousMonth = async (targetMonth: string) => {
    if (!user || !activeAccountId) return;

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
      const budgetRef = doc(getBudgetsCollectionRef(db, user.uid, activeAccountId));
      batch.set(budgetRef, {
        month: targetMonth,
        name: budget.name,
        categoryIds: budget.categoryIds,
        limitAmount: budget.limitAmount,
        createdAt: now,
        updatedAt: now,
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
    if (!user || !activeAccountId) return;

    const debtId = payload.debtId || doc(getDebtsCollectionRef(db, user.uid, activeAccountId)).id;
    const now = new Date().toISOString();
    const existingDebt = debts.find((entry) => entry.id === debtId);

    await setDoc(doc(getDebtsCollectionRef(db, user.uid, activeAccountId), debtId), {
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
    });

    showNotification(
      'success',
      payload.kind === 'DEBT' ? 'Hutang Disimpan' : 'Piutang Disimpan',
      `"${payload.title.trim()}" berhasil diperbarui.`,
      true
    );
  };

  const deleteDebt = async (debtId: string) => {
    if (!user || !activeAccountId) return;
    await deleteDoc(doc(getDebtsCollectionRef(db, user.uid, activeAccountId), debtId));
    showNotification('success', 'Catatan Dihapus', 'Catatan hutang piutang berhasil dihapus.', true);
  };

  const recordDebtPayment = async (debtId: string, payload: { amount: number; date: string; note?: string }) => {
    if (!user || !activeAccountId) return;

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

    await updateDoc(doc(getDebtsCollectionRef(db, user.uid, activeAccountId), debtId), {
      paidAmount: nextPaidAmount,
      remainingAmount: nextRemainingAmount,
      status: nextStatus,
      payments: [paymentEntry, ...(currentDebt.payments || [])],
      updatedAt: new Date().toISOString(),
    });

    showNotification('success', 'Pembayaran Disimpan', 'Pembayaran berhasil dicatat.', true);
  };

  const markDebtAsPaid = async (debtId: string) => {
    if (!user || !activeAccountId) return;

    const currentDebt = debts.find((entry) => entry.id === debtId);
    if (!currentDebt) return;

    await updateDoc(doc(getDebtsCollectionRef(db, user.uid, activeAccountId), debtId), {
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
    if (!user || !activeAccountId) return;
    const txQuery = query(getTransactionsCollectionRef(db, user.uid, activeAccountId));
    const snapshot = await getDocs(txQuery);
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

  const activeAccount = accounts.find((account) => account.id === activeAccountId) || null;
  const onboardingStorageKey = user && activeAccountId
    ? `dompetcerdas_onboarding_seen_${user.uid}_${activeAccountId}`
    : null;
  const hasStarterData = transactions.length > 0 || plans.length > 0 || budgets.length > 0 || debts.length > 0;

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
    setShowOnboarding(false);
  };

  const navigateFromOnboarding = (view: View) => {
    closeOnboarding();
    setCurrentView(view);
  };


  // --- RENDER ---

  // Handle link-telegram route
  if (isLinkTelegramRoute) {
    return <LinkTelegram />;
  }

  if (authLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthLogin />;
  }

  if (accountLoading) {
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
    { view: 'CATEGORIES', label: 'Kategori', icon: 'Briefcase' },
  ];

  const BOTTOM_NAV_ITEMS: Array<{ view: View; label: string; icon: string }> = [
    { view: 'DASHBOARD', label: 'Beranda', icon: 'Home' },
    { view: 'TRANSACTIONS', label: 'Riwayat', icon: 'BookOpen' },
    { view: 'BUDGETS', label: 'Anggaran', icon: 'PiggyBank' },
    { view: 'CATEGORIES', label: 'Kategori', icon: 'Briefcase' },
    { view: 'DEBTS', label: 'Hutang', icon: 'Handshake' },
  ];

  const bottomNavIndex = BOTTOM_NAV_ITEMS.findIndex((item) => item.view === currentView);

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
              Versi baru tersedia! (v{APP_VERSION})
            </Typography>
            <Button size="small" onClick={handleDismissUpdate} sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 'auto', textTransform: 'none' }}>
              Nanti
            </Button>
            <Button size="small" variant="contained" onClick={handleUpdate} sx={{ bgcolor: '#fff', color: theme.colors.accent, textTransform: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
              Update
            </Button>
          </Paper>
        </Snackbar>
      )}

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
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: theme.colors.accent, color: '#fff', display: 'flex' }}>
            <IconDisplay name="Wallet" size={24} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: theme.colors.textPrimary }}>
            DompetCerdas <Typography component="span" variant="caption" sx={{ opacity: 0.6 }}>v{APP_VERSION}</Typography>
          </Typography>
        </Box>

        {/* User Info */}
        <Box sx={{ px: 2, py: 2 }}>
          <Paper
            elevation={0}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 3, bgcolor: theme.colors.bgHover, border: `1px solid ${theme.colors.border}` }}
          >
            <Avatar src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName || 'User'} sx={{ width: 40, height: 40 }} />
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.colors.textPrimary }}>
                {user.displayName}
              </Typography>
              <Button size="small" onClick={handleLogout} sx={{ p: 0, minWidth: 'auto', color: theme.colors.expense, textTransform: 'none', fontSize: '0.75rem', fontWeight: 500 }}>
                Keluar
              </Button>
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
                  {account.name} • {getAccountTypeLabel(account.type)}
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

        {/* Mobile Header */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: theme.colors.accent, color: '#fff', display: 'flex' }}>
                <IconDisplay name="Wallet" size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.colors.textPrimary }}>
                DompetCerdas <Typography component="span" variant="caption" sx={{ opacity: 0.6 }}>v{APP_VERSION}</Typography>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setCurrentView('AI_ADVISOR')}
                sx={{
                  bgcolor: currentView === 'AI_ADVISOR' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: currentView === 'AI_ADVISOR' ? '#8B5CF6' : theme.colors.textMuted,
                }}
              >
                <IconDisplay name="Zap" size={18} />
              </IconButton>
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
              <Chip
                icon={<IconDisplay name="CalendarDays" size={14} />}
                label="Rencana"
                size="small"
                variant={currentView === 'PLANS' ? 'filled' : 'outlined'}
                onClick={() => setCurrentView('PLANS')}
                sx={{
                  bgcolor: currentView === 'PLANS' ? theme.colors.accent : theme.colors.bgHover,
                  color: currentView === 'PLANS' ? '#fff' : theme.colors.textSecondary,
                  borderColor: currentView === 'PLANS' ? theme.colors.accent : theme.colors.border,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
              <Avatar
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                alt={user.displayName || 'User'}
                sx={{ width: 32, height: 32, border: `1px solid ${theme.colors.border}`, ml: 0.5 }}
              />
              <IconButton size="small" onClick={handleLogout} sx={{ color: theme.colors.expense, bgcolor: theme.colors.expenseBg }}>
                <IconDisplay name="LogOut" size={16} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Mobile Account Selector */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            px: 2, py: 1,
            bgcolor: theme.colors.bgCard,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.16em', color: theme.colors.textMuted, fontSize: '0.6rem' }}>
              Akun Aktif
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>
              {activeAccount?.name || 'Pilih Akun'}
            </Typography>
          </Box>
          <Select
            value={activeAccountId || ''}
            onChange={(e) => switchAccount(e.target.value as string)}
            size="small"
            sx={{
              borderRadius: 2,
              bgcolor: theme.colors.bgPrimary,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.colors.border },
              maxWidth: 200,
            }}
          >
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} • {getAccountTypeLabel(account.type)}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 }, pb: { xs: '120px', md: 4 } }}>
          <Container maxWidth="lg" disableGutters>
            {currentView === 'DASHBOARD' && (
              <Dashboard
                transactions={transactions}
                categories={categories}
                budgets={normalizedBudgets}
                showGettingStarted={!hasStarterData}
                activeAccountName={activeAccount?.name || 'Akun Keuangan'}
                telegramLinked={telegramLinked}
                onGoToTransactions={() => setCurrentView('TRANSACTIONS')}
                onGoToBudgets={() => setCurrentView('BUDGETS')}
                onGoToSettings={() => setCurrentView('SETTINGS')}
                onOpenOnboarding={openOnboarding}
              />
            )}
            {currentView === 'TRANSACTIONS' && (
              <TransactionList
                transactions={transactions}
                categories={categories}
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
                onSaveBudget={saveBudget}
                onDeleteBudget={deleteBudget}
                onCopyBudgetsFromPreviousMonth={copyBudgetsFromPreviousMonth}
              />
            )}
            {currentView === 'DEBTS' && (
              <DebtManager
                debts={debts}
                onSaveDebt={saveDebt}
                onDeleteDebt={deleteDebt}
                onRecordPayment={recordDebtPayment}
                onMarkAsPaid={markDebtAsPaid}
              />
            )}
            {currentView === 'CATEGORIES' && (
              <CategoryManager
                categories={categories}
                onAddCategory={addCategory}
                onUpdateCategory={updateCategory}
                onDeleteCategory={deleteCategory}
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
                onOpenOnboarding={openOnboarding}
                onUpdateTelegramAccount={updateTelegramDefaultAccount}
                onCreateAccount={createAccount}
                onSwitchAccount={switchAccount}
                onDeleteAllTransactions={deleteAllTransactions}
                transactionCount={transactions.length}
                transactions={transactions}
                categories={categories}
              />
            )}
          </Container>
        </Box>

        <OnboardingModal
          isOpen={showOnboarding}
          accountName={activeAccount?.name || 'Akun Keuangan'}
          telegramLinked={telegramLinked}
          onClose={closeOnboarding}
          onGoToTransactions={() => navigateFromOnboarding('TRANSACTIONS')}
          onGoToBudgets={() => navigateFromOnboarding('BUDGETS')}
          onGoToSettings={() => navigateFromOnboarding('SETTINGS')}
        />

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
            value={bottomNavIndex >= 0 ? bottomNavIndex : false}
            onChange={(_, newValue) => {
              if (newValue >= 0 && newValue < BOTTOM_NAV_ITEMS.length) {
                setCurrentView(BOTTOM_NAV_ITEMS[newValue].view);
              }
            }}
            showLabels
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
                fontSize: '0.6rem',
                fontWeight: 500,
                mt: 0.25,
                '&.Mui-selected': {
                  fontSize: '0.6rem',
                  fontWeight: 600,
                },
              },
            }}
          >
            {BOTTOM_NAV_ITEMS.map((item, index) => (
              <BottomNavigationAction
                key={item.view}
                value={index}
                label={item.label}
                icon={<IconDisplay name={item.icon} size={20} />}
              />
            ))}
          </BottomNavigation>
        </Paper>

        {/* Mobile FAB */}
        {currentView === 'TRANSACTIONS' && (
          <Fab
            color="primary"
            onClick={() => setShowAddModal(true)}
            sx={{
              display: { xs: 'flex', md: 'none' },
              position: 'fixed',
              bottom: 72,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              width: 56,
              height: 56,
              border: `4px solid ${theme.colors.bgCard}`,
              bgcolor: theme.colors.accent,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: theme.colors.accentHover },
            }}
          >
            <IconDisplay name="Plus" size={28} />
          </Fab>
        )}

        {/* Desktop FAB */}
        {currentView === 'TRANSACTIONS' && (
          <Fab
            color="primary"
            onClick={() => setShowAddModal(true)}
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

        {/* Transaction Modal */}
        {showAddModal && (
          <TransactionForm
            categories={categories}
            onClose={() => setShowAddModal(false)}
            onAdd={addTransaction}
            onAddCategory={addCategory}
            onShowNotification={showNotification}
          />
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
          autoClose={notification.autoClose}
        />
      </Box>
    </Box>
  );
}

export default App;

