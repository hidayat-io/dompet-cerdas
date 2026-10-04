import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconDisplay from './IconDisplay';
import { IconName } from '../types';

export type DialogType = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType;
    icon?: IconName;
    isLoading?: boolean;
}

const typeColors: Record<DialogType, string> = {
    danger: '#dc2626',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
};

const defaultIcons: Record<DialogType, IconName> = {
    danger: 'Trash2',
    warning: 'AlertCircle',
    success: 'CheckCircle',
    info: 'Info'
};

// Pesan sering memuat nama dari user (kategori, tagihan, anggaran): nama panjang tanpa spasi
// dibiarkan pecah di mana saja supaya tidak overflow keluar dialog.
const WRAP_ANYWHERE_SX = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as const;

// Label button berada di sel grid yang sama dengan label button satunya (disembunyikan), jadi lebar
// alami kedua button = label terpanjang: selalu sama lebar saat berdampingan, dan turun ke baris
// kedua bersamaan kalau tidak muat (mis. "Ya, Batalkan Lunas" di HP 360px), bukan teksnya overflow.
const ButtonLabel: React.FC<{ visible: React.ReactNode; other: React.ReactNode }> = ({ visible, other }) => (
    <Box component="span" sx={{ display: 'inline-grid', justifyItems: 'center', alignItems: 'center', '& > *': { gridArea: '1 / 1' } }}>
        {/* Rata kiri: kalau label terpaksa wrap (layar sangat sempit), ikon tetap menempel ke teks. */}
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', textAlign: 'left' }}>{visible}</Box>
        <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex', alignItems: 'center', visibility: 'hidden' }}>{other}</Box>
    </Box>
);

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    type = 'danger',
    icon,
    isLoading = false
}) => {
    const color = typeColors[type];
    const displayIcon = icon || defaultIcons[type];
    // mr 0.75 = 6px (dulu `marginRight: 6` di sx terbaca 6 spacing unit = 48px). Warna ikon ikut
    // warna teks button, jadi ikut transparan bersama label saat loading.
    const confirmLabel = (
        <>
            <IconDisplay name={displayIcon} size={18} sx={{ mr: 0.75 }} />
            {confirmText}
        </>
    );

    return (
        <Dialog
            open={isOpen}
            onClose={isLoading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
        >
            <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <IconDisplay name={displayIcon} size={28} sx={{ color }} />
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    {title}
                </Typography>
                {typeof message === 'string' ? (
                    <Typography variant="body2" color="text.secondary" sx={WRAP_ANYWHERE_SX}>
                        {message}
                    </Typography>
                ) : (
                    <Box sx={{ textAlign: 'left', ...WRAP_ANYWHERE_SX }}>
                        {message}
                    </Box>
                )}
            </DialogContent>

            {/* minWidth fit-content: button selebar label satu baris (lihat ButtonLabel); flexWrap: kalau tidak
                muat berdampingan, kedua button bertumpuk dengan lebar penuh. disableSpacing: margin bawaan MUI
                diganti gap supaya baris kedua tetap sejajar (jarak antar-button tetap 20px seperti sebelumnya).
                Bentuk & ukuran kedua button disamakan: radius & padding sama (padding bawaan MUI outlined 15px
                vs contained 16px), border transparan di button contained.
                Loading pakai prop `loading` MUI: label tetap memakan tempat (transparan), jadi layout tidak
                lompat, dan spinner tampil di tengah. */}
            <DialogActions disableSpacing sx={{ px: 3, pb: 3, columnGap: 2.5, rowGap: 1.5, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    disabled={isLoading}
                    sx={{ flex: '1 1 0', minWidth: 'fit-content', borderRadius: 2, px: 2, py: 1.25, fontWeight: 600 }}
                >
                    <ButtonLabel visible={cancelText} other={confirmLabel} />
                </Button>
                <Button
                    variant="contained"
                    onClick={onConfirm}
                    loading={isLoading}
                    sx={{
                        flex: '1 1 0',
                        minWidth: 'fit-content',
                        borderRadius: 2,
                        border: '1px solid transparent',
                        px: 2,
                        py: 1.25,
                        fontWeight: 600,
                        bgcolor: color,
                        '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
                    }}
                >
                    <ButtonLabel visible={confirmLabel} other={cancelText} />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
