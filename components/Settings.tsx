import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import { Toast } from './ConfirmDialog';
import { Transaction, Category, FinancialAccount, AccountType, SharedAccountMember } from '../types';
import { exportToExcel, getCurrentMonthRange, formatDateRange } from '../utils/excelExport';
import { APP_VERSION, APP_BUILD_DATE } from '../constants';
import { getAccountTypeLabel, sanitizeAccountNameForFilename } from '../utils/accountLabels';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PageHeader from './PageHeader';
import FullScreenDialog from './FullScreenDialog';

interface SettingsProps {
    accounts: FinancialAccount[];
    activeAccountId: string | null;
    activeAccountName: string | null;
    telegramLinked: boolean;
    telegramDefaultAccountId: string | null;
    activeSharedInviteCode: string | null;
    sharedAccountMembers: SharedAccountMember[];
    onOpenOnboarding: () => void;
    onUpdateTelegramAccount: (accountId: string) => Promise<void>;
    onCreateAccount: (name: string, type: AccountType) => Promise<void>;
    onGenerateSharedInviteCode: () => Promise<void>;
    onJoinSharedAccount: (code: string) => Promise<void>;
    onSwitchAccount: (accountId: string) => Promise<void>;
    onDeleteAccount: (accountId: string) => Promise<void>;
    onDeleteAllTransactions: () => Promise<void>;
    transactionCount: number;
    transactions: Transaction[];
    categories: Category[];
}

const Settings: React.FC<SettingsProps> = ({
    accounts,
    activeAccountId,
    activeAccountName,
    telegramLinked,
    telegramDefaultAccountId,
    activeSharedInviteCode,
    sharedAccountMembers,
    onOpenOnboarding,
    onUpdateTelegramAccount,
    onCreateAccount,
    onGenerateSharedInviteCode,
    onJoinSharedAccount,
    onSwitchAccount,
    onDeleteAccount,
    onDeleteAllTransactions,
    transactionCount,
    transactions,
    categories
}) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState<AccountType>('PERSONAL');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<FinancialAccount | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [isJoiningShared, setIsJoiningShared] = useState(false);
    const [isGeneratingInviteCode, setIsGeneratingInviteCode] = useState(false);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        show: false, message: '', type: 'success'
    });

    const [isExporting, setIsExporting] = useState(false);
    const [exportRange, setExportRange] = useState<'current' | 'custom' | 'all'>('current');
    const [customStartDate, setCustomStartDate] = useState(() => getCurrentMonthRange().startDate);
    const [customEndDate, setCustomEndDate] = useState(() => getCurrentMonthRange().endDate);

    const handleDeleteAll = async () => {
        if (deleteConfirmText !== 'HAPUS SEMUA') return;
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
            const result = await exportToExcel({
                transactions,
                categories,
                startDate,
                endDate,
                filename: activeAccountName
                    ? `Transaksi_${sanitizeAccountNameForFilename(activeAccountName)}`
                    : undefined
            });
            setToast({ show: true, message: `✅ Berhasil export ${result.recordCount} transaksi ke Excel!`, type: 'success' });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal export ke Excel. Silakan coba lagi.';
            setToast({ show: true, message: `❌ ${errorMessage}`, type: 'error' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!newAccountName.trim()) {
            setToast({ show: true, message: 'Isi nama Akun Keuangan terlebih dahulu.', type: 'info' });
            return;
        }
        setIsCreatingAccount(true);
        try {
            await onCreateAccount(newAccountName, newAccountType);
            setNewAccountName('');
            setNewAccountType('PERSONAL');
            setShowAddAccountDialog(false);
        } catch (error) {
            console.error('Error creating account:', error);
            setToast({ show: true, message: 'Gagal membuat Akun Keuangan. Silakan coba lagi.', type: 'error' });
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!accountToDelete) return;

        setIsDeletingAccount(true);
        try {
            await onDeleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        } catch (error) {
            console.error('Error deleting account:', error);
            setToast({ show: true, message: 'Gagal menghapus Akun Keuangan. Silakan coba lagi.', type: 'error' });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
    const telegramAccount = accounts.find((a) => a.id === telegramDefaultAccountId) || null;
    const isSharedAccountActive = !!activeAccount?.sharedAccountId;
    const getAccountDeleteBlockReason = (account: FinancialAccount) => {
        if (accounts.length <= 1) return 'Minimal harus ada satu akun yang tersisa.';
        if (account.type === 'SHARED' || account.sharedAccountId) return 'Akun bersama belum bisa dihapus dari sini.';
        return null;
    };

    const handleGenerateInviteCode = async () => {
        if (!isSharedAccountActive) return;
        setIsGeneratingInviteCode(true);
        try {
            await onGenerateSharedInviteCode();
        } catch (error) {
            console.error('Error generating invite code:', error);
            setToast({ show: true, message: 'Gagal membuat kode gabung. Silakan coba lagi.', type: 'error' });
        } finally {
            setIsGeneratingInviteCode(false);
        }
    };

    const handleJoinSharedAccount = async () => {
        if (!joinCode.trim()) {
            setToast({ show: true, message: 'Masukkan kode gabung terlebih dahulu.', type: 'info' });
            return;
        }

        setIsJoiningShared(true);
        try {
            await onJoinSharedAccount(joinCode);
            setJoinCode('');
        } catch (error) {
            console.error('Error joining shared account:', error);
            setToast({ show: true, message: 'Kode gabung tidak valid atau akun belum bisa diakses.', type: 'error' });
        } finally {
            setIsJoiningShared(false);
        }
    };

    const handleCopyInviteCode = async () => {
        if (!activeSharedInviteCode) return;
        try {
            await navigator.clipboard.writeText(activeSharedInviteCode);
            setToast({ show: true, message: 'Kode gabung berhasil disalin.', type: 'success' });
        } catch (error) {
            console.error('Error copying invite code:', error);
            setToast({ show: true, message: 'Gagal menyalin kode gabung.', type: 'error' });
        }
    };

    return (
        <Box sx={{ pb: { xs: 10, md: 0 } }}>
            <PageHeader
                title="Pengaturan"
                description="Kelola akun keuangan, integrasi Telegram, tema, export, dan tindakan administratif dalam pola yang sama."
            />

            {/* Financial Accounts */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Akun Keuangan</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Tampilkan daftar akun yang ada dulu. Tambah akun hanya saat memang dibutuhkan.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => setShowAddAccountDialog(true)}
                        startIcon={<IconDisplay name="Plus" size={16} sx={{ color: '#fff' }} />}
                        sx={{ borderRadius: 2, flexShrink: 0 }}
                    >
                        Tambah Akun
                    </Button>
                </Box>

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {accounts.map((account) => {
                        const isActive = account.id === activeAccountId;
                        const isTelegramDefault = telegramLinked && account.id === telegramDefaultAccountId;
                        const deleteBlockReason = getAccountDeleteBlockReason(account);

                        return (
                            <Paper key={account.id} variant="outlined" sx={{ p: 2.25, borderRadius: 2.5 }}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {account.name}
                                            </Typography>
                                            <Chip size="small" label={getAccountTypeLabel(account.type)} />
                                            {isActive && (
                                                <Chip
                                                    size="small"
                                                    label="Sedang dipakai"
                                                    sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600 }}
                                                />
                                            )}
                                            {isTelegramDefault && (
                                                <Chip size="small" variant="outlined" label="Default Telegram" />
                                            )}
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            {account.role === 'OWNER' ? 'Pemilik akun ini.' : 'Anda bergabung sebagai anggota.'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                            {deleteBlockReason || 'Akun ini bisa dihapus selama belum punya transaksi.'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                        {!isActive && (
                                            <Button
                                                variant="outlined"
                                                onClick={() => onSwitchAccount(account.id)}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Pakai
                                            </Button>
                                        )}
                                        <Button
                                            variant="text"
                                            color="error"
                                            disabled={!!deleteBlockReason}
                                            onClick={() => setAccountToDelete(account)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Hapus
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Kolaborasi</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Gabung ke akun bersama pakai kode, atau bagikan kode dari akun bersama yang sedang aktif.
                        </Typography>
                    </Box>
                    <Chip
                        label={isSharedAccountActive ? 'Akun bersama aktif' : 'Belum di akun bersama'}
                        size="small"
                        sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600, flexShrink: 0 }}
                    />
                </Box>

                <Grid container spacing={2} sx={{ mb: isSharedAccountActive ? 3 : 0 }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                            label="Kode gabung"
                            size="small"
                            fullWidth
                            placeholder="Contoh: AB12CD34"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            disabled={isJoiningShared}
                            onClick={handleJoinSharedAccount}
                            startIcon={isJoiningShared ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <IconDisplay name="Users" size={16} />}
                            sx={{ borderRadius: 2, height: 40 }}
                        >
                            {isJoiningShared ? 'Menghubungkan...' : 'Gabung Akun'}
                        </Button>
                    </Grid>
                </Grid>

                {isSharedAccountActive && (
                    <>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary">
                                        Kode Gabung Aktif
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                                        {activeSharedInviteCode || 'Belum dibuat'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Bagikan kode ini ke anggota lain supaya mereka bisa masuk ke akun bersama ini.
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ display: 'grid', gap: 1.5 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={isGeneratingInviteCode}
                                        onClick={handleGenerateInviteCode}
                                        startIcon={isGeneratingInviteCode ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <IconDisplay name="RefreshCw" size={16} />}
                                        sx={{ borderRadius: 2, height: 40 }}
                                    >
                                        {isGeneratingInviteCode ? 'Membuat...' : activeSharedInviteCode ? 'Buat Ulang Kode' : 'Buat Kode Gabung'}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        disabled={!activeSharedInviteCode}
                                        onClick={handleCopyInviteCode}
                                        startIcon={<IconDisplay name="Share" size={16} />}
                                        sx={{ borderRadius: 2, height: 40 }}
                                    >
                                        Salin Kode
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>

                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                                Anggota Akun Bersama
                            </Typography>
                            <Grid container spacing={1.5}>
                                {sharedAccountMembers.map((member) => (
                                    <Grid key={member.id} size={{ xs: 12, md: 6 }}>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        {member.displayName || member.email || 'Anggota'}
                                                    </Typography>
                                                    {member.email && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {member.email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={member.role === 'OWNER' ? 'Pemilik' : 'Anggota'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </>
                )}
            </Paper>

            {/* Telegram Account */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Akun Keuangan Telegram</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Bot Telegram akan membaca dan mencatat transaksi ke akun ini secara default.
                        </Typography>
                    </Box>
                    <Chip
                        label={telegramAccount?.name || 'Belum terhubung'}
                        size="small"
                        sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600, flexShrink: 0 }}
                    />
                </Box>

                <FormControl fullWidth size="small" disabled={!telegramLinked || accounts.length <= 1}>
                    <InputLabel>Pilih akun Telegram</InputLabel>
                    <Select
                        label="Pilih akun Telegram"
                        value={telegramDefaultAccountId || accounts[0]?.id || ''}
                        onChange={(e) => onUpdateTelegramAccount(e.target.value)}
                    >
                        {accounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                                {account.name} • {getAccountTypeLabel(account.type)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {!telegramLinked
                        ? 'Hubungkan Telegram terlebih dahulu agar akun default bot bisa diatur.'
                        : accounts.length <= 1
                        ? 'Anda baru punya 1 akun, jadi Telegram akan selalu memakai akun ini.'
                        : 'Bisa juga diganti langsung dari Telegram dengan command /akun.'}
                </Typography>
            </Paper>

            {/* Quick Guide */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Panduan Singkat</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Cocok untuk user baru atau saat ingin mengingat lagi contoh input yang bisa dipakai di Telegram dan input natural.
                        </Typography>
                    </Box>
                    <Button variant="contained" onClick={onOpenOnboarding} sx={{ borderRadius: 2, flexShrink: 0 }}>
                        Buka Panduan
                    </Button>
                </Box>

                <Grid container spacing={2}>
                    {[
                        { title: 'Contoh input transaksi', value: 'makan siang 25rb' },
                        { title: 'Contoh input banyak transaksi', value: 'kopi 18rb, parkir 5rb' },
                        { title: 'Contoh input anggaran', value: 'bulan ini jatah makan 2 juta' },
                    ].map((item) => (
                        <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                                <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.12em' }} color="text.secondary">
                                    {item.title}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ mt: 1.5 }}>
                                    {item.value}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Theme */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.colors.accentLight }}>
                            <IconDisplay name={isDark ? 'Moon' : 'Sun'} size={24} sx={{ color: theme.colors.accent }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Mode {isDark ? 'Gelap' : 'Terang'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isDark ? 'Tampilan gelap untuk mata yang nyaman' : 'Tampilan terang untuk penggunaan sehari-hari'}
                            </Typography>
                        </Box>
                    </Box>
                    <Switch checked={isDark} onChange={toggleTheme} color="primary" />
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <Paper
                            variant="outlined"
                            onClick={() => isDark && toggleTheme()}
                            sx={{
                                p: 2, borderRadius: 2, cursor: 'pointer',
                                bgcolor: themes.light.colors.bgCard,
                                borderColor: !isDark ? theme.colors.accent : themes.light.colors.border,
                                borderWidth: !isDark ? 2 : 1,
                                transition: 'all 0.15s',
                                '&:hover': { boxShadow: 2 },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: themes.light.colors.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconDisplay name="Sun" size={20} sx={{ color: '#f59e0b' }} />
                                </Box>
                                <Typography fontWeight={600} sx={{ color: themes.light.colors.textPrimary }}>Terang</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[themes.light.colors.bgPrimary, themes.light.colors.accent, themes.light.colors.income].map((c, i) => (
                                    <Box key={i} sx={{ height: 8, flex: 1, borderRadius: 2, bgcolor: c, border: i === 0 ? '1px solid #e5e7eb' : 'none' }} />
                                ))}
                            </Box>
                            {!isDark && (
                                <Chip label="✓ Aktif" size="small" sx={{ mt: 1.5, bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600, width: '100%' }} />
                            )}
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <Paper
                            variant="outlined"
                            onClick={() => !isDark && toggleTheme()}
                            sx={{
                                p: 2, borderRadius: 2, cursor: 'pointer',
                                bgcolor: themes.dark.colors.bgCard,
                                borderColor: isDark ? theme.colors.accent : themes.dark.colors.border,
                                borderWidth: isDark ? 2 : 1,
                                transition: 'all 0.15s',
                                '&:hover': { boxShadow: 2 },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: themes.dark.colors.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconDisplay name="Moon" size={20} sx={{ color: '#a78bfa' }} />
                                </Box>
                                <Typography fontWeight={600} sx={{ color: themes.dark.colors.textPrimary }}>Gelap</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[themes.dark.colors.bgPrimary, themes.dark.colors.accent, themes.dark.colors.income].map((c, i) => (
                                    <Box key={i} sx={{ height: 8, flex: 1, borderRadius: 2, bgcolor: c }} />
                                ))}
                            </Box>
                            {isDark && (
                                <Chip label="✓ Aktif" size="small" sx={{ mt: 1.5, bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 600, width: '100%' }} />
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            {/* Export Excel */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.colors.incomeBg }}>
                        <IconDisplay name="FileText" size={24} sx={{ color: theme.colors.income }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Ekspor ke Excel</Typography>
                        <Typography variant="body2" color="text.secondary">Download laporan transaksi dalam format Excel (.xlsx)</Typography>
                    </Box>
                </Box>

                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>Pilih Periode:</Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                        { key: 'current' as const, icon: 'Calendar', title: 'Bulan Ini', sub: formatDateRange(getCurrentMonthRange().startDate, getCurrentMonthRange().endDate) },
                        { key: 'custom' as const, icon: 'CalendarDays', title: 'Rentang Custom', sub: 'Pilih tanggal sendiri' },
                        { key: 'all' as const, icon: 'Database', title: 'Semua Data', sub: `${transactions.length} transaksi` },
                    ].map((opt) => (
                        <Grid size={{ xs: 12, md: 4 }} key={opt.key}>
                            <Paper
                                variant="outlined"
                                onClick={() => setExportRange(opt.key)}
                                sx={{
                                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                                    bgcolor: exportRange === opt.key ? theme.colors.accentLight : 'action.hover',
                                    borderColor: exportRange === opt.key ? theme.colors.accent : 'divider',
                                    borderWidth: exportRange === opt.key ? 2 : 1,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <IconDisplay name={opt.icon} size={18} sx={{ color: exportRange === opt.key ? theme.colors.accent : undefined }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>{opt.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">{opt.sub}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {exportRange === 'custom' && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Dari Tanggal"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Sampai Tanggal"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    disabled={isExporting || transactions.length === 0}
                    onClick={handleExportExcel}
                    startIcon={isExporting
                        ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                        : <IconDisplay name="Download" size={20} sx={{ color: '#fff' }} />
                    }
                    sx={{
                        borderRadius: 2,
                        bgcolor: theme.colors.income,
                        '&:hover': { bgcolor: theme.colors.income, filter: 'brightness(0.9)' },
                        '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                    }}
                >
                    {isExporting ? 'Mengexport...' : 'Ekspor ke Excel'}
                </Button>
                {transactions.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                        Tidak ada transaksi untuk diexport
                    </Typography>
                )}
            </Paper>

            {/* Danger Zone */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, borderColor: isDark ? '#991b1b' : '#fecaca' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: isDark ? '#7f1d1d' : '#fee2e2' }}>
                        <IconDisplay name="AlertCircle" size={20} sx={{ color: '#ef4444' }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#ef4444' }}>Zona Berbahaya</Typography>
                        <Typography variant="body2" color="text.secondary">Tindakan di bawah ini tidak dapat dibatalkan</Typography>
                    </Box>
                </Box>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                        <Box>
                            <Typography variant="body1" fontWeight={600}>Hapus Semua Transaksi</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {transactionCount > 0
                                    ? `Anda memiliki ${transactionCount} transaksi yang akan dihapus permanen.`
                                    : 'Tidak ada transaksi untuk dihapus.'}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={transactionCount === 0}
                            startIcon={<IconDisplay name="Trash2" size={16} sx={{ color: '#fff' }} />}
                            onClick={() => setShowDeleteConfirm(true)}
                            sx={{ borderRadius: 2, flexShrink: 0 }}
                        >
                            Hapus Semua
                        </Button>
                    </Box>
                </Paper>
            </Paper>

            <Dialog
                open={showAddAccountDialog}
                onClose={() => {
                    if (isCreatingAccount) return;
                    setShowAddAccountDialog(false);
                    setNewAccountName('');
                    setNewAccountType('PERSONAL');
                }}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Tambah Akun Keuangan</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nama akun"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="Contoh: Rumah Tangga"
                            autoFocus
                        />
                        <FormControl fullWidth>
                            <InputLabel>Tipe</InputLabel>
                            <Select
                                label="Tipe"
                                value={newAccountType}
                                onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                            >
                                {(['PERSONAL', 'FAMILY', 'BUSINESS', 'SHARED'] as AccountType[]).map((type) => (
                                    <MenuItem key={type} value={type}>{getAccountTypeLabel(type)}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setShowAddAccountDialog(false);
                            setNewAccountName('');
                            setNewAccountType('PERSONAL');
                        }}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="contained"
                        disabled={isCreatingAccount}
                        onClick={handleCreateAccount}
                        startIcon={isCreatingAccount ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                    >
                        {isCreatingAccount ? 'Membuat...' : 'Tambah Akun'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!accountToDelete}
                onClose={() => {
                    if (isDeletingAccount) return;
                    setAccountToDelete(null);
                }}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Hapus Akun Keuangan</DialogTitle>
                <DialogContent>
                    <Typography sx={{ pt: 1 }}>
                        {accountToDelete
                            ? <>Akun <strong>{accountToDelete.name}</strong> hanya bisa dihapus kalau belum punya transaksi.</>
                            : null}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                        Kalau akun ini sudah punya transaksi, hapus dulu semua transaksi di akun tersebut. Kalau masih kosong, akun akan dihapus beserta data pendukungnya.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setAccountToDelete(null)}>
                        Batal
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={isDeletingAccount}
                        onClick={handleDeleteAccount}
                        startIcon={isDeletingAccount ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                    >
                        {isDeletingAccount ? 'Menghapus...' : 'Hapus Akun'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <FullScreenDialog
                open={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                title="Konfirmasi Penghapusan"
                description="Tindakan ini akan menghapus semua transaksi secara permanen dan tidak bisa dibatalkan."
                actions={
                    <>
                        <Button
                            variant="outlined"
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={deleteConfirmText !== 'HAPUS SEMUA' || isDeleting}
                            onClick={handleDeleteAll}
                            startIcon={isDeleting
                                ? <CircularProgress size={16} sx={{ color: '#fff' }} />
                                : <IconDisplay name="Trash2" size={16} sx={{ color: '#fff' }} />
                            }
                        >
                            {isDeleting ? 'Menghapus...' : 'Hapus Semua'}
                        </Button>
                    </>
                }
            >
                <Box sx={{ maxWidth: 560 }}>
                    <Typography sx={{ mb: 2 }}>
                        Anda akan menghapus <strong>{transactionCount} transaksi</strong> secara permanen.
                        Data yang dihapus tidak dapat dikembalikan.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Ketik <Box component="strong" sx={{ color: '#ef4444' }}>HAPUS SEMUA</Box> untuk konfirmasi:
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="HAPUS SEMUA"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                </Box>
            </FullScreenDialog>

            {/* Toast */}
            <Toast
                isOpen={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
                message={toast.message}
                type={toast.type}
            />

            {/* Version */}
            <Divider sx={{ mt: 4, mb: 2 }} />
            <Box sx={{ textAlign: 'center', pb: 2 }}>
                <Typography variant="body2" color="text.disabled">Dompet Cerdas v{APP_VERSION}</Typography>
                <Typography variant="caption" color="text.disabled" display="block">Build: {APP_BUILD_DATE}</Typography>
            </Box>
        </Box>
    );
};

export default Settings;
