import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, Auth } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import IconDisplay from './IconDisplay';

// Detect mobile devices
const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const AuthLogin: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

    // Check for redirect result on page load (for mobile redirect flow)
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth as Auth);
                if (result) {
                    console.log('Redirect sign-in successful:', result.user.email);
                }
            } catch (err: any) {
                console.error('Redirect result error:', err);
                const errorCode = err.code;

                if (errorCode === 'auth/unauthorized-domain') {
                    setError('Domain ini belum diizinkan. Silakan hubungi admin.');
                } else if (err.message && !errorCode?.includes('popup')) {
                    setError(`Gagal login: ${err.message}`);
                }
            } finally {
                setIsCheckingRedirect(false);
            }
        };

        checkRedirectResult();
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        setError('');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(auth as any).app) {
            setError("Firebase belum terinisialisasi. Silakan refresh halaman.");
            setIsLoading(false);
            return;
        }

        try {
            // Use redirect for mobile, popup for desktop
            if (isMobile()) {
                console.log('Using signInWithRedirect for mobile');
                await signInWithRedirect(auth as Auth, googleProvider as any);
                // Page will redirect, so no code after this runs
                return;
            }

            // Desktop: use popup
            console.log('Using signInWithPopup for desktop');
            await signInWithPopup(auth as Auth, googleProvider as any);
        } catch (err: any) {
            console.error("Login Error:", err);
            const errorCode = err.code;
            const errorMessage = err.message || '';

            if (errorCode === 'auth/cancelled-popup-request') {
                setError('Login dibatalkan.');
            } else if (errorCode === 'auth/popup-closed-by-user') {
                // Try redirect as fallback
                setError('Popup ditutup. Mencoba redirect...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any);
                    return;
                } catch {
                    setError('Gagal login. Silakan coba lagi.');
                }
            } else if (errorCode === 'auth/popup-blocked') {
                // Try redirect as fallback
                setError('Popup diblokir. Mencoba redirect...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any);
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

    // Loading state while checking redirect result
    if (isCheckingRedirect) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-fade-in-up transition-all border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Memeriksa status login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-fade-in-up transition-all border border-gray-100">
                <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                    <IconDisplay name="Wallet" size={32} className="text-white" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">DompetCerdas</h1>
                <p className="text-gray-500 mb-6">Kelola keuanganmu dengan lebih pintar, aman, dan terintegrasi di cloud.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 flex items-start gap-2 text-left border border-red-100">
                        <IconDisplay name="AlertCircle" size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Masuk dengan Google
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-400 mt-6">
                    Dengan masuk, kamu menyetujui bahwa data akan tersimpan di cloud Firebase.
                </p>
            </div>
        </div>
    );
};

export default AuthLogin;