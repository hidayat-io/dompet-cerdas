import React, { useMemo, useState } from 'react';
import { Budget, Category, Transaction } from '../types';
import IconDisplay from './IconDisplay';
import ConfirmDialog from './ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';
import { getBudgetOverview, getBudgetSummaries, getBudgetTransactions, getMonthKey, getMonthLabel, getPreviousMonthKey } from '../utils/budget';

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
            if (draft.budgetId === budgetId) {
                resetForm();
            }
            if (activeBudgetId === budgetId) {
                setActiveBudgetId(null);
            }
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
    const deleteDialog = (
        <ConfirmDialog
            isOpen={!!budgetToDelete}
            onClose={() => !deletingBudgetId && setBudgetToDelete(null)}
            onConfirm={handleConfirmDeleteBudget}
            title="Hapus Anggaran"
            message={budgetToDelete ? (
                <div className="space-y-2">
                    <p>
                        Anggaran <strong>"{budgetToDelete.name}"</strong> akan dihapus.
                    </p>
                    <p className="text-sm opacity-80">
                        Transaksi yang sudah tercatat tidak ikut terhapus.
                    </p>
                </div>
            ) : ''}
            confirmText="Hapus"
            type="danger"
            isLoading={!!deletingBudgetId}
        />
    );
    const budgetFormModal = showForm ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
                className="rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                                {draft.budgetId ? 'Edit Anggaran' : 'Anggaran Baru'}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                                Pilih kategori yang memang ingin dipantau. Kategori yang sudah dipakai anggaran lain tidak akan muncul di sini.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                        >
                            <IconDisplay name="X" size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 mt-5">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                                Nama Anggaran
                            </label>
                            <input
                                type="text"
                                value={draft.name}
                                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                                placeholder="Mis: Makan Harian"
                                className="w-full rounded-xl border px-4 py-3 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                                Batas Pengeluaran
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-sm" style={{ color: theme.colors.textMuted }}>Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={draft.limitAmount}
                                    onChange={(event) => setDraft((currentDraft) => ({
                                        ...currentDraft,
                                        limitAmount: formatRupiahInput(event.target.value),
                                    }))}
                                    placeholder="0"
                                    className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.textPrimary }}>
                            {draft.budgetId ? 'Kategori dalam Anggaran' : 'Pilih Kategori'}
                        </label>
                        {availableCategories.length === 0 ? (
                            <div
                                className="rounded-xl border border-dashed px-4 py-5 text-sm"
                                style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                            >
                                Semua kategori pengeluaran di bulan ini sudah dipakai anggaran lain.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {availableCategories.map((category) => {
                                    const selected = draft.categoryIds.includes(category.id);
                                    return (
                                        <button
                                            type="button"
                                            key={category.id}
                                            onClick={() => toggleCategory(category.id)}
                                            className="rounded-2xl border p-4 text-left transition-all"
                                            style={{
                                                backgroundColor: selected ? theme.colors.accentLight : theme.colors.bgHover,
                                                borderColor: selected ? theme.colors.accent : theme.colors.border,
                                                color: theme.colors.textPrimary,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    <IconDisplay name={category.icon} size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{category.name}</p>
                                                    <p className="text-xs mt-1" style={{ color: selected ? theme.colors.accent : theme.colors.textMuted }}>
                                                        {selected ? 'Dipilih' : 'Pilih kategori'}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-3 rounded-xl text-sm font-semibold"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !draft.name.trim() || !Number(draft.limitAmount.replace(/\./g, '')) || draft.categoryIds.length === 0}
                            className="px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            {saving ? 'Menyimpan...' : draft.budgetId ? 'Update Anggaran' : 'Simpan Anggaran'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;

    if (activeSummary) {
        return (
            <div className="space-y-6 pb-20 animate-fade-in-up">
                <div>
                    <button
                        onClick={() => setActiveBudgetId(null)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shadow-sm transition-colors"
                        style={{
                            backgroundColor: theme.colors.bgCard,
                            borderColor: theme.colors.border,
                            color: theme.colors.accent,
                        }}
                    >
                        <IconDisplay name="ArrowLeft" size={16} />
                        <span>Kembali ke Daftar Anggaran</span>
                    </button>
                </div>

                <div
                    className="rounded-2xl border p-6"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                {activeSummary.budget.name}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                                Menampilkan transaksi yang masuk ke anggaran ini di {getMonthLabel(selectedMonth)}.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {activeSummary.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => openEditForm(activeSummary.budget)}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setBudgetToDelete(activeSummary.budget)}
                                disabled={deletingBudgetId === activeSummary.budget.id}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.expense }}
                            >
                                {deletingBudgetId === activeSummary.budget.id ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}>
                            <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Batas Anggaran</p>
                            <p className="mt-2 text-lg font-bold" style={{ color: theme.colors.textPrimary }}>{formatRp(activeSummary.budget.limitAmount)}</p>
                        </div>
                        <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}>
                            <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Sudah Terpakai</p>
                            <p className="mt-2 text-lg font-bold" style={{ color: theme.colors.expense }}>{formatRp(activeTransactionsTotal)}</p>
                        </div>
                        <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}>
                            <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Sisa Anggaran</p>
                            <p className="mt-2 text-lg font-bold" style={{ color: activeSummary.remaining >= 0 ? theme.colors.income : theme.colors.expense }}>
                                {formatRp(activeSummary.remaining)}
                            </p>
                        </div>
                        <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}>
                            <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Jumlah Transaksi</p>
                            <p className="mt-2 text-lg font-bold" style={{ color: theme.colors.textPrimary }}>{activeBudgetTransactions.length}</p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-center justify-between text-xs mb-2" style={{ color: theme.colors.textMuted }}>
                            <span>{Math.min(activeSummary.percentage, 100).toFixed(0)}% terpakai</span>
                            <span>{activeSummary.isOverBudget ? 'Melebihi Anggaran' : 'Masih aman'}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.bgHover }}>
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(activeSummary.percentage, 100)}%`,
                                    backgroundColor: activeSummary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div
                    className="rounded-2xl border p-5"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                >
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                                Transaksi dalam Anggaran
                            </h3>
                            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                                Transaksi yang dihitung ke anggaran ini pada {getMonthLabel(selectedMonth)}.
                            </p>
                        </div>
                        <div
                            className="px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                        >
                            {activeBudgetTransactions.length} transaksi
                        </div>
                    </div>

                    {activeBudgetTransactions.length === 0 ? (
                        <div
                            className="rounded-2xl border border-dashed p-8 text-center"
                            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                        >
                            <IconDisplay name="Receipt" size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Belum ada transaksi yang masuk ke anggaran ini.</p>
                            <p className="text-sm mt-2">Tambah transaksi dengan kategori yang termasuk di anggaran ini agar progress-nya terisi.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeBudgetTransactions.map(({ transaction, category }) => (
                                <div
                                    key={transaction.id}
                                    className="rounded-2xl border p-4"
                                    style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
                                                style={{ backgroundColor: category?.color || theme.colors.accent }}
                                            >
                                                <IconDisplay name={category?.icon || 'Receipt'} size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                                                    {transaction.description || 'Tanpa deskripsi'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: theme.colors.textMuted }}>
                                                    <span>{formatTransactionDate(transaction.date)}</span>
                                                    <span>•</span>
                                                    <span>{category?.name || 'Tanpa Kategori'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold whitespace-nowrap" style={{ color: theme.colors.expense }}>
                                            {formatRp(transaction.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {budgetFormModal}
                {deleteDialog}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Anggaran</h2>
                    <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                        Buat anggaran yang memang ingin dipantau. Satu anggaran bisa berisi satu atau beberapa kategori.
                    </p>
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: theme.colors.textMuted }}>
                        Bulan Anggaran
                    </label>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMonth((currentMonth) => shiftMonth(currentMonth, -1));
                                setShowForm(false);
                                setDraft(emptyDraft);
                            }}
                            className="h-12 w-12 rounded-xl border flex items-center justify-center shrink-0"
                            style={{
                                backgroundColor: theme.colors.bgCard,
                                borderColor: theme.colors.border,
                                color: theme.colors.textPrimary,
                            }}
                            aria-label="Bulan sebelumnya"
                        >
                            <IconDisplay name="ArrowLeft" size={18} />
                        </button>
                        <div
                            className="min-w-0 flex-1 md:w-[220px] rounded-xl border px-4 py-3"
                            style={{
                                backgroundColor: theme.colors.bgCard,
                                borderColor: theme.colors.border,
                                color: theme.colors.textPrimary,
                            }}
                        >
                            <p className="text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                                {getMonthLabel(selectedMonth)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                                {selectedMonth}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedMonth((currentMonth) => shiftMonth(currentMonth, 1));
                                setShowForm(false);
                                setDraft(emptyDraft);
                            }}
                            className="h-12 w-12 rounded-xl border flex items-center justify-center shrink-0"
                            style={{
                                backgroundColor: theme.colors.bgCard,
                                borderColor: theme.colors.border,
                                color: theme.colors.textPrimary,
                            }}
                            aria-label="Bulan berikutnya"
                        >
                            <IconDisplay name="ArrowRight" size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}>
                    <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Total Anggaran</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: theme.colors.textPrimary }}>{formatRp(overview.totalBudget)}</p>
                </div>
                <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}>
                    <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Sudah Terpakai</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: theme.colors.expense }}>{formatRp(overview.totalSpent)}</p>
                </div>
                <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}>
                    <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Sisa Anggaran</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: overview.remaining >= 0 ? theme.colors.income : theme.colors.expense }}>
                        {formatRp(overview.remaining)}
                    </p>
                </div>
                <div className="rounded-2xl border p-5" style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}>
                    <p className="text-xs uppercase font-semibold" style={{ color: theme.colors.textMuted }}>Status</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: overview.overBudgetCount > 0 ? theme.colors.expense : theme.colors.textPrimary }}>
                        {overview.overBudgetCount > 0 ? `${overview.overBudgetCount} lewat` : 'Aman'}
                    </p>
                    <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
                        {overview.activeBudgetCount} anggaran aktif di {getMonthLabel(selectedMonth)}
                    </p>
                </div>
            </div>

            <div
                className="rounded-2xl border p-5"
                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                            Anggaran {getMonthLabel(selectedMonth)}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                            Pemakaian bulan ini dihitung dari transaksi di {getMonthLabel(selectedMonth)}. Saat pindah bulan, pemakaian mulai dari 0 lagi.
                        </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3 w-full md:w-auto">
                        <button
                            onClick={handleCopyPreviousMonth}
                            disabled={copying || previousMonthBudgetCount === 0}
                            className="w-full sm:w-64 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 text-center"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                        >
                            {copying ? 'Menyalin...' : `Salin ${getMonthLabel(previousMonth)}`}
                        </button>
                        <button
                            onClick={openCreateForm}
                            className="w-full sm:w-64 px-4 py-3 rounded-xl text-sm font-semibold text-white text-center"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            Buat Anggaran
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mt-5">
                    {summaries.length === 0 ? (
                        <div
                            className="rounded-2xl border border-dashed p-8 text-center"
                            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                        >
                            <IconDisplay name="PiggyBank" size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Belum ada anggaran di {getMonthLabel(selectedMonth)}.</p>
                            <p className="text-sm mt-2">Mulai dengan membuat anggaran untuk kategori yang memang ingin dipantau.</p>
                        </div>
                    ) : (
                        summaries.map((summary) => (
                            <div
                                key={summary.budget.id}
                                className="rounded-2xl border p-5"
                                style={{
                                    backgroundColor: summary.isOverBudget ? theme.colors.expenseBg : theme.colors.bgHover,
                                    borderColor: summary.isOverBudget ? `${theme.colors.expense}33` : theme.colors.border,
                                }}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-lg" style={{ color: theme.colors.textPrimary }}>
                                                    {summary.budget.name}
                                                </h4>
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: summary.isOverBudget ? theme.colors.bgCard : theme.colors.accentLight,
                                                    color: summary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                                }}
                                            >
                                                {summary.isOverBudget ? 'Melebihi Anggaran' : `${Math.min(summary.percentage, 100).toFixed(0)}% terpakai`}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                                            Anggaran {formatRp(summary.budget.limitAmount)} • Terpakai {formatRp(summary.spent)} • Sisa {formatRp(summary.remaining)}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {summary.categories.map((category) => (
                                                <span
                                                    key={category.id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.textSecondary }}
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: category.color }}
                                                    />
                                                    {category.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => setActiveBudgetId(summary.budget.id)}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                                            style={{ backgroundColor: theme.colors.accent }}
                                        >
                                            Lihat Detail
                                        </button>
                                        <button
                                            onClick={() => openEditForm(summary.budget)}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                            style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.textPrimary }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setBudgetToDelete(summary.budget)}
                                            disabled={deletingBudgetId === summary.budget.id}
                                            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                                            style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.expense }}
                                        >
                                            {deletingBudgetId === summary.budget.id ? 'Menghapus...' : 'Hapus'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: theme.colors.textMuted }}>
                                        <span>{Math.min(summary.percentage, 100).toFixed(0)}% terpakai</span>
                                        <span>{summary.isOverBudget ? 'Perlu perhatian' : 'Masih aman'}</span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.bgCard }}>
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(summary.percentage, 100)}%`,
                                                backgroundColor: summary.isOverBudget ? theme.colors.expense : theme.colors.accent,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </div>
            {budgetFormModal}
            {deleteDialog}
        </div>
    );
};

export default BudgetManager;
