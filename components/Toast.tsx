import React, { useEffect } from 'react';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { IconName } from '../types';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 1600,
    onClose
}) => {
    const { theme } = useTheme();

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

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

export default Toast;
