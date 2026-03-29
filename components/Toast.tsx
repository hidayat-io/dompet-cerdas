import React, { useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const severity = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';

    return (
        <Snackbar
            open
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

export default Toast;
