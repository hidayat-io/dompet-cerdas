import React, { useEffect, useState } from 'react';
import { Category, Plan, PlanItem, PlanItemStatus, TransactionType } from '../types';
import IconDisplay from './IconDisplay';
import ConfirmDialog from './ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';

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

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

type DeleteTarget =
    | { type: 'plan'; planId: string; title: string }
    | { type: 'item'; planId: string; itemId: string; title: string };

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
        if (!availableCategories.length) {
            setNewItemCategory('');
            return;
        }

        const categoryStillValid = availableCategories.some((category) => category.id === newItemCategory);
        if (!categoryStillValid) {
            setNewItemCategory(availableCategories[0].id);
        }
    }, [categories, newItemCategory, newItemType]);

    useEffect(() => {
        const availableCategories = categories.filter((category) => category.type === editItemType);
        if (!availableCategories.length) {
            setEditItemCategory('');
            return;
        }

        const categoryStillValid = availableCategories.some((category) => category.id === editItemCategory);
        if (!categoryStillValid) {
            setEditItemCategory(availableCategories[0].id);
        }
    }, [categories, editItemCategory, editItemType]);

    const getStatusStyles = (status: PlanItemStatus) => {
        if (status === 'DONE') {
            return { backgroundColor: theme.colors.incomeBg, color: theme.colors.income };
        }
        if (status === 'CANCELLED') {
            return { backgroundColor: theme.colors.expenseBg, color: theme.colors.expense };
        }
        return { backgroundColor: theme.colors.accentLight, color: theme.colors.accent };
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
            if (activePlanId === deleteTarget.planId) {
                setActivePlanId(null);
            }
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
                <div className="space-y-2">
                    <p>
                        {deleteTarget.type === 'plan' ? 'Rencana' : 'Item rencana'} <strong>"{deleteTarget.title}"</strong> akan dihapus.
                    </p>
                    <p className="text-sm opacity-80">
                        {deleteTarget.type === 'plan'
                            ? 'Semua item di dalam rencana ini juga akan ikut terhapus.'
                            : 'Tindakan ini tidak bisa dibatalkan.'}
                    </p>
                </div>
            ) : ''}
            confirmText="Hapus"
            type="danger"
        />
    );

    if (activePlanId) {
        const plan = plans.find((currentPlan) => currentPlan.id === activePlanId);
        if (!plan) {
            return <div onClick={() => setActivePlanId(null)}>Rencana tidak ditemukan. Kembali.</div>;
        }

        const useMonthBalance = !!plan.useCurrentMonthBalance;
        const baseBalance = useMonthBalance ? currentMonthBalance : currentBalance;
        const plannedItems = plan.items.filter((item) => item.status === 'PLANNED');
        const completedItems = plan.items.filter((item) => item.status === 'DONE');
        const cancelledItems = plan.items.filter((item) => item.status === 'CANCELLED');

        const planIncome = plannedItems
            .filter((item) => item.type === 'INCOME')
            .reduce((acc, item) => acc + item.amount, 0);
        const planExpense = plannedItems
            .filter((item) => item.type === 'EXPENSE')
            .reduce((acc, item) => acc + item.amount, 0);
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
            <div className="space-y-6 animate-fade-in-up pb-20">
                <button
                    onClick={() => setActivePlanId(null)}
                    className="flex items-center transition-colors"
                    style={{ color: theme.colors.textMuted }}
                >
                    <IconDisplay name="ArrowRight" className="transform rotate-180 mr-1" size={16} /> Kembali ke Daftar
                </button>

                <div
                    className="rounded-2xl p-6 shadow-sm border"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                >
                    <h2 className="text-2xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>{plan.title}</h2>
                    <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                        Rencana ini tidak mengubah saldo utama sampai item dijadikan transaksi.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div
                            className="p-4 rounded-xl border"
                            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                        >
                            <p className="text-xs uppercase font-medium" style={{ color: theme.colors.textMuted }}>Efek Rencana Aktif</p>
                            <p className="text-lg font-bold" style={{ color: planTotal >= 0 ? theme.colors.income : theme.colors.expense }}>
                                {planTotal > 0 ? '+' : ''}{formatRp(planTotal)}
                            </p>
                        </div>
                        <div
                            className="p-4 rounded-xl border opacity-70"
                            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                        >
                            <p className="text-xs uppercase font-medium" style={{ color: theme.colors.textMuted }}>Saldo Sekarang</p>
                            <p className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>{formatRp(currentBalance)}</p>
                        </div>
                        <div
                            className="p-4 rounded-xl border"
                            style={{ backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent }}
                        >
                            <p className="text-xs uppercase font-bold" style={{ color: theme.colors.accent }}>Saldo Proyeksi</p>
                            <p className="text-lg font-bold" style={{ color: theme.colors.accent }}>{formatRp(projectedBalance)}</p>
                        </div>
                        <div
                            className="p-4 rounded-xl border"
                            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                        >
                            <p className="text-xs uppercase font-medium" style={{ color: theme.colors.textMuted }}>Status Item</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="px-2.5 py-1 rounded-full" style={getStatusStyles('PLANNED')}>
                                    {plannedItems.length} aktif
                                </span>
                                <span className="px-2.5 py-1 rounded-full" style={getStatusStyles('DONE')}>
                                    {completedItems.length} selesai
                                </span>
                                <span className="px-2.5 py-1 rounded-full" style={getStatusStyles('CANCELLED')}>
                                    {cancelledItems.length} batal
                                </span>
                            </div>
                        </div>
                    </div>

                    <label
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer hover:bg-opacity-70 transition-all mt-4"
                        style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                    >
                        <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Hitung dari saldo bulan ini</p>
                            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                Proyeksi rencana dihitung dari saldo bulan berjalan ({formatRp(currentMonthBalance)})
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={useMonthBalance}
                            onChange={(e) => onUpdatePlanSettings(plan.id, e.target.checked)}
                            className="w-5 h-5"
                            style={{ accentColor: theme.colors.accent }}
                        />
                    </label>
                </div>

                <button
                    onClick={() => {
                        setNewItemName('');
                        setNewItemAmount('');
                        setNewItemType('EXPENSE');
                        setNewItemCategory('');
                        setNewItemPlannedDate('');
                        setShowAddModal(true);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-dashed transition-all hover:border-solid flex items-center justify-center gap-2 font-medium"
                    style={{
                        borderColor: theme.colors.accent,
                        color: theme.colors.accent,
                        backgroundColor: theme.colors.accentLight,
                    }}
                >
                    <IconDisplay name="Plus" size={20} />
                    Tambah Item Rencana
                </button>

                <div className="space-y-3">
                    {sortedItems.length === 0 ? (
                        <div className="text-center py-10" style={{ color: theme.colors.textMuted }}>
                            <IconDisplay name="CalendarDays" size={40} className="mx-auto mb-2 opacity-20" />
                            <p>Belum ada item di rencana ini.</p>
                        </div>
                    ) : (
                        sortedItems.map((item) => {
                            const category = categories.find((entry) => entry.id === item.categoryId);

                            return (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-xl border group"
                                    style={{
                                        backgroundColor: theme.colors.bgCard,
                                        borderColor: theme.colors.border,
                                        opacity: item.status === 'CANCELLED' ? 0.7 : 1,
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${category ? '' : 'bg-gray-300'}`}
                                                style={{ backgroundColor: category?.color }}
                                            >
                                                <IconDisplay name={category?.icon || 'HelpCircle'} size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <p className="font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                                                        {category?.name || 'Tanpa Kategori'}
                                                    </p>
                                                    <span
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                                        style={getStatusStyles(item.status)}
                                                    >
                                                        {STATUS_LABELS[item.status]}
                                                    </span>
                                                </div>
                                                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{item.name}</p>
                                                <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: theme.colors.textMuted }}>
                                                    <IconDisplay name="Calendar" size={12} />
                                                    <span>{formatDateLabel(item.plannedDate)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {item.status === 'PLANNED' && (
                                                <>
                                                    <button
                                                        onClick={() => openApplyModal(item)}
                                                        className="p-2 rounded-lg text-xs font-medium flex items-center gap-1"
                                                        title="Jadikan Transaksi"
                                                        style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                                                    >
                                                        <IconDisplay name="Save" size={14} />
                                                        <span className="hidden sm:inline">Jadikan Transaksi</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onUpdatePlanItemStatus(plan.id, item.id, 'CANCELLED')}
                                                        className="p-2 rounded-lg transition-colors"
                                                        title="Batalkan item ini"
                                                        style={{ backgroundColor: theme.colors.expenseBg, color: theme.colors.expense }}
                                                    >
                                                        <IconDisplay name="XCircle" size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {item.status !== 'PLANNED' && (
                                                <button
                                                    onClick={() => onUpdatePlanItemStatus(plan.id, item.id, 'PLANNED')}
                                                    className="p-2 rounded-lg transition-colors"
                                                    title="Aktifkan lagi"
                                                    style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                                >
                                                    <IconDisplay name="RefreshCw" size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                                title="Edit item"
                                            >
                                                <IconDisplay name="Edit" size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget({
                                                    type: 'item',
                                                    planId: plan.id,
                                                    itemId: item.id,
                                                    title: item.name,
                                                })}
                                                className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                                                title="Hapus item"
                                            >
                                                <IconDisplay name="Trash2" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pl-[52px]">
                                        <span className="font-bold text-lg" style={{ color: item.type === 'INCOME' ? theme.colors.income : theme.colors.expense }}>
                                            {item.type === 'INCOME' ? '+' : '-'}{formatRp(item.amount)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {applyModalOpen && itemToApply && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>Jadikan Transaksi</h3>
                            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                                Item <strong>{itemToApply.name}</strong> ({formatRp(itemToApply.amount)}) akan dicatat sebagai transaksi nyata. Pilih tanggalnya:
                            </p>
                            <input
                                type="date"
                                value={applyDate}
                                onChange={(e) => setApplyDate(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg mb-4 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setApplyModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium"
                                    style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleConfirmApply}
                                    className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                                    style={{ backgroundColor: theme.colors.accent }}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {editingItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>Edit Item Rencana</h3>
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Tipe</label>
                                    <div className="flex p-1 rounded-lg" style={{ backgroundColor: theme.colors.bgHover }}>
                                        <button
                                            type="button"
                                            onClick={() => setEditItemType('EXPENSE')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: editItemType === 'EXPENSE' ? theme.colors.bgCard : 'transparent',
                                                color: editItemType === 'EXPENSE' ? theme.colors.expense : theme.colors.textMuted,
                                                boxShadow: editItemType === 'EXPENSE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            }}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditItemType('INCOME')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: editItemType === 'INCOME' ? theme.colors.bgCard : 'transparent',
                                                color: editItemType === 'INCOME' ? theme.colors.income : theme.colors.textMuted,
                                                boxShadow: editItemType === 'INCOME' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            }}
                                        >
                                            Pemasukan
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Nama Item</label>
                                    <input
                                        type="text"
                                        value={editItemName}
                                        onChange={(e) => setEditItemName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Jumlah</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-sm" style={{ color: theme.colors.textMuted }}>Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={editItemAmount}
                                            onChange={(e) => setEditItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-semibold outline-none"
                                            style={{
                                                backgroundColor: theme.colors.bgHover,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.textPrimary,
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Kategori</label>
                                    <select
                                        value={editItemCategory}
                                        onChange={(e) => setEditItemCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                        required
                                    >
                                        {categories.filter((category) => category.type === editItemType).map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Tanggal Rencana</label>
                                    <input
                                        type="date"
                                        value={editItemPlannedDate}
                                        onChange={(e) => setEditItemPlannedDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Status</label>
                                    <select
                                        value={editItemStatus}
                                        onChange={(e) => setEditItemStatus(e.target.value as PlanItemStatus)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                    >
                                        <option value="PLANNED">Direncanakan</option>
                                        <option value="DONE">Sudah Dicatat</option>
                                        <option value="CANCELLED">Dibatalkan</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingItem(null)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                                        style={{ backgroundColor: theme.colors.accent }}
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>Tambah Item Rencana</h3>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Tipe</label>
                                    <div className="flex p-1 rounded-lg" style={{ backgroundColor: theme.colors.bgHover }}>
                                        <button
                                            type="button"
                                            onClick={() => setNewItemType('EXPENSE')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: newItemType === 'EXPENSE' ? theme.colors.bgCard : 'transparent',
                                                color: newItemType === 'EXPENSE' ? theme.colors.expense : theme.colors.textMuted,
                                                boxShadow: newItemType === 'EXPENSE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            }}
                                        >
                                            Pengeluaran
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewItemType('INCOME')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: newItemType === 'INCOME' ? theme.colors.bgCard : 'transparent',
                                                color: newItemType === 'INCOME' ? theme.colors.income : theme.colors.textMuted,
                                                boxShadow: newItemType === 'INCOME' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            }}
                                        >
                                            Pemasukan
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Nama Item</label>
                                    <input
                                        type="text"
                                        placeholder="mis: Tiket liburan"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Jumlah</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-sm" style={{ color: theme.colors.textMuted }}>Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={newItemAmount}
                                            onChange={(e) => setNewItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-semibold outline-none"
                                            style={{
                                                backgroundColor: theme.colors.bgHover,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.textPrimary,
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Kategori</label>
                                    <select
                                        value={newItemCategory}
                                        onChange={(e) => setNewItemCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                        required
                                    >
                                        <option value="">Pilih Kategori...</option>
                                        {filteredCategories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Tanggal Rencana</label>
                                    <input
                                        type="date"
                                        value={newItemPlannedDate}
                                        onChange={(e) => setNewItemPlannedDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary,
                                        }}
                                    />
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white rounded-lg text-sm font-medium"
                                        style={{ backgroundColor: theme.colors.accent }}
                                    >
                                        Tambah Item
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {deleteDialog}
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 pb-20 animate-fade-in-up">
                <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Rencana</h2>
                    <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                        Siapkan pemasukan dan pengeluaran berikutnya tanpa langsung mengubah saldo.
                    </p>
                </div>
                </div>

                <form
                    onSubmit={handleCreate}
                    className="p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-3"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                >
                    <input
                        type="text"
                        placeholder="Judul rencana baru (mis: Liburan Bali)"
                        className="flex-1 px-4 py-2.5 border rounded-lg outline-none"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                        style={{
                            backgroundColor: theme.colors.bgHover,
                            borderColor: theme.colors.border,
                            color: theme.colors.textPrimary,
                        }}
                    />
                    <button
                        type="submit"
                        className="text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                        style={{ backgroundColor: theme.colors.accent }}
                        disabled={!newPlanTitle.trim()}
                    >
                        Buat Rencana
                    </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.length === 0 ? (
                        <div
                            className="col-span-full text-center py-12 rounded-2xl border border-dashed"
                            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                        >
                            <IconDisplay name="CalendarDays" size={48} className="mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                            <p className="font-medium" style={{ color: theme.colors.textSecondary }}>Belum ada rencana.</p>
                            <p className="text-sm" style={{ color: theme.colors.textMuted }}>Buat rencana keuanganmu sekarang.</p>
                        </div>
                    ) : (
                        plans.map((plan) => {
                            const plannedItems = plan.items.filter((item) => item.status === 'PLANNED');
                            const total = plannedItems.reduce((acc, item) => (
                                item.type === 'INCOME' ? acc + item.amount : acc - item.amount
                            ), 0);
                            const doneCount = plan.items.filter((item) => item.status === 'DONE').length;
                            const useMonthBalance = !!plan.useCurrentMonthBalance;

                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setActivePlanId(plan.id)}
                                    className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: theme.colors.accent }} />
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-8">
                                            <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.textPrimary }}>{plan.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium">
                                                {useMonthBalance && (
                                                    <div className="flex items-center gap-1.5" style={{ color: theme.colors.accent }}>
                                                        <IconDisplay name="Calendar" size={12} />
                                                        <span>Saldo bulan ini</span>
                                                    </div>
                                                )}
                                                <span
                                                    className="px-2 py-1 rounded-full"
                                                    style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                                                >
                                                    {plannedItems.length} aktif
                                                </span>
                                                {doneCount > 0 && (
                                                    <span
                                                        className="px-2 py-1 rounded-full"
                                                        style={{ backgroundColor: theme.colors.incomeBg, color: theme.colors.income }}
                                                    >
                                                        {doneCount} selesai
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget({ type: 'plan', planId: plan.id, title: plan.title });
                                            }}
                                            className="text-gray-300 hover:text-red-500 p-1 absolute top-4 right-4 z-10 hover:scale-110 transition-transform"
                                            title="Hapus rencana"
                                        >
                                            <IconDisplay name="Trash2" size={18} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <span
                                            className="text-xs px-2 py-1 rounded-md"
                                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                                        >
                                            {plan.items.length} item
                                        </span>
                                        <div className="text-right">
                                            <p className="text-xs uppercase" style={{ color: theme.colors.textMuted }}>Efek Rencana Aktif</p>
                                            <p className="font-bold text-lg" style={{ color: total >= 0 ? theme.colors.income : theme.colors.expense }}>
                                                {total > 0 ? '+' : ''}{formatRp(total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {deleteDialog}
        </>
    );
};

export default PlanManager;
