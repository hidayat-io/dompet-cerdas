import React, { useEffect, useState } from 'react';
import { Category, Plan, PlanItem, PlanItemStatus, TransactionType } from '../types';
import IconDisplay from './IconDisplay';
import ConfirmDialog from './ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
interface PlanManagerProps {
    plans: Plan[];
    categories: Category[];
    currentBalance: number;
    currentMonthBalance: number;
    onCreatePlan: (title: string) => void;
    onDeletePlan: (id: string) => void;
    onAddPlanItem: (planId: string, item: Omit<PlanItem, 'id'>) => void;
    onUpdatePlanItem: (planId: string, itemId: string, item: Omit<PlanItem, 'id'>) => void;
    onDeletePlanItem: (planId: string, itemId: string) => void;
    onApplyPlanItemToTransaction: (planId: string, itemId: string, item: PlanItem, date: string) => void;
    onUpdatePlanSettings: (planId: string, useCurrentMonthBalance: boolean) => void;
    onUpdatePlanItemStatus: (planId: string, itemId: string, status: PlanItemStatus) => void;
}

const STATUS_LABELS: Record<PlanItemStatus, string> = {
    PLANNED: 'Direncanakan',
    DONE: 'Sudah Dicatat',
    CANCELLED: 'Dibatalkan',
};

const PLAN_STATUS_ORDER: Record<PlanItemStatus, number> = {
    PLANNED: 0,
    DONE: 1,
    CANCELLED: 2,
};

const formatRp = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatRupiahInput = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    return split[1] !== undefined ? `${rupiah},${split[1]}` : rupiah;
};

const formatDateLabel = (value?: string) => {
    if (!value) return 'Tanggal fleksibel';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

type DeleteTarget =
    | { type: 'plan'; planId: string; title: string }
    | { type: 'item'; planId: string; itemId: string; title: string };

// Reusable type toggle component
const TypeToggle: React.FC<{ value: TransactionType; onChange: (v: TransactionType) => void; incomeColor: string; expenseColor: string }> = ({ value, onChange, incomeColor, expenseColor }) => (
    <Box sx={{ display: 'flex', p: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
        {(['EXPENSE', 'INCOME'] as TransactionType[]).map((type) => (
            <Box
                key={type}
                component="button"
                type="button"
                onClick={() => onChange(type)}
                sx={{
                    flex: 1,
                    py: 1,
                    border: 'none',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                    bgcolor: value === type ? 'background.paper' : 'transparent',
                    color: value === type ? (type === 'EXPENSE' ? expenseColor : incomeColor) : 'text.secondary',
                    boxShadow: value === type ? 1 : 0,
                }}
            >
                {type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
            </Box>
        ))}
    </Box>
);

const PlanManager: React.FC<PlanManagerProps> = ({
    plans,
    categories,
    currentBalance,
    currentMonthBalance,
    onCreatePlan,
    onDeletePlan,
    onAddPlanItem,
    onUpdatePlanItem,
    onDeletePlanItem,
    onApplyPlanItemToTransaction,
    onUpdatePlanSettings,
    onUpdatePlanItemStatus,
}) => {
    const { theme } = useTheme();
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [newPlanTitle, setNewPlanTitle] = useState('');

    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemType, setNewItemType] = useState<TransactionType>('EXPENSE');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemPlannedDate, setNewItemPlannedDate] = useState('');

    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [itemToApply, setItemToApply] = useState<PlanItem | null>(null);
    const [applyDate, setApplyDate] = useState(new Date().toISOString().split('T')[0]);

    const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemAmount, setEditItemAmount] = useState('');
    const [editItemType, setEditItemType] = useState<TransactionType>('EXPENSE');
    const [editItemCategory, setEditItemCategory] = useState('');
    const [editItemPlannedDate, setEditItemPlannedDate] = useState('');
    const [editItemStatus, setEditItemStatus] = useState<PlanItemStatus>('PLANNED');

    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    useEffect(() => {
        const availableCategories = categories.filter((category) => category.type === newItemType);
        if (!availableCategories.length) { setNewItemCategory(''); return; }
        const categoryStillValid = availableCategories.some((category) => category.id === newItemCategory);
        if (!categoryStillValid) setNewItemCategory(availableCategories[0].id);
    }, [categories, newItemCategory, newItemType]);

    useEffect(() => {
        const availableCategories = categories.filter((category) => category.type === editItemType);
        if (!availableCategories.length) { setEditItemCategory(''); return; }
        const categoryStillValid = availableCategories.some((category) => category.id === editItemCategory);
        if (!categoryStillValid) setEditItemCategory(availableCategories[0].id);
    }, [categories, editItemCategory, editItemType]);

    const getStatusChipProps = (status: PlanItemStatus) => {
        if (status === 'DONE') return { bgcolor: theme.colors.incomeBg, color: theme.colors.income };
        if (status === 'CANCELLED') return { bgcolor: theme.colors.expenseBg, color: theme.colors.expense };
        return { bgcolor: theme.colors.accentLight, color: theme.colors.accent };
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlanTitle.trim()) return;
        onCreatePlan(newPlanTitle.trim());
        setNewPlanTitle('');
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePlanId || !newItemName || !newItemAmount) return;
        const amount = parseInt(newItemAmount.replace(/\./g, ''), 10);
        onAddPlanItem(activePlanId, {
            name: newItemName.trim(),
            amount,
            type: newItemType,
            categoryId: newItemCategory || categories.find((category) => category.type === newItemType)?.id || '',
            plannedDate: newItemPlannedDate || undefined,
            status: 'PLANNED',
        });
        setNewItemName('');
        setNewItemAmount('');
        setNewItemCategory('');
        setNewItemPlannedDate('');
        setShowAddModal(false);
    };

    const openApplyModal = (item: PlanItem) => {
        setItemToApply(item);
        setApplyDate(item.plannedDate || new Date().toISOString().split('T')[0]);
        setApplyModalOpen(true);
    };

    const handleConfirmApply = () => {
        if (!activePlanId || !itemToApply || !applyDate) return;
        onApplyPlanItemToTransaction(activePlanId, itemToApply.id, itemToApply, applyDate);
        setApplyModalOpen(false);
        setItemToApply(null);
    };

    const handleEditClick = (item: PlanItem) => {
        setEditingItem(item);
        setEditItemName(item.name);
        setEditItemAmount(formatRupiahInput(item.amount.toString()));
        setEditItemType(item.type);
        setEditItemCategory(item.categoryId);
        setEditItemPlannedDate(item.plannedDate || '');
        setEditItemStatus(item.status);
    };

    const handleUpdateItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePlanId || !editingItem) return;
        const amount = parseInt(editItemAmount.replace(/\./g, ''), 10);
        onUpdatePlanItem(activePlanId, editingItem.id, {
            name: editItemName.trim(),
            amount,
            type: editItemType,
            categoryId: editItemCategory,
            plannedDate: editItemPlannedDate || undefined,
            status: editItemStatus,
        });
        setEditingItem(null);
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'plan') {
            onDeletePlan(deleteTarget.planId);
            if (activePlanId === deleteTarget.planId) setActivePlanId(null);
        } else {
            onDeletePlanItem(deleteTarget.planId, deleteTarget.itemId);
        }
        setDeleteTarget(null);
    };

    const deleteDialog = (
        <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
            title={deleteTarget?.type === 'plan' ? 'Hapus Rencana' : 'Hapus Item Rencana'}
            message={deleteTarget ? (
                <Box>
                    <Typography>
                        {deleteTarget.type === 'plan' ? 'Rencana' : 'Item rencana'} <strong>"{deleteTarget.title}"</strong> akan dihapus.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                        {deleteTarget.type === 'plan'
                            ? 'Semua item di dalam rencana ini juga akan ikut terhapus.'
                            : 'Tindakan ini tidak bisa dibatalkan.'}
                    </Typography>
                </Box>
            ) : ''}
            confirmText="Hapus"
            type="danger"
        />
    );

    // Plan detail view
    if (activePlanId) {
        const plan = plans.find((currentPlan) => currentPlan.id === activePlanId);
        if (!plan) {
            return (
                <Box>
                    <Button onClick={() => setActivePlanId(null)}>Rencana tidak ditemukan. Kembali.</Button>
                </Box>
            );
        }

        const useMonthBalance = !!plan.useCurrentMonthBalance;
        const baseBalance = useMonthBalance ? currentMonthBalance : currentBalance;
        const plannedItems = plan.items.filter((item) => item.status === 'PLANNED');
        const completedItems = plan.items.filter((item) => item.status === 'DONE');
        const cancelledItems = plan.items.filter((item) => item.status === 'CANCELLED');

        const planIncome = plannedItems.filter((item) => item.type === 'INCOME').reduce((acc, item) => acc + item.amount, 0);
        const planExpense = plannedItems.filter((item) => item.type === 'EXPENSE').reduce((acc, item) => acc + item.amount, 0);
        const planTotal = planIncome - planExpense;
        const projectedBalance = baseBalance + planTotal;
        const filteredCategories = categories.filter((category) => category.type === newItemType);
        const sortedItems = [...plan.items].sort((left, right) => {
            const statusDelta = PLAN_STATUS_ORDER[left.status] - PLAN_STATUS_ORDER[right.status];
            if (statusDelta !== 0) return statusDelta;
            if (!left.plannedDate && !right.plannedDate) return left.name.localeCompare(right.name);
            if (!left.plannedDate) return 1;
            if (!right.plannedDate) return -1;
            return left.plannedDate.localeCompare(right.plannedDate);
        });

        return (
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
                <Button
                    startIcon={<IconDisplay name="ArrowLeft" size={16} />}
                    onClick={() => setActivePlanId(null)}
                    sx={{ mb: 3, color: 'text.secondary' }}
                >
                    Kembali ke Daftar
                </Button>

                {/* Plan summary card */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>{plan.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Rencana ini tidak mengubah saldo utama sampai item dijadikan transaksi.
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {[
                            {
                                label: 'Efek Rencana Aktif',
                                value: `${planTotal > 0 ? '+' : ''}${formatRp(planTotal)}`,
                                color: planTotal >= 0 ? theme.colors.income : theme.colors.expense,
                                highlight: false,
                            },
                            {
                                label: 'Saldo Sekarang',
                                value: formatRp(currentBalance),
                                color: 'text.primary' as const,
                                highlight: false,
                            },
                            {
                                label: 'Saldo Proyeksi',
                                value: formatRp(projectedBalance),
                                color: theme.colors.accent,
                                highlight: true,
                            },
                        ].map((stat) => (
                            <Grid size={{ xs: 12, md: 4 }} key={stat.label}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: stat.highlight ? theme.colors.accentLight : 'action.hover',
                                        borderColor: stat.highlight ? theme.colors.accent : 'divider',
                                    }}
                                >
                                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ color: stat.highlight ? theme.colors.accent : 'text.secondary' }}>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: stat.color }}>
                                        {stat.value}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                                <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary">
                                    Status Item
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {[
                                        { status: 'PLANNED' as PlanItemStatus, count: plannedItems.length, label: 'aktif' },
                                        { status: 'DONE' as PlanItemStatus, count: completedItems.length, label: 'selesai' },
                                        { status: 'CANCELLED' as PlanItemStatus, count: cancelledItems.length, label: 'batal' },
                                    ].map(({ status, count, label }) => (
                                        <Chip
                                            key={status}
                                            size="small"
                                            label={`${count} ${label}`}
                                            sx={{ ...getStatusChipProps(status), fontWeight: 600, height: 22, fontSize: 11 }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={useMonthBalance}
                                onChange={(e) => onUpdatePlanSettings(plan.id, e.target.checked)}
                                size="small"
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Hitung dari saldo bulan ini</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Proyeksi rencana dihitung dari saldo bulan berjalan ({formatRp(currentMonthBalance)})
                                </Typography>
                            </Box>
                        }
                        sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover', width: '100%', mx: 0, alignItems: 'flex-start' }}
                    />
                </Paper>

                {/* Add item button */}
                <Box
                    component="button"
                    onClick={() => {
                        setNewItemName('');
                        setNewItemAmount('');
                        setNewItemType('EXPENSE');
                        setNewItemCategory('');
                        setNewItemPlannedDate('');
                        setShowAddModal(true);
                    }}
                    sx={{
                        width: '100%',
                        p: 2,
                        mb: 2,
                        border: '2px dashed',
                        borderColor: theme.colors.accent,
                        borderRadius: 3,
                        bgcolor: theme.colors.accentLight,
                        color: theme.colors.accent,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        fontWeight: 600,
                        fontSize: 15,
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        '&:hover': { borderStyle: 'solid', boxShadow: 2 },
                    }}
                >
                    <IconDisplay name="Plus" size={20} />
                    Tambah Item Rencana
                </Box>

                {/* Items list */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {sortedItems.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <IconDisplay name="CalendarDays" size={40} style={{ color: 'rgba(0,0,0,0.15)', marginBottom: 8 }} />
                            <Typography color="text.secondary">Belum ada item di rencana ini.</Typography>
                        </Box>
                    ) : (
                        sortedItems.map((item) => {
                            const category = categories.find((entry) => entry.id === item.categoryId);
                            const chipSx = getStatusChipProps(item.status);

                            return (
                                <Paper
                                    key={item.id}
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2, opacity: item.status === 'CANCELLED' ? 0.7 : 1 }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: category?.color || '#9ca3af',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconDisplay name={category?.icon || 'HelpCircle'} size={18} style={{ color: '#fff' }} />
                                            </Box>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" fontWeight={600} noWrap>
                                                        {category?.name || 'Tanpa Kategori'}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={STATUS_LABELS[item.status]}
                                                        sx={{ ...chipSx, height: 20, fontSize: 11, fontWeight: 600 }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                    <IconDisplay name="Calendar" size={11} />
                                                    <Typography variant="caption" color="text.disabled">{formatDateLabel(item.plannedDate)}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                            {item.status === 'PLANNED' && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => openApplyModal(item)}
                                                        startIcon={<IconDisplay name="Save" size={14} style={{ color: '#fff' }} />}
                                                        sx={{ borderRadius: 2, fontSize: 12, display: { xs: 'none', sm: 'flex' } }}
                                                    >
                                                        Jadikan Transaksi
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openApplyModal(item)}
                                                        sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, display: { xs: 'flex', sm: 'none' } }}
                                                    >
                                                        <IconDisplay name="Save" size={14} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onUpdatePlanItemStatus(plan.id, item.id, 'CANCELLED')}
                                                        title="Batalkan item ini"
                                                        sx={{ bgcolor: theme.colors.expenseBg, color: theme.colors.expense }}
                                                    >
                                                        <IconDisplay name="XCircle" size={14} />
                                                    </IconButton>
                                                </>
                                            )}
                                            {item.status !== 'PLANNED' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onUpdatePlanItemStatus(plan.id, item.id, 'PLANNED')}
                                                    title="Aktifkan lagi"
                                                >
                                                    <IconDisplay name="RefreshCw" size={14} />
                                                </IconButton>
                                            )}
                                            <IconButton size="small" onClick={() => handleEditClick(item)} title="Edit item">
                                                <IconDisplay name="Edit" size={14} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteTarget({ type: 'item', planId: plan.id, itemId: item.id, title: item.name })}
                                                title="Hapus item"
                                            >
                                                <IconDisplay name="Trash2" size={14} />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Box sx={{ pl: 7 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: item.type === 'INCOME' ? theme.colors.income : theme.colors.expense }}>
                                            {item.type === 'INCOME' ? '+' : '-'}{formatRp(item.amount)}
                                        </Typography>
                                    </Box>
                                </Paper>
                            );
                        })
                    )}
                </Box>

                {/* Apply to transaction modal */}
                <Dialog
                    open={applyModalOpen && !!itemToApply}
                    onClose={() => setApplyModalOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Jadikan Transaksi</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Item <strong>{itemToApply?.name}</strong> ({itemToApply ? formatRp(itemToApply.amount) : ''}) akan dicatat sebagai transaksi nyata. Pilih tanggalnya:
                        </Typography>
                    </Box>
                    <DialogContent sx={{ px: 3, pb: 3, pt: 0 }}>
                        <TextField
                            type="date"
                            fullWidth
                            size="small"
                            value={applyDate}
                            onChange={(e) => setApplyDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => setApplyModalOpen(false)} sx={{ borderRadius: 2 }}>Batal</Button>
                            <Button variant="contained" onClick={handleConfirmApply} sx={{ borderRadius: 2 }}>Simpan</Button>
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* Edit item modal */}
                <Dialog
                    open={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    maxWidth="sm"
                    fullWidth
                    slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>Edit Item Rencana</Typography>
                    </Box>
                    <DialogContent sx={{ px: 3, pb: 3, pt: 1 }}>
                        <Box component="form" onSubmit={handleUpdateItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TypeToggle value={editItemType} onChange={setEditItemType} incomeColor={theme.colors.income} expenseColor={theme.colors.expense} />
                            <TextField label="Nama Item" size="small" fullWidth value={editItemName} onChange={(e) => setEditItemName(e.target.value)} required />
                            <TextField
                                label="Jumlah"
                                size="small"
                                fullWidth
                                inputMode="numeric"
                                value={editItemAmount}
                                onChange={(e) => setEditItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                required
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
                            />
                            <FormControl size="small" fullWidth required>
                                <InputLabel>Kategori</InputLabel>
                                <Select label="Kategori" value={editItemCategory} onChange={(e) => setEditItemCategory(e.target.value)}>
                                    {categories.filter((c) => c.type === editItemType).map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Tanggal Rencana"
                                type="date"
                                size="small"
                                fullWidth
                                value={editItemPlannedDate}
                                onChange={(e) => setEditItemPlannedDate(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select label="Status" value={editItemStatus} onChange={(e) => setEditItemStatus(e.target.value as PlanItemStatus)}>
                                    <MenuItem value="PLANNED">Direncanakan</MenuItem>
                                    <MenuItem value="DONE">Sudah Dicatat</MenuItem>
                                    <MenuItem value="CANCELLED">Dibatalkan</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
                                <Button variant="outlined" onClick={() => setEditingItem(null)} sx={{ borderRadius: 2 }}>Batal</Button>
                                <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>Simpan Perubahan</Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* Add item modal */}
                <Dialog
                    open={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    maxWidth="sm"
                    fullWidth
                    slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>Tambah Item Rencana</Typography>
                    </Box>
                    <DialogContent sx={{ px: 3, pb: 3, pt: 1 }}>
                        <Box component="form" onSubmit={handleAddItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TypeToggle value={newItemType} onChange={setNewItemType} incomeColor={theme.colors.income} expenseColor={theme.colors.expense} />
                            <TextField
                                label="Nama Item"
                                size="small"
                                fullWidth
                                placeholder="mis: Tiket liburan"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                required
                            />
                            <TextField
                                label="Jumlah"
                                size="small"
                                fullWidth
                                inputMode="numeric"
                                placeholder="0"
                                value={newItemAmount}
                                onChange={(e) => setNewItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                required
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> } }}
                            />
                            <FormControl size="small" fullWidth required>
                                <InputLabel>Kategori</InputLabel>
                                <Select label="Kategori" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                                    <MenuItem value="">Pilih Kategori...</MenuItem>
                                    {filteredCategories.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Tanggal Rencana"
                                type="date"
                                size="small"
                                fullWidth
                                value={newItemPlannedDate}
                                onChange={(e) => setNewItemPlannedDate(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1 }}>
                                <Button variant="outlined" onClick={() => setShowAddModal(false)} sx={{ borderRadius: 2 }}>Batal</Button>
                                <Button type="submit" variant="contained" sx={{ borderRadius: 2 }}>Tambah Item</Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>

                {deleteDialog}
            </Box>
        );
    }

    // Plans list view
    return (
        <>
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Rencana</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Siapkan pemasukan dan pengeluaran berikutnya tanpa langsung mengubah saldo.
                        </Typography>
                    </Box>
                </Box>

                {/* Create plan form */}
                <Card
                    variant="outlined"
                    sx={{ p: 2.5, borderRadius: 4, mb: 3 }}
                >
                    <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Judul rencana baru (mis: Liburan Bali)"
                            value={newPlanTitle}
                            onChange={(e) => setNewPlanTitle(e.target.value)}
                            sx={{ flex: 1 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!newPlanTitle.trim()}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 4, flexShrink: 0 }}
                        >
                            Buat Rencana
                        </Button>
                    </Box>
                </Card>

                {/* Plans grid */}
                <Grid container spacing={2}>
                    {plans.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
                                <IconDisplay name="CalendarDays" size={48} style={{ color: 'rgba(0,0,0,0.15)', marginBottom: 12 }} />
                                <Typography fontWeight={600} color="text.secondary">Belum ada rencana.</Typography>
                                <Typography variant="body2" color="text.disabled">Buat rencana keuanganmu sekarang.</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        plans.map((plan) => {
                            const plannedItems = plan.items.filter((item) => item.status === 'PLANNED');
                            const total = plannedItems.reduce((acc, item) => (
                                item.type === 'INCOME' ? acc + item.amount : acc - item.amount
                            ), 0);
                            const doneCount = plan.items.filter((item) => item.status === 'DONE').length;
                            const useMonthBalance = !!plan.useCurrentMonthBalance;

                            return (
                                <Grid size={{ xs: 12, md: 6 }} key={plan.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 4,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'box-shadow 0.2s',
                                            '&:hover': { boxShadow: 3 },
                                        }}
                                    >
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: theme.colors.accent, zIndex: 1 }} />
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', p: 2, pb: 0, pl: 3 }}>
                                            <Box sx={{ cursor: 'pointer', flex: 1 }} onClick={() => setActivePlanId(plan.id)}>
                                                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                                                    {plan.title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {useMonthBalance && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.colors.accent }}>
                                                            <IconDisplay name="Calendar" size={12} />
                                                            <Typography variant="caption" fontWeight={600}>Saldo bulan ini</Typography>
                                                        </Box>
                                                    )}
                                                    <Chip size="small" label={`${plannedItems.length} aktif`} sx={{ height: 20, fontSize: 11 }} />
                                                    {doneCount > 0 && (
                                                        <Chip
                                                            size="small"
                                                            label={`${doneCount} selesai`}
                                                            sx={{ height: 20, fontSize: 11, bgcolor: theme.colors.incomeBg, color: theme.colors.income }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget({ type: 'plan', planId: plan.id, title: plan.title });
                                                }}
                                                title="Hapus rencana"
                                                sx={{ ml: 1, zIndex: 2 }}
                                            >
                                                <IconDisplay name="Trash2" size={16} />
                                            </IconButton>
                                        </Box>
                                        
                                        <Box sx={{ p: 2, pt: 1.5, pl: 3, cursor: 'pointer' }} onClick={() => setActivePlanId(plan.id)}>
                                            <Divider sx={{ mb: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <Chip size="small" label={`${plan.items.length} item`} sx={{ height: 22 }} />
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="caption" textTransform="uppercase" color="text.secondary">
                                                        Efek Rencana Aktif
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight={700} sx={{ color: total >= 0 ? theme.colors.income : theme.colors.expense }}>
                                                        {total >= 0 ? '+' : ''}{formatRp(total)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            </Box>
            {deleteDialog}
        </>
    );
};

export default PlanManager;
