import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import { Transaction, Category, Budget } from '../types';
import IconDisplay from './IconDisplay';
import PageHeader from './PageHeader';
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
  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dompetcerdas_hide_balance') === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dompetcerdas_hide_balance', hideBalance ? 'true' : 'false');
  }, [hideBalance]);

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
  const formatSensitiveValue = (val: number) => hideBalance ? 'Rp ••••••' : formatRp(val);

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
      <PageHeader
        eyebrow={currentDate}
        title="Ringkasan Keuangan"
        description={`Pantau saldo, anggaran, dan aktivitas terbaru untuk ${activeAccountName} dalam satu pola tampilan yang konsisten.`}
      />

      {/* Getting Started Card */}
      {showGettingStarted && (
        <Card variant="outlined" sx={{ borderRadius: 4, mb: 4, bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
              <Box sx={{ maxWidth: 560 }}>
                <Chip
                  icon={<IconDisplay name="Sparkles" size={14} sx={{ color: theme.colors.accent }} />}
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

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {gettingStartedItems.map((item) => (
                <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                  <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                    <CardActionArea onClick={item.action} sx={{ height: '100%', p: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: theme.colors.bgHover, color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <IconDisplay name={item.icon} size={20} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>{item.description}</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">{item.actionLabel}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ borderRadius: 3, p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.14em" color="text.disabled">
                Contoh Input Natural / Telegram
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Ketik kalimat seperti ini pada fitur Telegram atau form Pintar. AI akan otomatis merapikannya:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['makan siang 25rb', 'kopi 18rb, parkir 5rb', 'bulan ini jatah makan 2 juta'].map((ex) => (
                  <Chip key={ex} label={ex} size="small" variant="outlined" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper' }} />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Hero Balance Card */}
      <Card
        sx={{
          borderRadius: 4,
          mb: 4,
          color: '#fff',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 16px 32px rgba(79,70,229,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', filter: 'blur(24px)' }} />
        <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
              <IconDisplay name="Wallet" size={20} sx={{ color: '#c7d2fe' }} />
              <Typography variant="overline" fontWeight={600} letterSpacing={1.5}>Total Saldo</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setHideBalance((prev) => !prev)}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
              aria-label={hideBalance ? 'Tampilkan total saldo' : 'Sembunyikan total saldo'}
            >
              <IconDisplay name="Eye" size={18} sx={{ color: '#fff', opacity: hideBalance ? 0.7 : 1 }} />
            </IconButton>
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 4, letterSpacing: '-0.02em' }}>{formatSensitiveValue(balance)}</Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(96,165,250,0.2)' }}>
                  <IconDisplay name="TrendingUp" size={18} sx={{ color: '#93c5fd' }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Pemasukan</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{formatSensitiveValue(totalIncome)}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 3, p: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(248,113,113,0.2)' }}>
                  <IconDisplay name="TrendingDown" size={18} sx={{ color: '#fca5a5' }} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}>Pengeluaran</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>{formatSensitiveValue(totalExpense)}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Budget Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            icon: 'Wallet', iconColor: theme.colors.accent,
            label: 'Anggaran Bulan Ini',
            value: formatRp(currentBudgetOverview.totalBudget),
            sub: currentBudgetOverview.activeBudgetCount > 0 ? `${currentBudgetOverview.activeBudgetCount} anggaran dipantau` : 'Belum ada anggaran',
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
            value: currentBudgetOverview.overBudgetCount > 0 ? `${currentBudgetOverview.overBudgetCount} berlebih` : 'Aman',
            sub: currentBudgetOverview.overBudgetCount > 0 ? 'Ada pengeluaran melampaui batas' : 'Keuangan terkendali',
            valueColor: currentBudgetOverview.overBudgetCount > 0 ? theme.colors.expense : 'text.primary',
          },
        ].map((card) => (
          <Grid size={{ xs: 12, md: 4 }} key={card.label}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <IconDisplay name={card.icon} size={18} sx={{ color: card.iconColor }} />
                  <Typography variant="overline" fontWeight={700} lineHeight={1} color="text.secondary">
                    {card.label}
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: card.valueColor, mb: 0.5 }}>{card.value}</Typography>
                <Typography variant="body2" color="text.secondary">{card.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Expense Chart */}
      <Card variant="outlined" sx={{ borderRadius: 4, mb: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Statistik Pengeluaran</Typography>
          {expenseByCategory.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ height: 240, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatRp(value)}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', backgroundColor: theme.colors.bgCard, color: theme.colors.textPrimary }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>Total Keluar</Typography>
                  <Typography variant="h6" fontWeight={800}>{formatRp(totalExpense)}</Typography>
                </Box>
              </Box>
              <List disablePadding>
                {expenseByCategory.slice(0, 4).map((item, idx, arr) => (
                  <React.Fragment key={idx}>
                    <ListItem disableGutters sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: item.color, width: 36, height: 36 }}>
                          <IconDisplay name={item.icon} size={18} sx={{ color: '#fff' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" fontWeight={700}>{item.name}</Typography>} 
                        secondary={<Typography variant="caption" color="text.secondary">{((item.value / totalExpense) * 100).toFixed(1)}%</Typography>}
                      />
                      <Typography variant="subtitle2" fontWeight={700}>{formatRp(item.value)}</Typography>
                    </ListItem>
                    {idx < arr.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.disabled' }}>
              <IconDisplay name="PieChart" size={64} sx={{ opacity: 0.15 }} />
              <Typography variant="body1" sx={{ mt: 2 }}>Belum ada pengeluaran tercatat.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Transaksi Terakhir</Typography>
          <Typography variant="body2" color="text.secondary">
            {transactions.length > 0 ? `Menampilkan ${Math.min(transactions.length, 10)} catatan terbaru` : 'Belum ada transaksi'}
          </Typography>
        </Box>
        {transactions.length > 0 && (
          <Button size="small" onClick={onGoToTransactions} sx={{ fontWeight: 600 }}>Lihat Semua</Button>
        )}
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        {transactions.length === 0 ? (
          <CardContent sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.disabled' }}>
             <IconDisplay name="Inbox" size={48} sx={{ opacity: 0.2 }} />
             <Typography variant="body2" sx={{ mt: 2 }}>Belum ada transaksi di bulan ini.</Typography>
          </CardContent>
        ) : (
          <List disablePadding>
            {[...transactions]
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
                  <React.Fragment key={t.id}>
                    <ListItemButton sx={{ py: 2, px: { xs: 2.5, md: 3 } }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: cat?.color || theme.colors.bgHover, color: '#fff' }}>
                          <IconDisplay name={cat?.icon || 'HelpCircle'} size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" fontWeight={700} noWrap>{cat?.name || 'Tanpa Kategori'}</Typography>}
                        secondary={<Typography variant="body2" color="text.secondary" noWrap>{t.description || t.date}</Typography>}
                        sx={{ m: 0, pr: 2 }}
                      />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: isIncome ? theme.colors.income : theme.colors.textPrimary, whiteSpace: 'nowrap' }}>
                        {isIncome ? '+' : '-'}{formatRp(t.amount)}
                      </Typography>
                    </ListItemButton>
                    {idx < arr.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
          </List>
        )}
      </Card>
    </Box>
  );
};

export default Dashboard;
