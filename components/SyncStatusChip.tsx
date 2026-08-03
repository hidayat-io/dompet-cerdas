import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';

export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error' | 'uploading';

interface SyncStatusChipProps {
    status: SyncStatus;
    label?: string;
    size?: 'small' | 'medium';
    onRetry?: () => void;
}

const statusConfig: Record<SyncStatus, { icon: string; label: string; colorKey: 'income' | 'warning' | 'error' | 'info' | 'textMuted' }> = {
    synced: { icon: 'CheckCircle', label: 'Tersinkron', colorKey: 'income' },
    pending: { icon: 'Clock', label: 'Menunggu sinkronisasi', colorKey: 'warning' },
    offline: { icon: 'WifiOff', label: 'Offline', colorKey: 'textMuted' },
    error: { icon: 'AlertCircle', label: 'Gagal sinkron', colorKey: 'error' },
    uploading: { icon: 'Loader', label: 'Mengupload...', colorKey: 'info' },
};

const SyncStatusChip: React.FC<SyncStatusChipProps> = ({ status, label, size = 'small', onRetry }) => {
    const { theme } = useTheme();
    const config = statusConfig[status];
    const displayLabel = label || config.label;

    const colorMap: Record<string, { color: string; bgcolor: string }> = {
        income: { color: theme.colors.income, bgcolor: theme.colors.incomeBg },
        warning: { color: theme.colors.warning, bgcolor: theme.colors.warningBg },
        error: { color: theme.colors.error, bgcolor: theme.colors.errorLight },
        info: { color: theme.colors.info, bgcolor: theme.colors.infoBg },
        textMuted: { color: theme.colors.textMuted, bgcolor: theme.colors.bgHover },
    };

    const { color, bgcolor } = colorMap[config.colorKey];

    return (
        <Chip
            size={size}
            icon={
                status === 'uploading' ? (
                    <CircularProgress size={12} sx={{ color: 'inherit !important' }} />
                ) : (
                    <IconDisplay name={config.icon} size={14} sx={{ color: 'inherit' }} />
                )
            }
            label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {displayLabel}
                    {onRetry && status === 'error' && (
                        <Box
                            component="span"
                            onClick={onRetry}
                            sx={{
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                ml: 0.5,
                                '&:hover': { opacity: 0.8 },
                            }}
                        >
                            Coba lagi
                        </Box>
                    )}
                </Box>
            }
            sx={{
                bgcolor,
                color,
                fontWeight: 600,
                height: size === 'small' ? 24 : 32,
                fontSize: size === 'small' ? 11 : 13,
                '& .MuiChip-icon': { color },
            }}
        />
    );
};

export default SyncStatusChip;
