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
import ReactMarkdown from 'react-markdown';
import { FinancialAnalysisMode, FinancialAnalysisResult, getFinancialAdvice } from './services/geminiService';
import IconDisplay from './components/IconDisplay';
import { useTheme } from './contexts/ThemeContext';
import NotificationModal, { NotificationType } from './components/NotificationModal';
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

  const [aiAnalysis, setAiAnalysis] = useState<FinancialAnalysisResult | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState<FinancialAnalysisMode>('HEALTH');
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

  // --- AI Logic ---
  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    setAiAnalysis(null);
    setAiAnalysisError(null);

    try {
      const result = await getFinancialAdvice(transactions, categories, aiAnalysisMode);
      setAiAnalysis(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menjalankan Analisis AI.';
      setAiAnalysisError(message);
      showNotification('error', 'Analisis Gagal', message, true);
    } finally {
      setIsLoadingAi(false);
    }
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

  const formatShortDate = (date: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

  const aiModeOptions: Array<{
    id: FinancialAnalysisMode;
    label: string;
    shortLabel: string;
    description: string;
    icon: string;
  }> = [
    {
      id: 'HEALTH',
      label: 'Kesehatan Finansial',
      shortLabel: 'Kesehatan',
      description: 'Fokus ke arus kas, keseimbangan pemasukan-pengeluaran, dan stabilitas data keuangan.',
      icon: 'HeartPulse'
    },
    {
      id: 'SPENDING',
      label: 'Pola Pengeluaran',
      shortLabel: 'Pengeluaran',
      description: 'Fokus ke kategori dominan, frekuensi transaksi, dan pola belanja yang menonjol.',
      icon: 'BarChart2'
    },
    {
      id: 'SAVINGS',
      label: 'Saran Hemat',
      shortLabel: 'Hemat',
      description: 'Fokus ke peluang efisiensi berdasarkan transaksi dan kategori yang benar-benar ada.',
      icon: 'PiggyBank'
    }
  ];

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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthLogin />;
  }

  if (accountLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600">Menyiapkan Akun Keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.bgPrimary }}>

      {/* Update Banner */}
      {showUpdateBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 p-3 flex items-center justify-between gap-3"
          style={{
            backgroundColor: theme.colors.accent,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <IconDisplay name="RefreshCw" size={18} />
            <span className="text-sm font-medium">
              Versi baru tersedia! (v{APP_VERSION})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismissUpdate}
              className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
            >
              Nanti
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 text-xs font-medium bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Update Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside
        className="w-64 hidden md:flex flex-col"
        style={{ backgroundColor: theme.colors.sidebarBg, borderRight: `1px solid ${theme.colors.border} ` }}
      >
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: `1px solid ${theme.colors.border} ` }}>
          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: theme.colors.accent }}>
            <IconDisplay name="Wallet" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.colors.textPrimary }}>DompetCerdas <span className="text-xs font-normal opacity-60">v{APP_VERSION}</span></h1>
        </div>

        <div className="px-4 py-4">
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: theme.colors.bgHover, border: `1px solid ${theme.colors.border} ` }}
          >
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="User" className="w-10 h-10 rounded-full" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate" style={{ color: theme.colors.textPrimary }}>{user.displayName}</p>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-medium">Keluar</button>
            </div>
          </div >

          <div
            className="mt-3 rounded-xl p-3"
            style={{ backgroundColor: theme.colors.bgHover, border: `1px solid ${theme.colors.border}` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.textMuted }}>
              Akun Aktif
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
              {activeAccount?.name || 'Pilih Akun'}
            </p>
            <select
              value={activeAccountId || ''}
              onChange={(event) => switchAccount(event.target.value)}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: theme.colors.bgCard,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} • {getAccountTypeLabel(account.type)}
                </option>
              ))}
            </select>
          </div>
        </div >

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'DASHBOARD' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'DASHBOARD' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="Home" size={18} /> Dashboard
          </button>
          <button
            onClick={() => setCurrentView('TRANSACTIONS')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'TRANSACTIONS' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'TRANSACTIONS' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="BookOpen" size={18} /> Transaksi
          </button>
          <button
            onClick={() => setCurrentView('PLANS')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'PLANS' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'PLANS' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="CalendarDays" size={18} /> Rencana
          </button>
          <button
            onClick={() => setCurrentView('BUDGETS')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'BUDGETS' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'BUDGETS' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="PiggyBank" size={18} /> Anggaran
          </button>
          <button
            onClick={() => setCurrentView('DEBTS')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'DEBTS' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'DEBTS' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="Handshake" size={18} /> Hutang Piutang
          </button>
          <button
            onClick={() => setCurrentView('CATEGORIES')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'CATEGORIES' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'CATEGORIES' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="Briefcase" size={18} /> Kategori
          </button>
          <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
            <button
              onClick={() => setCurrentView('AI_ADVISOR')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'AI_ADVISOR' ? theme.colors.sidebarActiveBg : 'transparent',
                color: currentView === 'AI_ADVISOR' ? theme.colors.sidebarActive : theme.colors.sidebarText
              }}
            >
              <IconDisplay name="Zap" size={18} style={{ color: theme.colors.accent }} /> Analisis AI
            </button>
            <button
              onClick={() => setCurrentView('SETTINGS')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'SETTINGS' ? theme.colors.sidebarActiveBg : 'transparent',
                color: currentView === 'SETTINGS' ? theme.colors.sidebarActive : theme.colors.sidebarText
              }}
            >
              <IconDisplay name="Settings" size={18} /> Pengaturan
            </button>
          </div>
        </nav>

        <div className="p-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-xs opacity-80 mb-1">Saldo Saat Ini</p>
            <p className="font-bold text-lg">{formatBalance(currentBalance)}</p>
          </div>
        </div>
      </aside >

      {/* Main Content */}
      < main className="flex-1 flex flex-col h-full overflow-hidden relative" >

        {/* Mobile Header */}
        < header
          className="p-4 flex justify-between items-center md:hidden sticky top-0 z-20"
          style={{ backgroundColor: theme.colors.bgCard, borderBottom: `1px solid ${theme.colors.border}` }
          }
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded text-white" style={{ backgroundColor: theme.colors.accent }}>
              <IconDisplay name="Wallet" size={20} />
            </div>
            <span className="font-bold" style={{ color: theme.colors.textPrimary }}>DompetCerdas <span className="text-xs font-normal opacity-60">v{APP_VERSION}</span></span>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick Access: AI Button */}
            <button
              onClick={() => setCurrentView('AI_ADVISOR')}
              className="p-2 rounded-full transition-all"
              style={{
                backgroundColor: currentView === 'AI_ADVISOR' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: currentView === 'AI_ADVISOR' ? '#8B5CF6' : theme.colors.textMuted
              }}
              title="AI Analisis"
            >
              <IconDisplay name="Zap" size={18} />
            </button>
            <button
              onClick={() => setCurrentView('SETTINGS')}
              className="p-2 rounded-full transition-all"
              style={{
                backgroundColor: currentView === 'SETTINGS' ? theme.colors.accentLight : 'transparent',
                color: currentView === 'SETTINGS' ? theme.colors.accent : theme.colors.textMuted
              }}
              title="Pengaturan"
            >
              <IconDisplay name="Settings" size={18} />
            </button>
            {/* Quick Access: Rencana Button */}
            <button
              onClick={() => setCurrentView('PLANS')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: currentView === 'PLANS' ? theme.colors.accent : theme.colors.bgHover,
                color: currentView === 'PLANS' ? '#fff' : theme.colors.textSecondary,
                border: `1px solid ${currentView === 'PLANS' ? theme.colors.accent : theme.colors.border}`
              }}
            >
              <IconDisplay name="CalendarDays" size={14} />
              <span>Rencana</span>
            </button>
            <button
              onClick={() => setCurrentView('DEBTS')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: currentView === 'DEBTS' ? theme.colors.accent : theme.colors.bgHover,
                color: currentView === 'DEBTS' ? '#fff' : theme.colors.textSecondary,
                border: `1px solid ${currentView === 'DEBTS' ? theme.colors.accent : theme.colors.border}`
              }}
            >
              <IconDisplay name="Handshake" size={14} />
              <span>Hutang</span>
            </button>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="User" className="w-8 h-8 rounded-full" style={{ border: `1px solid ${theme.colors.border}` }} />
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg" style={{ backgroundColor: theme.colors.expenseBg }}>
              <IconDisplay name="LogOut" size={16} />
            </button>
          </div>
        </header >

        <div
          className="md:hidden px-4 py-2"
          style={{ backgroundColor: theme.colors.bgCard, borderBottom: `1px solid ${theme.colors.border}` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.textMuted }}>
                Akun Aktif
              </p>
              <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                {activeAccount?.name || 'Pilih Akun'}
              </p>
            </div>
            <select
              value={activeAccountId || ''}
              onChange={(event) => switchAccount(event.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: theme.colors.bgPrimary,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} • {getAccountTypeLabel(account.type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        < div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8" >
          <div className="max-w-5xl mx-auto">
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
              <div className="space-y-6 animate-fade-in-up">
                <div
                  className="relative overflow-hidden rounded-[28px] border p-6 md:p-8"
                  style={{
                    background: theme.name === 'dark'
                      ? 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(49,46,129,0.52) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(238,242,255,0.95) 100%)',
                    borderColor: theme.colors.border,
                    boxShadow: theme.name === 'dark'
                      ? '0 28px 80px rgba(2, 6, 23, 0.35)'
                      : '0 24px 60px rgba(79, 70, 229, 0.08)'
                  }}
                >
                  <div
                    className="absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl"
                    style={{ backgroundColor: `${theme.colors.accent}22` }}
                  />
                  <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                      <div
                        className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          backgroundColor: theme.name === 'dark' ? 'rgba(129,140,248,0.18)' : '#EEF2FF',
                          color: theme.name === 'dark' ? '#C7D2FE' : '#4338CA'
                        }}
                      >
                        <IconDisplay name="Sparkles" size={14} />
                        Analisis AI
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: theme.colors.textPrimary }}>
                        Analisis keuangan yang hanya berbasis transaksi Anda
                      </h2>
                      <p className="text-sm md:text-base mt-2 max-w-xl leading-7" style={{ color: theme.colors.textSecondary }}>
                        Sistem hanya mengirim ringkasan dan sampel transaksi yang paling relevan agar hemat token, lalu AI diminta memberi insight berdasarkan data Anda saja tanpa asumsi di luar transaksi.
                      </p>
                    </div>
                    <button
                      onClick={handleAiAnalysis}
                      disabled={isLoadingAi || transactions.length === 0}
                      className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.accent} 0%, ${theme.name === 'dark' ? '#8B5CF6' : '#6366F1'} 100%)`,
                        boxShadow: theme.name === 'dark'
                          ? '0 18px 36px rgba(99, 102, 241, 0.28)'
                          : '0 18px 36px rgba(79, 70, 229, 0.22)'
                      }}
                    >
                      {isLoadingAi ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Menganalisis...
                        </>
                      ) : (
                        <>
                          <IconDisplay name="Zap" size={18} />
                          Jalankan Analisis
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {aiModeOptions.map((mode) => {
                    const isActive = aiAnalysisMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setAiAnalysisMode(mode.id);
                          setAiAnalysis(null);
                          setAiAnalysisError(null);
                        }}
                        className="rounded-[24px] border p-5 text-left transition-all"
                        style={{
                          background: isActive
                            ? (theme.name === 'dark'
                              ? 'linear-gradient(135deg, rgba(79,70,229,0.30) 0%, rgba(99,102,241,0.18) 100%)'
                              : 'linear-gradient(135deg, rgba(238,242,255,1) 0%, rgba(224,231,255,0.92) 100%)')
                            : theme.colors.bgCard,
                          borderColor: isActive ? theme.colors.accent : theme.colors.border,
                          boxShadow: isActive
                            ? (theme.name === 'dark'
                              ? '0 20px 40px rgba(79, 70, 229, 0.18)'
                              : '0 20px 40px rgba(99, 102, 241, 0.12)')
                            : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: isActive
                                ? (theme.name === 'dark' ? 'rgba(99,102,241,0.22)' : '#FFFFFF')
                                : theme.colors.bgHover,
                              color: isActive ? theme.colors.accent : theme.colors.textSecondary
                            }}
                          >
                            <IconDisplay name={mode.icon} size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                              {mode.label}
                            </p>
                            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                              {mode.shortLabel}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                          {mode.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {transactions.length === 0 && (
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      backgroundColor: theme.name === 'dark' ? 'rgba(120, 53, 15, 0.22)' : '#FFFBEB',
                      borderColor: theme.name === 'dark' ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A',
                      color: theme.name === 'dark' ? '#FDE68A' : '#92400E'
                    }}
                  >
                    Belum ada data transaksi. Tambahkan transaksi terlebih dahulu agar Analisis AI bisa memberi insight yang relevan.
                  </div>
                )}

                {!aiAnalysis && !isLoadingAi && transactions.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        title: 'Data yang dipakai',
                        value: `${transactions.length} transaksi`,
                        description: 'AI hanya melihat data transaksi dan kategori Anda.'
                      },
                      {
                        title: 'Hemat token',
                        value: 'Ringkasan + sampel',
                        description: 'Yang dikirim bukan seluruh histori mentah, tapi agregasi dan transaksi penting.'
                      },
                      {
                        title: 'Batas pengetahuan',
                        value: 'Data Anda saja',
                        description: 'Analisis dilarang menebak kondisi di luar angka transaksi.'
                      }
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border p-5"
                        style={{
                          backgroundColor: theme.colors.bgCard,
                          borderColor: theme.colors.border
                        }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                          {item.title}
                        </p>
                        <p className="mt-3 text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                          {item.value}
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {isLoadingAi && (
                  <div
                    className="rounded-[28px] border p-6 md:p-8"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                        style={{ borderColor: theme.colors.accent, borderTopColor: 'transparent' }}
                      />
                      <div>
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>Sedang menyusun analisis</p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          AI sedang menyusun mode {aiModeOptions.find((mode) => mode.id === aiAnalysisMode)?.label.toLowerCase()} dari ringkasan transaksi dan sampel transaksi penting Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {aiAnalysisError && !isLoadingAi && (
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      backgroundColor: theme.name === 'dark' ? 'rgba(127, 29, 29, 0.24)' : '#FEF2F2',
                      borderColor: theme.name === 'dark' ? 'rgba(248, 113, 113, 0.25)' : '#FECACA'
                    }}
                  >
                    <p className="font-semibold" style={{ color: theme.name === 'dark' ? '#FCA5A5' : '#B91C1C' }}>
                      Analisis belum bisa ditampilkan
                    </p>
                    <p className="text-sm mt-2" style={{ color: theme.name === 'dark' ? '#FECACA' : '#7F1D1D' }}>
                      {aiAnalysisError}
                    </p>
                  </div>
                )}

                {aiAnalysis && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: 'Transaksi dianalisis',
                          value: `${aiAnalysis.summary.totalTransactionsAnalyzed}/${aiAnalysis.summary.totalTransactions}`,
                          description: 'Sampel terpilih setelah diringkas untuk efisiensi token.'
                        },
                        {
                          title: 'Total pemasukan',
                          value: formatBalance(aiAnalysis.summary.incomeTotal),
                          description: 'Akumulasi transaksi kategori pemasukan.'
                        },
                        {
                          title: 'Total pengeluaran',
                          value: formatBalance(aiAnalysis.summary.expenseTotal),
                          description: 'Akumulasi transaksi kategori pengeluaran.'
                        },
                        {
                          title: 'Saldo bersih data',
                          value: formatBalance(aiAnalysis.summary.netBalance),
                          description: 'Selisih pemasukan dan pengeluaran pada data yang tersedia.'
                        },
                        {
                          title: 'Mode analisis',
                          value: aiModeOptions.find((mode) => mode.id === aiAnalysis.mode)?.shortLabel || 'AI',
                          description: 'Jenis pembacaan data yang sedang aktif saat ini.'
                        },
                        {
                          title: 'Sisa token harian',
                          value: aiAnalysis.usage
                            ? `${aiAnalysis.usage.remainingDailyTokens.toLocaleString('id-ID')}/${aiAnalysis.usage.dailyTokenLimit.toLocaleString('id-ID')}`
                            : '-',
                          description: 'Kuota biaya Analisis AI per user per hari dari backend.'
                        }
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-2xl border p-5"
                          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                            {item.title}
                          </p>
                          <p className="mt-3 text-xl font-bold leading-tight" style={{ color: theme.colors.textPrimary }}>
                            {item.value}
                          </p>
                          <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
                      <div
                        className="relative overflow-hidden rounded-[28px] border p-6 md:p-8"
                        style={{
                          backgroundColor: theme.colors.bgCard,
                          borderColor: theme.colors.border
                        }}
                      >
                        <div className="absolute inset-x-0 top-0 h-1.5" style={{
                          background: `linear-gradient(90deg, ${theme.colors.accent} 0%, ${theme.name === 'dark' ? '#8B5CF6' : '#A5B4FC'} 100%)`
                        }} />
                        <div className="prose max-w-none">
                          <ReactMarkdown
                            components={{
                              h2: ({ children }) => (
                                <h2 className="mt-6 mb-3 text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                  {children}
                                </h2>
                              ),
                              p: ({ children }) => (
                                <p className="mb-3 text-sm md:text-[15px] leading-7" style={{ color: theme.colors.textSecondary }}>
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-4 space-y-2 pl-5 list-disc" style={{ color: theme.colors.textSecondary }}>
                                  {children}
                                </ul>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm md:text-[15px] leading-7">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong style={{ color: theme.colors.textPrimary }}>{children}</strong>
                              ),
                              code: ({ children }) => (
                                <code
                                  className="rounded px-1.5 py-0.5 text-xs"
                                  style={{
                                    backgroundColor: theme.colors.bgHover,
                                    color: theme.colors.textPrimary
                                  }}
                                >
                                  {children}
                                </code>
                              )
                            }}
                          >
                            {aiAnalysis.markdown}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div
                          className="rounded-[28px] border p-5"
                          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                            Dasar Analisis
                          </p>
                          <div className="mt-4 space-y-3 text-sm">
                            <div>
                              <p style={{ color: theme.colors.textMuted }}>Rentang data</p>
                              <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                                {aiAnalysis.summary.analyzedDateRange
                                  ? `${formatShortDate(aiAnalysis.summary.analyzedDateRange.start)} - ${formatShortDate(aiAnalysis.summary.analyzedDateRange.end)}`
                                  : 'Tidak tersedia'}
                              </p>
                            </div>
                            <div>
                              <p style={{ color: theme.colors.textMuted }}>Komposisi sampel</p>
                              <p className="font-semibold leading-6" style={{ color: theme.colors.textPrimary }}>
                                {aiAnalysis.summary.samplesUsed.recent} terbaru, {aiAnalysis.summary.samplesUsed.largestExpense} terbesar, {aiAnalysis.summary.samplesUsed.categoryAnchors} jangkar kategori, {aiAnalysis.summary.samplesUsed.incomeAnchors} pemasukan
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className="rounded-[28px] border p-5"
                          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                            Kategori Pengeluaran Utama
                          </p>
                          <div className="mt-4 space-y-3">
                            {aiAnalysis.summary.topCategories.length > 0 ? aiAnalysis.summary.topCategories.map((category) => (
                              <div key={category.name}>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <div>
                                    <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{category.name}</p>
                                    <p style={{ color: theme.colors.textMuted }}>{category.count} transaksi</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{formatBalance(category.total)}</p>
                                    <p style={{ color: theme.colors.textMuted }}>{category.percentage}%</p>
                                  </div>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: theme.colors.bgHover }}>
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(category.percentage, 100)}%`,
                                      background: `linear-gradient(90deg, ${theme.colors.accent} 0%, ${theme.name === 'dark' ? '#A78BFA' : '#818CF8'} 100%)`
                                    }}
                                  />
                                </div>
                              </div>
                            )) : (
                              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                Belum ada pengeluaran yang cukup untuk diringkas per kategori.
                              </p>
                            )}
                          </div>
                        </div>

                        <div
                          className="rounded-[28px] border p-5"
                          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                            Ringkasan Bulanan
                          </p>
                          <div className="mt-4 space-y-3">
                            {aiAnalysis.summary.monthlySummaries.length > 0 ? aiAnalysis.summary.monthlySummaries.map((month) => (
                              <div key={month.month} className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.colors.bgHover }}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{month.month}</p>
                                  <p className="text-sm" style={{ color: month.net >= 0 ? theme.colors.income : theme.colors.expense }}>
                                    {formatBalance(month.net)}
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                                  <span>Pemasukan {formatBalance(month.income)}</span>
                                  <span>Pengeluaran {formatBalance(month.expense)}</span>
                                </div>
                              </div>
                            )) : (
                              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                Ringkasan bulanan belum tersedia.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
          </div>
        </div >

        <OnboardingModal
          isOpen={showOnboarding}
          accountName={activeAccount?.name || 'Akun Keuangan'}
          telegramLinked={telegramLinked}
          onClose={closeOnboarding}
          onGoToTransactions={() => navigateFromOnboarding('TRANSACTIONS')}
          onGoToBudgets={() => navigateFromOnboarding('BUDGETS')}
          onGoToSettings={() => navigateFromOnboarding('SETTINGS')}
        />

        {/* Mobile Bottom Navigation Bar */}
        < nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 z-30 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ backgroundColor: theme.colors.bgCard, borderTop: `1px solid ${theme.colors.border}` }}
        >
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="flex flex-col items-center justify-center flex-1 py-1"
            style={{ color: currentView === 'DASHBOARD' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Home" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Beranda</span>
          </button>
          <button
            onClick={() => setCurrentView('TRANSACTIONS')}
            className="flex flex-col items-center justify-center flex-1 py-1"
            style={{ color: currentView === 'TRANSACTIONS' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="BookOpen" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Riwayat</span>
          </button>

          {/* Center Space for FAB */}
          <div className="w-14 flex-shrink-0"></div>

          <button
            onClick={() => setCurrentView('BUDGETS')}
            className="flex flex-col items-center justify-center flex-1 py-1"
            style={{ color: currentView === 'BUDGETS' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="PiggyBank" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Anggaran</span>
          </button>
          <button
            onClick={() => setCurrentView('CATEGORIES')}
            className="flex flex-col items-center justify-center flex-1 py-1"
            style={{ color: currentView === 'CATEGORIES' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Briefcase" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Kategori</span>
          </button>
          <button
            onClick={() => setCurrentView('DEBTS')}
            className="flex flex-col items-center justify-center flex-1 py-1"
            style={{ color: currentView === 'DEBTS' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Handshake" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Hutang</span>
          </button>
        </nav >

        {/* Mobile Center Floating Action Button (FAB) */}
        < div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40" >
          <button
            onClick={() => setShowAddModal(true)}
            className="text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-4 focus:outline-none active:scale-95 transition-transform"
            style={{ backgroundColor: theme.colors.accent, borderColor: theme.colors.bgCard }}
          >
            <IconDisplay name="Plus" size={32} />
          </button>
        </div >

        {/* Desktop Floating Action Button */}
        < button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex fixed bottom-8 right-8 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none z-40"
          style={{ backgroundColor: theme.colors.accent }}
        >
          <IconDisplay name="Plus" size={28} />
        </button >

        {/* Modal */}
        {
          showAddModal && (
            <TransactionForm
              categories={categories}
              onClose={() => setShowAddModal(false)}
              onAdd={addTransaction}
              onAddCategory={addCategory}
              onShowNotification={showNotification}
            />
          )
        }

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
          autoClose={notification.autoClose}
        />
      </main >
    </div >
  );
}

export default App;
