import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Transaction, Category, Budget } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { getBudgetOverview, getBudgetSummaries, getMonthKey } from '../utils/budget';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  showGettingStarted: boolean;
  activeAccountName: string;
  telegramLinked: boolean;
  onGoToTransactions: () => void;
  onGoToBudgets: () => void;
  onGoToSettings: () => void;
  onOpenOnboarding: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  budgets,
  showGettingStarted,
  activeAccountName,
  telegramLinked,
  onGoToTransactions,
  onGoToBudgets,
  onGoToSettings,
  onOpenOnboarding,
}) => {
  const { theme } = useTheme();

  const totalIncome = transactions
    .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const currentMonthKey = getMonthKey();
  const currentBudgetSummaries = getBudgetSummaries(budgets, transactions, categories, currentMonthKey);
  const currentBudgetOverview = getBudgetOverview(currentBudgetSummaries);

  // Data untuk Grafik (Top 5 Pengeluaran)
  const expenseByCategory = categories
    .filter(c => c.type === 'EXPENSE')
    .map(cat => {
      const amount = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: amount, color: cat.color, icon: cat.icon };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value); // Urutkan dari yang terbesar

  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-fade-in-up">

      {/* Header Sederhana */}
      <div className="px-1">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{currentDate}</p>
        <h2 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>Ringkasan Keuangan</h2>
      </div>

      {showGettingStarted && (
        <div
          className="rounded-[28px] border p-5 md:p-6"
          style={{
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
              >
                <IconDisplay name="Sparkles" size={14} />
                Mulai Dari Sini
              </div>
              <h3 className="mt-3 text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                Biar {activeAccountName} cepat terisi dan mudah dipahami
              </h3>
              <p className="mt-2 text-sm leading-7" style={{ color: theme.colors.textSecondary }}>
                Untuk user baru, langkah paling aman biasanya begini: catat transaksi dulu, lalu atur anggaran kalau sudah mulai rutin.
              </p>
            </div>
            <button
              onClick={onOpenOnboarding}
              className="rounded-full px-5 py-3 text-sm font-semibold"
              style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
            >
              Lihat Panduan Singkat
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                title: '1. Catat transaksi dulu',
                description: 'Mulai dari yang simpel, misalnya makan siang, parkir, atau gaji.',
                actionLabel: 'Buka Transaksi',
                action: onGoToTransactions,
                icon: 'BookOpen',
              },
              {
                title: '2. Buat anggaran kalau sudah rutin',
                description: 'Pilih kategori yang ingin dipantau, tidak perlu semua sekaligus.',
                actionLabel: 'Buka Anggaran',
                action: onGoToBudgets,
                icon: 'PiggyBank',
              },
              {
                title: telegramLinked ? '3. Telegram sudah siap' : '3. Hubungkan Telegram',
                description: telegramLinked
                  ? 'Anda sudah bisa catat lewat chat atau voice note tanpa buka aplikasi.'
                  : 'Kalau ingin lebih cepat, hubungkan Telegram supaya input terasa natural.',
                actionLabel: telegramLinked ? 'Buka Pengaturan' : 'Hubungkan Sekarang',
                action: onGoToSettings,
                icon: 'Send',
              },
            ].map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="rounded-[24px] border p-5 text-left transition-colors"
                style={{
                  backgroundColor: theme.colors.bgHover,
                  borderColor: theme.colors.border,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.accent }}
                >
                  <IconDisplay name={item.icon} size={20} />
                </div>
                <h4 className="mt-4 text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                  {item.description}
                </p>
                <p className="mt-4 text-sm font-semibold" style={{ color: theme.colors.accent }}>
                  {item.actionLabel}
                </p>
              </button>
            ))}
          </div>

          <div
            className="mt-5 rounded-[24px] border p-4"
            style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
              Contoh Input Telegram / Input Natural
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
              Pakai contoh ini saat mencatat lewat Telegram. Sistem akan baca dulu, lalu minta konfirmasi sebelum disimpan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['makan siang 25rb', 'kopi 18rb, parkir 5rb', 'bulan ini jatah makan 2 juta'].map((example) => (
                <span
                  key={example}
                  className="rounded-full px-3 py-1.5 text-sm"
                  style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.textPrimary }}
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Card - Saldo Utama (Tampilan ala E-Wallet) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
        {/* Elemen Dekoratif Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-400 opacity-20 rounded-full blur-xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <IconDisplay name="Wallet" size={18} className="text-indigo-200" />
            <span className="text-sm font-medium tracking-wide">Total Saldo</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-6">
            {formatRp(balance)}
          </h1>

          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-300 bg-blue-400/20">
                <IconDisplay name="TrendingUp" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-indigo-100 uppercase">Pemasukan</span>
                <span className="text-sm font-semibold text-white">{formatRp(totalIncome)}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-indigo-100 uppercase">Pengeluaran</span>
                <span className="text-sm font-semibold text-white">{formatRp(totalExpense)}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center text-red-300">
                <IconDisplay name="TrendingUp" size={16} className="transform rotate-180" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-2">
            <IconDisplay name="Wallet" size={16} style={{ color: theme.colors.accent }} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
              Anggaran Bulan Ini
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
            {formatRp(currentBudgetOverview.totalBudget)}
          </p>
          <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
            {currentBudgetOverview.activeBudgetCount > 0
              ? `${currentBudgetOverview.activeBudgetCount} anggaran sedang dipantau`
              : 'Belum ada anggaran bulan ini'}
          </p>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-2">
            <IconDisplay name="TrendingUp" size={16} className="transform rotate-180" style={{ color: theme.colors.expense }} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
              Sudah Terpakai
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold" style={{ color: theme.colors.expense }}>
            {formatRp(currentBudgetOverview.totalSpent)}
          </p>
          <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
            Sisa {formatRp(currentBudgetOverview.remaining)}
          </p>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-2">
            <IconDisplay name="AlertCircle" size={16} style={{ color: currentBudgetOverview.overBudgetCount > 0 ? theme.colors.expense : theme.colors.accent }} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
              Status Anggaran
            </p>
          </div>
          <p
            className="mt-3 text-2xl font-bold"
            style={{ color: currentBudgetOverview.overBudgetCount > 0 ? theme.colors.expense : theme.colors.textPrimary }}
          >
            {currentBudgetOverview.overBudgetCount > 0 ? `${currentBudgetOverview.overBudgetCount} lewat` : 'Aman'}
          </p>
          <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
            {currentBudgetOverview.overBudgetCount > 0
              ? 'Ada anggaran yang sudah melewati batas'
              : currentBudgetOverview.activeBudgetCount > 0
                ? 'Belum ada anggaran yang melewati batas'
                : 'Atur anggaran untuk mulai memantau'}
          </p>
        </div>
      </div>

      {/* Analisis Pengeluaran (Chart & List) */}
      <div
        className="p-5 rounded-2xl shadow-sm border"
        style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ color: theme.colors.textPrimary }}>Statistik Pengeluaran</h3>
        </div>

        {expenseByCategory.length > 0 ? (
          <div className="flex flex-col gap-6">
            {/* Donut Chart */}
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatRp(value)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: theme.colors.bgCard,
                      color: theme.colors.textPrimary
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Text Center Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-medium" style={{ color: theme.colors.textMuted }}>Total Keluar</span>
                <span className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>{formatRp(totalExpense)}</span>
              </div>
            </div>

            {/* Kategori Legend List */}
            <div className="space-y-3">
              {expenseByCategory.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{item.name}</span>
                      <span className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {((item.value / totalExpense) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>{formatRp(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center" style={{ color: theme.colors.textMuted }}>
            <IconDisplay name="PieChart" size={48} className="mb-3 opacity-20" />
            <p className="text-sm">Belum ada pengeluaran tercatat.</p>
          </div>
        )}
      </div>

      {/* Transaksi Terakhir (Mobile Clean Style) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="font-bold" style={{ color: theme.colors.textPrimary }}>Transaksi Terakhir</h3>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>
              {transactions.length > 0 ? `Menampilkan ${Math.min(transactions.length, 10)} dari ${transactions.length} transaksi` : 'Belum ada transaksi'}
            </p>
          </div>
        </div>
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
        >
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: theme.colors.textMuted }}>
              Belum ada transaksi terbaru.
            </div>
          ) : (
            <div>
              {[...transactions]
                .sort((a, b) => {
                  // Sort by createdAt descending (newest first)
                  const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return timeB - timeA;
                })
                .slice(0, 10)
                .map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const isIncome = cat?.type === 'INCOME';
                  return (
                    <div
                      key={t.id}
                      className="p-4 flex items-center justify-between transition-colors"
                      style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: cat?.color || '#ccc' }}
                        >
                          <IconDisplay name={cat?.icon || 'HelpCircle'} size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-semibold truncate pr-2" style={{ color: theme.colors.textPrimary }}>
                            {cat?.name || 'Tanpa Kategori'}
                          </p>
                          <p className="text-xs truncate max-w-[120px] md:max-w-xs" style={{ color: theme.colors.textMuted }}>
                            {t.description || t.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-semibold text-sm whitespace-nowrap"
                        style={{ color: isIncome ? theme.colors.income : theme.colors.expense }}
                      >
                        {isIncome ? '+' : '-'}{formatRp(t.amount)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
