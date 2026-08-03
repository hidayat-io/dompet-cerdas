import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import type { TransactionType } from '../types';

interface QuickAddSheetProps {
    open: boolean;
    type: TransactionType;
    amount: string;
    categoryId: string;
    categories: Array<{ id: string; name: string; icon: string; color: string; type: TransactionType }>;
    recentCategoryIds: string[];
    onTypeChange: (type: TransactionType) => void;
    onAmountChange: (amount: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onSave: () => void;
    onAddDetail: () => void;
    onClose: () => void;
    isSaving?: boolean;
    error?: string;
}

const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
    open,
    type,
    amount,
    categoryId,
    categories,
    recentCategoryIds,
    onTypeChange,
    onAmountChange,
    onCategoryChange,
    onSave,
    onAddDetail,
    onClose,
    isSaving = false,
    error,
}) => {
    const { theme } = useTheme();
    const [displayAmount, setDisplayAmount] = useState('');

    useEffect(() => {
        if (open) {
            setDisplayAmount(amount);
        }
    }, [open, amount]);

    const formatAmountDisplay = (val: string) => {
        const digits = val.replace(/\D/g, '');
        if (!digits) return '';
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const formatted = formatAmountDisplay(raw);
        setDisplayAmount(formatted);
        onAmountChange(raw);
    };

    const filteredCategories = categories.filter(c => c.type === type);
    const recentCats = recentCategoryIds
        .map(id => filteredCategories.find(c => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .slice(0, 5);
    const otherCats = filteredCategories.filter(c => !recentCategoryIds.includes(c.id));

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1200,
                    animation: 'fadeIn 0.2s ease-out',
                    '@keyframes fadeIn': {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                    },
                }}
                onClick={onClose}
            />

            {/* Sheet */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1201,
                    bgcolor: 'background.paper',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.25s ease-out',
                    '@keyframes slideUp': {
                        from: { transform: 'translateY(100%)' },
                        to: { transform: 'translateY(0)' },
                    },
                }}
            >
                {/* Handle */}
                <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
                </Box>

                {/* Header */}
                <Box sx={{ px: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700}>
                        Catat Transaksi
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Tutup">
                        <IconDisplay name="X" size={18} />
                    </IconButton>
                </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 2 }}>
                {/* Type Toggle */}
                <Box
                    sx={{
                        display: 'flex',
                        bgcolor: 'action.hover',
                        borderRadius: 3,
                        p: 0.5,
                        mb: 3,
                    }}
                >
                    {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
                        <Box
                            key={t}
                            component="button"
                            onClick={() => onTypeChange(t)}
                            sx={{
                                flex: 1,
                                py: 1.25,
                                px: 2,
                                border: 'none',
                                borderRadius: 2.5,
                                cursor: 'pointer',
                                bgcolor: type === t ? 'background.paper' : 'transparent',
                                color: type === t ? (t === 'EXPENSE' ? 'error.main' : 'info.main') : 'text.secondary',
                                fontWeight: 700,
                                fontSize: 14,
                                fontFamily: 'inherit',
                                boxShadow: type === t ? 1 : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            {t === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
                        </Box>
                    ))}
                </Box>

                {/* Amount Input */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        value={displayAmount}
                        onChange={handleAmountInput}
                        placeholder="0"
                        inputProps={{
                            inputMode: 'numeric',
                            style: {
                                textAlign: 'center',
                                fontSize: 32,
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.disabled', mr: 1 }}>
                                    Rp
                                </Typography>
                            ),
                            sx: {
                                bgcolor: 'action.hover',
                                borderRadius: 3,
                                '&:before, &:after': { display: 'none' },
                                py: 2,
                            },
                        }}
                        error={!!error}
                        helperText={error}
                        autoFocus
                    />
                </Box>

                {/* Frequent Categories */}
                {recentCats.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                            Sering dipakai
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {recentCats.map((cat) => (
                                <Chip
                                    key={cat.id}
                                    icon={
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                bgcolor: cat.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconDisplay name={cat.icon} size={12} sx={{ color: '#fff' }} />
                                        </Box>
                                    }
                                    label={cat.name}
                                    onClick={() => onCategoryChange(cat.id)}
                                    sx={{
                                        height: 40,
                                        px: 1,
                                        bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.hover',
                                        color: categoryId === cat.id ? theme.colors.accent : 'text.primary',
                                        border: categoryId === cat.id ? `2px solid ${theme.colors.accent}` : '1px solid transparent',
                                        fontWeight: 600,
                                        '&:hover': {
                                            bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.selected',
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* All Categories */}
                <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                        Semua kategori
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1,
                            maxHeight: 200,
                            overflow: 'auto',
                        }}
                    >
                        {otherCats.map((cat) => (
                            <Box
                                key={cat.id}
                                component="button"
                                onClick={() => onCategoryChange(cat.id)}
                                sx={{
                                    p: 1.5,
                                    border: 'none',
                                    borderRadius: 2.5,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.hover',
                                    boxShadow: categoryId === cat.id ? `0 0 0 2px ${theme.colors.accent}` : 'none',
                                    transition: 'all 0.15s',
                                    '&:hover': {
                                        bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.selected',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: cat.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <IconDisplay name={cat.icon} size={18} sx={{ color: '#fff' }} />
                                </Box>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    textAlign="center"
                                    noWrap
                                    sx={{
                                        width: '100%',
                                        color: categoryId === cat.id ? theme.colors.accent : 'text.primary',
                                    }}
                                >
                                    {cat.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Sticky Action Bar */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onSave}
                    disabled={isSaving || !displayAmount || !categoryId}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: 16,
                        fontWeight: 700,
                        bgcolor: theme.colors.accent,
                        '&:hover': { bgcolor: theme.colors.accentHover },
                    }}
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button
                    fullWidth
                    variant="text"
                    onClick={onAddDetail}
                    sx={{ mt: 1, color: 'text.secondary' }}
                >
                    Tambah detail (tanggal, catatan, lampiran)
                </Button>
            </Box>
        </Box>
    </>
    );
};

export default QuickAddSheet;
