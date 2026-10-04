import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import { onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getScopedCollectionRefForAccount } from '../services/accountService';
import { AddTransactionOptions, RoutineExpense, RoutineExpenseRecord, Category, FinancialAccount } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import ConfirmDialog from './ConfirmDialog';
import QuickAddSheetLoader from './QuickAddSheetLoader';
import PageHeader from './PageHeader';
import { formatRp, formatRupiahInput } from '../utils/format';
import { NotificationType } from './NotificationModal';

interface RoutineExpenseManagerProps {
  activeAccount: Pick<FinancialAccount, 'id' | 'sharedAccountId'>;
  currentUserId: string;
  categories: Category[];
  onAddTransaction: (amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' }, options?: AddTransactionOptions) => Promise<void>;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
}

// Nama tagihan dari user bisa panjang tanpa spasi: dibiarkan pecah di mana saja supaya tidak
// terpotong di list atau membuat dialog overflow ke samping.
const WRAP_ANYWHERE_SX = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as const;

const getMonthString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// Alur bayar tagihan: dialog Set Lunas → (opsional) form transaksi.
type PayFlow = { expense: RoutineExpense; step: 'confirm' | 'form' };

const RoutineExpenseManager: React.FC<RoutineExpenseManagerProps> = ({
  activeAccount,
  currentUserId,
  categories,
  onAddTransaction,
  onAddCategory,
  onShowNotification,
}) => {
  const { theme } = useTheme();
  const [expenses, setExpenses] = useState<RoutineExpense[]>([]);
  const [records, setRecords] = useState<RoutineExpenseRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = getMonthString(currentDate);

  // Manage expenses dialog
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RoutineExpense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  
  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'AWAL_BULAN' | 'AKHIR_BULAN' | 'CUSTOM'>('AWAL_BULAN');
  const [reminderDate, setReminderDate] = useState<number>(1);
  const [reminderTime, setReminderTime] = useState<string>('08:00');

  // Payment integration
  // Alur bayar disimpan dalam SATU state. Proses async yang selesai belakangan hanya
  // boleh menutup alur yang memicunya (dibandingkan per objek), bukan alur lain yang
  // sedang dibuka user — termasuk alur baru untuk tagihan yang sama.
  const [payFlow, setPayFlow] = useState<PayFlow | null>(null);
  const [recordTransaction, setRecordTransaction] = useState(false);
  const [expenseToUnmark, setExpenseToUnmark] = useState<RoutineExpense | null>(null);
  // Isi dialog dipertahankan setelah dialog ditutup, supaya selama animasi tutup tidak
  // berkedip kosong ("Set Lunas - ", "undefined").
  const [payDialogExpense, setPayDialogExpense] = useState<RoutineExpense | null>(null);
  const [unmarkDialogExpense, setUnmarkDialogExpense] = useState<RoutineExpense | null>(null);

  const closePayFlow = (flow: PayFlow) => {
    setPayFlow((current) => (current === flow ? null : current));
  };

  // --- Firestore listeners (shared-account aware) ---
  useEffect(() => {
    if (!currentUserId || !activeAccount) return;

    const expensesRef = getScopedCollectionRefForAccount<RoutineExpense>(
      db, currentUserId, activeAccount, 'routine_expenses'
    );
    const recordsRef = getScopedCollectionRefForAccount<RoutineExpenseRecord>(
      db, currentUserId, activeAccount, 'routine_expense_records'
    );

    const unsubExpenses = onSnapshot(expensesRef, (snapshot) => {
      const data: RoutineExpense[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RoutineExpense));
      setExpenses(data);
    }, (error) => {
      console.error('Routine expenses listener error:', error);
    });

    const unsubRecords = onSnapshot(recordsRef, (snapshot) => {
      const data: RoutineExpenseRecord[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RoutineExpenseRecord));
      setRecords(data);
    }, (error) => {
      console.error('Routine expense records listener error:', error);
    });

    return () => {
      unsubExpenses();
      unsubRecords();
    };
  }, [currentUserId, activeAccount]);

  // --- Month navigation ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthLabel = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Filter expenses applicable for the current month (only show from creation month onward)
  const applicableExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        const expMonth = exp.createdAt.substring(0, 7);
        return expMonth <= currentMonth;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [expenses, currentMonth]);

  // --- Summary stats ---
  const paidCount = useMemo(() =>
    applicableExpenses.filter(exp => records.some(r => r.expenseId === exp.id && r.month === currentMonth)).length,
    [applicableExpenses, records, currentMonth]
  );
  const totalExpenses = applicableExpenses.length;

  // --- Checklist toggle ---
  const handleTogglePaid = (expense: RoutineExpense) => {
    const record = records.find(r => r.expenseId === expense.id && r.month === currentMonth);
    if (record) {
      setExpenseToUnmark(expense);
      setUnmarkDialogExpense(expense);
    } else {
      setPayFlow({ expense, step: 'confirm' });
      setPayDialogExpense(expense);
      setRecordTransaction(false);
    }
  };

  const getPaidRecordRef = (expense: RoutineExpense) => {
    const recordsRef = getScopedCollectionRefForAccount<RoutineExpenseRecord>(
      db, currentUserId, activeAccount, 'routine_expense_records'
    );
    return doc(recordsRef, `${expense.id}_${currentMonth}`);
  };

  const buildPaidRecord = (expense: RoutineExpense): RoutineExpenseRecord => ({
    id: `${expense.id}_${currentMonth}`,
    expenseId: expense.id,
    month: currentMonth,
    paidAt: new Date().toISOString(),
    createdByUserId: currentUserId,
  });

  // --- Mark as paid only (without transaction) ---
  // Dialog langsung ditutup: Firestore menerapkan write secara lokal seketika (list langsung
  // "Lunas"), sedangkan ack server bisa lama atau baru datang setelah online lagi. Toast
  // menunggu ack supaya tidak bilang "berhasil" untuk write yang akhirnya ditolak server.
  const handleMarkAsPaidOnly = (flow: PayFlow) => {
    const { expense } = flow;
    closePayFlow(flow);
    setDoc(getPaidRecordRef(expense), buildPaidRecord(expense))
      .then(() => onShowNotification?.('success', 'Berhasil', `"${expense.name}" ditandai lunas.`, true))
      .catch((error) => {
        console.error('Failed to mark routine expense as paid:', error);
        onShowNotification?.('error', 'Gagal', `"${expense.name}" gagal ditandai lunas. Coba lagi.`, true);
      });
  };

  // --- Save transaction + mark paid ---
  // Transaksi dan tanda lunas di-commit dalam SATU batch atomic (setelah upload lampiran
  // selesai): keduanya tersimpan atau keduanya tidak, tanpa keadaan setengah jadi
  // ("lunas tanpa transaksi" / "transaksi tanpa lunas") dan tanpa rollback manual.
  // Kalau gagal, error dilempar ke form supaya form tetap terbuka dan user bisa coba lagi.
  const handleSaveTransaction = async (
    amount: number, categoryId: string, date: string, description: string,
    attachment?: { file: File; type: 'image' | 'pdf' }
  ) => {
    const flow = payFlow;
    if (!flow) return;
    const { expense } = flow;
    const recordRef = getPaidRecordRef(expense);
    const record = buildPaidRecord(expense);

    try {
      await onAddTransaction(amount, categoryId, date, description, attachment, {
        extraWrites: (batch) => batch.set(recordRef, record),
      });
    } catch (error) {
      console.error('Failed to save transaction and mark paid:', error);
      throw error;
    }

    onShowNotification?.('success', 'Berhasil', `"${expense.name}" ditandai lunas dan transaksi dicatat.`, true);
    closePayFlow(flow);
  };

  // Form transaksi punya toast sukses generik ("Tersimpan!") yang muncul SETELAH
  // handleSaveTransaction selesai dan akan menimpa pesan di atas. Notifikasi sukses
  // dari form diredam di sini; error dari form tetap diteruskan.
  const notifyFromTransactionForm = (type: NotificationType, title: string, message: string, autoClose?: boolean) => {
    if (type === 'success') return;
    onShowNotification?.(type, title, message, autoClose);
  };

  // --- Unmark paid ---
  // Sama seperti Set Lunas: dialog langsung ditutup, penghapusan jalan di belakang,
  // toast menunggu ack server.
  const handleUnmarkPaid = () => {
    const expense = expenseToUnmark;
    if (!expense) return;
    setExpenseToUnmark(null);
    deleteDoc(getPaidRecordRef(expense))
      .then(() => onShowNotification?.('success', 'Berhasil', `Status lunas "${expense.name}" telah dibatalkan.`, true))
      .catch((error) => {
        console.error('Failed to unmark routine expense:', error);
        onShowNotification?.('error', 'Gagal', `Status lunas "${expense.name}" gagal dibatalkan. Coba lagi.`, true);
      });
  };

  // --- CRUD for expense components ---
  const openExpenseForm = (expense?: RoutineExpense) => {
    setEditingExpense(expense || null);
    setAmountDisplay(expense ? formatRupiahInput(String(expense.amount)) : '');
    setReminderEnabled(expense?.reminderEnabled || false);
    setReminderType(expense?.reminderType || 'AWAL_BULAN');
    setReminderDate(expense?.reminderDate || 15);
    setReminderTime(expense?.reminderTime || '08:00');
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = (formData.get('name') as string).trim();
    const categoryId = formData.get('categoryId') as string;
    const amount = Number(amountDisplay.replace(/\D/g, ''));

    if (!name || !amount || !categoryId) {
      onShowNotification?.('warning', 'Data Tidak Lengkap', 'Mohon isi semua field.', true);
      return;
    }

    try {
      const expensesRef = getScopedCollectionRefForAccount<RoutineExpense>(
        db, currentUserId, activeAccount, 'routine_expenses'
      );

      if (editingExpense) {
        await setDoc(doc(expensesRef, editingExpense.id), {
          ...editingExpense,
          name,
          amount,
          categoryId,
          reminderEnabled,
          reminderType: reminderEnabled ? reminderType : null,
          reminderDate: reminderEnabled && reminderType === 'CUSTOM' ? reminderDate : null,
          reminderTime: reminderEnabled ? reminderTime : null,
        }, { merge: true });
        onShowNotification?.('success', 'Berhasil', 'Pengeluaran rutin diperbarui.', true);
      } else {
        const newRef = doc(expensesRef);
        await setDoc(newRef, {
          id: newRef.id,
          name,
          amount,
          categoryId,
          createdAt: new Date().toISOString(),
          createdByUserId: currentUserId,
          reminderEnabled,
          reminderType: reminderEnabled ? reminderType : null,
          reminderDate: reminderEnabled && reminderType === 'CUSTOM' ? reminderDate : null,
          reminderTime: reminderEnabled ? reminderTime : null,
        } as RoutineExpense);
        onShowNotification?.('success', 'Berhasil', 'Pengeluaran rutin ditambahkan.', true);
      }

      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to save routine expense:', error);
      onShowNotification?.('error', 'Gagal', 'Terjadi kesalahan saat menyimpan.', true);
    }
  };

  const handleDeleteExpense = async () => {
    if (!editingExpense) return;
    try {
      const expensesRef = getScopedCollectionRefForAccount<RoutineExpense>(
        db, currentUserId, activeAccount, 'routine_expenses'
      );
      await deleteDoc(doc(expensesRef, editingExpense.id));
      setShowDeleteConfirm(false);
      setShowExpenseForm(false);
      setEditingExpense(null);
      onShowNotification?.('success', 'Berhasil', 'Pengeluaran rutin dihapus.', true);
    } catch (error) {
      onShowNotification?.('error', 'Gagal', 'Terjadi kesalahan saat menghapus.', true);
    }
  };

  // --- If TransactionForm is showing, render it as a standalone fullscreen dialog ---
  if (payFlow?.step === 'form') {
    const formFlow = payFlow;
    const formExpense = formFlow.expense;
    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();

    return (
      <QuickAddSheetLoader
        quickAddType="EXPENSE"
        categories={categories}
        transactions={[]}
        prefill={{
          amount: formExpense.amount,
          categoryId: formExpense.categoryId,
          date: todayStr,
          description: `Pembayaran ${formExpense.name} - ${monthLabel}`,
        }}
        onAdd={handleSaveTransaction}
        onAddCategory={onAddCategory}
        onClose={() => closePayFlow(formFlow)}
        onShowNotification={notifyFromTransactionForm}
      />
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      <PageHeader
        title="Pengeluaran Rutin"
        description="Kelola dan pantau pembayaran rutin bulanan Anda."
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconDisplay name="Settings" size={16} />}
            onClick={() => setShowManageDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Kelola
          </Button>
        }
      />

      {/* Month Navigation */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <IconButton onClick={handlePrevMonth} size="small">
          <IconDisplay name="ArrowLeft" size={20} />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
          {monthLabel}
        </Typography>
        <IconButton onClick={handleNextMonth} size="small">
          <IconDisplay name="ArrowRight" size={20} />
        </IconButton>
      </Paper>

      {/* Summary */}
      {totalExpenses > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip
            size="small"
            label={`${paidCount}/${totalExpenses} Dibayar`}
            color={paidCount === totalExpenses ? 'success' : 'default'}
            variant={paidCount === totalExpenses ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
          {paidCount === totalExpenses && totalExpenses > 0 && (
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Semua lunas! ✨
            </Typography>
          )}
        </Box>
      )}

      {/* Checklist */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        {applicableExpenses.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: theme.colors.textMuted }}>
            <IconDisplay name="RefreshCw" size={48} />
            <Typography sx={{ mt: 2, fontWeight: 600 }}>Belum ada pengeluaran rutin.</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: theme.colors.textMuted }}>
              Tekan tombol "Kelola" untuk menambahkan komponen.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {applicableExpenses.map((expense, index) => {
              const isPaid = records.some(r => r.expenseId === expense.id && r.month === currentMonth);
              const category = categories.find(c => c.id === expense.categoryId);

              return (
                <React.Fragment key={expense.id}>
                  <ListItemButton
                    onClick={() => handleTogglePaid(expense)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      opacity: isPaid ? 0.55 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <Checkbox
                      edge="start"
                      checked={isPaid}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        color: theme.colors.textMuted,
                        '&.Mui-checked': { color: theme.colors.income },
                      }}
                    />
                    <Box sx={{ flex: 1, ml: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        sx={{
                          textDecoration: isPaid ? 'line-through' : 'none',
                          color: theme.colors.textPrimary,
                          ...WRAP_ANYWHERE_SX,
                        }}
                      >
                        {expense.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {category && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: category.color || theme.colors.textMuted }}>
                            <IconDisplay name={category.icon as any} size={14} />
                            <Typography variant="caption">{category.name}</Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          {formatRp(expense.amount)}
                        </Typography>
                        {expense.reminderEnabled && (
                          <>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.colors.accent }}>
                              <IconDisplay name="Bell" size={14} />
                              <Typography variant="caption" fontWeight={600}>
                                {expense.reminderType === 'AWAL_BULAN' ? 'Awal Bulan' :
                                 expense.reminderType === 'AKHIR_BULAN' ? 'Akhir Bulan' :
                                 `Tgl ${expense.reminderDate}`} 
                                 {expense.reminderTime ? ` • ${expense.reminderTime}` : ' • 08:00'}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                    {isPaid && (
                      <Chip
                        size="small"
                        label="Lunas"
                        color="success"
                        variant="outlined"
                        sx={{ ml: 1, fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    )}
                  </ListItemButton>
                  {index < applicableExpenses.length - 1 && (
                    <Box sx={{ height: '1px', bgcolor: theme.colors.border, mx: 2 }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Manage Dialog */}
      <Dialog open={showManageDialog} onClose={() => setShowManageDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Kelola Komponen Rutin</DialogTitle>
        <DialogContent dividers>
          {expenses.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Belum ada komponen pengeluaran rutin.
            </Typography>
          ) : (
            <List disablePadding>
              {expenses.map((exp) => {
                const cat = categories.find(c => c.id === exp.categoryId);
                return (
                  <ListItem key={exp.id} sx={{ px: 0, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1.5 }}>
                      {cat && <IconDisplay name={cat.icon as any} size={20} sx={{ color: cat.color }} />}
                    </Box>
                    <ListItemText
                      primary={exp.name}
                      secondary={formatRp(exp.amount)}
                      primaryTypographyProps={{ fontWeight: 600, sx: WRAP_ANYWHERE_SX }}
                    />
                    <Button
                      size="small"
                      onClick={() => openExpenseForm(exp)}
                      sx={{ minWidth: 'auto', textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowManageDialog(false)}>Tutup</Button>
          <Button
            variant="contained"
            startIcon={<IconDisplay name="Plus" size={16} />}
            onClick={() => openExpenseForm()}
          >
            Tambah
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Form Dialog */}
      <Dialog
        open={showExpenseForm}
        onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}
        fullWidth
        maxWidth="xs"
      >
        <form onSubmit={handleSaveExpense}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingExpense ? 'Edit Komponen' : 'Tambah Komponen'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                autoFocus
                name="name"
                label="Nama Pengeluaran"
                placeholder="contoh: Cicilan Rumah"
                defaultValue={editingExpense?.name || ''}
                fullWidth
                required
              />
              <TextField
                label="Nominal Default"
                placeholder="contoh: 2.000.000"
                value={amountDisplay}
                onChange={(e) => setAmountDisplay(formatRupiahInput(e.target.value))}
                fullWidth
                required
                inputProps={{ inputMode: 'numeric' }}
              />
              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  name="categoryId"
                  label="Kategori"
                  defaultValue={editingExpense?.categoryId || ''}
                >
                  {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconDisplay name={cat.icon as any} size={18} sx={{ color: cat.color }} />
                        {cat.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 1 }} />
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconDisplay name="Bell" size={18} sx={{ color: reminderEnabled ? theme.colors.accent : theme.colors.textMuted }} />
                      <Typography fontWeight={600}>Pengingat via Telegram</Typography>
                    </Box>
                  }
                />
                
                {reminderEnabled && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, pl: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Waktu Pengingat</InputLabel>
                      <Select
                        value={reminderType}
                        label="Waktu Pengingat"
                        onChange={(e) => setReminderType(e.target.value as any)}
                      >
                        <MenuItem value="AWAL_BULAN">Awal Bulan (Tgl 1)</MenuItem>
                        <MenuItem value="AKHIR_BULAN">Akhir Bulan</MenuItem>
                        <MenuItem value="CUSTOM">Custom Tanggal</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {reminderType === 'CUSTOM' && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Tanggal</InputLabel>
                        <Select
                          value={reminderDate}
                          label="Tanggal"
                          onChange={(e) => setReminderDate(Number(e.target.value))}
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                            <MenuItem key={date} value={date}>Tanggal {date}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    <FormControl fullWidth size="small">
                      <InputLabel>Jam Pengingat</InputLabel>
                      <Select
                        value={reminderTime}
                        label="Jam Pengingat"
                        onChange={(e) => setReminderTime(e.target.value as string)}
                      >
                        {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
                          const h = String(hour).padStart(2, '0');
                          return <MenuItem key={`${h}:00`} value={`${h}:00`}>{`${h}:00`}</MenuItem>;
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            {editingExpense && (
              <Button
                color="error"
                sx={{ mr: 'auto' }}
                onClick={() => setShowDeleteConfirm(true)}
                startIcon={<IconDisplay name="Trash2" size={16} />}
              >
                Hapus
              </Button>
            )}
            <Button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}>Batal</Button>
            <Button type="submit" variant="contained">Simpan</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteExpense}
        title="Hapus Komponen"
        message={`Yakin ingin menghapus "${editingExpense?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {/* Pay Routine Expense Dialog */}
      <Dialog
        open={payFlow?.step === 'confirm'}
        onClose={() => setPayFlow(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, ...WRAP_ANYWHERE_SX }}>
          Set Lunas - {payDialogExpense?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ...WRAP_ANYWHERE_SX }}>
            Tandai tagihan &ldquo;<strong>{payDialogExpense?.name}</strong>&rdquo; ({formatRp(payDialogExpense?.amount || 0)}) sebagai lunas untuk bulan {monthLabel}.
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Box
            onClick={() => setRecordTransaction(!recordTransaction)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${recordTransaction ? theme.colors.income : theme.colors.border}`,
              bgcolor: recordTransaction ? `${theme.colors.income}10` : 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Checkbox
              checked={recordTransaction}
              onChange={(e) => setRecordTransaction(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0.5, mt: 0.25 }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600} color={theme.colors.textPrimary}>
                Catat ke Transaksi Pengeluaran
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Buka form transaksi untuk mencatat pengeluaran ini
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setPayFlow(null)}
            sx={{ borderRadius: 2 }}
          >
            Batal
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!payFlow) return;
              if (recordTransaction) {
                setPayFlow({ expense: payFlow.expense, step: 'form' });
              } else {
                handleMarkAsPaidOnly(payFlow);
              }
            }}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {recordTransaction ? 'Lanjut Catat Transaksi' : 'Set Lunas'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unmark Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(expenseToUnmark)}
        onClose={() => setExpenseToUnmark(null)}
        onConfirm={handleUnmarkPaid}
        title="Batalkan Status Lunas?"
        message={`Kembalikan status tagihan "${unmarkDialogExpense?.name}" menjadi belum dibayar untuk bulan ${monthLabel}?`}
        confirmText="Ya, Batalkan Lunas"
        cancelText="Tutup"
        type="danger"
      />
    </Box>
  );
};

export default RoutineExpenseManager;
