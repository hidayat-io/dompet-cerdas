import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import { Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';
import PageHeader from './PageHeader';

interface CategoryManagerProps {
  categories: Category[];
  currentUserId?: string | null;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onUpdateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, currentUserId, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const { theme } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleCloseModal = () => {
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleConfirmDelete = () => {
    if (deletingCategory) {
      onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  const canEditCategory = (category: Category) => !category.createdByUserId || !currentUserId || category.createdByUserId === currentUserId;

  const CategorySection = ({ type, label }: { type: 'INCOME' | 'EXPENSE'; label: string }) => {
    const color = type === 'INCOME' ? theme.colors.income : theme.colors.expense;
    const bgColor = type === 'INCOME' ? theme.colors.incomeBg : theme.colors.expenseBg;
    const filtered = categories.filter(c => c.type === type);

    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: bgColor }}>
            <IconDisplay name={type === 'INCOME' ? 'TrendingUp' : 'TrendingDown'} size={20} sx={{ color }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
              {label}
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {filtered.length} Kategori
            </Typography>
          </Box>
        </Box>

        {filtered.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center', bgcolor: 'transparent' }}>
            <Typography variant="body2" color="text.disabled">
              Belum ada kategori {label.toLowerCase()}
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filtered.map(cat => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={cat.id}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': { 
                      boxShadow: 2, 
                      borderColor: color,
                      bgcolor: type === 'INCOME' ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: cat.color,
                        flexShrink: 0,
                      }}
                    >
                      <IconDisplay name={cat.icon} size={24} sx={{ color: '#fff' }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} variant="subtitle2" noWrap>{cat.name}</Typography>
                      <Chip
                        label={type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        size="small"
                        sx={{ bgcolor: bgColor, color, fontWeight: 700, fontSize: 10, height: 20, mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, pl: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => setEditingCategory(cat)}
                      disabled={!canEditCategory(cat)}
                      title="Edit Kategori"
                      sx={{ color: 'text.secondary', bgcolor: 'action.hover', '&:hover': { color: 'info.main', bgcolor: 'info.main' + '14' } }}
                    >
                      <IconDisplay name="Edit2" size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeletingCategory(cat)}
                      disabled={!canEditCategory(cat)}
                      title="Hapus Kategori"
                      sx={{ color: 'text.secondary', bgcolor: 'action.hover', '&:hover': { color: 'error.main', bgcolor: 'error.main' + '14' } }}
                    >
                      <IconDisplay name="Trash2" size={16} />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Master Kategori"
        description="Kelola kategori pemasukan dan pengeluaran dengan pola kartu, aksi, dan label yang konsisten."
        actions={
          <Button
            variant="contained"
            startIcon={<IconDisplay name="Plus" size={18} sx={{ color: '#fff' }} />}
            onClick={() => setIsAdding(true)}
          >
            Kategori Baru
          </Button>
        }
      />

      <CategoryFormModal
        isOpen={isAdding || editingCategory !== null}
        editingCategory={editingCategory}
        categories={categories}
        onClose={handleCloseModal}
        onSave={onAddCategory}
        onUpdate={onUpdateCategory}
      />

      <ConfirmDialog
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori"
        message={
          <Box>
            <Typography>
              Apakah Anda yakin ingin menghapus kategori <strong>"{deletingCategory?.name}"</strong>?
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Kategori yang sudah digunakan dalam transaksi tidak dapat dihapus.
            </Typography>
          </Box>
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        icon="Trash2"
      />

      <CategorySection type="INCOME" label="Pemasukan" />
      <CategorySection type="EXPENSE" label="Pengeluaran" />
    </Box>
  );
};

export default CategoryManager;
