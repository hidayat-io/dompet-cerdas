import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onUpdateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
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

  const CategorySection = ({ type, label }: { type: 'INCOME' | 'EXPENSE'; label: string }) => {
    const color = type === 'INCOME' ? theme.colors.income : theme.colors.expense;
    const bgColor = type === 'INCOME' ? theme.colors.incomeBg : theme.colors.expenseBg;
    const filtered = categories.filter(c => c.type === type);

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconDisplay name={type === 'INCOME' ? 'TrendingUp' : 'TrendingDown'} size={16} style={{ color }} />
          </Box>
          <Typography fontWeight={700} sx={{ color }}>
            {label} ({filtered.length})
          </Typography>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 3, borderRadius: 2, border: '2px dashed', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">
              Belum ada kategori {label.toLowerCase()}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {filtered.map(cat => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={cat.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 2,
                    transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconDisplay name={cat.icon} size={24} style={{ color: '#fff' }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={700} variant="body2">{cat.name}</Typography>
                      <Chip
                        label={label}
                        size="small"
                        sx={{ bgcolor: bgColor, color, fontWeight: 600, fontSize: 11, height: 20 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setEditingCategory(cat)}
                      title="Edit Kategori"
                      sx={{ color: 'text.disabled', '&:hover': { color: 'info.main', bgcolor: 'info.main' + '14' } }}
                    >
                      <IconDisplay name="Edit" size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeletingCategory(cat)}
                      title="Hapus Kategori"
                      sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'error.main' + '14' } }}
                    >
                      <IconDisplay name="Trash2" size={18} />
                    </IconButton>
                  </Box>
                </Paper>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Master Kategori</Typography>
        <Button
          variant="contained"
          startIcon={<IconDisplay name="Plus" size={18} style={{ color: '#fff' }} />}
          onClick={() => setIsAdding(true)}
          sx={{ borderRadius: '999px', fontWeight: 600, px: 2.5 }}
        >
          Tambah Kategori Baru
        </Button>
      </Box>

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
