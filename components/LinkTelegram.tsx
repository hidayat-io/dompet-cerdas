import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { callCloudFunction } from '../services/firebaseRuntime';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

type LinkStatus = 'loading' | 'validating' | 'success' | 'invalid' | 'expired' | 'used' | 'not_logged_in' | 'error';

const LinkTelegram: React.FC = () => {
    const [status, setStatus] = useState<LinkStatus>('loading');
    const [message, setMessage] = useState('Memuat...');
    const [user, setUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [linkedAccountName, setLinkedAccountName] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (authChecked) {
            linkTelegramAccount();
        }
    }, [authChecked]);

    const linkTelegramAccount = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                setStatus('invalid');
                setMessage('Token tidak ditemukan di URL');
                return;
            }

            if (!user) {
                setStatus('not_logged_in');
                setMessage('Silakan login terlebih dahulu, lalu buka link ini lagi dari Telegram.');
                sessionStorage.setItem('telegram_link_token', token);
                setTimeout(() => { window.location.href = '/'; }, 3000);
                return;
            }

            setStatus('validating');
            setMessage('Memvalidasi token...');
            setMessage('Menghubungkan akun Telegram...');

            console.log('Calling linkTelegram function:', { userId: user.uid });
            const result = await callCloudFunction<{ token: string }, { telegramId?: number; accountName?: string }>('linkTelegram', { token });
            const telegramId = result?.telegramId;
            const accountName = result?.accountName;
            console.log('linkTelegram response:', result);
            if (accountName) setLinkedAccountName(accountName);

            try {
                setMessage('Mengirim notifikasi ke Telegram...');
                console.log('Calling notifyLinkSuccess:', { telegramId });
                await callCloudFunction<{ telegramId: number; accountName?: string }, { success: boolean }>(
                    'notifyLinkSuccess',
                    { telegramId: telegramId!, accountName }
                );
                console.log('notifyLinkSuccess completed');
            } catch (notifyError) {
                console.error('Failed to notify bot:', notifyError);
            }

            setStatus('success');
            sessionStorage.removeItem('telegram_link_token');
            setMessage(accountName
                ? `Akun berhasil terhubung! Telegram sekarang akan memakai Akun Keuangan "${accountName}".`
                : 'Akun berhasil terhubung! Silakan kembali ke Telegram Bot untuk mulai menggunakan fitur.');

        } catch (error: any) {
            console.error('Error linking account:', error);
            const reason = error?.details?.reason;
            if (reason === 'invalid') {
                setStatus('invalid');
                sessionStorage.removeItem('telegram_link_token');
                setMessage('Token tidak valid atau sudah kadaluarsa.');
            } else if (reason === 'used') {
                setStatus('used');
                sessionStorage.removeItem('telegram_link_token');
                setMessage('Token sudah pernah digunakan. Silakan minta link baru dari Telegram Bot.');
            } else if (reason === 'expired') {
                setStatus('expired');
                sessionStorage.removeItem('telegram_link_token');
                setMessage('Token sudah kadaluarsa (max 5 menit). Silakan minta link baru dari Telegram Bot dengan mengirim /start.');
            } else {
                setStatus('error');
                setMessage('Terjadi kesalahan. Silakan coba lagi.');
            }
        }
    };

    const statusEmoji: Record<LinkStatus, string> = {
        loading: '🔄', validating: '🔄', success: '✅',
        invalid: '❌', expired: '❌', used: '❌',
        not_logged_in: '🔒', error: '⚠️',
    };

    const statusTitle: Record<LinkStatus, string> = {
        loading: 'Memuat...', validating: 'Memvalidasi...',
        success: 'Berhasil Terhubung!', invalid: 'Token Tidak Valid',
        expired: 'Token Kadaluarsa', used: 'Token Sudah Digunakan',
        not_logged_in: 'Belum Login', error: 'Terjadi Kesalahan',
    };

    const isLoading = status === 'loading' || status === 'validating';
    const isError = ['invalid', 'expired', 'used', 'error'].includes(status);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2.5 }}>
            <Paper
                elevation={3}
                sx={{ borderRadius: 3, p: 5, maxWidth: 500, width: '100%', textAlign: 'center' }}
            >
                <Typography variant="h1" sx={{ fontSize: 64, mb: 2.5, lineHeight: 1 }}>
                    {statusEmoji[status]}
                </Typography>

                <Typography variant="h5" fontWeight={700} gutterBottom>
                    {statusTitle[status]}
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                    {message}
                </Typography>

                {isLoading && <CircularProgress size={40} />}

                {status === 'success' && (
                    <Box sx={{ mt: 2 }}>
                        {linkedAccountName && (
                            <Alert severity="info" sx={{ mb: 2, textAlign: 'left', borderRadius: 2 }}>
                                Akun aktif untuk Telegram: <strong>{linkedAccountName}</strong>
                            </Alert>
                        )}
                        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                            Anda bisa menutup halaman ini dan kembali ke Telegram.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button variant="contained" onClick={() => window.close()} sx={{ borderRadius: 2, fontWeight: 600 }}>
                                Tutup Halaman
                            </Button>
                            <Button variant="outlined" onClick={() => { window.location.href = '/'; }} sx={{ borderRadius: 2, fontWeight: 600 }}>
                                Buka Dashboard
                            </Button>
                        </Box>
                    </Box>
                )}

                {status === 'not_logged_in' && (
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                        Mengalihkan ke halaman login...
                    </Typography>
                )}

                {isError && (
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => { window.location.href = '/'; }}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                            Kembali ke Dashboard
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default LinkTelegram;
