import React, { useState } from 'react';
import { Category, IconName, TransactionType } from '../types';
import { AVAILABLE_ICONS, COLORS } from '../constants';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const { theme } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form States
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('EXPENSE');
  const [newCatIcon, setNewCatIcon] = useState<IconName>('Utensils');
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);

  const resetForm = () => {
    setNewCatName('');
    setNewCatType('EXPENSE');
    setNewCatIcon('Utensils');
    setNewCatColor(COLORS[0]);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      return;
    }

    onAddCategory({
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
      color: newCatColor
    });

    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatType(cat.type);
    setNewCatIcon(cat.icon as IconName);
    setNewCatColor(cat.color);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!newCatName.trim()) {
      return;
    }

    onUpdateCategory(editingCategory.id, {
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
      color: newCatColor
    });

    resetForm();
    setEditingCategory(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleDeleteClick = (cat: Category) => {
    setDeletingCategory(cat);
  };

  const handleConfirmDelete = () => {
    if (deletingCategory) {
      onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  const isModalOpen = isAdding || editingCategory !== null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>Master Kategori</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
          style={{ backgroundColor: theme.colors.accent }}
        >
          <IconDisplay name="Plus" size={18} />
          Tambah Kategori Baru
        </button>
      </div>

      {/* Modal Tambah/Edit Kategori */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all animate-fade-in-up"
            style={{ backgroundColor: theme.colors.bgCard }}
          >
            <div className="p-4 flex justify-between items-center" style={{ backgroundColor: theme.colors.accent }}>
              <h3 className="text-white font-semibold text-lg">
                {editingCategory ? 'Edit Kategori' : 'Buat Kategori Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-white hover:text-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editingCategory ? handleUpdate : handleAdd} className="p-6 space-y-5">
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

              {/* Preview (Optional visual check) */}
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

              <button
                type="submit"
                className="w-full py-3 text-white rounded-lg font-bold transition-colors shadow-md"
                style={{ backgroundColor: theme.colors.accent }}
              >
                {editingCategory ? 'Simpan Perubahan' : 'Simpan Kategori'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori"
        message={
          <div className="space-y-2">
            <p>Apakah Anda yakin ingin menghapus kategori <strong>"{deletingCategory?.name}"</strong>?</p>
            <p className="text-sm opacity-80">Kategori yang sudah digunakan dalam transaksi tidak dapat dihapus.</p>
          </div>
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        icon="Trash2"
      />

      {/* Grid List Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="p-4 rounded-xl shadow-sm border flex items-center justify-between group hover:shadow-md transition-shadow"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                <IconDisplay name={cat.icon} size={24} />
              </div>
              <div>
                <h4 className="font-bold" style={{ color: theme.colors.textPrimary }}>{cat.name}</h4>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: cat.type === 'INCOME' ? theme.colors.incomeBg : theme.colors.expenseBg,
                    color: cat.type === 'INCOME' ? theme.colors.income : theme.colors.expense
                  }}
                >
                  {cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <button
                onClick={() => handleEdit(cat)}
                className="p-2 rounded-full hover:bg-blue-50 transition-colors text-gray-300 hover:text-blue-500"
                title="Edit Kategori"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteClick(cat)}
                className="p-2 rounded-full hover:bg-red-50 transition-colors text-gray-300 hover:text-red-500"
                title="Hapus Kategori"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;