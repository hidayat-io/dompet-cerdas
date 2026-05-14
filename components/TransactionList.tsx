import React, { useMemo, useState, useRef } from 'react';
import { Transaction, Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import TransactionForm from './TransactionForm';
import { NotificationType } from './NotificationModal';
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
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
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
  name: string;
  type: 'image' | 'pdf';
  onClose: () => void;
}> = ({ url, name, type, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <FullScreenDialog
      open
      onClose={onClose}
      title={name}
      description="Preview lampiran transaksi dalam tampilan yang konsisten dengan modal lain."
      headerActions={
        <IconButton
          component="a"
          href={url}
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
            src={url}
            alt={name}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2, boxShadow: 3, display: isLoading ? 'none' : 'block' }}
          />
        ) : (
          <Box
            component="iframe"
            src={url}
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

const getShortMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return months[month];
};

const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

type FilterMode = 'month' | 'range';

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, currentUserId, activeAccountRole, pendingAttachmentUploads = {}, onDelete, onUpdate, onAddCategory, onShowNotification }) => {
  const { theme } = useTheme();

  const [viewingAttachment, setViewingAttachment] = useState<{
    url: string;
    name: string;
    type: 'image' | 'pdf';
  } | null>(null);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Long Press Logic with Animation
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);

  const handleTouchStart = (transaction: Transaction) => {
    setLongPressedId(transaction.id);
    longPressTimerRef.current = setTimeout(() => {
      setEditingTransaction(transaction);
      setLongPressedId(null);
      if (navigator && navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressedId(null);
  };

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

  const yearOptions = useMemo(() => generateYearOptions(), []);

  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

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

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonthIndex(monthIndex);
    setStartDate(formatDateLocal(new Date(selectedYear, monthIndex, 1)));
    setEndDate(formatDateLocal(new Date(selectedYear, monthIndex + 1, 0)));
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

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedYear === now.getFullYear() && selectedMonthIndex === now.getMonth();
  };

  const hasActiveFilters = searchQuery || selectedCategoryId !== 'all' || selectedType !== 'all';

  return (
    <>
      {/* Attachment Modal */}
      {viewingAttachment && (
        <AttachmentModal
          url={viewingAttachment.url}
          name={viewingAttachment.name}
          type={viewingAttachment.type}
          onClose={() => setViewingAttachment(null)}
        />
      )}

      <Box sx={{ pb: { xs: 10, md: 0 } }}>
        {/* Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: 'Pemasukan', value: totalIncome, color: theme.colors.income },
            { label: 'Pengeluaran', value: totalExpense, color: theme.colors.expense },
            { label: 'Saldo', value: totalBalance, color: totalBalance >= 0 ? theme.colors.income : theme.colors.expense, prefix: totalBalance > 0 ? '+' : '' },
          ].map((item) => (
            <Grid size={{ xs: 4 }} key={item.label}>
              <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {item.label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: item.color, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                  {item.prefix}{formatRp(item.value)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Header + Filter Toggle */}
        <PageHeader
          title="Riwayat Transaksi"
          description="Lihat, cari, dan saring transaksi dengan pola tampilan yang sama seperti menu lainnya."
          actions={
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<IconDisplay name="Filter" size={16} />}
              endIcon={<IconDisplay name={showFilters ? 'ArrowUp' : 'ArrowDown'} size={14} />}
            >
              {getFilterLabel()}
            </Button>
          }
        />

        {/* Filter Panel */}
        {showFilters && (
          <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
            {/* Filter Mode Tabs */}
            <Tabs 
              value={filterMode} 
              onChange={(_, newValue) => setFilterMode(newValue)}
              variant="fullWidth"
              sx={{ mb: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
            >
              <Tab 
                value="month" 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconDisplay name="Calendar" size={16} /> Per Bulan</Box>} 
              />
              <Tab 
                value="range" 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><IconDisplay name="CalendarDays" size={16} /> Rentang Tanggal</Box>} 
              />
            </Tabs>

            {/* Month Selector */}
            {filterMode === 'month' && (
              <Box>
                {/* Year selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', pb: 1, mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ flexShrink: 0 }}>
                    Tahun:
                  </Typography>
                  {yearOptions.map((year) => (
                    <Box
                      key={year}
                      component="button"
                      onClick={() => handleYearChange(year)}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        border: 'none',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        bgcolor: selectedYear === year ? 'primary.main' : 'action.hover',
                        color: selectedYear === year ? '#fff' : 'text.primary',
                        transition: 'all 0.15s',
                      }}
                    >
                      {year}
                    </Box>
                  ))}
                </Box>

                {/* Month grid */}
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => (
                    <Grid size={{ xs: 3, md: 2 }} key={monthIndex}>
                      <Box
                        component="button"
                        onClick={() => handleMonthSelect(monthIndex)}
                        sx={{
                          width: '100%',
                          py: 1,
                          border: '1px solid',
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          bgcolor: selectedMonthIndex === monthIndex ? 'primary.main' : 'action.hover',
                          color: selectedMonthIndex === monthIndex ? '#fff' : 'text.primary',
                          borderColor: selectedMonthIndex === monthIndex ? 'primary.main' : 'divider',
                          transition: 'all 0.15s',
                        }}
                      >
                        {getShortMonthName(monthIndex)}
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {!isCurrentMonth() && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<IconDisplay name="RefreshCw" size={14} />}
                    onClick={resetToCurrentMonth}
                    sx={{ borderRadius: 2, mt: 1 }}
                  >
                    Kembali ke Bulan Ini
                  </Button>
                )}
              </Box>
            )}

            {/* Date Range Selector */}
            {filterMode === 'range' && (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'flex-end' } }}>
                <TextField
                  label="Dari Tanggal"
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Sampai Tanggal"
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconDisplay name="RefreshCw" size={14} />}
                  onClick={resetToCurrentMonth}
                  sx={{ borderRadius: 2, flexShrink: 0, height: 40 }}
                >
                  Bulan Ini
                </Button>
              </Box>
            )}

            {/* Search & Filters */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, mt: 2 }}>
              {/* Search */}
              <TextField
                size="small"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconDisplay name="Search" size={18} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <IconDisplay name="X" size={14} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }
                }}
                sx={{ flex: 1 }}
              />

              {/* Type Filter Tabs */}
              <Tabs
                value={selectedType}
                onChange={(_, newValue) => setSelectedType(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  flexShrink: 0, 
                  minHeight: 40,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  p: 0.5,
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTab-root': { 
                    minHeight: 32, 
                    py: 0.5, 
                    px: 2, 
                    borderRadius: 1.5,
                    textTransform: 'none', 
                    fontWeight: 600,
                    fontSize: 13,
                    minWidth: 'auto',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                    }
                  },
                  '& .MuiTab-root.Mui-selected[value="EXPENSE"]': { color: theme.colors.expense },
                  '& .MuiTab-root.Mui-selected[value="INCOME"]': { color: theme.colors.income },
                  '& .MuiTab-root.Mui-selected[value="all"]': { color: 'primary.main' },
                }}
              >
                <Tab value="all" label="Semua" />
                <Tab value="EXPENSE" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><IconDisplay name="TrendingDown" size={14} /> Keluar</Box>} />
                <Tab value="INCOME" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><IconDisplay name="TrendingUp" size={14} /> Masuk</Box>} />
              </Tabs>

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 160, flexShrink: 0 }}>
                <InputLabel>Kategori</InputLabel>
                <Select
                  label="Kategori"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <MenuItem value="all">Semua Kategori</MenuItem>
                  <MenuItem disabled sx={{ fontSize: 12, color: 'text.disabled', py: 0.25 }}>── Pengeluaran ──</MenuItem>
                  {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                  <MenuItem disabled sx={{ fontSize: 12, color: 'text.disabled', py: 0.25 }}>── Pemasukan ──</MenuItem>
                  {categories.filter(c => c.type === 'INCOME').map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>
        )}

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

        {/* Transaction Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {filteredTransactions.length} transaksi ditemukan
        </Typography>

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

        {/* Transactions grouped by date */}
        {filteredTransactions.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              {Object.entries(groupedTransactions).map(([date, txs]) => {
                const transactionsForDate = txs as Transaction[];
                const { dayDate, dayName, monthYear } = getDateParts(date);
                const dailyTotal = calculateDailyTotal(transactionsForDate);
                const isToday = date === todayKey;

                return (
                  <Card
                    key={date}
                    variant="outlined"
                    sx={{
                      overflow: 'hidden',
                      borderRadius: 4,
                      borderColor: isToday ? 'primary.main' : 'divider',
                      boxShadow: isToday ? `0 0 0 1px ${theme.colors.accent}22` : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        px: { xs: 2.5, md: 3 },
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        background: isToday
                          ? `linear-gradient(135deg, ${theme.colors.accentLight} 0%, ${theme.colors.bgCard} 100%)`
                          : 'linear-gradient(180deg, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0.02) 100%)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            bgcolor: isToday ? 'primary.main' : 'background.paper',
                            color: isToday ? '#fff' : 'text.primary',
                            border: '1px solid',
                            borderColor: isToday ? 'primary.main' : 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isToday ? `0 12px 24px ${theme.colors.accent}25` : 'none',
                          }}
                        >
                          <Typography sx={{ fontSize: 30, fontWeight: 300, lineHeight: 1, letterSpacing: '-1px', color: 'inherit' }}>
                            {dayDate}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="text.primary" lineHeight={1.2}>
                            {dayName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {monthYear}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`${dailyTotal > 0 ? '+' : ''}${formatRp(dailyTotal)}`}
                        size="small"
                        sx={{
                          bgcolor: dailyTotal >= 0 ? theme.colors.incomeBg : theme.colors.expenseBg,
                          color: dailyTotal >= 0 ? theme.colors.income : theme.colors.expense,
                          fontWeight: 700,
                          height: 28,
                          borderRadius: 2,
                        }}
                      />
                    </Box>

                    <List disablePadding sx={{ bgcolor: 'background.paper' }}>
                    {transactionsForDate.map((t, idx, arr) => {
                      const cat = categories.find(c => c.id === t.categoryId);
                      const isIncome = cat?.type === 'INCOME';
                      const attachmentData = t.attachmentUrl
                        ? { url: t.attachmentUrl, name: t.attachmentName || 'Lampiran', type: t.attachmentType || 'image' as 'image' | 'pdf' }
                        : t.attachment
                        ? { url: t.attachment.url, name: t.attachment.name, type: t.attachment.type }
                        : null;
                      const pendingAttachmentUpload = pendingAttachmentUploads[t.id];

                      return (
                        <React.Fragment key={t.id}>
                          <ListItemButton 
                            sx={{ 
                              py: 2,
                              px: { xs: 2.5, md: 3 },
                              transition: 'all 0.2s',
                              transform: longPressedId === t.id ? 'scale(0.98)' : 'none',
                              opacity: longPressedId === t.id ? 0.7 : 1,
                              bgcolor: longPressedId === t.id ? theme.colors.accentLight : 'transparent',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                            onTouchStart={() => handleTouchStart(t)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchEnd}
                            onMouseDown={() => handleTouchStart(t)}
                            onMouseUp={handleTouchEnd}
                            onMouseLeave={handleTouchEnd}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: cat?.color || theme.colors.bgHover, width: 44, height: 44 }}>
                                <IconDisplay name={cat?.icon || 'HelpCircle'} size={22} sx={{ color: '#fff' }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<Typography variant="subtitle1" fontWeight={700} noWrap>{cat?.name || 'Kategori Dihapus'}</Typography>}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                                    {t.description || 'Tidak ada catatan'}
                                  </Typography>
                                  {attachmentData && (
                                    <Chip
                                      size="small"
                                      icon={<IconDisplay name={attachmentData.type === 'image' ? 'Image' : 'FileText'} size={12} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingAttachment(attachmentData);
                                      }}
                                      sx={{
                                        height: 20,
                                        fontSize: 10,
                                        cursor: 'pointer',
                                        color: attachmentData.type === 'image' ? theme.colors.income : theme.colors.accent,
                                        bgcolor: attachmentData.type === 'image' ? theme.colors.incomeBg : theme.colors.accentLight,
                                        '& .MuiChip-label': { px: 1 },
                                      }}
                                    />
                                  )}
                                  {pendingAttachmentUpload && (
                                    <Chip
                                      size="small"
                                      icon={<IconDisplay name={pendingAttachmentUpload.status === 'failed' ? 'AlertCircle' : 'Loader'} size={12} />}
                                      label={pendingAttachmentUpload.status === 'failed' ? 'Upload gagal' : 'Menunggu upload'}
                                      sx={{
                                        height: 20,
                                        fontSize: 10,
                                        color: pendingAttachmentUpload.status === 'failed' ? theme.colors.error : theme.colors.accent,
                                        bgcolor: pendingAttachmentUpload.status === 'failed' ? theme.colors.errorLight : theme.colors.accentLight,
                                        '& .MuiChip-label': { px: 1 },
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              sx={{ m: 0, pr: 2 }}
                            />
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{ color: isIncome ? theme.colors.income : theme.colors.textPrimary, flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              {isIncome ? '+' : '-'}{formatRp(t.amount)}
                            </Typography>
                          </ListItemButton>
                          {idx < arr.length - 1 && <Divider component="li" variant="inset" sx={{ ml: { xs: 9, md: 10 } }} />}
                        </React.Fragment>
                      );
                    })}
                    </List>
                  </Card>
                );
              })}
          </Box>
        )}
      </Box>

      {/* Edit Modal */}
      {editingTransaction && onUpdate && (
        <TransactionForm
          categories={categories}
          initialData={editingTransaction}
          latestData={transactions.find((transaction) => transaction.id === editingTransaction.id) || editingTransaction}
          currentUserId={currentUserId}
          activeAccountRole={activeAccountRole}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddCategory={onAddCategory}
          onClose={() => setEditingTransaction(null)}
          onShowNotification={onShowNotification}
        />
      )}
    </>
  );
};

export default TransactionList;
