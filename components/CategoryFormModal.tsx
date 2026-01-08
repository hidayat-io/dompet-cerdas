import React, { useState, useEffect } from 'react';
import { Category, IconName, TransactionType } from '../types';
import { AVAILABLE_ICONS, COLORS } from '../constants';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

interface CategoryFormModalProps {
    isOpen: boolean;
    editingCategory?: Category | null; // If provided, it's edit mode
    defaultType?: TransactionType; // Default type when adding new
    onClose: () => void;
    onSave: (category: Omit<Category, 'id'>) => void;
    onUpdate?: (id: string, category: Omit<Category, 'id'>) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    editingCategory,
    defaultType = 'EXPENSE',
    onClose,
    onSave,
    onUpdate
}) => {
    const { theme } = useTheme();

    // Form States
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(defaultType);
    const [newCatIcon, setNewCatIcon] = useState<IconName>('Utensils');
    const [newCatColor, setNewCatColor] = useState(COLORS[0]);

    // Initialize form when editing
    useEffect(() => {
        if (editingCategory) {
            setNewCatName(editingCategory.name);
            setNewCatType(editingCategory.type);
            setNewCatIcon(editingCategory.icon as IconName);
            setNewCatColor(editingCategory.color);
        } else {
            // Reset to defaults for new category
            setNewCatName('');
            setNewCatType(defaultType);
            setNewCatIcon(defaultType === 'EXPENSE' ? 'ShoppingBag' : 'Wallet');
            setNewCatColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        }
    }, [editingCategory, defaultType, isOpen]);

    const resetForm = () => {
        setNewCatName('');
        setNewCatType(defaultType);
        setNewCatIcon('Utensils');
        setNewCatColor(COLORS[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) {
            return;
        }

        const categoryData = {
            name: newCatName,
            type: newCatType,
            icon: newCatIcon,
            color: newCatColor
        };

        if (editingCategory && onUpdate) {
            onUpdate(editingCategory.id, categoryData);
        } else {
            onSave(categoryData);
        }

        resetForm();
        onClose();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] md:bg-black md:bg-opacity-50 md:backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4">
            <div
                className="h-full w-full md:h-auto md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl shadow-xl overflow-hidden transform transition-all animate-slide-up md:animate-fade-in flex flex-col"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center gap-3 flex-shrink-0" style={{ backgroundColor: theme.colors.accent }}>
                    <div className="flex items-center gap-3 flex-1">
                        {/* Back Button (Mobile) */}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg transition-all focus:outline-none flex items-center justify-center md:hidden"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            }}
                        >
                            <IconDisplay name="ArrowLeft" size={20} />
                        </button>

                        <h3 className="text-white font-semibold text-lg flex-shrink-0">
                            {editingCategory ? 'Edit Kategori' : 'Buat Kategori Baru'}
                        </h3>
                    </div>

                    {/* Close Button (Desktop only) */}
                    <button
                        onClick={handleClose}
                        className="hidden md:flex p-2 rounded-lg transition-all focus:outline-none items-center justify-center"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        <IconDisplay name="X" size={18} />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <form id="category-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-6">
                        {/* Nama & Tipe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>Nama Kategori</label>
                                <input
                                    type="text"
                                    required
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg outline-none"
                                    placeholder="Contoh: Investasi"
                                    autoFocus
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>Tipe Transaksi</label>
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                                    className="w-full px-4 py-2 border rounded-lg outline-none"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary
                                    }}
                                >
                                    <option value="EXPENSE">Pengeluaran</option>
                                    <option value="INCOME">Pemasukan</option>
                                </select>
                            </div>
                        </div>

                        {/* Pilih Ikon */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>Pilih Ikon</label>
                            <div
                                className="p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar"
                                style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                            >
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                    {AVAILABLE_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setNewCatIcon(icon)}
                                            className="p-2 rounded-lg transition-all flex justify-center items-center aspect-square border"
                                            style={{
                                                backgroundColor: newCatIcon === icon ? theme.colors.accent : theme.colors.bgCard,
                                                color: newCatIcon === icon ? 'white' : theme.colors.textMuted,
                                                borderColor: newCatIcon === icon ? theme.colors.accent : theme.colors.border,
                                                boxShadow: newCatIcon === icon ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                                            }}
                                            title={icon}
                                        >
                                            <IconDisplay name={icon} size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pilih Warna */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>Pilih Warna</label>
                            <div className="flex flex-wrap gap-3 p-1">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewCatColor(color)}
                                        className={`w-8 h-8 rounded-full transition-transform shadow-sm ${newCatColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div
                            className="flex items-center gap-3 p-3 rounded-lg border border-dashed"
                            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                        >
                            <span className="text-xs font-medium uppercase" style={{ color: theme.colors.textMuted }}>Preview:</span>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                                style={{ backgroundColor: newCatColor }}
                            >
                                <IconDisplay name={newCatIcon} size={16} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{newCatName || 'Nama Kategori'}</span>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                                style={{
                                    backgroundColor: newCatType === 'INCOME' ? theme.colors.incomeBg : theme.colors.expenseBg,
                                    color: newCatType === 'INCOME' ? theme.colors.income : theme.colors.expense
                                }}
                            >
                                {newCatType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                        </div>
                    </div>
                </form>

                {/* Desktop Footer (Hidden on Mobile) */}
                <div
                    className="hidden md:flex p-4 border-t flex-shrink-0"
                    style={{
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.bgCard
                    }}
                >
                    <div className="flex justify-end w-full">
                        <button
                            type="submit"
                            form="category-form"
                            className="px-6 py-3 rounded-lg font-semibold transition-all focus:outline-none flex items-center gap-2 shadow-md hover:shadow-lg"
                            style={{
                                backgroundColor: theme.colors.accent,
                                color: 'white'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <IconDisplay name={editingCategory ? "Check" : "Save"} size={18} />
                            <span>{editingCategory ? 'Update' : 'Simpan'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile FAB (Floating Action Button) */}
                <button
                    type="submit"
                    form="category-form"
                    className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.5)'
                    }}
                    onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.9)';
                    }}
                    onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <IconDisplay name={editingCategory ? "Check" : "Save"} size={28} style={{ color: 'white' }} />
                </button>
            </div>
        </div>
    );
};

export default CategoryFormModal;
