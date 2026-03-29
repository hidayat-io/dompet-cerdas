import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Category, IconName, TransactionType } from '../types';
import { AVAILABLE_ICONS, COLORS } from '../constants';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { checkCategorySimilarity, SimilarityResult } from '../utils/categoryValidation';

interface CategoryFormModalProps {
    isOpen: boolean;
    editingCategory?: Category | null;
    categories: Category[];
    defaultType?: TransactionType;
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
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(defaultType);
    const [newCatIcon, setNewCatIcon] = useState<IconName>('Utensils');
    const [newCatColor, setNewCatColor] = useState(COLORS[0]);
    const [warning, setWarning] = useState<SimilarityResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingCategory) {
            setNewCatName(editingCategory.name);
            setNewCatType(editingCategory.type);
            setNewCatIcon(editingCategory.icon as IconName);
            setNewCatColor(editingCategory.color);
        } else {
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

    const handleSubmit = async (forceSave = false) => {
        if (!newCatName.trim() || isSaving) return;

        if (!forceSave && !editingCategory) {
            const categoriesToCheck = editingCategory
                ? categories.filter(c => c.id !== (editingCategory as Category).id)
                : categories;
            const validation = checkCategorySimilarity(newCatName, categoriesToCheck);
            if (validation.isSimilar) {
                setWarning(validation);
                return;
            }
        }

        setIsSaving(true);
        const categoryData = { name: newCatName, type: newCatType, icon: newCatIcon, color: newCatColor };

        try {
            if (editingCategory && onUpdate) {
                onUpdate(editingCategory.id, categoryData);
            } else {
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

    const incomeColor = theme.colors.income;
    const expenseColor = theme.colors.expense;
    const typeColor = newCatType === 'INCOME' ? incomeColor : expenseColor;
    const typeBg = newCatType === 'INCOME' ? theme.colors.incomeBg : theme.colors.expenseBg;

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            {/* Header */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="h6" fontWeight={600} color="#fff">
                    {editingCategory ? 'Edit Kategori' : 'Buat Kategori Baru'}
                </Typography>
                <IconButton
                    onClick={handleClose}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                    <IconDisplay name="X" size={18} />
                </IconButton>
            </Box>

            {/* Warning Overlay */}
            {warning && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, maxWidth: 360, width: '100%', boxShadow: 8 }}>
                        <Box sx={{ width: 48, height: 48, bgcolor: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                            <IconDisplay name="AlertTriangle" size={24} style={{ color: '#f59e0b' }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} textAlign="center" gutterBottom>Perhatian!</Typography>
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>{warning.message}</Typography>
                        <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5, mb: 2, maxHeight: 120, overflowY: 'auto' }}>
                            {warning.conflictingCategories.map((cat) => (
                                <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <IconDisplay name={cat.icon} size={12} style={{ color: '#fff' }} />
                                    </Box>
                                    <Typography variant="body2">{cat.name}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                        {cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" sx={{ mb: 2 }}>
                            Apakah Anda yakin ingin tetap menyimpan?
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button fullWidth variant="outlined" onClick={() => setWarning(null)}>Batal</Button>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => handleSubmit(true)}
                                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                            >
                                Tetap Simpan
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            label="Nama Kategori"
                            fullWidth
                            required
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            disabled={isSaving}
                            placeholder="Contoh: Investasi"
                            autoFocus
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipe Transaksi</InputLabel>
                            <Select
                                label="Tipe Transaksi"
                                value={newCatType}
                                onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                                disabled={isSaving}
                            >
                                <MenuItem value="EXPENSE">Pengeluaran</MenuItem>
                                <MenuItem value="INCOME">Pemasukan</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {/* Icon Picker */}
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Pilih Ikon</Typography>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                        maxHeight: 160,
                        overflowY: 'auto',
                        mb: 2,
                    }}
                >
                    <Grid container spacing={0.75}>
                        {AVAILABLE_ICONS.map(icon => (
                            <Grid size="auto" key={icon}>
                                <Tooltip title={icon} placement="top" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => setNewCatIcon(icon)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: newCatIcon === icon ? 'primary.main' : 'divider',
                                            bgcolor: newCatIcon === icon ? 'primary.main' : 'background.paper',
                                            color: newCatIcon === icon ? '#fff' : 'text.disabled',
                                            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                        }}
                                    >
                                        <IconDisplay name={icon} size={18} />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Color Picker */}
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Pilih Warna</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {COLORS.map(color => (
                        <Tooltip key={color} title={color} placement="top" arrow>
                            <Box
                                component="button"
                                onClick={() => setNewCatColor(color)}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: color,
                                    border: '2px solid',
                                    borderColor: newCatColor === color ? 'text.primary' : 'transparent',
                                    cursor: 'pointer',
                                    transform: newCatColor === color ? 'scale(1.25)' : 'scale(1)',
                                    transition: 'transform 0.15s',
                                    '&:hover': { transform: 'scale(1.15)' },
                                    boxShadow: newCatColor === color ? '0 0 0 2px #fff, 0 0 0 4px ' + color : 'none',
                                }}
                                title={color}
                            />
                        </Tooltip>
                    ))}
                </Box>

                {/* Preview */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                    }}
                >
                    <Typography variant="caption" fontWeight={600} textTransform="uppercase" color="text.disabled">
                        Preview:
                    </Typography>
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: newCatColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconDisplay name={newCatIcon} size={16} style={{ color: '#fff' }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                        {newCatName || 'Nama Kategori'}
                    </Typography>
                    <Chip
                        label={newCatType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        size="small"
                        sx={{ ml: 'auto', bgcolor: typeBg, color: typeColor, fontWeight: 600, height: 20, fontSize: 11 }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: 2 }}>
                    Batal
                </Button>
                <Button
                    variant="contained"
                    disabled={!newCatName.trim() || isSaving}
                    onClick={() => handleSubmit(false)}
                    startIcon={isSaving
                        ? <CircularProgress size={16} sx={{ color: '#fff' }} />
                        : <IconDisplay name={editingCategory ? 'Check' : 'Save'} size={18} style={{ color: '#fff' }} />
                    }
                    sx={{ borderRadius: 2, minWidth: 120 }}
                >
                    {isSaving ? 'Menyimpan...' : editingCategory ? 'Update' : 'Simpan'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CategoryFormModal;
