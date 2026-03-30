import React, { useState, useEffect } from 'react';
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
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import { Category, IconName, TransactionType } from '../types';
import { AVAILABLE_ICONS, COLORS } from '../constants';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { checkCategorySimilarity, SimilarityResult } from '../utils/categoryValidation';
import FullScreenDialog from './FullScreenDialog';

interface CategoryFormModalProps {
    isOpen: boolean;
    editingCategory?: Category | null;
    categories: Category[];
    defaultType?: TransactionType;
    onClose: () => void;
    onSave: (category: Omit<Category, 'id'>) => void | Promise<any>;
    onUpdate?: (id: string, category: Omit<Category, 'id'>) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    editingCategory,
    categories,
    defaultType = 'EXPENSE',
    onClose,
    onSave,
    onUpdate,
}) => {
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [newCatType, setNewCatType] = useState<TransactionType>(defaultType);
    const [icon, setIcon] = useState<IconName>('HelpCircle');
    const [color, setColor] = useState('#9ca3af');
    const [isSaving, setIsSaving] = useState(false);
    const [warning, setWarning] = useState<SimilarityResult | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                setName(editingCategory.name);
                setNewCatType(editingCategory.type);
                setIcon(editingCategory.icon as IconName);
                setColor(editingCategory.color);
            } else {
                setName('');
                setNewCatType(defaultType);
                setIcon('HelpCircle');
                setColor('#9ca3af');
            }
            setWarning(null);
            setIsSaving(false);
        }
    }, [isOpen, editingCategory, defaultType]);

    const resetForm = () => {
        setName('');
        setNewCatType(defaultType);
        setIcon('HelpCircle');
        setColor('#9ca3af');
        setWarning(null);
        setIsSaving(false);
    };

    const handleSubmit = async (e?: React.FormEvent | boolean, bypassWarning = false) => {
        if (typeof e === 'boolean') {
            bypassWarning = e;
            e = undefined;
        }
        if (e) (e as React.FormEvent).preventDefault();
        
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (!bypassWarning && (!editingCategory || editingCategory.name.toLowerCase() !== trimmedName.toLowerCase())) {
            const categoriesToCheck = editingCategory
                ? categories.filter(c => c.id !== editingCategory.id)
                : categories;
            const validation = checkCategorySimilarity(trimmedName, categoriesToCheck);
            
            if (validation.isSimilar) {
                setWarning(validation);
                return;
            }
        }

        setIsSaving(true);
        try {
            if (editingCategory && onUpdate) {
                await onUpdate(editingCategory.id, { name: trimmedName, type: newCatType, icon, color });
            } else {
                await onSave({ name: trimmedName, type: newCatType, icon, color });
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

    const actions = (
        <>
            <Button variant="outlined" onClick={handleClose}>
                Batal
            </Button>
            {warning ? (
                <Button
                    variant="contained"
                    color="warning"
                    onClick={() => handleSubmit(true)}
                    disabled={isSaving}
                >
                    Tetap Simpan
                </Button>
            ) : null}
            <Button
                variant="contained"
                disabled={!name.trim() || isSaving}
                onClick={() => handleSubmit(undefined, false)}
                startIcon={isSaving
                    ? <CircularProgress size={16} sx={{ color: '#fff' }} />
                    : <IconDisplay name={editingCategory ? 'Check' : 'Save'} size={18} sx={{ color: '#fff' }} />
                }
            >
                {isSaving ? 'Menyimpan...' : editingCategory ? 'Update' : 'Simpan'}
            </Button>
        </>
    );

    return (
        <FullScreenDialog
            open={isOpen}
            onClose={handleClose}
            title={editingCategory ? 'Edit Kategori' : 'Buat Kategori Baru'}
            description="Gunakan kategori yang ringkas dan konsisten supaya transaksi, anggaran, dan ringkasan tetap rapi."
            actions={actions}
        >
            <Box component="form" id="category-form" onSubmit={(e) => handleSubmit(e)}>
                {warning ? (
                    <Alert
                        severity="warning"
                        sx={{ mb: 3 }}
                        action={
                            <IconButton size="small" onClick={() => setWarning(null)} color="inherit">
                                <IconDisplay name="X" size={16} />
                            </IconButton>
                        }
                    >
                        <Typography variant="body2" fontWeight={600} sx={{ mb: warning.conflictingCategories.length ? 1 : 0 }}>
                            {warning.message}
                        </Typography>
                        {warning.conflictingCategories.length ? (
                            <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                                {warning.conflictingCategories.map((cat) => (
                                    <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <IconDisplay name={cat.icon} size={12} sx={{ color: '#fff' }} />
                                        </Box>
                                        <Typography variant="body2">{cat.name}</Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                            {cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>
                        ) : null}
                    </Alert>
                ) : null}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            label="Nama Kategori"
                            fullWidth
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                        {AVAILABLE_ICONS.map(i => (
                            <Grid size="auto" key={i}>
                                <Tooltip title={i} placement="top" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => setIcon(i)}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor: icon === i ? 'primary.main' : 'divider',
                                            bgcolor: icon === i ? 'primary.main' : 'background.paper',
                                            color: icon === i ? '#fff' : 'text.disabled',
                                            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                                        }}
                                    >
                                        <IconDisplay name={i} size={18} />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Color Picker */}
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Pilih Warna</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {COLORS.map(c => (
                        <Tooltip key={c} title={c} placement="top" arrow>
                            <Box
                                component="button"
                                onClick={() => setColor(c)}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: c,
                                    border: '2px solid',
                                    borderColor: color === c ? 'text.primary' : 'transparent',
                                    cursor: 'pointer',
                                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                                    transition: 'transform 0.15s',
                                    '&:hover': { transform: 'scale(1.15)' },
                                    boxShadow: color === c ? '0 0 0 2px #fff, 0 0 0 4px ' + c : 'none',
                                }}
                                title={c}
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
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconDisplay name={icon} size={16} sx={{ color: '#fff' }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                        {name || 'Nama Kategori'}
                    </Typography>
                    <Chip
                        label={newCatType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        size="small"
                        sx={{ ml: 'auto', bgcolor: typeBg, color: typeColor, fontWeight: 600, height: 20, fontSize: 11 }}
                    />
                </Box>
            </Box>
        </FullScreenDialog>
    );
};

export default CategoryFormModal;
