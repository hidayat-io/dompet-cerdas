import React, { useState } from 'react';
import { Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';

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

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (categoryData: Omit<Category, 'id'>) => {
    onAddCategory(categoryData);
  };

  const handleUpdateCategory = (id: string, categoryData: Omit<Category, 'id'>) => {
    onUpdateCategory(id, categoryData);
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

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isAdding || editingCategory !== null}
        editingCategory={editingCategory}
        categories={categories}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        onUpdate={handleUpdateCategory}
      />

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

      {/* Separated Category Lists */}
      {/* Income Categories Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.incomeBg }}
          >
            <IconDisplay name="TrendingUp" size={16} style={{ color: theme.colors.income }} />
          </div>
          <h3 className="font-bold" style={{ color: theme.colors.income }}>
            Pemasukan ({categories.filter(c => c.type === 'INCOME').length})
          </h3>
        </div>

        {categories.filter(c => c.type === 'INCOME').length === 0 ? (
          <div
            className="p-6 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: theme.colors.border }}
          >
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Belum ada kategori pemasukan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.filter(c => c.type === 'INCOME').map(cat => (
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
                        backgroundColor: theme.colors.incomeBg,
                        color: theme.colors.income
                      }}
                    >
                      Pemasukan
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 rounded-full hover:bg-blue-50 transition-colors text-gray-300 hover:text-blue-500"
                    title="Edit Kategori"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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
        )}
      </div>

      {/* Expense Categories Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.colors.expenseBg }}
          >
            <IconDisplay name="TrendingDown" size={16} style={{ color: theme.colors.expense }} />
          </div>
          <h3 className="font-bold" style={{ color: theme.colors.expense }}>
            Pengeluaran ({categories.filter(c => c.type === 'EXPENSE').length})
          </h3>
        </div>

        {categories.filter(c => c.type === 'EXPENSE').length === 0 ? (
          <div
            className="p-6 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: theme.colors.border }}
          >
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Belum ada kategori pengeluaran
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.filter(c => c.type === 'EXPENSE').map(cat => (
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
                        backgroundColor: theme.colors.expenseBg,
                        color: theme.colors.expense
                      }}
                    >
                      Pengeluaran
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 rounded-full hover:bg-blue-50 transition-colors text-gray-300 hover:text-blue-500"
                    title="Edit Kategori"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
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
        )}
      </div>
    </div>
  );
};

export default CategoryManager;