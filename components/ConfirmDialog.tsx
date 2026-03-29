import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
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
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            {/* Colored Header */}
            <Box
                sx={{
                    bgcolor: color,
                    px: 3,
                    py: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        borderRadius: '50%',
                        p: 1.5,
                        display: 'flex',
                    }}
                >
                    <IconDisplay name={displayIcon} size={32} style={{ color: '#fff' }} />
                </Box>
                <Typography variant="h6" fontWeight={700} color="#fff">
                    {title}
                </Typography>
            </Box>

            {/* Body */}
            <DialogContent sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
                {typeof message === 'string' ? (
                    <Typography variant="body1" color="text.secondary">
                        {message}
                    </Typography>
                ) : (
                    message
                )}
            </DialogContent>

            {/* Actions */}
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
                        borderRadius: 2,
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
                            <IconDisplay name={displayIcon} size={18} style={{ color: '#fff', marginRight: 6 }} />
                            {confirmText}
                        </>
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Inline Toast — dipakai di beberapa tempat via named export
interface ToastProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    isOpen,
    onClose,
    message,
    type = 'success',
    duration = 1600,
}) => {
    React.useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    const severity = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';

    return (
        <Snackbar
            open={isOpen}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 96, md: 32 } }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ borderRadius: '999px', fontWeight: 600, alignItems: 'center' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default ConfirmDialog;
