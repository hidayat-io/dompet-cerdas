import React, { useState, useEffect } from 'react';
import { Category, IconName, TransactionType } from '../types';
import { AVAILABLE_ICONS, COLORS } from '../constants';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { checkCategorySimilarity, SimilarityResult } from '../utils/categoryValidation';

interface CategoryFormModalProps {
    isOpen: boolean;
    editingCategory?: Category | null; // If provided, it's edit mode
    categories: Category[]; // List of existing categories for validation
    defaultType?: TransactionType; // Default type when adding new
    onClose: () => void;
    onSave: (category: Omit<Category, 'id'>) => void | Promise<void>;
    onUpdate?: (id: string, category: Omit<Category, 'id'>) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    editingCategory,
    categories,
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

    // Validation Warning State
    const [warning, setWarning] = useState<SimilarityResult | null>(null);

    // Loading state for save operation
    const [isSaving, setIsSaving] = useState(false);

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
        setWarning(null);
        setIsSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent, forceSave = false) => {
        e.preventDefault();
        if (!newCatName.trim() || isSaving) {
            return;
        }

        // Run validation if not forced
        if (!forceSave && !editingCategory) {
            // We only validate for NEW categories or if name changed significantly (but for now let's just do new)
            // Or if editing, checks against OTHER categories.
            const categoriesToCheck = editingCategory
                ? categories.filter(c => c.id !== editingCategory.id)
                : categories;

            const validation = checkCategorySimilarity(newCatName, categoriesToCheck);

            if (validation.isSimilar) {
                setWarning(validation);
                return;
            }
        }

        // Start loading state
        setIsSaving(true);

        const categoryData = {
            name: newCatName,
            type: newCatType,
            icon: newCatIcon,
            color: newCatColor
        };

        try {
            if (editingCategory && onUpdate) {
                onUpdate(editingCategory.id, categoryData);
            } else {
                // Await onSave in case it's async (e.g., from TransactionForm)
                await Promise.resolve(onSave(categoryData));
            }

            resetForm();
            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
            setIsSaving(false);
        }
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
                <form id="category-form" onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto relative">
                    {/* Warning Overlay */}
                    {warning && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-red-100 max-w-sm w-full animate-bounce-in">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <IconDisplay name="AlertTriangle" size={24} />
                                </div>
                                <h4 className="text-lg font-bold text-center text-gray-800 mb-2">Perhatian!</h4>

                                <div className="mb-6 text-center">
                                    <p className="text-gray-600 text-sm mb-3">{warning.message}</p>

                                    <div className="bg-gray-50 rounded-lg p-3 text-left max-h-32 overflow-y-auto border border-gray-100">
                                        <ul className="space-y-2">
                                            <div className="bg-gray-50 rounded-lg p-3 text-left max-h-32 overflow-y-auto border border-gray-100">
                                                <ul className="space-y-2">
                                                    {warning.conflictingCategories.map((cat) => (
                                                        <li key={cat.id} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <div
                                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                                                style={{ backgroundColor: cat.color }}
                                                            >
                                                                <IconDisplay name={cat.icon} size={12} />
                                                            </div>
                                                            <span>{cat.name}</span>
                                                            <span className="text-xs text-gray-400 ml-auto">
                                                                {cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </ul>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3">Apakah Anda yakin ingin tetap menyimpan?</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setWarning(null)}
                                        className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e as any, true)}
                                        className="flex-1 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors shadow-md"
                                    >
                                        Tetap Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 border rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                            disabled={isSaving}
                            className="px-6 py-3 rounded-lg font-semibold transition-all focus:outline-none flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: isSaving ? theme.colors.bgMuted : theme.colors.accent,
                                color: 'white'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSaving) e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <IconDisplay name={editingCategory ? "Check" : "Save"} size={18} />
                                    <span>{editingCategory ? 'Update' : 'Simpan'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile FAB (Floating Action Button) */}
                <button
                    type="submit"
                    form="category-form"
                    disabled={isSaving}
                    className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: isSaving
                            ? theme.colors.bgMuted
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: isSaving
                            ? '0 4px 12px rgba(0,0,0,0.15)'
                            : '0 10px 30px rgba(102, 126, 234, 0.5)',
                        transform: isSaving ? 'scale(0.95)' : 'scale(1)'
                    }}
                    onTouchStart={(e) => {
                        if (!isSaving) e.currentTarget.style.transform = 'scale(0.9)';
                    }}
                    onTouchEnd={(e) => {
                        if (!isSaving) e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isSaving ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                    ) : (
                        <IconDisplay name={editingCategory ? "Check" : "Save"} size={28} style={{ color: 'white' }} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default CategoryFormModal;
