import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
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
                    <Typography variant="body2" color="text.secondary">
                        {message}
                    </Typography>
                ) : (
                    <Box sx={{ textAlign: 'left' }}>
                        {message}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    disabled={isLoading}
                    sx={{ borderRadius: 2, py: 1.25, fontWeight: 600 }}
                >
                    {cancelText}
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onConfirm}
                    disabled={isLoading}
                    sx={{
                        py: 1.25,
                        fontWeight: 600,
                        bgcolor: color,
                        '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
                    }}
                >
                    {isLoading ? (
                        <CircularProgress size={18} sx={{ color: '#fff' }} />
                    ) : (
                        <>
                            <IconDisplay name={displayIcon} size={18} sx={{ color: '#fff', marginRight: 6 }} />
                            {confirmText}
                        </>
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
