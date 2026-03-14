import React from 'react';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
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

const typeConfig: Record<DialogType, { bgColor: string; iconBg: string; iconColor: string; buttonBg: string; buttonHover: string }> = {
    danger: {
        bgColor: 'bg-red-600',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        buttonBg: 'bg-red-600',
        buttonHover: 'hover:bg-red-700'
    },
    warning: {
        bgColor: 'bg-amber-500',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        buttonBg: 'bg-amber-500',
        buttonHover: 'hover:bg-amber-600'
    },
    success: {
        bgColor: 'bg-emerald-500',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        buttonBg: 'bg-emerald-500',
        buttonHover: 'hover:bg-emerald-600'
    },
    info: {
        bgColor: 'bg-blue-500',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        buttonBg: 'bg-blue-500',
        buttonHover: 'hover:bg-blue-600'
    }
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
    const { theme } = useTheme();
    const config = typeConfig[type];
    const displayIcon = icon || defaultIcons[type];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div
                className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-fade-in-up"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                {/* Header with Icon */}
                <div className={`${config.bgColor} p-6 flex flex-col items-center text-center`}>
                    <div className={`${config.iconBg} p-4 rounded-full mb-4`}>
                        <IconDisplay name={displayIcon} size={32} className={config.iconColor} />
                    </div>
                    <h3 className="text-white font-bold text-xl">{title}</h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="text-center mb-6" style={{ color: theme.colors.textSecondary }}>
                        {typeof message === 'string' ? <p>{message}</p> : message}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: theme.colors.bgHover,
                                color: theme.colors.textPrimary,
                                border: `1px solid ${theme.colors.border}`
                            }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${config.buttonBg} ${config.buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <IconDisplay name={displayIcon} size={18} />
                                    <span>{confirmText}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Toast/Notification for success/error messages
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
    duration = 1600
}) => {
    const { theme } = useTheme();

    React.useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const toastConfig = {
        success: {
            bg: theme.colors.incomeBg,
            color: theme.colors.income,
            icon: 'CheckCircle' as IconName
        },
        error: {
            bg: theme.colors.expenseBg,
            color: theme.colors.expense,
            icon: 'XCircle' as IconName
        },
        info: {
            bg: theme.colors.accentLight,
            color: theme.colors.accent,
            icon: 'Info' as IconName
        }
    };

    const config = toastConfig[type];

    return (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div
                className="flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border"
                style={{
                    backgroundColor: config.bg,
                    borderColor: config.color + '40'
                }}
            >
                <IconDisplay name={config.icon} size={20} style={{ color: config.color }} />
                <span className="font-medium text-sm" style={{ color: config.color }}>
                    {message}
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full transition-colors hover:opacity-70"
                    style={{ color: config.color }}
                >
                    <IconDisplay name="X" size={16} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmDialog;
