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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div
                className="rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all animate-fade-in-up"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                <div className="p-4 flex justify-between items-center gap-3" style={{ backgroundColor: theme.colors.accent }}>
                    <h3 className="text-white font-semibold text-lg flex-shrink-0">
                        {editingCategory ? 'Edit Kategori' : 'Buat Kategori Baru'}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Save Button */}
                        <button
                            type="submit"
                            form="category-form"
                            className="px-3 py-2 rounded-lg font-semibold transition-all focus:outline-none flex items-center gap-1.5"
                            style={{
                                backgroundColor: 'white',
                                color: theme.colors.accent
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <IconDisplay name={editingCategory ? "Check" : "Save"} size={16} />
                            <span className="text-sm font-medium">{editingCategory ? 'Update' : 'Simpan'}</span>
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="px-3 py-2 rounded-lg transition-all focus:outline-none flex items-center gap-1.5"
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
                            <IconDisplay name="X" size={16} />
                        </button>
                    </div>
                </div>

                <form id="category-form" onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
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
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;
