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
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FullScreenDialog from './FullScreenDialog';
import PageHeader from './PageHeader';
interface PlanManagerProps {
    plans: Plan[];
    categories: Category[];
    currentUserId?: string | null;
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
    <ToggleButtonGroup
        fullWidth
        exclusive
        value={value}
        onChange={(_, nextValue) => {
            if (nextValue) onChange(nextValue);
        }}
        sx={{ bgcolor: 'action.hover', p: 0.5 }}
    >
        {(['EXPENSE', 'INCOME'] as TransactionType[]).map((type) => (
            <ToggleButton
                key={type}
                value={type}
                sx={{
                    color: value === type ? (type === 'EXPENSE' ? expenseColor : incomeColor) : 'text.secondary',
                    '&.Mui-selected': {
                        bgcolor: 'background.paper',
                        color: type === 'EXPENSE' ? expenseColor : incomeColor,
                        boxShadow: 1,
                    },
                }}
            >
                {type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
            </ToggleButton>
        ))}
    </ToggleButtonGroup>
);

const PlanManager: React.FC<PlanManagerProps> = ({
    plans,
    categories,
    currentUserId,
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
    const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const canEditPlan = (plan: Plan) => !plan.createdByUserId || !currentUserId || plan.createdByUserId === currentUserId;
    const canEditPlanItem = (plan: Plan, item: PlanItem) => (
        canEditPlan(plan) && (!item.createdByUserId || !currentUserId || item.createdByUserId === currentUserId)
    );

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
        setShowCreatePlanDialog(false);
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
                        if (!planEditable) return;
                        setNewItemName('');
                        setNewItemAmount('');
                        setNewItemType('EXPENSE');
                        setNewItemCategory('');
                        setNewItemPlannedDate('');
                        setShowAddModal(true);
                    }}
                    disabled={!planEditable}
                    sx={{
                        width: '100%',
                        p: 2,
                        mb: 2,
                        border: '2px dashed',
                        borderColor: theme.colors.accent,
                        borderRadius: 3,
                        bgcolor: theme.colors.accentLight,
                        color: theme.colors.accent,
                        cursor: planEditable ? 'pointer' : 'not-allowed',
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
                            <IconDisplay name="CalendarDays" size={40} sx={{ color: 'rgba(0,0,0,0.15)', marginBottom: 8 }} />
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
                                                <IconDisplay name={category?.icon || 'HelpCircle'} size={18} sx={{ color: '#fff' }} />
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
                                            {item.status === 'PLANNED' && planEditable && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => openApplyModal(item)}
                                                        startIcon={<IconDisplay name="Save" size={14} sx={{ color: '#fff' }} />}
                                                        sx={{ borderRadius: 2, fontSize: 12, display: { xs: 'none', sm: 'flex' } }}
                                                    >
                                                        Jadikan Transaksi
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openApplyModal(item)}
                                                        disabled={!planEditable}
                                                        sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, display: { xs: 'flex', sm: 'none' } }}
                                                    >
                                                        <IconDisplay name="Save" size={14} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onUpdatePlanItemStatus(plan.id, item.id, 'CANCELLED')}
                                                        disabled={!canEditPlanItem(plan, item)}
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
                                                    disabled={!canEditPlanItem(plan, item)}
                                                    title="Aktifkan lagi"
                                                >
                                                    <IconDisplay name="RefreshCw" size={14} />
                                                </IconButton>
                                            )}
                                            <IconButton size="small" onClick={() => handleEditClick(item)} disabled={!canEditPlanItem(plan, item)} title="Edit item">
                                                <IconDisplay name="Edit" size={14} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteTarget({ type: 'item', planId: plan.id, itemId: item.id, title: item.name })}
                                                disabled={!canEditPlanItem(plan, item)}
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
                <FullScreenDialog
                    open={applyModalOpen && !!itemToApply}
                    onClose={() => setApplyModalOpen(false)}
                    title="Jadikan Transaksi"
                    description={`Item ${itemToApply?.name || ''} akan dicatat sebagai transaksi nyata. Pilih tanggal pencatatannya.`}
                    actions={
                        <>
                            <Button variant="outlined" onClick={() => setApplyModalOpen(false)}>Batal</Button>
                            <Button variant="contained" onClick={handleConfirmApply}>Simpan</Button>
                        </>
                    }
                >
                    <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={applyDate}
                        onChange={(e) => setApplyDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </FullScreenDialog>

                {/* Edit item modal */}
                <FullScreenDialog
                    open={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    title="Edit Item Rencana"
                    description="Perbarui detail item agar rencana dan proyeksi saldo tetap akurat."
                    actions={
                        <>
                            <Button variant="outlined" onClick={() => setEditingItem(null)}>Batal</Button>
                            <Button type="submit" form="edit-plan-item-form" variant="contained">Simpan Perubahan</Button>
                        </>
                    }
                >
                    <Box component="form" id="edit-plan-item-form" onSubmit={handleUpdateItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    </Box>
                </FullScreenDialog>

                {/* Add item modal */}
                <FullScreenDialog
                    open={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Tambah Item Rencana"
                    description="Tambahkan item pemasukan atau pengeluaran yang ingin direncanakan lebih dulu."
                    actions={
                        <>
                            <Button variant="outlined" onClick={() => setShowAddModal(false)}>Batal</Button>
                            <Button type="submit" form="add-plan-item-form" variant="contained">Tambah Item</Button>
                        </>
                    }
                >
                    <Box component="form" id="add-plan-item-form" onSubmit={handleAddItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    </Box>
                </FullScreenDialog>

                {deleteDialog}
            </Box>
        );
    }

    // Plans list view
    return (
        <>
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
                <PageHeader
                    title="Rencana"
                    description="Siapkan pemasukan dan pengeluaran berikutnya tanpa langsung mengubah saldo."
                    actions={(
                        <Button
                            variant="contained"
                            onClick={() => setShowCreatePlanDialog(true)}
                            startIcon={<IconDisplay name="Plus" size={16} sx={{ color: '#fff' }} />}
                        >
                            Buat Rencana
                        </Button>
                    )}
                />

                {/* Plans grid */}
                <Grid container spacing={2}>
                    {plans.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
                                <IconDisplay name="CalendarDays" size={48} sx={{ color: 'rgba(0,0,0,0.15)', marginBottom: 12 }} />
                                <Typography fontWeight={600} color="text.secondary">Belum ada rencana.</Typography>
                                <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>Buat rencana keuanganmu sekarang.</Typography>
                                <Button variant="contained" onClick={() => setShowCreatePlanDialog(true)}>
                                    Buat Rencana Pertama
                                </Button>
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
                            const planEditable = canEditPlan(plan);

                            return (
                                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={plan.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 3,
                                            transition: 'box-shadow 0.2s',
                                            '&:hover': { boxShadow: 3 },
                                        }}
                                    >
                                        <Box sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                                                <Box sx={{ cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={() => setActivePlanId(plan.id)}>
                                                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                                                        {plan.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {plannedItems.length > 0 ? `${plannedItems.length} item aktif` : 'Belum ada item aktif'}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    disabled={!planEditable}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget({ type: 'plan', planId: plan.id, title: plan.title });
                                                    }}
                                                    title="Hapus rencana"
                                                >
                                                    <IconDisplay name="Trash2" size={16} />
                                                </IconButton>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                <Chip size="small" label={`${plan.items.length} item`} sx={{ height: 24 }} />
                                                <Chip size="small" label={`${plannedItems.length} aktif`} sx={{ height: 24 }} />
                                                {doneCount > 0 && (
                                                    <Chip
                                                        size="small"
                                                        label={`${doneCount} selesai`}
                                                        sx={{ height: 24, bgcolor: theme.colors.incomeBg, color: theme.colors.income }}
                                                    />
                                                )}
                                                {useMonthBalance && (
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<IconDisplay name="Calendar" size={12} />}
                                                        label="Saldo bulan ini"
                                                        sx={{ height: 24 }}
                                                    />
                                                )}
                                            </Box>

                                            <Paper
                                                variant="outlined"
                                                onClick={() => setActivePlanId(plan.id)}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: 'action.hover',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                    '&:hover': {
                                                        borderColor: theme.colors.accent,
                                                        bgcolor: theme.colors.accentLight,
                                                    },
                                                }}
                                            >
                                                <Typography variant="caption" textTransform="uppercase" color="text.secondary">
                                                    Efek Rencana Aktif
                                                </Typography>
                                                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, color: total >= 0 ? theme.colors.income : theme.colors.expense }}>
                                                    {total >= 0 ? '+' : ''}{formatRp(total)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                                    Buka detail untuk melihat dan mengatur item rencana.
                                                </Typography>
                                            </Paper>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            </Box>

            <Dialog
                open={showCreatePlanDialog}
                onClose={() => setShowCreatePlanDialog(false)}
                fullWidth
                maxWidth="xs"
            >
                <Box component="form" onSubmit={handleCreate}>
                    <DialogTitle>Buat Rencana</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Judul rencana"
                            placeholder="Contoh: Liburan Bali"
                            value={newPlanTitle}
                            onChange={(e) => setNewPlanTitle(e.target.value)}
                            sx={{ mt: 1 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={() => setShowCreatePlanDialog(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="contained" disabled={!newPlanTitle.trim()}>
                            Buat Rencana
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>
            {deleteDialog}
        </>
    );
};

export default PlanManager;
