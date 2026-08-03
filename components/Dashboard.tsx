import React, { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { Transaction, Category, Budget, DebtRecord, Plan, PlanItem } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { getBudgetOverview, getBudgetSummaries, getMonthKey } from '../utils/budget';
import SyncStatusChip from './SyncStatusChip';
import { formatRp } from '../utils/format';

const DashboardExpenseChart = lazy(() => import('./DashboardExpenseChart'));

interface DashboardProps {
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    debts?: DebtRecord[];
    plans?: Plan[];
    isOffline?: boolean;
    hasPendingWrites?: boolean;
    pendingAttachmentCount?: number;
    showGettingStarted: boolean;
    isGettingStartedDismissed: boolean;
    activeAccountName: string;
    telegramLinked: boolean;
    onGoToTransactions: () => void;
    onGoToBudgets: () => void;
    onGoToDebts: () => void;
    onGoToSettings: () => void;
    onOpenOnboarding: () => void;
    onQuickAdd: (type: 'INCOME' | 'EXPENSE') => void;
    onScanReceipt: () => void;
}

const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);
};

const Dashboard: React.FC<DashboardProps> = ({
    transactions,
    categories,
    budgets,
    debts = [],
    plans = [],
    isOffline = false,
    hasPendingWrites = false,
    pendingAttachmentCount = 0,
    showGettingStarted,
    isGettingStartedDismissed,
    activeAccountName,
    telegramLinked,
    onGoToTransactions,
    onGoToBudgets,
    onGoToDebts,
    onGoToSettings,
    onOpenOnboarding,
    onQuickAdd,
    onScanReceipt,
}) => {
    const { theme } = useTheme();
    const [hideBalance, setHideBalance] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('dompetcerdas_hide_balance') === 'true';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('dompetcerdas_hide_balance', hideBalance ? 'true' : 'false');
    }, [hideBalance]);

    const currentMonthKey = getMonthKey();
    const currentBudgetSummaries = useMemo(
        () => getBudgetSummaries(budgets, transactions, categories, currentMonthKey),
        [budgets, transactions, categories, currentMonthKey]
    );
    const currentBudgetOverview = useMemo(
        () => getBudgetOverview(currentBudgetSummaries),
        [currentBudgetSummaries]
    );

    const totalIncome = useMemo(() => transactions
        .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0),
        [transactions, categories]
    );
    const totalExpense = useMemo(() => transactions
        .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0),
        [transactions, categories]
    );
    const balance = totalIncome - totalExpense;

    const currentMonthIncome = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        return transactions
            .filter(t => {
                const [ty, tm] = t.date.split('-').map(Number);
                return ty === year && tm === month && categories.find(c => c.id === t.categoryId)?.type === 'INCOME';
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, categories, currentMonthKey]);

    const currentMonthExpense = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        return transactions
            .filter(t => {
                const [ty, tm] = t.date.split('-').map(Number);
                return ty === year && tm === month && categories.find(c => c.id === t.categoryId)?.type === 'EXPENSE';
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, categories, currentMonthKey]);

    const expenseByCategory = useMemo(() => categories
        .filter(c => c.type === 'EXPENSE')
        .map(cat => ({
            name: cat.name,
            value: transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0),
            color: cat.color,
            icon: cat.icon,
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value),
        [transactions, categories]
    );

    const recentTransactions = useMemo(() => [...transactions]
        .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        })
        .slice(0, 5),
        [transactions]
    );

    const formatSensitiveValue = (val: number) => hideBalance ? 'Rp ••••••' : formatRp(val);

    const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const attentionItems = useMemo(() => {
        const items: Array<{
            id: string;
            icon: string;
            title: string;
            description: string;
            severity: 'warning' | 'error' | 'info';
            action: () => void;
        }> = [];

        currentBudgetSummaries.forEach((summary) => {
            if (summary.percentage >= 90 && !summary.isOverBudget) {
                items.push({
                    id: `budget-warning-${summary.budget.id}`,
                    icon: 'AlertTriangle',
                    title: `Anggaran ${summary.budget.name} hampir habis`,
                    description: `${Math.min(summary.percentage, 100).toFixed(0)}% terpakai • sisa ${formatRp(summary.remaining)}`,
                    severity: 'warning',
                    action: onGoToBudgets,
                });
            }
            if (summary.isOverBudget) {
                items.push({
                    id: `budget-over-${summary.budget.id}`,
                    icon: 'AlertCircle',
                    title: `Anggaran ${summary.budget.name} melebihi batas`,
                    description: `Lebih ${formatRp(Math.abs(summary.remaining))} dari batas`,
                    severity: 'error',
                    action: onGoToBudgets,
                });
            }
        });

        debts.forEach((debt) => {
            if (debt.status !== 'PAID' && debt.dueDate) {
                const today = new Date().toISOString().split('T')[0];
                const dueDate = debt.dueDate;
                if (dueDate < today) {
                    items.push({
                        id: `debt-overdue-${debt.id}`,
                        icon: 'Clock',
                        title: `${debt.kind === 'DEBT' ? 'Hutang' : 'Piutang'} ${debt.personName} lewat jatuh tempo`,
                        description: `Sisa ${formatRp(debt.remainingAmount)} • jatuh tempo ${formatShortDate(debt.dueDate)}`,
                        severity: 'error',
                        action: onGoToDebts,
                    });
                }
            }
        });

        plans.forEach((plan) => {
            plan.items.forEach((item) => {
                if (item.status === 'PLANNED' && item.plannedDate) {
                    const today = new Date().toISOString().split('T')[0];
                    if (item.plannedDate === today) {
                        const cat = categories.find(c => c.id === item.categoryId);
                        items.push({
                            id: `plan-today-${plan.id}-${item.id}`,
                            icon: 'Calendar',
                            title: `Rencana: ${item.name}`,
                            description: `${item.type === 'EXPENSE' ? 'Keluar' : 'Masuk'} ${formatRp(item.amount)} • ${cat?.name || 'Tanpa kategori'}`,
                            severity: 'info',
                            action: onGoToTransactions,
                        });
                    }
                }
            });
        });

        return items.slice(0, 4);
    }, [currentBudgetSummaries, debts, plans, categories, onGoToBudgets, onGoToDebts, onGoToTransactions]);

    const gettingStartedItems = [
        { title: '1. Catat transaksi dulu', description: 'Mulai dari yang simpel, misalnya makan siang, parkir, atau gaji.', actionLabel: 'Buka Transaksi', action: onGoToTransactions, icon: 'BookOpen' },
        { title: '2. Buat anggaran kalau sudah rutin', description: 'Pilih kategori yang ingin dipantau, tidak perlu semua sekaligus.', actionLabel: 'Buka Anggaran', action: onGoToBudgets, icon: 'PiggyBank' },
        {
            title: telegramLinked ? '3. Telegram sudah siap' : '3. Hubungkan Telegram',
            description: telegramLinked ? 'Anda sudah bisa catat lewat chat atau voice note.' : 'Kalau ingin lebih cepat, hubungkan Telegram supaya input terasa natural.',
            actionLabel: telegramLinked ? 'Buka Pengaturan' : 'Hubungkan Sekarang',
            action: onGoToSettings,
            icon: 'Send',
        },
    ];

    const syncStatus = isOffline ? 'offline' : hasPendingWrites || pendingAttachmentCount > 0 ? 'pending' : 'synced';
    const syncLabel = isOffline ? 'Offline' : pendingAttachmentCount > 0 ? `${pendingAttachmentCount} upload tertunda` : undefined;

    return (
        <Box sx={{ pb: { xs: 12, md: 0 } }}>
            {/* Compact Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.1em' }}>
                            {currentDate.toUpperCase()}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                            Ringkasan Keuangan
                        </Typography>
                    </Box>
                    <SyncStatusChip status={syncStatus} label={syncLabel} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {activeAccountName}
                </Typography>
            </Box>

            {/* Getting Started Card */}
            {showGettingStarted && !isGettingStartedDismissed && (
                <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Chip
                            icon={<IconDisplay name="Sparkles" size={14} sx={{ color: theme.colors.accent }} />}
                            label="Mulai Dari Sini"
                            size="small"
                            sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}
                        />
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Biar {activeAccountName} cepat terisi
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Untuk user baru, langkah paling aman: catat transaksi dulu, lalu atur anggaran kalau sudah rutin.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {gettingStartedItems.map((item) => (
                                <Button
                                    key={item.title}
                                    size="small"
                                    variant="outlined"
                                    onClick={item.action}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {item.actionLabel}
                                </Button>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Attention Items */}
            {attentionItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.1em', mb: 1.5, display: 'block' }}>
                        Perlu Perhatian
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {attentionItems.map((item) => (
                            <Box
                                key={item.id}
                                onClick={item.action}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: item.severity === 'error' ? theme.colors.expenseBg : item.severity === 'warning' ? theme.colors.warningBg : theme.colors.infoBg,
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s',
                                    '&:hover': { transform: 'translateX(4px)' },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        bgcolor: item.severity === 'error' ? theme.colors.expense : item.severity === 'warning' ? theme.colors.warning : theme.colors.info,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <IconDisplay name={item.icon} size={20} sx={{ color: '#fff' }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        {item.description}
                                    </Typography>
                                </Box>
                                <IconDisplay name="ChevronRight" size={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Hero Balance Card - Compact */}
            <Card
                sx={{
                    mb: 3,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 8px 24px rgba(79,70,229,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
                <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                                Total Saldo
                            </Typography>
                            <Typography variant="h4" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatSensitiveValue(balance)}
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => setHideBalance((prev) => !prev)}
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.12)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                            }}
                            aria-label={hideBalance ? 'Tampilkan total saldo' : 'Sembunyikan total saldo'}
                        >
                            <IconDisplay name="Eye" size={18} sx={{ color: '#fff', opacity: hideBalance ? 0.7 : 1 }} />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, p: 2, backdropFilter: 'blur(12px)' }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <IconDisplay name="TrendingUp" size={14} sx={{ color: '#93c5fd' }} />
                                <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                                    Masuk bulan ini
                                </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={700}>
                                {formatSensitiveValue(currentMonthIncome)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <IconDisplay name="TrendingDown" size={14} sx={{ color: '#fca5a5' }} />
                                <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                                    Keluar bulan ini
                                </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight={700}>
                                {formatSensitiveValue(currentMonthExpense)}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.1em', mb: 1.5, display: 'block' }}>
                    Aksi Cepat
                </Typography>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Box
                            component="button"
                            onClick={() => onQuickAdd('EXPENSE')}
                            sx={{
                                width: '100%',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: theme.colors.expenseBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconDisplay name="TrendingDown" size={22} sx={{ color: theme.colors.expense }} />
                            </Box>
                            <Typography variant="body2" fontWeight={600}>Pengeluaran</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Box
                            component="button"
                            onClick={() => onQuickAdd('INCOME')}
                            sx={{
                                width: '100%',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: theme.colors.incomeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconDisplay name="TrendingUp" size={22} sx={{ color: theme.colors.income }} />
                            </Box>
                            <Typography variant="body2" fontWeight={600}>Pemasukan</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Box
                            component="button"
                            onClick={onScanReceipt}
                            sx={{
                                width: '100%',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: theme.colors.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconDisplay name="Sparkles" size={22} sx={{ color: theme.colors.accent }} />
                            </Box>
                            <Typography variant="body2" fontWeight={600}>Scan Struk</Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <Box
                            component="button"
                            onClick={onGoToTransactions}
                            sx={{
                                width: '100%',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
                            }}
                        >
                            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: theme.colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconDisplay name="BookOpen" size={22} sx={{ color: theme.colors.textSecondary }} />
                            </Box>
                            <Typography variant="body2" fontWeight={600}>Riwayat</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Budget Overview Mini */}
            {currentBudgetSummaries.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Anggaran Bulan Ini
                            </Typography>
                            <Button size="small" onClick={onGoToBudgets} sx={{ fontWeight: 600 }}>
                                Detail
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Terpakai
                                </Typography>
                                <Typography variant="h6" fontWeight={700} sx={{ color: theme.colors.expense }}>
                                    {formatRp(currentBudgetOverview.totalSpent)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    dari {formatRp(currentBudgetOverview.totalBudget)}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Sisa
                                </Typography>
                                <Typography variant="h6" fontWeight={700} sx={{ color: currentBudgetOverview.remaining >= 0 ? theme.colors.income : theme.colors.expense }}>
                                    {formatRp(currentBudgetOverview.remaining)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {currentBudgetOverview.activeBudgetCount} anggaran aktif
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Expense Chart */}
            {expenseByCategory.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Statistik Pengeluaran
                        </Typography>
                        <Suspense
                            fallback={(
                                <Box sx={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.secondary' }}>
                                    <IconDisplay name="PieChart" size={40} sx={{ opacity: 0.3 }} />
                                    <Typography variant="body2">Menyiapkan grafik pengeluaran...</Typography>
                                </Box>
                            )}
                        >
                            <DashboardExpenseChart
                                expenseByCategory={expenseByCategory}
                                totalExpense={totalExpense}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            )}

            {/* Recent Transactions */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Transaksi Terakhir
                    </Typography>
                    {transactions.length > 0 && (
                        <Button size="small" onClick={onGoToTransactions} sx={{ fontWeight: 600 }}>
                            Lihat semua
                        </Button>
                    )}
                </Box>

                {recentTransactions.length === 0 ? (
                    <Card sx={{ py: 6, textAlign: 'center' }}>
                        <IconDisplay name="Inbox" size={48} sx={{ color: theme.colors.textMuted, opacity: 0.3, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Belum ada transaksi di bulan ini.
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => onQuickAdd('EXPENSE')}
                            sx={{ mt: 1 }}
                        >
                            Catat transaksi pertama
                        </Button>
                    </Card>
                ) : (
                    <Card sx={{ overflow: 'hidden' }}>
                        {recentTransactions.map((t, idx) => {
                            const cat = categories.find(c => c.id === t.categoryId);
                            const isIncome = cat?.type === 'INCOME';
                            return (
                                <React.Fragment key={t.id}>
                                    {idx > 0 && <Box sx={{ height: 1, bgcolor: 'divider', mx: 2 }} />}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 2,
                                            '&:hover': { bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: '50%',
                                                bgcolor: cat?.color || theme.colors.bgHover,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <IconDisplay name={cat?.icon || 'HelpCircle'} size={20} sx={{ color: '#fff' }} />
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {t.description || t.date}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {cat?.name || 'Tanpa Kategori'} • {formatShortDate(t.date)}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            sx={{
                                                color: isIncome ? theme.colors.income : theme.colors.textPrimary,
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isIncome ? '+' : '-'}{formatRp(t.amount)}
                                        </Typography>
                                    </Box>
                                </React.Fragment>
                            );
                        })}
                    </Card>
                )}
            </Box>
        </Box>
    );
};

export default Dashboard;
