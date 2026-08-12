import React, { useEffect, useMemo, useState } from 'react';
import { Transaction, Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import QuickAddSheetLoader from './QuickAddSheetLoader';
import TransactionActionSheet from './TransactionActionSheet';
import { NotificationType } from './NotificationModal';
import { formatRp } from '../utils/format';
import { resolveAttachmentUrl } from '../services/firebaseRuntime';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FullScreenDialog from './FullScreenDialog';
import PageHeader from './PageHeader';
import type { OfflineAttachmentUploadJob } from '../services/offlineAttachmentQueue';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currentUserId?: string | null;
  activeAccountRole?: 'OWNER' | 'MEMBER';
  pendingAttachmentUploads?: Record<string, OfflineAttachmentUploadJob>;
  onRetryAttachmentUpload?: (transactionId: string) => Promise<void>;
  onCancelAttachmentUpload?: (transactionId: string) => Promise<void>;
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' } | null
  ) => Promise<void>;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
}

// Modal for viewing attachment
const AttachmentModal: React.FC<{
  url: string;
  path?: string;
  name: string;
  type: 'image' | 'pdf';
  onClose: () => void;
}> = ({ url, path, name, type, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  // Private attachments (e.g. Telegram receipts) carry a Storage path instead
  // of a durable URL; resolve it client-side, falling back to the stored url.
  const [resolvedUrl, setResolvedUrl] = useState(path ? '' : url);

  useEffect(() => {
    let cancelled = false;
    if (path) {
      setIsLoading(true);
      resolveAttachmentUrl({ url, path }).then((resolved) => {
        if (!cancelled) setResolvedUrl(resolved);
      });
    }
    return () => { cancelled = true; };
  }, [url, path]);

  return (
    <FullScreenDialog
      open
      onClose={onClose}
      title={name}
      description="Preview lampiran transaksi dalam tampilan yang konsisten dengan modal lain."
      headerActions={
        <IconButton
          component="a"
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          title="Buka di tab baru"
          sx={{ color: 'primary.main' }}
        >
          <IconDisplay name="Share" size={18} />
        </IconButton>
      }
      contentSx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">Memuat lampiran...</Typography>
          </Box>
        )}
        {type === 'image' ? (
          <Box
            component="img"
            src={resolvedUrl}
            alt={name}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2, boxShadow: 3, display: isLoading ? 'none' : 'block' }}
          />
        ) : (
          <Box
            component="iframe"
            src={resolvedUrl}
            title={name}
            onLoad={() => setIsLoading(false)}
            sx={{ width: '100%', height: '70vh', border: '1px solid', borderColor: 'divider', borderRadius: 2, display: isLoading ? 'none' : 'block' }}
          />
        )}
      </Box>
    </FullScreenDialog>
  );
};

// Helpers
const getMonthName = (month: number): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month];
};

type FilterMode = 'month' | 'range';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, currentUserId, activeAccountRole, pendingAttachmentUploads = {}, onRetryAttachmentUpload, onCancelAttachmentUpload, onDelete, onUpdate, onAddCategory, onShowNotification }) => {
  const { theme } = useTheme();

  const [viewingAttachment, setViewingAttachment] = useState<{
    url: string;
    path?: string;
    name: string;
    type: 'image' | 'pdf';
  } | null>(null);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  });
  const [showFilters, setShowFilters] = useState(false);

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  const [actionSheetTransaction, setActionSheetTransaction] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.date);

      let dateMatch = false;
      if (filterMode === 'month') {
        dateMatch = txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonthIndex;
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = txDate >= start && txDate <= end;
      }
      if (!dateMatch) return false;

      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;

      if (selectedType !== 'all') {
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat?.type !== selectedType) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const descMatch = t.description?.toLowerCase().includes(query);
        const cat = categories.find(c => c.id === t.categoryId);
        const catMatch = cat?.name?.toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [transactions, filterMode, selectedYear, selectedMonthIndex, startDate, endDate, selectedCategoryId, selectedType, searchQuery, categories]);

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groups: { [key: string]: Transaction[] } = {};
    sorted.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });

    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    });

    return groups;
  }, [filteredTransactions]);

  // Calculate totals
  const { totalIncome, totalExpense, totalBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat?.type === 'INCOME') income += t.amount;
      else expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, totalBalance: income - expense };
  }, [filteredTransactions, categories]);

  const getDateParts = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayDate = date.getDate().toString().padStart(2, '0');
    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return { dayDate, dayName, monthYear };
  };

  const calculateDailyTotal = (txs: Transaction[]) => {
    return txs.reduce((acc, t) => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (!cat) return acc;
      return cat.type === 'INCOME' ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const getFilterLabel = () => {
    if (filterMode === 'month') {
      return `${getMonthName(selectedMonthIndex)} ${selectedYear}`;
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleMonthSelect = (monthIndex: number, year = selectedYear) => {
    setSelectedYear(year);
    setSelectedMonthIndex(monthIndex);
    setStartDate(formatDateLocal(new Date(year, monthIndex, 1)));
    setEndDate(formatDateLocal(new Date(year, monthIndex + 1, 0)));
  };

  const handleMonthStep = (step: -1 | 1) => {
    const nextDate = new Date(selectedYear, selectedMonthIndex + step, 1);
    handleMonthSelect(nextDate.getMonth(), nextDate.getFullYear());
  };

  const todayKey = formatDateLocal(new Date());

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setStartDate(formatDateLocal(new Date(year, selectedMonthIndex, 1)));
    setEndDate(formatDateLocal(new Date(year, selectedMonthIndex + 1, 0)));
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    const [year, month] = value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonthIndex(month - 1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const [endYear, endMonth] = value.split('-').map(Number);
    if (startYear === endYear && startMonth === endMonth) {
      setSelectedYear(endYear);
      setSelectedMonthIndex(endMonth - 1);
    }
  };

  const resetToCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonthIndex(now.getMonth());
    setStartDate(formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
    setEndDate(formatDateLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  };

  const hasActiveFilters = searchQuery || selectedCategoryId !== 'all' || selectedType !== 'all';
  const attachmentUploadJobs = useMemo(
    () => Object.values(pendingAttachmentUploads).sort((left, right) => left.queuedAt.localeCompare(right.queuedAt)),
    [pendingAttachmentUploads]
  );
  const failedAttachmentUploadCount = attachmentUploadJobs.filter((job) => job.status === 'failed').length;
  const pendingAttachmentUploadCount = attachmentUploadJobs.length - failedAttachmentUploadCount;

  return (
    <>
      {/* Attachment Modal */}
      {viewingAttachment && (
        <AttachmentModal
          url={viewingAttachment.url}
          path={viewingAttachment.path}
          name={viewingAttachment.name}
          type={viewingAttachment.type}
          onClose={() => setViewingAttachment(null)}
        />
      )}

      <Box sx={{ pb: { xs: 10, md: 0 } }}>
        {/* Month navigation and advanced filters */}
        <PageHeader
          title="Riwayat Transaksi"
          description="Lihat, cari, dan saring transaksi dengan pola tampilan yang sama seperti menu lainnya."
          actions={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                aria-label="Bulan sebelumnya"
                onClick={() => handleMonthStep(-1)}
                disabled={filterMode !== 'month'}
              >
                <IconDisplay name="ArrowLeft" size={18} />
              </IconButton>
              <Typography variant="body2" fontWeight={700} sx={{ minWidth: 130, textAlign: 'center' }}>
                {filterMode === 'month' ? getFilterLabel() : 'Rentang tanggal'}
              </Typography>
              <IconButton
                size="small"
                aria-label="Bulan berikutnya"
                onClick={() => handleMonthStep(1)}
                disabled={filterMode !== 'month'}
              >
                <IconDisplay name="ArrowRight" size={18} />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowFilters(true)}
                startIcon={<IconDisplay name="Filter" size={16} />}
              >
                Filter lanjutan
              </Button>
            </Box>
          }
        />

        {attachmentUploadJobs.length > 0 && (
          <Card
            variant="outlined"
            data-testid="attachment-upload-status"
            sx={{
              mb: 2,
              borderRadius: 3,
              borderColor: failedAttachmentUploadCount > 0 ? theme.colors.error : theme.colors.warning,
              bgcolor: failedAttachmentUploadCount > 0 ? theme.colors.errorLight : theme.colors.warningBg,
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <IconDisplay
                  name={failedAttachmentUploadCount > 0 ? 'AlertCircle' : 'Loader'}
                  size={20}
                  sx={{ color: failedAttachmentUploadCount > 0 ? theme.colors.error : theme.colors.warning, mt: 0.25 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Status upload lampiran
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {failedAttachmentUploadCount > 0
                      ? failedAttachmentUploadCount + ' upload gagal' + (pendingAttachmentUploadCount > 0 ? ', ' + pendingAttachmentUploadCount + ' masih tertunda' : '') + '.'
                      : pendingAttachmentUploadCount + ' upload menunggu koneksi.'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {failedAttachmentUploadCount > 0 && (
                    <Chip
                      size="small"
                      label={failedAttachmentUploadCount + ' gagal'}
                      sx={{ height: 22, color: theme.colors.error, bgcolor: theme.colors.errorLight, fontWeight: 700 }}
                    />
                  )}
                  {pendingAttachmentUploadCount > 0 && (
                    <Chip
                      size="small"
                      label={pendingAttachmentUploadCount + ' tertunda'}
                      sx={{ height: 22, color: theme.colors.warning, bgcolor: theme.colors.warningBg, fontWeight: 700 }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1.5, maxHeight: 220, overflowY: 'auto' }}>
                {attachmentUploadJobs.map((job) => {
                  const transaction = transactions.find((item) => item.id === job.transactionId);
                  const isFailed = job.status === 'failed';

                  return (
                    <Box
                      key={job.id}
                      data-testid={'attachment-upload-' + job.transactionId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {transaction?.description?.trim() || job.fileName || 'Lampiran transaksi'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {transaction ? 'Transaksi ' + transaction.date : 'Transaksi tidak ditemukan pada daftar saat ini'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Chip
                          size="small"
                          icon={<IconDisplay name={isFailed ? 'AlertCircle' : 'Loader'} size={11} />}
                          label={isFailed ? 'Gagal' : 'Sync...'}
                          sx={{
                            height: 22,
                            fontSize: 10,
                            color: isFailed ? theme.colors.error : theme.colors.warning,
                            bgcolor: isFailed ? theme.colors.errorLight : theme.colors.warningBg,
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                        {isFailed && onRetryAttachmentUpload && (
                          <Button
                            size="small"
                            onClick={() => { void onRetryAttachmentUpload(job.transactionId); }}
                            sx={{ minWidth: 0, px: 0.75, fontSize: 10, textTransform: 'none' }}
                          >
                            Coba lagi
                          </Button>
                        )}
                        {onCancelAttachmentUpload && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => { void onCancelAttachmentUpload(job.transactionId); }}
                            sx={{ minWidth: 0, px: 0.75, fontSize: 10, textTransform: 'none' }}
                          >
                            Batalkan
                          </Button>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Card>
        )}

        {/* Advanced filter modal */}
        <Dialog open={showFilters} onClose={() => setShowFilters(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Filter Lanjutan
            <IconButton onClick={() => setShowFilters(false)} aria-label="Tutup filter" size="small">
              <IconDisplay name="X" size={20} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Tabs
              value={filterMode}
              onChange={(_, newValue) => setFilterMode(newValue)}
              variant="fullWidth"
              sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
            >
              <Tab value="month" label="Per Bulan" />
              <Tab value="range" label="Rentang Tanggal" />
            </Tabs>
            {filterMode === 'range' && (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
                <TextField label="Dari Tanggal" type="date" size="small" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
                <TextField label="Sampai Tanggal" type="date" size="small" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
              </Box>
            )}
            <TextField
              fullWidth
              size="small"
              label="Cari transaksi"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><IconDisplay name="Search" size={18} /></InputAdornment> } }}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>Jenis transaksi</Typography>
            <Tabs
              value={selectedType}
              onChange={(_, newValue) => setSelectedType(newValue)}
              variant="fullWidth"
              sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
            >
              <Tab value="all" label="Semua" />
              <Tab value="EXPENSE" label="Keluar" />
              <Tab value="INCOME" label="Masuk" />
            </Tabs>
            <FormControl fullWidth size="small">
              <InputLabel>Kategori</InputLabel>
              <Select label="Kategori" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                <MenuItem value="all">Semua Kategori</MenuItem>
                <MenuItem disabled sx={{ fontSize: 12, color: 'text.disabled', py: 0.25 }}>── Pengeluaran ──</MenuItem>
                {categories.filter(c => c.type === 'EXPENSE').map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                <MenuItem disabled sx={{ fontSize: 12, color: 'text.disabled', py: 0.25 }}>── Pemasukan ──</MenuItem>
                {categories.filter(c => c.type === 'INCOME').map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button onClick={() => setShowFilters(false)}>Tutup</Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedCategoryId('all'); }}>Reset filter</Button>
              <Button variant="contained" onClick={() => setShowFilters(false)}>Terapkan</Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Filter aktif:</Typography>
            {searchQuery && (
              <Chip
                size="small"
                icon={<IconDisplay name="Search" size={12} />}
                label={`"${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, height: 24 }}
              />
            )}
            {selectedType !== 'all' && (
              <Chip
                size="small"
                icon={<IconDisplay name={selectedType === 'EXPENSE' ? 'TrendingDown' : 'TrendingUp'} size={12} />}
                label={selectedType === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
                onDelete={() => setSelectedType('all')}
                sx={{
                  bgcolor: selectedType === 'EXPENSE' ? theme.colors.expenseBg : theme.colors.incomeBg,
                  color: selectedType === 'EXPENSE' ? theme.colors.expense : theme.colors.income,
                  height: 24,
                }}
              />
            )}
            {selectedCategoryId !== 'all' && (
              <Chip
                size="small"
                icon={<IconDisplay name="Tag" size={12} />}
                label={categories.find(c => c.id === selectedCategoryId)?.name || 'Kategori'}
                onDelete={() => setSelectedCategoryId('all')}
                sx={{ height: 24 }}
              />
            )}
            <Button
              size="small"
              color="error"
              onClick={() => { setSearchQuery(''); setSelectedType('all'); setSelectedCategoryId('all'); }}
              sx={{ fontSize: 12, px: 1, py: 0.5, minWidth: 0 }}
            >
              Hapus Semua
            </Button>
          </Box>
        )}

        {/* Transaction Count & Compact Summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {filteredTransactions.length} transaksi ditemukan
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 12 }}>
            <Typography variant="caption" sx={{ color: theme.colors.income, fontWeight: 700 }}>
              +{formatRp(totalIncome)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>•</Typography>
            <Typography variant="caption" sx={{ color: theme.colors.expense, fontWeight: 700 }}>
              -{formatRp(totalExpense)}
            </Typography>
          </Box>
        </Box>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <Card variant="outlined" sx={{ py: 8, borderRadius: 4, textAlign: 'center', mb: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <IconDisplay name="Search" size={32} sx={{ color: theme.colors.textMuted }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.secondary">Tidak ada transaksi ditemukan</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1, px: 4 }}>
              {hasActiveFilters
                ? 'Coba ubah filter atau menghapus kata kunci pencarian'
                : 'Belum ada transaksi di rentang waktu ini.'}
            </Typography>
          </Card>
        )}

        {/* Transactions grouped by date - Compact mobile list */}
        {filteredTransactions.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
              {Object.entries(groupedTransactions).map(([date, txs]) => {
                const transactionsForDate = txs as Transaction[];
                const { dayDate, dayName, monthYear } = getDateParts(date);
                const dailyTotal = calculateDailyTotal(transactionsForDate);
                const isToday = date === todayKey;

                return (
                  <Box key={date} sx={{ mb: 2 }}>
                    {/* Compact sticky date header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2,
                        py: 1.5,
                        mb: 0.5,
                        bgcolor: isToday ? theme.colors.accentLight : 'transparent',
                        borderRadius: 2,
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700} color={isToday ? theme.colors.accent : 'text.primary'}>
                          {dayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayDate} {monthYear}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: dailyTotal >= 0 ? theme.colors.income : theme.colors.expense,
                        }}
                      >
                        {dailyTotal > 0 ? '+' : ''}{formatRp(dailyTotal)}
                      </Typography>
                    </Box>

                    <List disablePadding sx={{ bgcolor: 'background.paper', borderRadius: 3, overflow: 'hidden' }}>
                    {transactionsForDate.map((t, idx) => {
                      const cat = categories.find(c => c.id === t.categoryId);
                      const isIncome = cat?.type === 'INCOME';
                      const attachmentData = t.attachmentUrl
                        ? { url: t.attachmentUrl, name: t.attachmentName || 'Lampiran', type: t.attachmentType || 'image' as 'image' | 'pdf' }
                        : t.attachment
                        ? { url: t.attachment.url, path: t.attachment.path, name: t.attachment.name, type: t.attachment.type }
                        : null;
                      const pendingAttachmentUpload = pendingAttachmentUploads[t.id];

                      return (
                        <React.Fragment key={t.id}>
                          <ListItemButton
                            onClick={() => setActionSheetTransaction(t)}
                            sx={{
                              py: 1.5,
                              px: 2,
                              transition: 'all 0.15s',
                              '&:hover': { bgcolor: 'action.hover' },
                              '&:active': { bgcolor: 'action.selected' },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: cat?.color || theme.colors.bgHover, width: 40, height: 40 }}>
                                <IconDisplay name={cat?.icon || 'HelpCircle'} size={20} sx={{ color: '#fff' }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={700} noWrap sx={{ mb: 0.25 }}>
                                  {t.description || cat?.name || 'Tanpa deskripsi'}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {cat?.name || 'Kategori Dihapus'}
                                  </Typography>
                                  {attachmentData && (
                                    <Chip
                                      size="small"
                                      icon={<IconDisplay name={attachmentData.type === 'image' ? 'Image' : 'FileText'} size={10} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingAttachment(attachmentData);
                                      }}
                                      sx={{
                                        height: 18,
                                        fontSize: 9,
                                        cursor: 'pointer',
                                        color: theme.colors.info,
                                        bgcolor: theme.colors.infoBg,
                                        '& .MuiChip-label': { px: 0.75 },
                                      }}
                                    />
                                  )}
                                  {pendingAttachmentUpload && (
                                    <Chip
                                      size="small"
                                      icon={<IconDisplay name={pendingAttachmentUpload.status === 'failed' ? 'AlertCircle' : 'Loader'} size={10} />}
                                      label={pendingAttachmentUpload.status === 'failed' ? 'Gagal' : 'Sync...'}
                                      sx={{
                                        height: 18,
                                        fontSize: 9,
                                        color: pendingAttachmentUpload.status === 'failed' ? theme.colors.error : theme.colors.warning,
                                        bgcolor: pendingAttachmentUpload.status === 'failed' ? theme.colors.errorLight : theme.colors.warningBg,
                                        '& .MuiChip-label': { px: 0.75 },
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ m: 0, pr: 2 }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ color: isIncome ? theme.colors.income : theme.colors.textPrimary, flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              {isIncome ? '+' : '-'}{formatRp(t.amount)}
                            </Typography>
                          </ListItemButton>
                          {idx < transactionsForDate.length - 1 && <Divider component="li" variant="inset" sx={{ ml: 8 }} />}
                        </React.Fragment>
                      );
                    })}
                    </List>
                  </Box>
                );
              })}
          </Box>
        )}
      </Box>

      {/* Edit Modal */}
      {editingTransaction && onUpdate && (
        <QuickAddSheetLoader
          quickAddType="EXPENSE"
          categories={categories}
          transactions={transactions}
          initialData={editingTransaction}
          latestData={transactions.find((transaction) => transaction.id === editingTransaction.id) || editingTransaction}
          currentUserId={currentUserId}
          activeAccountRole={activeAccountRole}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddCategory={onAddCategory}
          onClose={() => setEditingTransaction(null)}
          onShowNotification={onShowNotification}
          onAdd={async () => {}}
        />
      )}

      {/* Action Sheet */}
      <TransactionActionSheet
        open={!!actionSheetTransaction}
        transaction={actionSheetTransaction ? {
          id: actionSheetTransaction.id,
          description: actionSheetTransaction.description,
          amount: actionSheetTransaction.amount,
          date: actionSheetTransaction.date,
          categoryName: categories.find(c => c.id === actionSheetTransaction.categoryId)?.name,
          hasAttachment: !!(actionSheetTransaction.attachment || actionSheetTransaction.attachmentUrl),
          canEdit: !currentUserId || !actionSheetTransaction.createdByUserId || actionSheetTransaction.createdByUserId === currentUserId || activeAccountRole === 'OWNER',
        } : null}
        onClose={() => setActionSheetTransaction(null)}
        onAction={(action) => {
          if (!actionSheetTransaction) return;

          switch (action) {
            case 'view':
              if (actionSheetTransaction.attachmentUrl) {
                setViewingAttachment({
                  url: actionSheetTransaction.attachmentUrl,
                  name: actionSheetTransaction.attachmentName || 'Lampiran',
                  type: actionSheetTransaction.attachmentType || 'image',
                });
              } else if (actionSheetTransaction.attachment) {
                setViewingAttachment({
                  url: actionSheetTransaction.attachment.url,
                  path: actionSheetTransaction.attachment.path,
                  name: actionSheetTransaction.attachment.name,
                  type: actionSheetTransaction.attachment.type,
                });
              }
              break;
            case 'edit':
              setEditingTransaction(actionSheetTransaction);
              break;
            case 'duplicate':
              onShowNotification?.('info', 'Fitur Duplikat', 'Fitur duplikat transaksi akan segera hadir.', true);
              break;
            case 'delete':
              onDelete(actionSheetTransaction.id);
              break;
          }
        }}
      />
    </>
  );
};

export default TransactionList;
