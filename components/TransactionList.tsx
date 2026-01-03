import React, { useMemo, useState, useRef } from 'react';
import { Transaction, Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import TransactionForm from './TransactionForm';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onUpdate?: (
    id: string,
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' } | null
  ) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => void;
}

// Modal for viewing attachment (moved up for cleaner structure)
const AttachmentModal: React.FC<{
  url: string;
  name: string;
  type: 'image' | 'pdf';
  onClose: () => void;
}> = ({ url, name, type, onClose }) => {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.colors.bgCard }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 flex justify-between items-center border-b"
          style={{
            backgroundColor: theme.colors.bgHover,
            borderColor: theme.colors.border
          }}
        >
          <span className="font-medium truncate" style={{ color: theme.colors.textPrimary }}>{name}</span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.accent }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accentLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Buka di tab baru"
            >
              <IconDisplay name="Share" size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: theme.colors.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgMuted;
                e.currentTarget.style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textMuted;
              }}
            >
              <IconDisplay name="X" size={18} />
            </button>
          </div>
        </div>
        <div
          className="overflow-auto flex-1 p-4 flex items-center justify-center"
          style={{ backgroundColor: theme.colors.bgPrimary }}
        >
          {type === 'image' ? (
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          ) : (
            <iframe
              src={url}
              title={name}
              className="w-full h-[70vh] rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            />
          )}
        </div>
      </div>
    </div>
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

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, onDelete, onUpdate, onAddCategory }) => {
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

  const yearOptions = useMemo(() => generateYearOptions(), []);

  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter transactions based on selected filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.date);

      if (filterMode === 'month') {
        return txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonthIndex;
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }
    });
  }, [transactions, filterMode, selectedYear, selectedMonthIndex, startDate, endDate]);

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groups: { [key: string]: Transaction[] } = {};
    sorted.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });

    // Sort transactions within each date group by createdAt descending (newest first)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Descending: newest input at top
      });
    });

    return groups;
  }, [filteredTransactions]);

  // Calculate totals for filtered transactions
  const { totalIncome, totalExpense, totalBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat?.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      totalBalance: income - expense
    };
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

  // Get current filter label
  const getFilterLabel = () => {
    if (filterMode === 'month') {
      return `${getMonthName(selectedMonthIndex)} ${selectedYear}`;
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  };

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle month select
  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonthIndex(monthIndex);
    const firstDay = new Date(selectedYear, monthIndex, 1);
    const lastDay = new Date(selectedYear, monthIndex + 1, 0);
    setStartDate(formatDateLocal(firstDay));
    setEndDate(formatDateLocal(lastDay));
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const firstDay = new Date(year, selectedMonthIndex, 1);
    const lastDay = new Date(year, selectedMonthIndex + 1, 0);
    setStartDate(formatDateLocal(firstDay));
    setEndDate(formatDateLocal(lastDay));
  };

  // Handle start date change
  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    const [year, month] = value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonthIndex(month - 1);
  };

  // Handle end date change
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
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateLocal(firstDay));
    setEndDate(formatDateLocal(lastDay));
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedYear === now.getFullYear() && selectedMonthIndex === now.getMonth();
  };

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

      <div className="space-y-4 pb-20 md:pb-0">
        {/* Header with Filter Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-2xl font-bold hidden md:block" style={{ color: theme.colors.textPrimary }}>Riwayat Transaksi</h2>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-sm"
            style={{
              backgroundColor: theme.colors.bgCard,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary
            }}
          >
            <IconDisplay name="Filter" size={16} />
            <span>{getFilterLabel()}</span>
            <IconDisplay name={showFilters ? "ArrowUp" : "ArrowDown"} size={14} style={{ color: theme.colors.textMuted }} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div
            className="rounded-xl border p-4 shadow-sm animate-fade-in-up"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            {/* Filter Mode Tabs */}
            <div
              className="flex p-1 rounded-lg mb-4"
              style={{ backgroundColor: theme.colors.bgHover }}
            >
              <button
                onClick={() => setFilterMode('month')}
                className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: filterMode === 'month' ? theme.colors.bgCard : 'transparent',
                  color: filterMode === 'month' ? theme.colors.accent : theme.colors.textMuted,
                  boxShadow: filterMode === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <IconDisplay name="Calendar" size={16} />
                Per Bulan
              </button>
              <button
                onClick={() => setFilterMode('range')}
                className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: filterMode === 'range' ? theme.colors.bgCard : 'transparent',
                  color: filterMode === 'range' ? theme.colors.accent : theme.colors.textMuted,
                  boxShadow: filterMode === 'range' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <IconDisplay name="CalendarDays" size={16} />
                Rentang Tanggal
              </button>
            </div>

            {/* Month Selector with Year */}
            {filterMode === 'month' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: theme.colors.textMuted }}>Tahun:</span>
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                      style={{
                        backgroundColor: selectedYear === year ? theme.colors.accent : theme.colors.bgHover,
                        color: selectedYear === year ? theme.colors.accentText : theme.colors.textPrimary,
                        boxShadow: selectedYear === year ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => (
                    <button
                      key={monthIndex}
                      onClick={() => handleMonthSelect(monthIndex)}
                      className="py-2 px-3 rounded-lg text-sm font-medium transition-all border"
                      style={{
                        backgroundColor: selectedMonthIndex === monthIndex ? theme.colors.accent : theme.colors.bgHover,
                        color: selectedMonthIndex === monthIndex ? theme.colors.accentText : theme.colors.textPrimary,
                        borderColor: selectedMonthIndex === monthIndex ? theme.colors.accent : theme.colors.border,
                        boxShadow: selectedMonthIndex === monthIndex ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      {getShortMonthName(monthIndex)}
                    </button>
                  ))}
                </div>

                {!isCurrentMonth() && (
                  <button
                    onClick={resetToCurrentMonth}
                    className="mt-3 w-full py-2 px-4 font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                    style={{
                      backgroundColor: theme.colors.bgHover,
                      color: theme.colors.textPrimary
                    }}
                  >
                    <IconDisplay name="RefreshCw" size={14} />
                    Kembali ke Bulan Ini
                  </button>
                )}
              </div>
            )}

            {/* Date Range Selector */}
            {filterMode === 'range' && (
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.textMuted }}>Dari Tanggal</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                    style={{
                      backgroundColor: theme.colors.bgHover,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: theme.colors.textMuted }}>Sampai Tanggal</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none text-sm"
                    style={{
                      backgroundColor: theme.colors.bgHover,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }}
                  />
                </div>

                <button
                  onClick={resetToCurrentMonth}
                  className="py-2 px-4 font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm flex-shrink-0"
                  style={{
                    backgroundColor: theme.colors.bgHover,
                    color: theme.colors.textPrimary
                  }}
                >
                  <IconDisplay name="RefreshCw" size={14} />
                  Bulan Ini
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl border p-3 shadow-sm"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            <p className="text-xs mb-1" style={{ color: theme.colors.textMuted }}>Pemasukan</p>
            <p className="text-sm md:text-base font-bold" style={{ color: theme.colors.income }}>{formatRp(totalIncome)}</p>
          </div>
          <div
            className="rounded-xl border p-3 shadow-sm"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            <p className="text-xs mb-1" style={{ color: theme.colors.textMuted }}>Pengeluaran</p>
            <p className="text-sm md:text-base font-bold" style={{ color: theme.colors.expense }}>{formatRp(totalExpense)}</p>
          </div>
          <div
            className="rounded-xl border p-3 shadow-sm"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            <p className="text-xs mb-1" style={{ color: theme.colors.textMuted }}>Selisih</p>
            <p
              className="text-sm md:text-base font-bold"
              style={{ color: totalBalance >= 0 ? theme.colors.income : theme.colors.expense }}
            >
              {formatRp(totalBalance)}
            </p>
          </div>
        </div>

        {/* Transaction Count */}
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {filteredTransactions.length} transaksi ditemukan
        </p>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl shadow-sm border"
            style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
          >
            <div className="p-4 rounded-full mb-4" style={{ backgroundColor: theme.colors.bgHover }}>
              <IconDisplay name="Search" size={32} style={{ color: theme.colors.textMuted }} />
            </div>
            <p className="font-medium" style={{ color: theme.colors.textSecondary }}>Tidak ada transaksi</p>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>Coba ubah filter tanggal</p>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, txs]) => {
            const transactionsForDate = txs as Transaction[];
            const { dayDate, dayName, monthYear } = getDateParts(date);
            const dailyTotal = calculateDailyTotal(transactionsForDate);

            return (
              <div
                key={date}
                className="rounded-xl shadow-sm border overflow-hidden"
                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
              >
                {/* Date Header */}
                <div
                  className="px-4 py-3 flex justify-between items-center"
                  style={{ backgroundColor: theme.colors.bgHover, borderBottom: `1px solid ${theme.colors.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-3xl font-light tracking-tighter leading-none"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {dayDate}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>{dayName}</span>
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>{monthYear}</span>
                    </div>
                  </div>
                  {/* Daily Summary */}
                  <div
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: dailyTotal >= 0 ? theme.colors.incomeBg : theme.colors.expenseBg,
                      color: dailyTotal >= 0 ? theme.colors.income : theme.colors.expense
                    }}
                  >
                    {dailyTotal > 0 ? '+' : ''}{formatRp(dailyTotal)}
                  </div>
                </div>

                {/* Transactions List */}
                <div style={{ borderColor: theme.colors.border }}>
                  {transactionsForDate.map((t) => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const isIncome = cat?.type === 'INCOME';

                    return (
                      <div
                        key={t.id}
                        className="p-4 flex items-center justify-between group relative select-none"
                        style={{
                          borderBottom: `1px solid ${theme.colors.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: longPressedId === t.id ? 'scale(0.97)' : 'scale(1)',
                          opacity: longPressedId === t.id ? 0.7 : 1,
                          backgroundColor: longPressedId === t.id ? theme.colors.accentLight : 'transparent'
                        }}
                        onTouchStart={() => handleTouchStart(t)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onMouseDown={() => handleTouchStart(t)}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                      >
                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: cat?.color || '#9ca3af' }}
                          >
                            <IconDisplay name={cat?.icon || 'HelpCircle'} size={18} />
                          </div>

                          {/* Text Content */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                              {cat?.name || 'Kategori Dihapus'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs truncate" style={{ color: theme.colors.textMuted }}>
                                {t.description || 'Tidak ada catatan'}
                              </span>
                              {t.attachmentUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingAttachment({
                                      url: t.attachmentUrl!,
                                      name: t.attachmentName || 'Lampiran',
                                      type: t.attachmentType || 'image'
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors"
                                  style={{
                                    color: theme.colors.accent,
                                    backgroundColor: theme.colors.accentLight
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  title="Lihat lampiran"
                                >
                                  <IconDisplay name="Paperclip" size={12} />
                                </button>
                              )}
                              {t.attachment && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingAttachment({
                                      url: t.attachment!.url,
                                      name: t.attachment!.name,
                                      type: t.attachment!.type
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors"
                                  style={{
                                    color: theme.colors.accent,
                                    backgroundColor: theme.colors.accentLight
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  title="Lihat lampiran"
                                >
                                  <IconDisplay name="Paperclip" size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount, Edit & Delete */}
                        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                          <span
                            className="font-bold text-sm whitespace-nowrap mr-2"
                            style={{ color: isIncome ? theme.colors.income : theme.colors.expense }}
                          >
                            {isIncome ? '+' : '-'}{formatRp(t.amount)}
                          </span>


                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTransaction && onUpdate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <TransactionForm
            categories={categories}
            initialData={editingTransaction}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddCategory={onAddCategory}
            onClose={() => setEditingTransaction(null)}
          />
        </div>
      )}
    </>
  );
};

export default TransactionList;