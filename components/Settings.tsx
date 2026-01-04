import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import { Toast } from './ConfirmDialog';
import { Transaction, Category } from '../types';
import { exportToExcel, getCurrentMonthRange, formatDateRange } from '../utils/excelExport';

interface SettingsProps {
    onDeleteAllTransactions: () => Promise<void>;
    transactionCount: number;
    transactions: Transaction[];
    categories: Category[];
}

const Settings: React.FC<SettingsProps> = ({ onDeleteAllTransactions, transactionCount, transactions, categories }) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        show: false,
        message: '',
        type: 'success'
    });

    // Export Excel states
    const [isExporting, setIsExporting] = useState(false);
    const [exportRange, setExportRange] = useState<'current' | 'custom' | 'all'>('current');
    const [customStartDate, setCustomStartDate] = useState(() => {
        const { startDate } = getCurrentMonthRange();
        return startDate;
    });
    const [customEndDate, setCustomEndDate] = useState(() => {
        const { endDate } = getCurrentMonthRange();
        return endDate;
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

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            let startDate: string | undefined;
            let endDate: string | undefined;

            if (exportRange === 'current') {
                const range = getCurrentMonthRange();
                startDate = range.startDate;
                endDate = range.endDate;
            } else if (exportRange === 'custom') {
                startDate = customStartDate;
                endDate = customEndDate;
            }
            // 'all' = no date filter

            const result = exportToExcel({
                transactions,
                categories,
                startDate,
                endDate
            });

            setToast({
                show: true,
                message: `✅ Berhasil export ${result.recordCount} transaksi ke Excel!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);

            // Check if it's a file size error
            const errorMessage = error instanceof Error ? error.message : 'Gagal export ke Excel. Silakan coba lagi.';

            setToast({
                show: true,
                message: `❌ ${errorMessage}`,
                type: 'error'
            });
        } finally {
            setIsExporting(false);
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

            {/* Export Excel Section */}
            <div
                className="rounded-xl border p-6"
                style={{
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.border
                }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: theme.colors.incomeBg }}
                    >
                        <IconDisplay
                            name="FileText"
                            size={24}
                            style={{ color: theme.colors.income }}
                        />
                    </div>
                    <div>
                        <h3
                            className="font-semibold text-lg"
                            style={{ color: theme.colors.textPrimary }}
                        >
                            Export ke Excel
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Download laporan transaksi dalam format Excel (.xlsx)
                        </p>
                    </div>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                    {/* Range Selection */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Pilih Periode:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Current Month */}
                            <button
                                onClick={() => setExportRange('current')}
                                className={`p-3 rounded-lg border-2 transition-all ${exportRange === 'current' ? 'ring-2 ring-offset-2' : ''
                                    }`}
                                style={{
                                    backgroundColor: exportRange === 'current' ? theme.colors.accentLight : theme.colors.bgHover,
                                    borderColor: exportRange === 'current' ? theme.colors.accent : theme.colors.border,
                                    color: theme.colors.textPrimary
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <IconDisplay name="Calendar" size={18} style={{ color: exportRange === 'current' ? theme.colors.accent : theme.colors.textMuted }} />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Bulan Ini</p>
                                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                            {formatDateRange(getCurrentMonthRange().startDate, getCurrentMonthRange().endDate)}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Custom Range */}
                            <button
                                onClick={() => setExportRange('custom')}
                                className={`p-3 rounded-lg border-2 transition-all ${exportRange === 'custom' ? 'ring-2 ring-offset-2' : ''
                                    }`}
                                style={{
                                    backgroundColor: exportRange === 'custom' ? theme.colors.accentLight : theme.colors.bgHover,
                                    borderColor: exportRange === 'custom' ? theme.colors.accent : theme.colors.border,
                                    color: theme.colors.textPrimary
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <IconDisplay name="CalendarDays" size={18} style={{ color: exportRange === 'custom' ? theme.colors.accent : theme.colors.textMuted }} />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Rentang Custom</p>
                                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>Pilih tanggal sendiri</p>
                                    </div>
                                </div>
                            </button>

                            {/* All Transactions */}
                            <button
                                onClick={() => setExportRange('all')}
                                className={`p-3 rounded-lg border-2 transition-all ${exportRange === 'all' ? 'ring-2 ring-offset-2' : ''
                                    }`}
                                style={{
                                    backgroundColor: exportRange === 'all' ? theme.colors.accentLight : theme.colors.bgHover,
                                    borderColor: exportRange === 'all' ? theme.colors.accent : theme.colors.border,
                                    color: theme.colors.textPrimary
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <IconDisplay name="Database" size={18} style={{ color: exportRange === 'all' ? theme.colors.accent : theme.colors.textMuted }} />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Semua Data</p>
                                        <p className="text-xs" style={{ color: theme.colors.textMuted }}>{transactions.length} transaksi</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Range Inputs */}
                    {exportRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-lg border" style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.textMuted }}>Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                                    style={{
                                        backgroundColor: theme.colors.bgCard,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.textMuted }}>Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                                    style={{
                                        backgroundColor: theme.colors.bgCard,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Export Button */}
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting || transactions.length === 0}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${transactions.length === 0 || isExporting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'hover:scale-[1.02]'
                            }`}
                        style={{
                            backgroundColor: transactions.length > 0 && !isExporting ? theme.colors.income : undefined,
                            color: transactions.length > 0 && !isExporting ? 'white' : undefined
                        }}
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Mengexport...
                            </>
                        ) : (
                            <>
                                <IconDisplay name="Download" size={20} />
                                Export ke Excel
                            </>
                        )}
                    </button>

                    {transactions.length === 0 && (
                        <p className="text-xs text-center" style={{ color: theme.colors.textMuted }}>
                            Tidak ada transaksi untuk diexport
                        </p>
                    )}
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
