import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconDisplay from './IconDisplay';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotificationModalProps {
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    onClose?: () => void;
    autoClose?: boolean;
    autoCloseDuration?: number;
}

const typeConfig: Record<NotificationType, {
    icon: string;
    accent: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
    label: string;
}> = {
    success: {
        icon: 'CheckCircle',
        accent: '#10B981',
        iconBg: 'radial-gradient(circle at top, #ECFDF5 0%, #D1FAE5 100%)',
        iconColor: '#059669',
        badgeBg: '#ECFDF5',
        badgeColor: '#047857',
        label: 'Sukses'
    },
    error: {
        icon: 'XCircle',
        accent: '#EF4444',
        iconBg: 'radial-gradient(circle at top, #FEF2F2 0%, #FEE2E2 100%)',
        iconColor: '#DC2626',
        badgeBg: '#FEF2F2',
        badgeColor: '#B91C1C',
        label: 'Gagal'
    },
    warning: {
        icon: 'AlertTriangle',
        accent: '#F59E0B',
        iconBg: 'radial-gradient(circle at top, #FFFBEB 0%, #FEF3C7 100%)',
        iconColor: '#D97706',
        badgeBg: '#FFFBEB',
        badgeColor: '#B45309',
        label: 'Perhatian'
    },
    info: {
        icon: 'Info',
        accent: '#3B82F6',
        iconBg: 'radial-gradient(circle at top, #EFF6FF 0%, #DBEAFE 100%)',
        iconColor: '#2563EB',
        badgeBg: '#EFF6FF',
        badgeColor: '#1D4ED8',
        label: 'Info'
    },
    loading: {
        icon: 'Loader',
        accent: '#8B5CF6',
        iconBg: 'radial-gradient(circle at top, #F5F3FF 0%, #EDE9FE 100%)',
        iconColor: '#7C3AED',
        badgeBg: '#F5F3FF',
        badgeColor: '#6D28D9',
        label: 'Memproses'
    },
};

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    type,
    title,
    message,
    onClose,
    autoClose = false,
    autoCloseDuration = 1600
}) => {
    useEffect(() => {
        if (isOpen && autoClose && onClose && type !== 'loading') {
            const timer = setTimeout(onClose, autoCloseDuration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDuration, onClose, type]);

    const config = typeConfig[type];
    const showManualClose = type !== 'loading' && !autoClose && onClose;

    return (
        <Dialog
            open={isOpen}
            onClose={type !== 'loading' && onClose ? onClose : undefined}
            maxWidth="xs"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
        >
            <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
                <Chip
                    label={config.label}
                    size="small"
                    sx={{
                        mb: 2,
                        bgcolor: config.badgeBg,
                        color: config.badgeColor,
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        height: 24,
                    }}
                />

                <Box
                    sx={{
                        mx: 'auto',
                        mb: 2,
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: `${config.accent}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {type === 'loading' ? (
                        <CircularProgress size={30} sx={{ color: config.iconColor }} />
                    ) : (
                        <IconDisplay name={config.icon} size={34} sx={{ color: config.iconColor }} />
                    )}
                </Box>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    {title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 288, mx: 'auto', lineHeight: 1.7 }}>
                    {message}
                </Typography>

                {autoClose && type !== 'loading' && (
                    <Alert severity={type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} sx={{ mt: 2, textAlign: 'left' }}>
                        Notifikasi ini akan tertutup otomatis.
                    </Alert>
                )}
            </DialogContent>

            {showManualClose ? (
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button fullWidth variant="contained" onClick={onClose}>
                        Mengerti
                    </Button>
                </DialogActions>
            ) : null}
        </Dialog>
    );
};

export default NotificationModal;
