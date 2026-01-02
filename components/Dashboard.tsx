import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Transaction, Category } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories }) => {
  const { theme } = useTheme();

  const totalIncome = transactions
    .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => categories.find(c => c.id === t.categoryId)?.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

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
        <h3 className="font-bold mb-3 px-1" style={{ color: theme.colors.textPrimary }}>Transaksi Terakhir</h3>
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
              {transactions.slice(0, 5).map(t => {
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