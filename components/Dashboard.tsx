import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
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

  const expenseByCategory = categories
    .filter(c => c.type === 'EXPENSE')
    .map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0),
      color: cat.color,
      icon: cat.icon,
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const formatRp = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const gettingStartedItems = [
    { title: '1. Catat transaksi dulu', description: 'Mulai dari yang simpel, misalnya makan siang, parkir, atau gaji.', actionLabel: 'Buka Transaksi', action: onGoToTransactions, icon: 'BookOpen' },
    { title: '2. Buat anggaran kalau sudah rutin', description: 'Pilih kategori yang ingin dipantau, tidak perlu semua sekaligus.', actionLabel: 'Buka Anggaran', action: onGoToBudgets, icon: 'PiggyBank' },
    {
      title: telegramLinked ? '3. Telegram sudah siap' : '3. Hubungkan Telegram',
      description: telegramLinked ? 'Anda sudah bisa catat lewat chat atau voice note.' : 'Kalau ingin lebih cepat, hubungkan Telegram supaya input terasa natural.',
      actionLabel: telegramLinked ? 'Buka Pengaturan' : 'Hubungkan Sekarang',
      action: onGoToSettings,
      icon: 'Send',
    },
  ];

  return (
    <Box sx={{ pb: { xs: 12, md: 0 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={600} textTransform="uppercase" letterSpacing="0.14em" color="text.disabled">
          {currentDate}
        </Typography>
        <Typography variant="h5" fontWeight={700}>Ringkasan Keuangan</Typography>
      </Box>

      {/* Getting Started Card */}
      {showGettingStarted && (
        <Paper variant="outlined" sx={{ borderRadius: '28px', p: { xs: 2.5, md: 3 }, mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Box sx={{ maxWidth: 560 }}>
              <Chip
                icon={<IconDisplay name="Sparkles" size={14} style={{ color: theme.colors.accent }} />}
                label="Mulai Dari Sini"
                size="small"
                sx={{ bgcolor: theme.colors.accentLight, color: theme.colors.accent, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 1.5 }}
              />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Biar {activeAccountName} cepat terisi dan mudah dipahami
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Untuk user baru, langkah paling aman biasanya begini: catat transaksi dulu, lalu atur anggaran kalau sudah mulai rutin.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={onOpenOnboarding} sx={{ borderRadius: '999px', whiteSpace: 'nowrap', fontWeight: 600 }}>
              Lihat Panduan Singkat
            </Button>
          </Box>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {gettingStartedItems.map((item) => (
              <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                <Paper
                  component="button"
                  onClick={item.action}
                  variant="outlined"
                  sx={{
                    borderRadius: '24px', p: 2.5, width: '100%', textAlign: 'left', cursor: 'pointer',
                    bgcolor: 'action.hover', transition: 'box-shadow 0.15s',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'background.paper', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconDisplay name={item.icon} size={20} />
                  </Box>
                  <Typography variant="body1" fontWeight={600} sx={{ mt: 2, mb: 0.5 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>{item.description}</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">{item.actionLabel}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper variant="outlined" sx={{ borderRadius: '24px', p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.14em" color="text.disabled">
              Contoh Input Telegram / Input Natural
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.8, mb: 1.5 }}>
              Pakai contoh ini saat mencatat lewat Telegram. Sistem akan baca dulu, lalu minta konfirmasi sebelum disimpan.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['makan siang 25rb', 'kopi 18rb, parkir 5rb', 'bulan ini jatah makan 2 juta'].map((ex) => (
                <Chip key={ex} label={ex} size="small" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper' }} />
              ))}
            </Box>
          </Paper>
        </Paper>
      )}

      {/* Hero Balance Card */}
      <Box
        sx={{
          borderRadius: 4,
          p: 3,
          mb: 3,
          color: '#fff',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 20px 40px rgba(79,70,229,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -16, right: -16, width: 128, height: 128, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', filter: 'blur(24px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -16, left: -16, width: 96, height: 96, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.2)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, opacity: 0.9 }}>
            <IconDisplay name="Wallet" size={18} style={{ color: '#c7d2fe' }} />
            <Typography variant="body2" fontWeight={500} letterSpacing={1}>Total Saldo</Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>{formatRp(balance)}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 2, p: 1.5, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconDisplay name="TrendingUp" size={16} style={{ color: '#93c5fd' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 1 }}>Pemasukan</Typography>
                <Typography variant="body2" fontWeight={600}>{formatRp(totalIncome)}</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 1, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right', display: 'block' }}>Pengeluaran</Typography>
                <Typography variant="body2" fontWeight={600}>{formatRp(totalExpense)}</Typography>
              </Box>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconDisplay name="TrendingDown" size={16} style={{ color: '#fca5a5' }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Budget Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            icon: 'Wallet', iconColor: theme.colors.accent,
            label: 'Anggaran Bulan Ini',
            value: formatRp(currentBudgetOverview.totalBudget),
            sub: currentBudgetOverview.activeBudgetCount > 0 ? `${currentBudgetOverview.activeBudgetCount} anggaran sedang dipantau` : 'Belum ada anggaran bulan ini',
            valueColor: 'text.primary',
          },
          {
            icon: 'TrendingDown', iconColor: theme.colors.expense,
            label: 'Sudah Terpakai',
            value: formatRp(currentBudgetOverview.totalSpent),
            sub: `Sisa ${formatRp(currentBudgetOverview.remaining)}`,
            valueColor: theme.colors.expense,
          },
          {
            icon: 'AlertCircle', iconColor: currentBudgetOverview.overBudgetCount > 0 ? theme.colors.expense : theme.colors.accent,
            label: 'Status Anggaran',
            value: currentBudgetOverview.overBudgetCount > 0 ? `${currentBudgetOverview.overBudgetCount} lewat` : 'Aman',
            sub: currentBudgetOverview.overBudgetCount > 0 ? 'Ada anggaran yang sudah melewati batas' : currentBudgetOverview.activeBudgetCount > 0 ? 'Belum ada anggaran yang melewati batas' : 'Atur anggaran untuk mulai memantau',
            valueColor: currentBudgetOverview.overBudgetCount > 0 ? theme.colors.expense : 'text.primary',
          },
        ].map((card) => (
          <Grid size={{ xs: 12, md: 4 }} key={card.label}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <IconDisplay name={card.icon} size={16} style={{ color: card.iconColor }} />
                <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.12em" color="text.disabled">
                  {card.label}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: card.valueColor, mb: 0.5 }}>{card.value}</Typography>
              <Typography variant="caption" color="text.disabled">{card.sub}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Expense Chart */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 3 }}>
        <Typography fontWeight={700} gutterBottom>Statistik Pengeluaran</Typography>
        {expenseByCategory.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatRp(value)}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme.colors.bgCard, color: theme.colors.textPrimary }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Typography variant="caption" color="text.disabled">Total Keluar</Typography>
                <Typography variant="body2" fontWeight={700}>{formatRp(totalExpense)}</Typography>
              </Box>
            </Box>
            <Box>
              {expenseByCategory.slice(0, 4).map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 32, borderRadius: 1, bgcolor: item.color }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      <Typography variant="caption" color="text.disabled">{((item.value / totalExpense) * 100).toFixed(1)}%</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{formatRp(item.value)}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
            <IconDisplay name="PieChart" size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
            <Typography variant="body2">Belum ada pengeluaran tercatat.</Typography>
          </Box>
        )}
      </Paper>

      {/* Recent Transactions */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography fontWeight={700}>Transaksi Terakhir</Typography>
            <Typography variant="caption" color="text.disabled">
              {transactions.length > 0 ? `Menampilkan ${Math.min(transactions.length, 10)} dari ${transactions.length} transaksi` : 'Belum ada transaksi'}
            </Typography>
          </Box>
        </Box>
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {transactions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.disabled">Belum ada transaksi terbaru.</Typography>
            </Box>
          ) : (
            [...transactions]
              .sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
              })
              .slice(0, 10)
              .map((t, idx, arr) => {
                const cat = categories.find(c => c.id === t.categoryId);
                const isIncome = cat?.type === 'INCOME';
                return (
                  <Box key={t.id}>
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: cat?.color || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconDisplay name={cat?.icon || 'HelpCircle'} size={18} style={{ color: '#fff' }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: { xs: 160, md: 300 } }}>
                            {cat?.name || 'Tanpa Kategori'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: { xs: 120, md: 240 }, display: 'block' }}>
                            {t.description || t.date}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: isIncome ? theme.colors.income : theme.colors.expense, whiteSpace: 'nowrap', ml: 1 }}>
                        {isIncome ? '+' : '-'}{formatRp(t.amount)}
                      </Typography>
                    </Box>
                    {idx < arr.length - 1 && <Divider />}
                  </Box>
                );
              })
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
