import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';

type LinkStatus = 'loading' | 'validating' | 'success' | 'invalid' | 'expired' | 'used' | 'not_logged_in' | 'error';

const LinkTelegram: React.FC = () => {
    const { theme } = useTheme();
    const [status, setStatus] = useState<LinkStatus>('loading');
    const [message, setMessage] = useState('Memuat...');
    const [user, setUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Wait for auth state to be ready
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, []);

    // Process linking after auth is ready
    useEffect(() => {
        if (authChecked) {
            linkTelegramAccount();
        }
    }, [authChecked]);

    const linkTelegramAccount = async () => {
        try {
            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                setStatus('invalid');
                setMessage('Token tidak ditemukan di URL');
                return;
            }

            // Check if user is logged in
            if (!user) {
                setStatus('not_logged_in');
                setMessage('Silakan login terlebih dahulu, lalu buka link ini lagi dari Telegram.');
                // Store the token in sessionStorage so we can use it after login
                sessionStorage.setItem('telegram_link_token', token);
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return;
            }

            setStatus('validating');
            setMessage('Memvalidasi token...');

            // Validate token from Firestore
            const tokenDoc = await getDoc(doc(db, 'link_tokens', token));

            if (!tokenDoc.exists()) {
                setStatus('invalid');
                setMessage('Token tidak valid atau sudah kadaluarsa.');
                return;
            }

            const tokenData = tokenDoc.data();

            // Check if already used
            if (tokenData.used) {
                setStatus('used');
                setMessage('Token sudah pernah digunakan. Silakan minta link baru dari Telegram Bot.');
                return;
            }

            // Check expiry (5 minutes)
            const createdAt = tokenData.createdAt.toDate();
            const now = new Date();
            const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (diffMinutes > 5) {
                setStatus('expired');
                setMessage('Token sudah kadaluarsa (max 5 menit). Silakan minta link baru dari Telegram Bot dengan mengirim /start.');
                return;
            }

            // Link Telegram ID to current user
            const telegramId = tokenData.telegramId;

            console.log('Linking telegram account:', { telegramId, userId: user.uid });

            // Create telegram_link document
            await setDoc(doc(db, `users/${user.uid}/telegram_link/main`), {
                telegramId,
                linkedAt: new Date().toISOString(),
                active: true,
                lastInteraction: new Date().toISOString(),
            });

            console.log('Created telegram_link document');

            // Mark token as used
            await updateDoc(doc(db, 'link_tokens', token), {
                used: true,
                usedAt: new Date().toISOString(),
            });

            console.log('Marked token as used');

            // Notify bot via Cloud Function
            try {
                const functionUrl = 'https://asia-southeast1-expensetracker-test-1.cloudfunctions.net/notifyLinkSuccess';
                console.log('Calling notifyLinkSuccess:', { telegramId, userId: user.uid });

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ telegramId, userId: user.uid }),
                });

                const result = await response.json();
                console.log('notifyLinkSuccess response:', result);

                if (!response.ok) {
                    console.warn('Bot notification failed, but linking was successful');
                }
            } catch (notifyError) {
                console.error('Failed to notify bot:', notifyError);
                // Continue anyway, link is successful
            }

            setStatus('success');
            setMessage('🎉 Akun berhasil terhubung! Silakan kembali ke Telegram Bot untuk mulai menggunakan fitur.');

        } catch (error) {
            console.error('Error linking account:', error);
            setStatus('error');
            setMessage('Terjadi kesalahan. Silakan coba lagi.');
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
            case 'validating':
                return '🔄';
            case 'success':
                return '✅';
            case 'invalid':
            case 'expired':
            case 'used':
                return '❌';
            case 'not_logged_in':
                return '🔒';
            case 'error':
                return '⚠️';
            default:
                return '❓';
        }
    };

    const getStatusTitle = () => {
        switch (status) {
            case 'loading':
                return 'Memuat...';
            case 'validating':
                return 'Memvalidasi...';
            case 'success':
                return 'Berhasil Terhubung!';
            case 'invalid':
                return 'Token Tidak Valid';
            case 'expired':
                return 'Token Kadaluarsa';
            case 'used':
                return 'Token Sudah Digunakan';
            case 'not_logged_in':
                return 'Belum Login';
            case 'error':
                return 'Terjadi Kesalahan';
            default:
                return 'Unknown';
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                backgroundColor: theme.colors.bgPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                style={{
                    backgroundColor: theme.colors.bgCard,
                    borderRadius: '16px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
            >
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                    {getStatusIcon()}
                </div>

                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: theme.colors.textPrimary,
                        marginBottom: '12px',
                    }}
                >
                    {getStatusTitle()}
                </h1>

                <p
                    style={{
                        fontSize: '16px',
                        color: theme.colors.textSecondary,
                        marginBottom: '24px',
                        lineHeight: '1.6',
                    }}
                >
                    {message}
                </p>

                {(status === 'loading' || status === 'validating') && (
                    <div
                        style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            border: `4px solid ${theme.colors.bgMuted}`,
                            borderTop: `4px solid ${theme.colors.accent}`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                )}

                {status === 'success' && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ fontSize: '14px', color: theme.colors.textMuted, marginBottom: '16px' }}>
                            Anda bisa menutup halaman ini dan kembali ke Telegram.
                        </p>
                        <button
                            onClick={() => window.close()}
                            style={{
                                backgroundColor: theme.colors.accent,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                                marginRight: '8px',
                            }}
                        >
                            Tutup Halaman
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                backgroundColor: 'transparent',
                                color: theme.colors.accent,
                                border: `1px solid ${theme.colors.accent}`,
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            Buka Dashboard
                        </button>
                    </div>
                )}

                {status === 'not_logged_in' && (
                    <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '14px', color: theme.colors.textMuted }}>
                            Mengalihkan ke halaman login...
                        </p>
                    </div>
                )}

                {(status === 'invalid' || status === 'expired' || status === 'used' || status === 'error') && (
                    <div style={{ marginTop: '16px' }}>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                backgroundColor: theme.colors.accent,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LinkTelegram;
