import React, { useMemo, useState } from 'react';
import { Budget, Category, Transaction } from '../types';
import IconDisplay from './IconDisplay';
import ConfirmDialog from './ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';
import { getBudgetOverview, getBudgetSummaries, getBudgetTransactions, getMonthKey, getMonthLabel, getPreviousMonthKey } from '../utils/budget';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import FullScreenDialog from './FullScreenDialog';
import PageHeader from './PageHeader';

interface BudgetManagerProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    onSaveBudget: (payload: {
        budgetId?: string;
        month: string;
        name: string;
        categoryIds: string[];
        limitAmount: number;
    }) => Promise<void>;
    onDeleteBudget: (budgetId: string) => Promise<void>;
    onCopyBudgetsFromPreviousMonth: (targetMonth: string) => Promise<void>;
}

type BudgetDraft = {
    budgetId?: string;
    name: string;
    limitAmount: string;
    categoryIds: string[];
};

const emptyDraft: BudgetDraft = {
    name: '',
    limitAmount: '',
    categoryIds: [],
};

const formatRp = (value: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
}).format(value);

const formatRupiahInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('id-ID').format(Number(digits));
};

const shiftMonth = (monthKey: string, delta: number) => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return getMonthKey(date);
};

const BudgetManager: React.FC<BudgetManagerProps> = ({
    budgets,
    transactions,
    categories,
    onSaveBudget,
    onDeleteBudget,
    onCopyBudgetsFromPreviousMonth,
}) => {
    const { theme } = useTheme();
    const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
    const [draft, setDraft] = useState<BudgetDraft>(emptyDraft);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copying, setCopying] = useState(false);
    const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
    const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
    const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

    const expenseCategories = useMemo(
        () => categories.filter((category) => category.type === 'EXPENSE'),
        [categories]
    );

    const budgetsForMonth = useMemo(
        () => budgets
            .filter((budget) => budget.month === selectedMonth)
            .sort((left, right) => left.name.localeCompare(right.name)),
        [budgets, selectedMonth]
    );

    const summaries = useMemo(
        () => getBudgetSummaries(budgets, transactions, categories, selectedMonth),
        [budgets, transactions, categories, selectedMonth]
    );

    const overview = useMemo(
        () => getBudgetOverview(summaries),
        [summaries]
    );

    const usedCategoryIds = useMemo(() => {
        const ids = new Set<string>();
        budgetsForMonth.forEach((budget) => {
            if (draft.budgetId && budget.id === draft.budgetId) return;
            budget.categoryIds.forEach((categoryId) => ids.add(categoryId));
        });
        return ids;
    }, [budgetsForMonth, draft.budgetId]);

    const availableCategories = useMemo(
        () => expenseCategories.filter((category) => (
            draft.categoryIds.includes(category.id) || !usedCategoryIds.has(category.id)
        )),
        [expenseCategories, draft.categoryIds, usedCategoryIds]
    );

    const previousMonth = getPreviousMonthKey(selectedMonth);
    const previousMonthBudgetCount = budgets.filter((budget) => budget.month === previousMonth).length;
    const activeSummary = summaries.find((summary) => summary.budget.id === activeBudgetId) || null;
    const activeBudgetTransactions = activeSummary
        ? getBudgetTransactions(activeSummary.budget, transactions, categories, selectedMonth)
        : [];

    const resetForm = () => {
        setDraft(emptyDraft);
        setShowForm(false);
    };

    const openCreateForm = () => {
        setDraft(emptyDraft);
        setShowForm(true);
    };

    const openEditForm = (budget: Budget) => {
        setDraft({
            budgetId: budget.id,
            name: budget.name,
            limitAmount: budget.limitAmount > 0 ? new Intl.NumberFormat('id-ID').format(budget.limitAmount) : '',
            categoryIds: budget.categoryIds,
        });
        setShowForm(true);
    };

    const toggleCategory = (categoryId: string) => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            categoryIds: currentDraft.categoryIds.includes(categoryId)
                ? currentDraft.categoryIds.filter((entry) => entry !== categoryId)
                : [...currentDraft.categoryIds, categoryId],
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const limitAmount = Number(draft.limitAmount.replace(/\./g, ''));
        if (!draft.name.trim() || !limitAmount || draft.categoryIds.length === 0) return;
        setSaving(true);
        try {
            await onSaveBudget({
                budgetId: draft.budgetId,
                month: selectedMonth,
                name: draft.name.trim(),
                categoryIds: draft.categoryIds,
                limitAmount,
            });
            resetForm();
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBudget = async (budgetId: string) => {
        setDeletingBudgetId(budgetId);
        try {
            await onDeleteBudget(budgetId);
            if (draft.budgetId === budgetId) resetForm();
            if (activeBudgetId === budgetId) setActiveBudgetId(null);
        } finally {
            setDeletingBudgetId(null);
        }
    };

    const handleConfirmDeleteBudget = async () => {
        if (!budgetToDelete) return;
        try {
            await handleDeleteBudget(budgetToDelete.id);
        } finally {
            setBudgetToDelete(null);
        }
    };

    const handleCopyPreviousMonth = async () => {
        setCopying(true);
        try {
            await onCopyBudgetsFromPreviousMonth(selectedMonth);
        } finally {
            setCopying(false);
        }
    };

    const formatTransactionDate = (dateValue: string) => new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateValue));

    const activeTransactionsTotal = activeBudgetTransactions.reduce((total, item) => total + item.transaction.amount, 0);

    const isFormValid = draft.name.trim() && Number(draft.limitAmount.replace(/\./g, '')) > 0 && draft.categoryIds.length > 0;

    const budgetFormModal = (
        <FullScreenDialog
            open={showForm}
            onClose={resetForm}
            title={draft.budgetId ? 'Edit Anggaran' : 'Anggaran Baru'}
            description="Pilih kategori pengeluaran yang ingin dipantau, lalu tetapkan batas agar progres anggarannya mudah dibaca."
            actions={
                <>
                    <Button variant="outlined" onClick={resetForm} disabled={saving}>
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        form="budget-form"
                        variant="contained"
                        disabled={saving || !isFormValid}
                        startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                    >
                        {saving ? 'Menyimpan...' : draft.budgetId ? 'Update Anggaran' : 'Simpan Anggaran'}
                    </Button>
                </>
            }
        >
            <Box component="form" id="budget-form" onSubmit={handleSubmit}>
                <Grid container spacing={2} sx={{ mb: 3, pt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">
                            Kategori yang sudah dipakai di anggaran lain untuk bulan ini tidak akan ditampilkan agar tidak bentrok.
                        </Typography>
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <TextField
                                label="Nama Anggaran"
                                fullWidth
                                size="small"
                                value={draft.name}
                                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                                placeholder="Mis: Makan Harian"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                label="Batas Pengeluaran"
                                fullWidth
                                size="small"
                                inputMode="numeric"
                                value={draft.limitAmount}
                                onChange={(e) => setDraft((d) => ({ ...d, limitAmount: formatRupiahInput(e.target.value) }))}
                                placeholder="0"
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        {draft.budgetId ? 'Kategori dalam Anggaran' : 'Pilih Kategori'}
                    </Typography>

                    {availableCategories.length === 0 ? (
                        <Card variant="outlined" sx={{ p: 4, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center', mb: 3 }}>
                            <IconDisplay name="Info" size={24} sx={{ color: theme.colors.textMuted, mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Semua kategori pengeluaran di bulan ini sudah dipakai anggaran lain.
                            </Typography>
                        </Card>
                    ) : (
                        <Grid container spacing={1.5}>
                            {availableCategories.map((category) => {
                                const selected = draft.categoryIds.includes(category.id);
                                return (
                                    <Grid size={{ xs: 6, md: 4 }} key={category.id}>
                                        <CardActionArea
                                            onClick={() => toggleCategory(category.id)}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: selected ? theme.colors.accentLight : 'background.paper',
                                            }}
                                        >
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: 'transparent',
                                                    borderColor: selected ? theme.colors.accent : 'divider',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            bgcolor: category.color,
                                                        }}
                                                    >
                                                        <IconDisplay name={category.icon} size={16} sx={{ color: '#fff' }} />
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} noWrap>{category.name}</Typography>
                                                        <Typography variant="caption" sx={{ color: selected ? theme.colors.accent : 'text.secondary', fontWeight: 600 }}>
                                                            {selected ? 'Terpilih' : 'Pilih kategori'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        </CardActionArea>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
            </Box>
        </FullScreenDialog>
    );

    const deleteDialog = (
        <ConfirmDialog
            isOpen={!!budgetToDelete}
            onClose={() => !deletingBudgetId && setBudgetToDelete(null)}
            onConfirm={handleConfirmDeleteBudget}
            title="Hapus Anggaran"
            message={budgetToDelete ? (
                <Box>
                    <Typography>
                        Anggaran <strong>"{budgetToDelete.name}"</strong> akan dihapus.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                        Transaksi yang sudah tercatat tidak ikut terhapus.
                    </Typography>
                </Box>
            ) : ''}
            confirmText="Hapus"
            type="danger"
            isLoading={!!deletingBudgetId}
        />
    );

    // Active budget detail view
    if (activeSummary) {
        return (
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
                <Button
                    variant="outlined"
                    startIcon={<IconDisplay name="ArrowLeft" size={16} />}
                    onClick={() => setActiveBudgetId(null)}
                    sx={{ borderRadius: 2, mb: 3, fontWeight: 600 }}
                >
                    Kembali ke Daftar Anggaran
                </Button>

                <Card variant="outlined" sx={{ borderRadius: 4, mb: 3 }}>
                    <CardHeader
                        title={<Typography variant="h5" fontWeight={700}>{activeSummary.budget.name}</Typography>}
                        subheader={
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Menampilkan transaksi yang masuk ke anggaran ini di {getMonthLabel(selectedMonth)}.
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                    {activeSummary.categories.map((category) => (
                                        <Chip
                                            key={category.id}
                                            size="small"
                                            icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: category.color, ml: 1 }} />}
                                            label={category.name}
                                            sx={{ height: 24, fontWeight: 500 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        }
                        action={
                            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, mt: 1, mr: 1 }}>
                                <Button variant="outlined" size="small" onClick={() => openEditForm(activeSummary.budget)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                                    Edit
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    disabled={deletingBudgetId === activeSummary.budget.id}
                                    onClick={() => setBudgetToDelete(activeSummary.budget)}
                                    sx={{ borderRadius: 2, fontWeight: 600 }}
                                >
                                    {deletingBudgetId === activeSummary.budget.id ? 'Loading...' : 'Hapus'}
                                </Button>
                            </Box>
                        }
                        sx={{ p: 3, pb: 2, alignItems: 'flex-start' }}
                    />
                    
                    <CardContent sx={{ px: 3, pt: 0, pb: 3 }}>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {[
                                { label: 'Batas Anggaran', value: formatRp(activeSummary.budget.limitAmount), color: 'text.primary' as const },
                                { label: 'Sudah Terpakai', value: formatRp(activeTransactionsTotal), color: theme.colors.expense },
                                { label: 'Sisa Anggaran', value: formatRp(activeSummary.remaining), color: activeSummary.remaining >= 0 ? theme.colors.income : theme.colors.expense },
                                { label: 'Jumlah Transaksi', value: String(activeBudgetTransactions.length), color: 'text.primary' as const },
                            ].map((stat) => (
                                <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                                        <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary" display="block">
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: stat.color }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {Math.min(activeSummary.percentage, 100).toFixed(0)}% terpakai
                                </Typography>
                                <Typography variant="caption" fontWeight={600} color="text.secondary">
                                    {activeSummary.isOverBudget ? 'Melebihi Anggaran' : 'Masih aman'}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(activeSummary.percentage, 100)}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: 'action.hover',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: activeSummary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                        borderRadius: 5,
                                    },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 4 }}>
                    <CardHeader 
                        title={<Typography variant="h6" fontWeight={700}>Transaksi dalam Anggaran</Typography>}
                        subheader={`Transaksi yang dihitung ke anggaran ini pada ${getMonthLabel(selectedMonth)}.`}
                        action={
                            <Chip
                                label={`${activeBudgetTransactions.length} transaksi`}
                                size="small"
                                sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600, mt: 1, mr: 1 }}
                            />
                        }
                    />

                    {activeBudgetTransactions.length === 0 ? (
                        <CardContent sx={{ pt: 2, pb: 6, textAlign: 'center' }}>
                            <IconDisplay name="Receipt" size={48} sx={{ color: 'rgba(0,0,0,0.1)', marginBottom: 16 }} />
                            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                                Belum ada transaksi yang masuk ke anggaran ini.
                            </Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 1, px: 4 }}>
                                Tambah transaksi dengan kategori yang termasuk di anggaran ini agar progress-nya terisi.
                            </Typography>
                        </CardContent>
                    ) : (
                        <List disablePadding>
                            {activeBudgetTransactions.map(({ transaction, category }, idx, arr) => (
                                <React.Fragment key={transaction.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: category?.color || theme.colors.accent, width: 44, height: 44 }}>
                                                <IconDisplay name={category?.icon || 'Receipt'} size={22} sx={{ color: '#fff' }} />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={
                                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                    {transaction.description || 'Tanpa deskripsi'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatTransactionDate(transaction.date)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled">•</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {category?.name || 'Tanpa Kategori'}
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ my: 0, pr: 2 }}
                                        />
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.colors.expense, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                            {formatRp(transaction.amount)}
                                        </Typography>
                                    </ListItem>
                                    {idx < arr.length - 1 && <Divider component="li" variant="inset" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Card>

                {budgetFormModal}
                {deleteDialog}
            </Box>
        );
    }

    // Main budget list view
    return (
        <Box sx={{ pb: { xs: 10, md: 0 } }}>
            <PageHeader
                title="Anggaran"
                description="Buat anggaran yang memang ingin dipantau. Satu anggaran bisa berisi satu atau beberapa kategori."
                actions={
                    <Box>
                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.1em', color: 'text.secondary', display: 'block', mb: 1 }}>
                        Bulan Anggaran
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={() => {
                                setSelectedMonth((m) => shiftMonth(m, -1));
                                setShowForm(false);
                                setDraft(emptyDraft);
                            }}
                            aria-label="Bulan sebelumnya"
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                        >
                            <IconDisplay name="ArrowLeft" size={18} />
                        </IconButton>
                        <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 180, textAlign: 'center' }}>
                            <Typography variant="body1" fontWeight={600}>{getMonthLabel(selectedMonth)}</Typography>
                            <Typography variant="caption" color="text.secondary">{selectedMonth}</Typography>
                        </Paper>
                        <IconButton
                            onClick={() => {
                                setSelectedMonth((m) => shiftMonth(m, 1));
                                setShowForm(false);
                                setDraft(emptyDraft);
                            }}
                            aria-label="Bulan berikutnya"
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                        >
                            <IconDisplay name="ArrowRight" size={18} />
                        </IconButton>
                    </Box>
                    </Box>
                }
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Anggaran', value: formatRp(overview.totalBudget), color: 'text.primary' as const },
                    { label: 'Sudah Terpakai', value: formatRp(overview.totalSpent), color: theme.colors.expense },
                    { label: 'Sisa Anggaran', value: formatRp(overview.remaining), color: overview.remaining >= 0 ? theme.colors.income : theme.colors.expense },
                    {
                        label: 'Status',
                        value: overview.overBudgetCount > 0 ? `${overview.overBudgetCount} lewat` : 'Aman',
                        color: overview.overBudgetCount > 0 ? theme.colors.expense : 'text.primary' as const,
                        sub: `${overview.activeBudgetCount} anggaran aktif di ${getMonthLabel(selectedMonth)}`,
                    },
                ].map((stat) => (
                    <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary" display="block">
                                {stat.label}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: stat.color }}>
                                {stat.value}
                            </Typography>
                            {stat.sub && (
                                <Typography variant="caption" color="text.secondary">{stat.sub}</Typography>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Card variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Anggaran {getMonthLabel(selectedMonth)}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Pemakaian bulan ini dihitung dari transaksi di {getMonthLabel(selectedMonth)}. Saat pindah bulan, pemakaian mulai dari 0 lagi.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexShrink: 0, minWidth: { md: 220 } }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            disabled={copying || previousMonthBudgetCount === 0}
                            startIcon={copying ? <CircularProgress size={16} /> : undefined}
                            onClick={handleCopyPreviousMonth}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                            {copying ? 'Menyalin...' : `Salin ${getMonthLabel(previousMonth)}`}
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<IconDisplay name="Plus" size={18} sx={{ color: '#fff' }} />}
                            onClick={openCreateForm}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                            Buat Anggaran
                        </Button>
                    </Box>
                </Box>

                {summaries.length === 0 ? (
                    <Card variant="outlined" sx={{ p: 6, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
                        <IconDisplay name="PiggyBank" size={40} sx={{ color: 'rgba(0,0,0,0.15)', marginBottom: 12 }} />
                        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                            Belum ada anggaran di {getMonthLabel(selectedMonth)}.
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                            Mulai dengan membuat anggaran untuk kategori yang memang ingin dipantau.
                        </Typography>
                    </Card>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {summaries.map((summary) => (
                            <Card
                                key={summary.budget.id}
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    bgcolor: summary.isOverBudget ? theme.colors.expenseBg : 'action.hover',
                                    borderColor: summary.isOverBudget ? `${theme.colors.expense}44` : 'divider',
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' }, justifyContent: 'space-between', gap: 2 }}>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                                <Typography variant="h6" fontWeight={700}>{summary.budget.name}</Typography>
                                                <Chip
                                                    size="small"
                                                    label={summary.isOverBudget ? 'Melebihi Anggaran' : `${Math.min(summary.percentage, 100).toFixed(0)}% terpakai`}
                                                    sx={{
                                                        bgcolor: summary.isOverBudget ? 'background.paper' : theme.colors.accentLight,
                                                        color: summary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                                        fontWeight: 600,
                                                        height: 22,
                                                        fontSize: 11,
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Anggaran {formatRp(summary.budget.limitAmount)} • Terpakai {formatRp(summary.spent)} • Sisa {formatRp(summary.remaining)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                                {summary.categories.map((category) => (
                                                    <Chip
                                                        key={category.id}
                                                        size="small"
                                                        icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: category.color, ml: 1 }} />}
                                                        label={category.name}
                                                        sx={{ height: 24, bgcolor: 'background.paper', fontWeight: 500 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => setActiveBudgetId(summary.budget.id)}
                                                sx={{ borderRadius: 2, fontSize: 13, fontWeight: 600 }}
                                            >
                                                Lihat Detail
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => openEditForm(summary.budget)}
                                                sx={{ borderRadius: 2, fontSize: 13, fontWeight: 600 }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                disabled={deletingBudgetId === summary.budget.id}
                                                onClick={() => setBudgetToDelete(summary.budget)}
                                                sx={{ borderRadius: 2, fontSize: 13, fontWeight: 600 }}
                                            >
                                                {deletingBudgetId === summary.budget.id ? 'Loading...' : 'Hapus'}
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                {Math.min(summary.percentage, 100).toFixed(0)}% terpakai
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                {summary.isOverBudget ? 'Perlu perhatian' : 'Masih aman'}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(summary.percentage, 100)}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                bgcolor: 'background.paper',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: summary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                                    borderRadius: 5,
                                                },
                                            }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Card>

            {budgetFormModal}
            {deleteDialog}
        </Box>
    );
};

export default BudgetManager;
