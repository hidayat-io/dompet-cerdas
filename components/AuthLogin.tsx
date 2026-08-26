import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, getRedirectResult, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, Auth } from 'firebase/auth';
import { auth, googleProvider, browserPopupRedirectResolver } from '../firebase';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconDisplay from './IconDisplay';

const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const GoogleLogo: React.FC = () => (
    <svg width={20} height={20} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const features = [
    { icon: 'Zap', title: 'Catat Cepat', desc: '3 detik untuk input transaksi' },
    { icon: 'PieChart', title: 'Anggaran Terpantau', desc: 'Alert otomatis saat hampir habis' },
    { icon: 'Send', title: 'Telegram Bot', desc: 'Catat lewat chat & voice note' },
];

const AuthLogin: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
    const isE2EMode = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
    const testEmail = import.meta.env.VITE_E2E_TEST_EMAIL || 'e2e.test@dompet.local';
    const testPassword = import.meta.env.VITE_E2E_TEST_PASSWORD || 'E2eTest123!';

    useEffect(() => {
        let active = true;
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth as Auth, browserPopupRedirectResolver);
                if (result && active) {
                    console.log('Redirect sign-in successful:', result.user.email);
                }
            } catch (err: any) {
                if (!active) return;
                console.error('Redirect result error:', err);
                const errorCode = err.code;
                if (errorCode === 'auth/unauthorized-domain') {
                    setError('Domain ini belum diizinkan. Silakan hubungi admin.');
                } else if (err.message && !errorCode?.includes('popup')) {
                    setError(`Gagal login: ${err.message}`);
                }
            } finally {
                if (active) setIsCheckingRedirect(false);
            }
        };

        checkRedirectResult();
        return () => { active = false; };
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');

        if (!(auth as any).app) {
            setError("Firebase belum terinisialisasi. Silakan refresh halaman.");
            setIsLoading(false);
            return;
        }

        try {
            if (isMobile()) {
                await signInWithRedirect(auth as Auth, googleProvider as any, browserPopupRedirectResolver);
                return;
            }
            await signInWithPopup(auth as Auth, googleProvider as any, browserPopupRedirectResolver);
        } catch (err: any) {
            console.error("Login Error:", err);
            const errorCode = err.code;
            const errorMessage = err.message || '';

            if (errorCode === 'auth/cancelled-popup-request') {
                setError('Login dibatalkan.');
            } else if (errorCode === 'auth/popup-closed-by-user') {
                setError('Popup ditutup. Mencoba redirect...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any, browserPopupRedirectResolver);
                    return;
                } catch {
                    setError('Gagal login. Silakan coba lagi.');
                }
            } else if (errorCode === 'auth/popup-blocked') {
                setError('Popup diblokir. Mencoba redirect...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any, browserPopupRedirectResolver);
                    return;
                } catch {
                    setError('Gagal login. Silakan coba lagi.');
                }
            } else if (errorCode === 'auth/unauthorized-domain') {
                setError('Domain ini belum diizinkan di Firebase. Hubungi admin.');
            } else {
                setError(`Gagal login: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth as Auth, testEmail, testPassword);
        } catch (err: any) {
            if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
                await createUserWithEmailAndPassword(auth as Auth, testEmail, testPassword);
            } else {
                console.error('Test login error:', err);
                setError(`Gagal login test: ${err?.message || 'unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingRedirect) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Memeriksa status login...</Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
            {/* Logo & Tagline */}
            <Box sx={{ textAlign: 'center', mb: 4, maxWidth: 360 }}>
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 4,
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 8px 32px rgba(79,70,229,0.25)',
                    }}
                >
                    <IconDisplay name="Wallet" size={36} sx={{ color: '#fff' }} />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    DompetCerdas
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Kelola keuangan dengan lebih pintar dan terintegrasi
                </Typography>
            </Box>

            {/* Feature Highlights */}
            <Box sx={{ width: '100%', maxWidth: 360, mb: 4 }}>
                {features.map((feature) => (
                    <Box
                        key={feature.title}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            mb: 1.5,
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: 'primary.light',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <IconDisplay name={feature.icon} size={22} sx={{ color: 'primary.main' }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={700}>
                                {feature.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {feature.desc}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Login Card */}
            <Paper elevation={0} sx={{ width: '100%', maxWidth: 360, p: 3, borderRadius: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <GoogleLogo />}
                    sx={{
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        fontSize: 15,
                        bgcolor: '#4285F4',
                        '&:hover': { bgcolor: '#3367D6' },
                    }}
                >
                    Masuk dengan Google
                </Button>

                {isE2EMode && (
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleTestLogin}
                        disabled={isLoading}
                        sx={{
                            mt: 1.5,
                            py: 1.25,
                            borderRadius: 3,
                            fontWeight: 600,
                        }}
                        data-testid="auth-e2e-login"
                    >
                        Masuk Test
                    </Button>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                    Dengan masuk, kamu menyetujui bahwa data akan tersimpan aman di cloud Firebase
                </Typography>
            </Paper>
        </Box>
    );
};

export default AuthLogin;
