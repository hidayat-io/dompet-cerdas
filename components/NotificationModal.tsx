import React, { useEffect, useState } from 'react';
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
    autoCloseDuration = 3000
}) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (isOpen && autoClose && onClose && type !== 'loading') {
            // Reset progress
            setProgress(100);

            // Countdown timer
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDuration);

            // Progress animation
            const startTime = Date.now();
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / autoCloseDuration) * 100);
                setProgress(remaining);

                if (remaining <= 0) {
                    clearInterval(progressInterval);
                }
            }, 16); // ~60fps

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [isOpen, autoClose, autoCloseDuration, onClose, type]);

    if (!isOpen) return null;

    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'CheckCircle',
                    bgColor: '#10B981',
                    iconBg: '#D1FAE5',
                    iconColor: '#059669'
                };
            case 'error':
                return {
                    icon: 'XCircle',
                    bgColor: '#EF4444',
                    iconBg: '#FEE2E2',
                    iconColor: '#DC2626'
                };
            case 'warning':
                return {
                    icon: 'AlertTriangle',
                    bgColor: '#F59E0B',
                    iconBg: '#FEF3C7',
                    iconColor: '#D97706'
                };
            case 'info':
                return {
                    icon: 'Info',
                    bgColor: '#3B82F6',
                    iconBg: '#DBEAFE',
                    iconColor: '#2563EB'
                };
            case 'loading':
                return {
                    icon: 'Loader',
                    bgColor: '#8B5CF6',
                    iconBg: '#EDE9FE',
                    iconColor: '#7C3AED'
                };
        }
    };

    const config = getTypeConfig();

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={type !== 'loading' && onClose ? onClose : undefined}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in"
                style={{ backgroundColor: theme.colors.bgCard }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: config.iconBg }}
                    >
                        {type === 'loading' ? (
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
                                style={{ borderColor: config.iconColor, borderTopColor: 'transparent' }}
                            />
                        ) : (
                            <IconDisplay name={config.icon} size={32} style={{ color: config.iconColor }} />
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3
                    className="text-xl font-bold text-center mb-2"
                    style={{ color: theme.colors.textPrimary }}
                >
                    {title}
                </h3>

                {/* Message */}
                <p
                    className="text-center text-sm mb-4"
                    style={{ color: theme.colors.textSecondary }}
                >
                    {message}
                </p>

                {/* Auto-close countdown progress bar */}
                {autoClose && type !== 'loading' && (
                    <div className="mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>
                                Auto-close dalam {Math.ceil((progress / 100) * (autoCloseDuration / 1000))} detik
                            </span>
                        </div>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.bgMuted }}>
                            <div
                                className="h-full transition-all ease-linear"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: config.bgColor,
                                    transitionDuration: '16ms'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Close Button (only if not loading and onClose is provided) */}
                {type !== 'loading' && onClose && (
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: config.bgColor }}
                    >
                        OK
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationModal;
