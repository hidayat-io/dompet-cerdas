import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, Auth } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import IconDisplay from './IconDisplay';

// Detect if running in iOS Safari or in-app browser (like Telegram, Instagram, etc.)
const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInAppBrowser = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    // Detect common in-app browsers
    return /fban|fbav|instagram|twitter|line|telegram|telegrambot|webview|wv\)|micromessenger|snapchat/i.test(ua) ||
        // Additional check for iOS WebView
        (isIOS() && !/(safari)/i.test(ua) && /applewebkit/i.test(ua));
};

const isSafari = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
};

// Should use redirect instead of popup? (for regular iOS Safari)
const shouldUseRedirect = (): boolean => {
    return isIOS() && isSafari() && !isInAppBrowser();
};

// Get the current URL for "Open in Browser" functionality
const getCurrentUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
};

// Open URL in external browser (iOS)
const openInExternalBrowser = () => {
    const currentUrl = getCurrentUrl();

    // For iOS, we can use the x-web-search scheme or just window.open
    // Most effective is to copy URL and show instructions
    if (isIOS()) {
        // Try to open in Safari using special URL scheme
        // This works on some iOS versions
        const safariUrl = `x-safari-${currentUrl}`;

        // Fallback: just open in new window (might open in Safari on iOS)
        window.open(currentUrl, '_blank');

        // Also try the safari scheme
        setTimeout(() => {
            window.location.href = safariUrl;
        }, 100);
    } else {
        window.open(currentUrl, '_blank');
    }
};

// Copy URL to clipboard
const copyUrlToClipboard = async (): Promise<boolean> => {
    const currentUrl = getCurrentUrl();
    try {
        await navigator.clipboard.writeText(currentUrl);
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
};

const AuthLogin: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
    const [urlCopied, setUrlCopied] = useState(false);
    const [showInAppWarning, setShowInAppWarning] = useState(false);

    // Check if we're in an in-app browser on mount
    useEffect(() => {
        setShowInAppWarning(isInAppBrowser());
    }, []);

    // Check for redirect result on page load
    useEffect(() => {
        const checkRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth as Auth);
                if (result) {
                    // User successfully signed in via redirect
                    console.log('Redirect sign-in successful:', result.user.email);
                }
            } catch (err: any) {
                console.error('Redirect result error:', err);
                const errorCode = err.code;
                if (errorCode === 'auth/unauthorized-domain') {
                    setError('Domain ini belum diizinkan di Firebase Console.');
                } else if (errorCode !== 'auth/popup-closed-by-user') {
                    // Don't show error for in-app browsers (expected to fail)
                    if (!isInAppBrowser()) {
                        setError(`Gagal login: ${err.message || 'Terjadi kesalahan'}`);
                    }
                }
            } finally {
                setIsCheckingRedirect(false);
            }
        };

        checkRedirectResult();
    }, []);

    const handleCopyUrl = async () => {
        const success = await copyUrlToClipboard();
        if (success) {
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 3000);
        }
    };

    const handleLogin = async () => {
        // If in-app browser, show warning instead of trying to login
        if (isInAppBrowser()) {
            setShowInAppWarning(true);
            return;
        }

        setIsLoading(true);
        setError('');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(auth as any).app) {
            setError("Firebase belum terinisialisasi. Silakan refresh halaman.");
            setIsLoading(false);
            return;
        }

        try {
            // Use redirect for iOS Safari (not in-app browser)
            if (shouldUseRedirect()) {
                console.log('Using signInWithRedirect for iOS Safari');
                await signInWithRedirect(auth as Auth, googleProvider as any);
                return;
            }

            // Use popup for desktop and other browsers
            console.log('Using signInWithPopup');
            await signInWithPopup(auth as Auth, googleProvider as any);
        } catch (err: any) {
            console.error("Login Error:", err);
            const errorCode = err.code;
            const errorMessage = err.message || '';

            if (errorCode === 'auth/cancelled-popup-request') {
                setError('Login dibatalkan.');
            } else if (errorCode === 'auth/popup-closed-by-user') {
                setError('Popup login ditutup. Mencoba metode alternatif...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any);
                    return;
                } catch (redirectErr: any) {
                    setError(`Gagal login: ${redirectErr.message || 'Terjadi kesalahan'}`);
                }
            } else if (errorCode === 'auth/popup-blocked') {
                setError('Popup diblokir browser. Mencoba metode alternatif...');
                try {
                    await signInWithRedirect(auth as Auth, googleProvider as any);
                    return;
                } catch (redirectErr: any) {
                    setError(`Gagal login: ${redirectErr.message || 'Terjadi kesalahan'}`);
                }
            } else if (errorCode === 'auth/unauthorized-domain') {
                setError('Domain ini belum diizinkan di Firebase Console.');
            } else {
                setError(`Gagal login: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking redirect result
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

                {/* In-App Browser Warning & Instructions */}
                {showInAppWarning && isInAppBrowser() ? (
                    <div className="space-y-4">
                        <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm border border-amber-200">
                            <div className="flex items-center gap-2 font-semibold mb-2">
                                <IconDisplay name="AlertCircle" size={18} />
                                <span>Buka di Browser</span>
                            </div>
                            <p className="text-xs text-amber-600 mb-3">
                                Login Google tidak bisa dilakukan di in-app browser.
                                Silakan buka halaman ini di Safari atau Chrome.
                            </p>

                            {/* Copy URL Button */}
                            <button
                                onClick={handleCopyUrl}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-2"
                            >
                                {urlCopied ? (
                                    <>
                                        <IconDisplay name="Check" size={18} />
                                        URL Disalin!
                                    </>
                                ) : (
                                    <>
                                        <IconDisplay name="Share" size={18} />
                                        Salin URL
                                    </>
                                )}
                            </button>

                            {/* Open in Browser Button */}
                            <button
                                onClick={openInExternalBrowser}
                                className="w-full bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <IconDisplay name="Globe" size={18} />
                                Buka di Safari
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Atau ketuk ••• di pojok kanan atas, lalu pilih "Open in Safari"
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Regular Login Button */}
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

                        {/* Hint for iOS users (not in-app browser) */}
                        {isIOS() && !isInAppBrowser() && (
                            <p className="text-xs text-blue-600 mt-4 bg-blue-50 p-2 rounded-lg">
                                ℹ️ Anda akan diarahkan ke halaman login Google
                            </p>
                        )}
                    </>
                )}

                <p className="text-xs text-gray-400 mt-6">
                    Dengan masuk, kamu menyetujui bahwa data akan tersimpan di cloud Firebase.
                </p>
            </div>
        </div>
    );
};

export default AuthLogin;