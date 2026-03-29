import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(10px)' } } }}
            PaperProps={{
                sx: {
                    borderRadius: '28px',
                    overflow: 'hidden',
                    backgroundImage: 'none',
                }
            }}
        >
            <Box sx={{ position: 'relative', p: 3, textAlign: 'center' }}>
                {/* Accent glow at top */}
                <Box
                    sx={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        inset: '0 32px auto 32px',
                        height: 96,
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                        opacity: 0.8,
                        background: `linear-gradient(180deg, ${config.accent}22 0%, transparent 100%)`
                    }}
                />

                {/* Manual close button */}
                {showManualClose && (
                    <Box
                        component="button"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 1,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'text.secondary',
                            transition: 'transform 0.15s',
                            '&:hover': { transform: 'scale(1.05)' },
                        }}
                        aria-label="Tutup notifikasi"
                    >
                        <IconDisplay name="X" size={16} />
                    </Box>
                )}

                {/* Badge */}
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

                {/* Icon */}
                <Box
                    sx={{
                        mx: 'auto',
                        mb: 2.5,
                        width: 96,
                        height: 96,
                        borderRadius: '28px',
                        background: config.iconBg,
                        boxShadow: `0 18px 40px ${config.accent}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 12,
                            borderRadius: '20px',
                            border: `1px solid ${config.accent}20`,
                        }
                    }}
                >
                    {type === 'loading' ? (
                        <CircularProgress size={34} sx={{ color: config.iconColor }} />
                    ) : (
                        <IconDisplay name={config.icon} size={42} style={{ color: config.iconColor }} />
                    )}
                </Box>

                {/* Title */}
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
                    {title}
                </Typography>

                {/* Message */}
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 288, mx: 'auto', lineHeight: 1.7 }}>
                    {message}
                </Typography>

                {/* Auto-close indicator */}
                {autoClose && type !== 'loading' && (
                    <Box
                        sx={{
                            mt: 2.5,
                            mx: 'auto',
                            height: 6,
                            width: 80,
                            borderRadius: '999px',
                            background: `linear-gradient(90deg, ${config.accent} 0%, ${config.accent}55 100%)`
                        }}
                    />
                )}

                {/* Manual close button */}
                {showManualClose && (
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={onClose}
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            py: 1.25,
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${config.accent} 0%, ${config.accent}DD 100%)`,
                            boxShadow: `0 16px 32px ${config.accent}30`,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${config.accent} 0%, ${config.accent}DD 100%)`,
                                filter: 'brightness(0.93)',
                            },
                        }}
                    >
                        Mengerti
                    </Button>
                )}
            </Box>
        </Dialog>
    );
};

export default NotificationModal;
