import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import { Toast } from './ConfirmDialog';

interface SettingsProps {
    onDeleteAllTransactions: () => Promise<void>;
    transactionCount: number;
}

const Settings: React.FC<SettingsProps> = ({ onDeleteAllTransactions, transactionCount }) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const handleDeleteAll = async () => {
        if (deleteConfirmText !== 'HAPUS SEMUA') {
            return;
        }

        setIsDeleting(true);
        try {
            await onDeleteAllTransactions();
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
            setToast({ show: true, message: 'Semua transaksi berhasil dihapus!', type: 'success' });
        } catch (error) {
            console.error('Error deleting transactions:', error);
            setToast({ show: true, message: 'Gagal menghapus transaksi. Silakan coba lagi.', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <h2
                className="text-2xl font-bold"
                style={{ color: theme.colors.textPrimary }}
            >
                Pengaturan
            </h2>

            {/* Theme Section - Simple Toggle */}
            <div
                className="rounded-xl border p-6"
                style={{
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.border
                }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="p-3 rounded-xl"
                            style={{ backgroundColor: theme.colors.accentLight }}
                        >
                            <IconDisplay
                                name={isDark ? "Moon" : "Sun"}
                                size={24}
                                style={{ color: theme.colors.accent }}
                            />
                        </div>
                        <div>
                            <h3
                                className="font-semibold text-lg"
                                style={{ color: theme.colors.textPrimary }}
                            >
                                Mode {isDark ? 'Gelap' : 'Terang'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                {isDark ? 'Tampilan gelap untuk mata yang nyaman' : 'Tampilan terang untuk penggunaan sehari-hari'}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={toggleTheme}
                        className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            backgroundColor: isDark ? theme.colors.accent : theme.colors.bgMuted
                        }}
                    >
                        <span className="sr-only">Toggle theme</span>
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${isDark ? 'translate-x-8' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Theme Preview Cards */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {/* Light Theme Card */}
                    <button
                        onClick={() => !isDark || toggleTheme()}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${!isDark ? 'ring-2 ring-offset-2' : ''
                            }`}
                        style={{
                            backgroundColor: themes.light.colors.bgCard,
                            borderColor: !isDark ? theme.colors.accent : themes.light.colors.border,
                            ...((!isDark) && { ringColor: theme.colors.accent })
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: themes.light.colors.accentLight }}
                            >
                                <IconDisplay name="Sun" size={20} style={{ color: '#f59e0b' }} />
                            </div>
                            <span
                                className="font-medium"
                                style={{ color: themes.light.colors.textPrimary }}
                            >
                                Terang
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.light.colors.bgPrimary, border: '1px solid #e5e7eb' }}></div>
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.light.colors.accent }}></div>
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.light.colors.income }}></div>
                        </div>
                        {!isDark && (
                            <div
                                className="mt-3 text-xs font-medium py-1 px-2 rounded-full text-center"
                                style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                            >
                                ✓ Aktif
                            </div>
                        )}
                    </button>

                    {/* Dark Theme Card */}
                    <button
                        onClick={() => isDark || toggleTheme()}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${isDark ? 'ring-2 ring-offset-2' : ''
                            }`}
                        style={{
                            backgroundColor: themes.dark.colors.bgCard,
                            borderColor: isDark ? theme.colors.accent : themes.dark.colors.border,
                            ...((isDark) && { ringColor: theme.colors.accent })
                        }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: themes.dark.colors.accentLight }}
                            >
                                <IconDisplay name="Moon" size={20} style={{ color: '#a78bfa' }} />
                            </div>
                            <span
                                className="font-medium"
                                style={{ color: themes.dark.colors.textPrimary }}
                            >
                                Gelap
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.dark.colors.bgPrimary }}></div>
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.dark.colors.accent }}></div>
                            <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: themes.dark.colors.income }}></div>
                        </div>
                        {isDark && (
                            <div
                                className="mt-3 text-xs font-medium py-1 px-2 rounded-full text-center"
                                style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                            >
                                ✓ Aktif
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Danger Zone - Delete All Transactions */}
            <div
                className="rounded-xl border p-6"
                style={{
                    backgroundColor: theme.colors.bgCard,
                    borderColor: isDark ? '#991b1b' : '#fecaca'
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }}>
                        <IconDisplay name="AlertCircle" size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-500">
                            Zona Berbahaya
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Tindakan di bawah ini tidak dapat dibatalkan
                        </p>
                    </div>
                </div>

                <div
                    className="p-4 rounded-lg border"
                    style={{
                        backgroundColor: theme.colors.bgHover,
                        borderColor: theme.colors.border
                    }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p
                                className="font-medium"
                                style={{ color: theme.colors.textPrimary }}
                            >
                                Hapus Semua Transaksi
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: theme.colors.textSecondary }}
                            >
                                {transactionCount > 0
                                    ? `Anda memiliki ${transactionCount} transaksi yang akan dihapus permanen.`
                                    : 'Tidak ada transaksi untuk dihapus.'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={transactionCount === 0}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 flex-shrink-0 ${transactionCount === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                        >
                            <IconDisplay name="Trash2" size={16} />
                            Hapus Semua
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div
                        className="rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        style={{ backgroundColor: theme.colors.bgCard }}
                    >
                        <div className="bg-red-600 p-4 flex items-center gap-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <IconDisplay name="AlertCircle" size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Konfirmasi Penghapusan</h3>
                                <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <p style={{ color: theme.colors.textPrimary }}>
                                Anda akan menghapus <strong>{transactionCount} transaksi</strong> secara permanen.
                                Data yang dihapus tidak dapat dikembalikan.
                            </p>

                            <div>
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: theme.colors.textSecondary }}
                                >
                                    Ketik <strong className="text-red-500">HAPUS SEMUA</strong> untuk konfirmasi:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="HAPUS SEMUA"
                                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                        border: '1px solid'
                                    }}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="flex-1 py-2 px-4 rounded-lg font-medium transition-all"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        color: theme.colors.textPrimary
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deleteConfirmText !== 'HAPUS SEMUA' || isDeleting}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${deleteConfirmText === 'HAPUS SEMUA' && !isDeleting
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <IconDisplay name="Trash2" size={16} />
                                            Hapus Semua
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <Toast
                isOpen={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
                message={toast.message}
                type={toast.type}
            />
        </div>
    );
};

export default Settings;
