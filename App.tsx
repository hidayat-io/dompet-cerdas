import React, { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, writeBatch, getDocs, getDoc, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db, storage } from './firebase';

import { INITIAL_CATEGORIES } from './constants';
import { Category, Transaction, Simulation, SimulationItem } from './types';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import CategoryManager from './components/CategoryManager';
import TransactionForm from './components/TransactionForm';
import SimulationManager from './components/SimulationManager';
import AuthLogin from './components/AuthLogin';
import Settings from './components/Settings';
import { getFinancialAdvice } from './services/geminiService';
import IconDisplay from './components/IconDisplay';
import { useTheme } from './contexts/ThemeContext';

// ... (skip content)

type View = 'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'SIMULATION' | 'AI_ADVISOR' | 'SETTINGS';

function App() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [showAddModal, setShowAddModal] = useState(false);

  // Data States (Synced with Firestore)
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setTransactions([]);
      setSimulations([]);
      return;
    }

    // 1. Categories Listener
    const catQuery = query(collection(db, 'users', user.uid, 'categories'));
    const unsubCat = onSnapshot(catQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(data);

      // Seed Initial Data if empty
      if (data.length === 0 && !snapshot.metadata.hasPendingWrites) {
        const batch = writeBatch(db);
        INITIAL_CATEGORIES.forEach(cat => {
          // Gunakan ID manual dari constants agar konsisten atau biarkan auto-id
          // Disini kita biarkan firestore generate ID untuk keamanan, atau pakai ID constants
          // Untuk simple case, kita buat dokumen baru
          const ref = doc(collection(db, 'users', user.uid, 'categories'));
          batch.set(ref, { ...cat, id: ref.id });
        });
        batch.commit().catch(console.error);
      }
    });

    // 2. Transactions Listener
    const txQuery = query(collection(db, 'users', user.uid, 'transactions'));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      // Sort by date desc implicitly handled in UI, but safe to have raw data
      setTransactions(data);
    });

    // 3. Simulations Listener
    const simQuery = query(collection(db, 'users', user.uid, 'simulations'));
    const unsubSim = onSnapshot(simQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Simulation));
      setSimulations(data);
    });

    return () => {
      unsubCat();
      unsubTx();
      unsubSim();
    };
  }, [user]);

  // --- CRUD Handlers (Firestore) ---

  const addTransaction = async (
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' }
  ) => {
    if (!user) return;

    let attachmentData = null;

    // Upload attachment if exists
    if (attachment) {
      try {
        // Create ref
        const fileExt = attachment.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `users/${user.uid}/attachments/${fileName}`);

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
        alert("Gagal mengupload lampiran, transaksi tetap disimpan tanpa lampiran.");
      }
    }

    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
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
    if (!user) return;

    const txRef = doc(db, 'users', user.uid, 'transactions', id);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return;

    const currentData = txSnap.data() as Transaction;
    let attachmentData = currentData.attachment;

    // Handle Attachment Logic
    if (attachment === null) {
      if (currentData.attachment && currentData.attachment.path) {
        try {
          await deleteObject(ref(storage, currentData.attachment.path));
        } catch (e) { console.error("Failed to delete old attachment", e); }
      }
      else if (currentData.attachmentUrl) {
        // Try to delete legacy attachment if possible or ignore
      }
      attachmentData = undefined;
    }
    else if (attachment) {
      if (currentData.attachment && currentData.attachment.path) {
        try {
          await deleteObject(ref(storage, currentData.attachment.path));
        } catch (e) { console.error("Failed to delete old attachment", e); }
      }

      try {
        const fileExt = attachment.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, `users/${user.uid}/attachments/${fileName}`);

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
        alert("Gagal mengupload lampiran baru.");
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
    if (!user) return;

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
    }

    await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'categories'), cat);
  };

  const updateCategory = async (id: string, cat: Omit<Category, 'id'>) => {
    if (!user) return;
    const catRef = doc(db, 'users', user.uid, 'categories', id);
    await updateDoc(catRef, cat);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const isUsed = transactions.some(t => t.categoryId === id);
    if (isUsed) {
      alert("Kategori ini tidak bisa dihapus karena masih digunakan dalam transaksi.");
      return;
    }
    await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
  };

  // --- Simulation Handlers (Firestore) ---
  const createSimulation = async (title: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'simulations'), {
      title,
      items: [],
      createdAt: new Date().toISOString()
    });
  };

  const deleteSimulation = async (id: string) => {
    if (!user) return;
    // Removed native confirm to avoid UX issues, or assume UI handles confirmation if needed.
    // However, for safety, let's keep it but make sure logic is sound.
    // Actually user says it fails. I will remove confirm for now to test if logic works.
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'simulations', id));
    } catch (e) { console.error(e); }
  };

  const addSimulationItem = async (simId: string, item: Omit<SimulationItem, 'id'>) => {
    if (!user) return;
    const simRef = doc(db, 'users', user.uid, 'simulations', simId);
    const simulation = simulations.find(s => s.id === simId);
    if (simulation) {
      const newItem = { ...item, id: Date.now().toString() }; // Client side ID generation for array item ok here
      const updatedItems = [...simulation.items, newItem];
      await setDoc(simRef, { items: updatedItems }, { merge: true });
    }
  };

  const deleteSimulationItem = async (simId: string, itemId: string) => {
    if (!user) return;
    const simRef = doc(db, 'users', user.uid, 'simulations', simId);
    const simulation = simulations.find(s => s.id === simId);
    if (simulation) {
      const updatedItems = simulation.items.filter(i => i.id !== itemId);
      await setDoc(simRef, { items: updatedItems }, { merge: true });
    }
  };

  const applySimulationItemToReal = (item: SimulationItem, date: string) => {
    addTransaction(item.amount, item.categoryId, date, `[Dari Simulasi] ${item.name} `);
    alert("Transaksi berhasil disalin ke buku utama!");
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Delete all transactions
  const deleteAllTransactions = async () => {
    if (!user) return;
    const txQuery = query(collection(db, 'users', user.uid, 'transactions'));
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
    setAiAnalysis("");
    const result = await getFinancialAdvice(transactions, categories);
    setAiAnalysis(result);
    setIsLoadingAi(false);
  };

  const currentBalance = transactions.reduce((acc, t) => {
    const type = categories.find(c => c.id === t.categoryId)?.type;
    return type === 'INCOME' ? acc + t.amount : acc - t.amount;
  }, 0);

  const formatBalance = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);


  // --- RENDER ---

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.bgPrimary }}>

      {/* Sidebar Navigation (Desktop) */}
      <aside
        className="w-64 hidden md:flex flex-col"
        style={{ backgroundColor: theme.colors.sidebarBg, borderRight: `1px solid ${theme.colors.border} ` }}
      >
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: `1px solid ${theme.colors.border} ` }}>
          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: theme.colors.accent }}>
            <IconDisplay name="Wallet" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.colors.textPrimary }}>DompetCerdas</h1>
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
            onClick={() => setCurrentView('SIMULATION')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: currentView === 'SIMULATION' ? theme.colors.sidebarActiveBg : 'transparent',
              color: currentView === 'SIMULATION' ? theme.colors.sidebarActive : theme.colors.sidebarText
            }}
          >
            <IconDisplay name="Calculator" size={18} /> Simulasi Biaya
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
            <span className="font-bold" style={{ color: theme.colors.textPrimary }}>DompetCerdas</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="User" className="w-8 h-8 rounded-full" style={{ border: `1px solid ${theme.colors.border}` }} />
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-1 rounded">
              <IconDisplay name="ArrowRight" size={18} />
            </button>
          </div>
        </header >

        {/* Content Area */}
        < div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8" >
          <div className="max-w-5xl mx-auto">

            {currentView === 'DASHBOARD' && (
              <Dashboard
                transactions={transactions}
                categories={categories}
              />
            )}
            {currentView === 'TRANSACTIONS' && (
              <TransactionList
                transactions={transactions}
                categories={categories}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
              />
            )}
            {currentView === 'SIMULATION' && (
              <SimulationManager
                simulations={simulations}
                categories={categories}
                currentBalance={currentBalance}
                onCreateSimulation={createSimulation}
                onDeleteSimulation={deleteSimulation}
                onAddSimulationItem={addSimulationItem}
                onDeleteSimulationItem={deleteSimulationItem}
                onApplyItemToReal={applySimulationItemToReal}
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Analisis Keuangan Cerdas</h2>
                    <p className="text-gray-500 text-sm mt-1">Dapatkan wawasan tentang kebiasaan belanja Anda menggunakan Gemini AI.</p>
                  </div>
                  <button
                    onClick={handleAiAnalysis}
                    disabled={isLoadingAi || transactions.length === 0}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg w-full md:w-auto justify-center"
                  >
                    {isLoadingAi ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Menganalisis...
                      </>
                    ) : (
                      <>
                        <IconDisplay name="Zap" size={18} />
                        Mulai Analisis
                      </>
                    )}
                  </button>
                </div>

                {transactions.length === 0 && (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
                    Belum ada data transaksi. Silakan tambah transaksi terlebih dahulu agar AI dapat menganalisisnya.
                  </div>
                )}

                {aiAnalysis && (
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-purple-100 relative overflow-hidden animate-fade-in-up">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    <div className="prose prose-purple max-w-none">
                      <div className="whitespace-pre-wrap leading-relaxed text-gray-700 text-sm md:text-base">
                        {aiAnalysis}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'SETTINGS' && (
              <Settings
                onDeleteAllTransactions={deleteAllTransactions}
                transactionCount={transactions.length}
              />
            )}
          </div>
        </div >

        {/* Mobile Bottom Navigation Bar (5 Items) */}
        < nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-between items-center h-16 z-30 px-4 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          style={{ backgroundColor: theme.colors.bgCard, borderTop: `1px solid ${theme.colors.border}` }}
        >
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="flex flex-col items-center justify-center w-12 py-1"
            style={{ color: currentView === 'DASHBOARD' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Home" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Home</span>
          </button>
          <button
            onClick={() => setCurrentView('TRANSACTIONS')}
            className="flex flex-col items-center justify-center w-12 py-1"
            style={{ color: currentView === 'TRANSACTIONS' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="BookOpen" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Riwayat</span>
          </button>

          {/* Center Space for FAB */}
          <div className="w-8"></div>

          <button
            onClick={() => setCurrentView('SIMULATION')}
            className="flex flex-col items-center justify-center w-12 py-1"
            style={{ color: currentView === 'SIMULATION' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Calculator" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Simulasi</span>
          </button>
          <button
            onClick={() => setCurrentView('SETTINGS')}
            className="flex flex-col items-center justify-center w-12 py-1"
            style={{ color: currentView === 'SETTINGS' ? theme.colors.accent : theme.colors.textMuted }}
          >
            <IconDisplay name="Settings" size={20} />
            <span className="text-[9px] font-medium mt-0.5">Setting</span>
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
            />
          )
        }
      </main >
    </div >
  );
}

export default App;