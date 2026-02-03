import React, { useState } from 'react';
import { Simulation, SimulationItem, Category, TransactionType } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

interface SimulationManagerProps {
    simulations: Simulation[];
    categories: Category[];
    currentBalance: number;
    currentMonthBalance: number;
    onCreateSimulation: (title: string) => void;
    onDeleteSimulation: (id: string) => void;
    onAddSimulationItem: (simId: string, item: Omit<SimulationItem, 'id'>) => void;
    onUpdateSimulationItem: (simId: string, itemId: string, item: Omit<SimulationItem, 'id'>) => void;
    onDeleteSimulationItem: (simId: string, itemId: string) => void;
    onApplyItemToReal: (item: SimulationItem, date: string) => void;
    onUpdateSimulationSettings: (simId: string, useCurrentMonthBalance: boolean) => void;
}

const SimulationManager: React.FC<SimulationManagerProps> = ({
    simulations,
    categories,
    currentBalance,
    currentMonthBalance,
    onCreateSimulation,
    onDeleteSimulation,
    onAddSimulationItem,
    onUpdateSimulationItem,
    onDeleteSimulationItem,
    onApplyItemToReal,
    onUpdateSimulationSettings
}) => {
    const { theme } = useTheme();
    const [activeSimId, setActiveSimId] = useState<string | null>(null);
    const [newSimTitle, setNewSimTitle] = useState('');

    // State untuk form item baru di dalam simulasi
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [newItemType, setNewItemType] = useState<TransactionType>('EXPENSE');
    const [newItemCategory, setNewItemCategory] = useState('');

    // State untuk Modal Apply to Real
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [itemToApply, setItemToApply] = useState<SimulationItem | null>(null);
    const [applyDate, setApplyDate] = useState(new Date().toISOString().split('T')[0]);

    // State untuk Edit Item
    const [editingItem, setEditingItem] = useState<SimulationItem | null>(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemAmount, setEditItemAmount] = useState('');
    const [editItemType, setEditItemType] = useState<TransactionType>('EXPENSE');
    const [editItemCategory, setEditItemCategory] = useState('');

    // State untuk Add Item Modal
    const [showAddModal, setShowAddModal] = useState(false);

    // Format Helper
    const formatRp = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

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
        return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    };

    // Handlers
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSimTitle.trim()) {
            onCreateSimulation(newSimTitle);
            setNewSimTitle('');
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSimId || !newItemName || !newItemAmount) return;

        const amount = parseInt(newItemAmount.replace(/\./g, ''), 10);
        onAddSimulationItem(activeSimId, {
            name: newItemName,
            amount,
            type: newItemType,
            categoryId: newItemCategory || categories[0]?.id // Default to first cat if not selected
        });

        setNewItemName('');
        setNewItemAmount('');
        setShowAddModal(false);
    };

    const openApplyModal = (item: SimulationItem) => {
        setItemToApply(item);
        setApplyDate(new Date().toISOString().split('T')[0]);
        setApplyModalOpen(true);
    };

    const handleConfirmApply = () => {
        if (itemToApply && applyDate) {
            onApplyItemToReal(itemToApply, applyDate);
            setApplyModalOpen(false);
            setItemToApply(null);
        }
    };

    const handleEditClick = (item: SimulationItem) => {
        setEditingItem(item);
        setEditItemName(item.name);
        setEditItemAmount(formatRupiahInput(item.amount.toString()));
        setEditItemType(item.type);
        setEditItemCategory(item.categoryId);
    };

    const handleUpdateItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSimId || !editingItem) return;

        const amount = parseInt(editItemAmount.replace(/\./g, ''), 10);
        onUpdateSimulationItem(activeSimId, editingItem.id, {
            name: editItemName,
            amount,
            type: editItemType,
            categoryId: editItemCategory
        });

        setEditingItem(null);
        setEditItemName('');
        setEditItemAmount('');
    };

    // --- Render ---

    // VIEW 1: Detail Simulasi (Active)
    if (activeSimId) {
        const sim = simulations.find(s => s.id === activeSimId);
        if (!sim) return <div onClick={() => setActiveSimId(null)}>Simulasi tidak ditemukan. Kembali.</div>;

        const useMonthBalance = !!sim.useCurrentMonthBalance;
        const baseBalance = useMonthBalance ? currentMonthBalance : currentBalance;

        const simIncome = sim.items.filter(i => i.type === 'INCOME').reduce((acc, i) => acc + i.amount, 0);
        const simExpense = sim.items.filter(i => i.type === 'EXPENSE').reduce((acc, i) => acc + i.amount, 0);
        const simTotal = simIncome - simExpense;
        const projectedBalance = baseBalance + simTotal;

        const filteredCategories = categories.filter(c => c.type === newItemType);

        return (
            <div className="space-y-6 animate-fade-in-up pb-20">
                <button
                    onClick={() => setActiveSimId(null)}
                    className="flex items-center transition-colors"
                    style={{ color: theme.colors.textMuted }}
                >
                    <IconDisplay name="ArrowRight" className="transform rotate-180 mr-1" size={16} /> Kembali ke Daftar
                </button>

                {/* Header Simulasi */}
                <div
                    className="rounded-2xl p-6 shadow-sm border"
                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                >
                    <h2 className="text-2xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>{sim.title}</h2>
                    <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>Mode Simulasi: Angka di sini tidak mempengaruhi saldo utama sampai Anda menerapkannya.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            className="p-4 rounded-xl border"
                            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                        >
                            <p className="text-xs uppercase font-medium" style={{ color: theme.colors.textMuted }}>Total Simulasi</p>
                            <p className="text-lg font-bold" style={{ color: simTotal >= 0 ? theme.colors.income : theme.colors.expense }}>
                                {simTotal > 0 ? '+' : ''}{formatRp(simTotal)}
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
                    </div>

                    {/* Toggle: Gunakan Saldo Bulan Ini */}
                    <label
                        className="flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer hover:bg-opacity-70 transition-all mt-4"
                        style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                    >
                        <div>
                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Gunakan saldo bulan ini saja</p>
                            <p className="text-xs" style={{ color: theme.colors.textMuted }}>Proyeksi simulasi dihitung dari saldo bulan berjalan ({formatRp(currentMonthBalance)})</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={useMonthBalance}
                            onChange={e => onUpdateSimulationSettings(sim.id, e.target.checked)}
                            className="w-5 h-5"
                            style={{ accentColor: theme.colors.accent }}
                        />
                    </label>
                </div>

                {/* Button Tambah Item */}
                <button
                    onClick={() => {
                        setNewItemName('');
                        setNewItemAmount('');
                        setNewItemType('EXPENSE');
                        setNewItemCategory('');
                        setShowAddModal(true);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-dashed transition-all hover:border-solid flex items-center justify-center gap-2 font-medium"
                    style={{
                        borderColor: theme.colors.accent,
                        color: theme.colors.accent,
                        backgroundColor: theme.colors.accentLight
                    }}
                >
                    <IconDisplay name="Plus" size={20} />
                    Tambah Item ke Simulasi
                </button>

                {/* List Items */}
                <div className="space-y-3">
                    {sim.items.length === 0 ? (
                        <div className="text-center py-10" style={{ color: theme.colors.textMuted }}>
                            <IconDisplay name="Calculator" size={40} className="mx-auto mb-2 opacity-20" />
                            <p>Belum ada item dalam simulasi ini.</p>
                        </div>
                    ) : (
                        sim.items.map(item => {
                            const cat = categories.find(c => c.id === item.categoryId);
                            return (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-xl border group"
                                    style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${cat ? '' : 'bg-gray-300'}`} style={{ backgroundColor: cat?.color }}>
                                                <IconDisplay name={cat?.icon || 'HelpCircle'} size={18} />
                                            </div>
                                            <div>
                                                <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>{cat?.name || 'Tanpa Kategori'}</p>
                                                <p className="text-xs" style={{ color: theme.colors.textMuted }}>{item.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openApplyModal(item)}
                                                className="p-2 rounded-lg text-xs font-medium flex items-center gap-1"
                                                title="Tambahkan ke Transaksi Utama"
                                                style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                                            >
                                                <IconDisplay name="Save" size={14} /> <span className="hidden sm:inline">Tambah ke Utama</span>
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="p-2 rounded-lg transition-colors"
                                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                                title="Edit Item"
                                            >
                                                <IconDisplay name="Edit" size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteSimulationItem(sim.id, item.id)}
                                                className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
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

                {/* Modal Apply Date */}
                {applyModalOpen && itemToApply && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>Simpan ke Transaksi Utama</h3>
                            <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                                Item <strong>{itemToApply.name}</strong> ({formatRp(itemToApply.amount)}) akan dicatat sebagai transaksi nyata. Pilih tanggalnya:
                            </p>
                            <input
                                type="date"
                                value={applyDate}
                                onChange={e => setApplyDate(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg mb-4 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary
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
                                    Konfirmasi Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Edit Item */}
                {editingItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>Edit Item Simulasi</h3>
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                {/* Type Toggle */}
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
                                                boxShadow: editItemType === 'EXPENSE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Pengeluaran</button>
                                        <button
                                            type="button"
                                            onClick={() => setEditItemType('INCOME')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: editItemType === 'INCOME' ? theme.colors.bgCard : 'transparent',
                                                color: editItemType === 'INCOME' ? theme.colors.income : theme.colors.textMuted,
                                                boxShadow: editItemType === 'INCOME' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Pemasukan</button>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Nama Item</label>
                                    <input
                                        type="text"
                                        value={editItemName}
                                        onChange={e => setEditItemName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary
                                        }}
                                        required
                                    />
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Jumlah</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-sm" style={{ color: theme.colors.textMuted }}>Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={editItemAmount}
                                            onChange={e => setEditItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-semibold outline-none"
                                            style={{
                                                backgroundColor: theme.colors.bgHover,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.textPrimary
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Kategori</label>
                                    <select
                                        value={editItemCategory}
                                        onChange={e => setEditItemCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary
                                        }}
                                        required
                                    >
                                        {categories.filter(c => c.type === editItemType).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buttons */}
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

                {/* Modal Add Item */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div
                            className="rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up"
                            style={{ backgroundColor: theme.colors.bgCard }}
                        >
                            <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.textPrimary }}>Tambah Item Simulasi</h3>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                {/* Type Toggle */}
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
                                                boxShadow: newItemType === 'EXPENSE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Pengeluaran</button>
                                        <button
                                            type="button"
                                            onClick={() => setNewItemType('INCOME')}
                                            className="flex-1 px-4 py-2 rounded-md text-xs font-bold"
                                            style={{
                                                backgroundColor: newItemType === 'INCOME' ? theme.colors.bgCard : 'transparent',
                                                color: newItemType === 'INCOME' ? theme.colors.income : theme.colors.textMuted,
                                                boxShadow: newItemType === 'INCOME' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Pemasukan</button>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Nama Item</label>
                                    <input
                                        type="text"
                                        placeholder="mis: Tiket Liburan"
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary
                                        }}
                                        required
                                    />
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Jumlah</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-sm" style={{ color: theme.colors.textMuted }}>Rp</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={newItemAmount}
                                            onChange={e => setNewItemAmount(formatRupiahInput(e.target.value.replace(/\D/g, '')))}
                                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-semibold outline-none"
                                            style={{
                                                backgroundColor: theme.colors.bgHover,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.textPrimary
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-medium mb-2 block" style={{ color: theme.colors.textMuted }}>Kategori</label>
                                    <select
                                        value={newItemCategory}
                                        onChange={e => setNewItemCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: theme.colors.bgHover,
                                            borderColor: theme.colors.border,
                                            color: theme.colors.textPrimary
                                        }}
                                        required
                                    >
                                        <option value="">Pilih Kategori...</option>
                                        {categories.filter(c => c.type === newItemType).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buttons */}
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
            </div>
        );
    }

    // VIEW 2: Daftar Simulasi
    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Simulasi Biaya</h2>
                    <p className="text-sm" style={{ color: theme.colors.textMuted }}>Rencanakan pengeluaran tanpa takut saldo terpotong.</p>
                </div>
            </div>

            {/* Create Simulation Form */}
            <form
                onSubmit={handleCreate}
                className="p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-3"
                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
            >
                <input
                    type="text"
                    placeholder="Judul Simulasi Baru (mis: Rencana Liburan Bali)"
                    className="flex-1 px-4 py-2.5 border rounded-lg outline-none"
                    value={newSimTitle}
                    onChange={e => setNewSimTitle(e.target.value)}
                    style={{
                        backgroundColor: theme.colors.bgHover,
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary
                    }}
                />
                <button
                    type="submit"
                    className="text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                    style={{ backgroundColor: theme.colors.accent }}
                    disabled={!newSimTitle.trim()}
                >
                    Buat Simulasi
                </button>
            </form>

            {/* Grid Simulasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulations.length === 0 ? (
                    <div
                        className="col-span-full text-center py-12 rounded-2xl border border-dashed"
                        style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                    >
                        <IconDisplay name="Calculator" size={48} className="mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                        <p className="font-medium" style={{ color: theme.colors.textSecondary }}>Belum ada simulasi.</p>
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>Buat rencana keuanganmu sekarang!</p>
                    </div>
                ) : (
                    simulations.map(sim => {
                        const total = sim.items.reduce((acc, i) => {
                            return i.type === 'INCOME' ? acc + i.amount : acc - i.amount;
                        }, 0);
                        
                        const useMonthBalance = !!sim.useCurrentMonthBalance;

                        return (
                            <div
                                key={sim.id}
                                onClick={() => setActiveSimId(sim.id)}
                                className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-8">
                                        <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.textPrimary }}>{sim.title}</h3>
                                        {useMonthBalance && (
                                            <div className="flex items-center gap-1.5">
                                                <IconDisplay name="Calendar" size={12} style={{ color: theme.colors.accent }} />
                                                <span
                                                    className="text-[10px] font-medium"
                                                    style={{ color: theme.colors.accent }}
                                                >Saldo bulan ini</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteSimulation(sim.id); }}
                                        className="text-gray-300 hover:text-red-500 p-1 absolute top-4 right-4 z-10 hover:scale-110 transition-transform"
                                        title="Hapus Simulasi"
                                    >
                                        <IconDisplay name="Trash2" size={18} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <span
                                        className="text-xs px-2 py-1 rounded-md"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                                    >{sim.items.length} Transaksi</span>
                                    <div className="text-right">
                                        <p className="text-xs uppercase" style={{ color: theme.colors.textMuted }}>Total Efek</p>
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
    );
};

export default SimulationManager;