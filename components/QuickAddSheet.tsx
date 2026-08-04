import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';
import type { TransactionType, Category, Transaction } from '../types';
import { formatRupiahInput } from '../utils/format';

interface QuickAddSheetProps {
    open: boolean;
    type: TransactionType;
    amount: string;
    description: string;
    categoryId: string;
    date: string;
    attachment: { file: File; type: 'image' | 'pdf' } | null;
    categories: Array<{ id: string; name: string; icon: string; color: string; type: TransactionType }>;
    recentCategoryIds: string[];
    onTypeChange: (type: TransactionType) => void;
    onAmountChange: (amount: string) => void;
    onDescriptionChange: (description: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onDateChange: (date: string) => void;
    onAttachmentChange: (attachment: { file: File; type: 'image' | 'pdf' } | null) => void;
    onScanButtonClick: () => void;
    onScanCancelled?: () => void;
    onSave: () => void;
    onClose: () => void;
    isSaving?: boolean;
    error?: string;
    isScanning?: boolean;
    scanMessage?: string;
    scanError?: string;
    onClearScanMessage?: () => void;
    onClearScanError?: () => void;
    // Edit mode
    isEditMode?: boolean;
    isReadOnly?: boolean;
    initialData?: Transaction;
    existingAttachment?: { url: string; name: string; type: 'image' | 'pdf' } | null;
    isAttachmentDeleted?: boolean;
    hasRemoteConflict?: boolean;
    showConflictDialog?: boolean;
    onApplyLatestVersion?: () => void;
    onKeepMyVersion?: () => void;
    onOpenConflictDialog?: () => void;
    onCloseConflictDialog?: () => void;
    onRequestDelete?: () => void;
    showDeleteConfirm?: boolean;
    onCloseDeleteConfirm?: () => void;
    onConfirmDelete?: () => void;
    onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
    showCategoryModal?: boolean;
    onOpenCategoryModal?: () => void;
    onCloseCategoryModal?: () => void;
    onCategorySaved?: (categoryId: string) => void;
    latestData?: Transaction;
}

const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
    open,
    type,
    amount,
    description,
    categoryId,
    date,
    attachment,
    categories,
    recentCategoryIds,
    onTypeChange,
    onAmountChange,
    onDescriptionChange,
    onCategoryChange,
    onDateChange,
    onAttachmentChange,
    onScanButtonClick,
    onScanCancelled,
    onSave,
    onClose,
    isSaving = false,
    error,
    isScanning = false,
    scanMessage,
    scanError,
    onClearScanMessage,
    onClearScanError,
    isEditMode = false,
    isReadOnly = false,
    initialData,
    existingAttachment,
    isAttachmentDeleted = false,
    hasRemoteConflict = false,
    showConflictDialog = false,
    onApplyLatestVersion,
    onKeepMyVersion,
    onOpenConflictDialog,
    onCloseConflictDialog,
    onRequestDelete,
    showDeleteConfirm = false,
    onCloseDeleteConfirm,
    onConfirmDelete,
    onAddCategory,
    showCategoryModal = false,
    onOpenCategoryModal,
    onCloseCategoryModal,
    onCategorySaved,
    latestData,
}) => {
    const { theme } = useTheme();
    const [displayAmount, setDisplayAmount] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const scanInputRef = useRef<HTMLInputElement>(null);

    const hasAttachment = !!(attachment || (existingAttachment && !isAttachmentDeleted));

    const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            onScanCancelled?.();
            return;
        }
        onAttachmentChange({ file, type: file.type === 'application/pdf' ? 'pdf' : 'image' });
        e.target.value = '';
    };

    useEffect(() => {
        if (open) {
            setDisplayAmount(formatRupiahInput(amount));
        }
    }, [open, amount]);

    const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const formatted = formatRupiahInput(raw);
        setDisplayAmount(formatted);
        onAmountChange(raw);
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onAttachmentChange({ file, type: file.type === 'application/pdf' ? 'pdf' : 'image' });
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
                        {isEditMode ? (isReadOnly ? 'Detail Transaksi' : 'Edit Transaksi') : 'Catat Transaksi'}
                    </Typography>
                    <IconButton size="small" onClick={onClose} aria-label="Tutup">
                        <IconDisplay name="X" size={18} />
                    </IconButton>
                </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, pb: 2 }}>
                {isReadOnly && initialData && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            Dibuat oleh: {initialData.createdByName || 'anggota lain'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Transaksi ini hanya bisa diubah oleh pembuatnya.
                        </Typography>
                    </Alert>
                )}
                {hasRemoteConflict && !isReadOnly && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            Transaksi ini berubah di perangkat atau tab lain.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tinjau versi terbaru sebelum menyimpan supaya perubahan tidak saling timpa.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            <Button size="small" variant="outlined" color="warning" onClick={onApplyLatestVersion}>
                                Pakai versi terbaru
                            </Button>
                            <Button size="small" variant="contained" color="warning" onClick={onOpenConflictDialog}>
                                Bandingkan dulu
                            </Button>
                        </Box>
                    </Alert>
                )}
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
                            onClick={() => !isReadOnly && onTypeChange(t)}
                            disabled={isReadOnly}
                            sx={{
                                flex: 1,
                                py: 1.25,
                                px: 2,
                                border: 'none',
                                borderRadius: 2.5,
                                cursor: isReadOnly ? 'not-allowed' : 'pointer',
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
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        value={displayAmount}
                        onChange={handleAmountInput}
                        placeholder="0"
                        disabled={isReadOnly}
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
                                py: 1.5,
                            },
                        }}
                        error={!!error}
                        autoFocus
                    />
                </Box>

                {/* Description Input (Wajib) */}
                <Box sx={{ mb: 2.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Catatan / Keterangan *"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Contoh: Makan siang, Bensin, Parkir"
                        disabled={isReadOnly}
                        error={!!error && !description.trim()}
                        helperText={error}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />
                </Box>

                {/* AI Scan Struk — selalu terlihat */}
                <Box sx={{ mb: 2.5 }}>
                    <input
                        id="quick-add-scan-input"
                        ref={scanInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleScanFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            onScanButtonClick();
                            scanInputRef.current?.click();
                        }}
                        disabled={isScanning || isSaving || isReadOnly || !navigator.onLine}
                        startIcon={isScanning ? <CircularProgress size={16} /> : <IconDisplay name="Sparkles" size={16} />}
                        sx={{ borderRadius: 2.5, py: 1 }}
                    >
                        {isScanning ? 'Menganalisis struk...' : 'Scan Struk (AI)'}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, textAlign: 'center' }}>
                        Foto struk dibaca AI, form terisi otomatis
                    </Typography>
                    {isScanning && (
                        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>
                            {scanMessage || 'Menganalisis struk...'}
                        </Alert>
                    )}
                    {scanError && !isScanning && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={onClearScanError}>
                            {scanError}
                        </Alert>
                    )}
                    {scanMessage && !isScanning && !scanError && (
                        <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={onClearScanMessage}>
                            {scanMessage}
                        </Alert>
                    )}
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
                                    onClick={() => !isReadOnly && onCategoryChange(cat.id)}
                                    disabled={isReadOnly}
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                            Semua kategori
                        </Typography>
                        {onAddCategory && onOpenCategoryModal && !isReadOnly && (
                            <Button size="small" variant="text" startIcon={<IconDisplay name="Plus" size={14} />} onClick={onOpenCategoryModal} sx={{ textTransform: 'none' }}>
                                Kategori Baru
                            </Button>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1,
                            overflow: 'visible',
                        }}
                    >
                        {otherCats.map((cat) => (
                            <Box
                                key={cat.id}
                                component="button"
                                onClick={() => !isReadOnly && onCategoryChange(cat.id)}
                                disabled={isReadOnly}
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

                {showDetails && (
                    <Box sx={{ mt: 2.5, display: 'grid', gap: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Tanggal"
                            type="date"
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            disabled={isReadOnly}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <Box>
                            <input
                                id="quick-add-attachment"
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleAttachmentChange}
                                style={{ display: 'none' }}
                            />
                            {existingAttachment && !isAttachmentDeleted && !attachment ? (
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', minWidth: 0 }}>
                                        <IconDisplay name={existingAttachment.type === 'image' ? 'Image' : 'FileText'} size={20} sx={{ color: theme.colors.textMuted, flexShrink: 0 }} />
                                        <Typography variant="body2" noWrap sx={{ flex: 1 }}>{existingAttachment.name}</Typography>
                                    </Box>
                                    {!isReadOnly && (
                                        <IconButton size="small" onClick={() => onAttachmentChange(null)} disabled={isSaving || isScanning} aria-label="Hapus lampiran">
                                            <IconDisplay name="X" size={16} />
                                        </IconButton>
                                    )}
                                </Paper>
                            ) : (
                                <>
                                    <Button component="label" htmlFor="quick-add-attachment" variant="outlined" fullWidth disabled={isScanning || isSaving || isReadOnly}>
                                        {attachment ? `Lampiran: ${attachment.file.name}` : 'Tambah foto atau PDF'}
                                    </Button>
                                    {attachment && !isReadOnly && (
                                        <Button size="small" color="inherit" onClick={() => onAttachmentChange(null)} sx={{ mt: 0.5 }}>
                                            Hapus lampiran
                                        </Button>
                                    )}
                                </>
                            )}
                        </Box>
                    </Box>
                )}
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
                {isEditMode && onRequestDelete && !isReadOnly && (
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={onRequestDelete}
                        disabled={isSaving || isScanning}
                        startIcon={<IconDisplay name="Trash2" size={18} />}
                        sx={{ mb: 1, borderRadius: 3, py: 1 }}
                    >
                        Hapus Transaksi
                    </Button>
                )}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onSave}
                    disabled={isSaving || isReadOnly || !displayAmount || !categoryId}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: 16,
                        fontWeight: 700,
                        bgcolor: theme.colors.accent,
                        '&:hover': { bgcolor: theme.colors.accentHover },
                    }}
                >
                    {isSaving ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
                </Button>
                {!isReadOnly && (
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => setShowDetails((current) => !current)}
                        sx={{ mt: 1, color: 'text.secondary' }}
                    >
                        {showDetails ? 'Sembunyikan detail' : 'Tambah detail (tanggal, lampiran)'}
                    </Button>
                )}
            </Box>
        </Box>

        {/* Conflict Dialog */}
        <Dialog open={showConflictDialog} onClose={isSaving ? undefined : onCloseConflictDialog} maxWidth="sm" fullWidth>
            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    Versi Transaksi Berubah
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ada perubahan dari tab atau perangkat lain sejak form ini dibuka. Pilih versi mana yang ingin kamu lanjutkan.
                </Typography>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            Versi terbaru di server
                        </Typography>
                        <Typography variant="body2">Jumlah: {latestData ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(latestData.amount) : '-'}</Typography>
                        <Typography variant="body2">Tanggal: {latestData?.date || '-'}</Typography>
                        <Typography variant="body2">Catatan: {latestData?.description || '-'}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            Versi yang sedang kamu edit
                        </Typography>
                        <Typography variant="body2">Jumlah: {displayAmount ? `Rp ${displayAmount}` : '-'}</Typography>
                        <Typography variant="body2">Tanggal: {date || '-'}</Typography>
                        <Typography variant="body2">Catatan: {description || '-'}</Typography>
                    </Paper>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onCloseConflictDialog} disabled={isSaving}>Tutup</Button>
                <Button variant="outlined" color="warning" onClick={onApplyLatestVersion} disabled={isSaving}>Pakai versi terbaru</Button>
                <Button variant="contained" color="warning" onClick={onKeepMyVersion} disabled={isSaving}>Simpan versi saya</Button>
            </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={onCloseDeleteConfirm || (() => {})}
            onConfirm={onConfirmDelete || (() => {})}
            title="Hapus Transaksi"
            message={
                <Box>
                    <Typography sx={{ mb: 1 }}>Apakah Anda yakin ingin menghapus transaksi ini?</Typography>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Typography fontWeight={600}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialData?.amount || 0)}</Typography>
                        <Typography variant="body2" color="text.secondary">{initialData?.description || 'Tidak ada catatan'}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Tindakan ini tidak dapat dibatalkan.</Typography>
                </Box>
            }
            confirmText="Hapus"
            cancelText="Batal"
            type="danger"
            icon="Trash2"
        />

        {/* Category Form Modal */}
        {onAddCategory && onCloseCategoryModal && onCategorySaved && (
            <CategoryFormModal
                isOpen={showCategoryModal}
                defaultType={type}
                categories={categories}
                onClose={onCloseCategoryModal}
                onSave={async (categoryData) => {
                    const newCategoryId = await onAddCategory(categoryData);
                    if (newCategoryId) onCategorySaved(newCategoryId);
                }}
            />
        )}
    </>
    );
};

export default QuickAddSheet;
