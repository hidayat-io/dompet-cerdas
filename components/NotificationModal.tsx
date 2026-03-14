import React, { useEffect } from 'react';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

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

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    type,
    title,
    message,
    onClose,
    autoClose = false,
    autoCloseDuration = 1600
}) => {
    const { theme } = useTheme();

    useEffect(() => {
        if (isOpen && autoClose && onClose && type !== 'loading') {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDuration);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [isOpen, autoClose, autoCloseDuration, onClose, type]);

    if (!isOpen) return null;

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'CheckCircle',
                    accent: '#10B981',
                    iconBg: 'radial-gradient(circle at top, #ECFDF5 0%, #D1FAE5 100%)',
                    iconColor: '#059669',
                    badgeBg: '#ECFDF5',
                    badgeColor: '#047857',
                    label: 'Sukses'
                };
            case 'error':
                return {
                    icon: 'XCircle',
                    accent: '#EF4444',
                    iconBg: 'radial-gradient(circle at top, #FEF2F2 0%, #FEE2E2 100%)',
                    iconColor: '#DC2626',
                    badgeBg: '#FEF2F2',
                    badgeColor: '#B91C1C',
                    label: 'Gagal'
                };
            case 'warning':
                return {
                    icon: 'AlertTriangle',
                    accent: '#F59E0B',
                    iconBg: 'radial-gradient(circle at top, #FFFBEB 0%, #FEF3C7 100%)',
                    iconColor: '#D97706',
                    badgeBg: '#FFFBEB',
                    badgeColor: '#B45309',
                    label: 'Perhatian'
                };
            case 'info':
                return {
                    icon: 'Info',
                    accent: '#3B82F6',
                    iconBg: 'radial-gradient(circle at top, #EFF6FF 0%, #DBEAFE 100%)',
                    iconColor: '#2563EB',
                    badgeBg: '#EFF6FF',
                    badgeColor: '#1D4ED8',
                    label: 'Info'
                };
            case 'loading':
                return {
                    icon: 'Loader',
                    accent: '#8B5CF6',
                    iconBg: 'radial-gradient(circle at top, #F5F3FF 0%, #EDE9FE 100%)',
                    iconColor: '#7C3AED',
                    badgeBg: '#F5F3FF',
                    badgeColor: '#6D28D9',
                    label: 'Memproses'
                };
        }
    };

    const config = getTypeConfig();
    const showManualClose = type !== 'loading' && !autoClose && onClose;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
            style={{
                backgroundColor: theme.name === 'dark' ? 'rgba(2, 6, 23, 0.72)' : 'rgba(15, 23, 42, 0.42)',
                backdropFilter: 'blur(10px)'
            }}
            onClick={type !== 'loading' && onClose ? onClose : undefined}
        >
            <div
                className="relative w-full max-w-[24rem] overflow-hidden rounded-[28px] border p-6 shadow-2xl animate-scale-in"
                style={{
                    background: theme.name === 'dark'
                        ? `linear-gradient(180deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.98) 100%)`
                        : `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)`,
                    borderColor: theme.name === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.16)',
                    boxShadow: theme.name === 'dark'
                        ? '0 28px 80px rgba(2, 6, 23, 0.55)'
                        : '0 28px 80px rgba(15, 23, 42, 0.18)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-b-[32px] opacity-80"
                    style={{
                        background: `linear-gradient(180deg, ${config.accent}22 0%, transparent 100%)`
                    }}
                />

                {showManualClose && (
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105"
                        style={{
                            backgroundColor: theme.name === 'dark' ? 'rgba(51,65,85,0.7)' : 'rgba(255,255,255,0.92)',
                            border: `1px solid ${theme.colors.border}`,
                            color: theme.colors.textSecondary
                        }}
                        aria-label="Tutup notifikasi"
                    >
                        <IconDisplay name="X" size={16} />
                    </button>
                )}

                <div className="relative flex flex-col items-center text-center">
                    <div
                        className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                            backgroundColor: config.badgeBg,
                            color: config.badgeColor
                        }}
                    >
                        {config.label}
                    </div>

                    <div
                        className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-[28px]"
                        style={{
                            background: config.iconBg,
                            boxShadow: `0 18px 40px ${config.accent}22`
                        }}
                    >
                        <div
                            className="absolute inset-3 rounded-[20px]"
                            style={{
                                border: `1px solid ${config.accent}20`
                            }}
                        />
                        {type === 'loading' ? (
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
                                style={{ borderColor: config.iconColor, borderTopColor: 'transparent' }}
                            />
                        ) : (
                            <IconDisplay name={config.icon} size={42} style={{ color: config.iconColor }} />
                        )}
                    </div>

                    <h3
                        className="mb-2 text-[1.45rem] font-bold leading-tight"
                        style={{ color: theme.colors.textPrimary }}
                    >
                        {title}
                    </h3>

                    <p
                        className="max-w-[18rem] text-sm leading-6"
                        style={{ color: theme.colors.textSecondary }}
                    >
                        {message}
                    </p>

                    {autoClose && type !== 'loading' && (
                        <div
                            className="mt-5 h-1.5 w-20 rounded-full"
                            style={{
                                background: `linear-gradient(90deg, ${config.accent} 0%, ${config.accent}55 100%)`
                            }}
                        />
                    )}

                    {showManualClose && (
                        <button
                            onClick={onClose}
                            className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-all hover:translate-y-[-1px] hover:opacity-95"
                            style={{
                                background: `linear-gradient(135deg, ${config.accent} 0%, ${config.accent}DD 100%)`,
                                boxShadow: `0 16px 32px ${config.accent}30`
                            }}
                        >
                            Mengerti
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
