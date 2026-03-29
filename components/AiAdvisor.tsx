import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import LinearProgress from '@mui/material/LinearProgress';
import ReactMarkdown from 'react-markdown';
import { FinancialAnalysisMode, FinancialAnalysisResult, getFinancialAdvice } from '../services/geminiService';
import { Category, Transaction } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';

interface AiAdvisorProps {
  transactions: Transaction[];
  categories: Category[];
  onShowNotification: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, autoClose?: boolean) => void;
}

const AI_MODE_OPTIONS: Array<{
  id: FinancialAnalysisMode;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'HEALTH',
    label: 'Kesehatan Finansial',
    shortLabel: 'Kesehatan',
    description: 'Fokus ke arus kas, keseimbangan pemasukan-pengeluaran, dan stabilitas data keuangan.',
    icon: 'HeartPulse'
  },
  {
    id: 'SPENDING',
    label: 'Pola Pengeluaran',
    shortLabel: 'Pengeluaran',
    description: 'Fokus ke kategori dominan, frekuensi transaksi, dan pola belanja yang menonjol.',
    icon: 'BarChart2'
  },
  {
    id: 'SAVINGS',
    label: 'Saran Hemat',
    shortLabel: 'Hemat',
    description: 'Fokus ke peluang efisiensi berdasarkan transaksi dan kategori yang benar-benar ada.',
    icon: 'PiggyBank'
  }
];

const formatBalance = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

const AiAdvisor: React.FC<AiAdvisorProps> = ({ transactions, categories, onShowNotification }) => {
  const { theme } = useTheme();
  const [aiAnalysis, setAiAnalysis] = useState<FinancialAnalysisResult | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysisMode, setAiAnalysisMode] = useState<FinancialAnalysisMode>('HEALTH');

  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    setAiAnalysis(null);
    setAiAnalysisError(null);

    try {
      const result = await getFinancialAdvice(transactions, categories, aiAnalysisMode);
      setAiAnalysis(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menjalankan Analisis AI.';
      setAiAnalysisError(message);
      onShowNotification('error', 'Analisis Gagal', message, true);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const isDark = theme.name === 'dark';

  return (
    <Box className="animate-fade-in-up" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '28px',
          border: `1px solid ${theme.colors.border}`,
          p: { xs: 3, md: 4 },
          background: isDark
            ? 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(49,46,129,0.52) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(238,242,255,0.95) 100%)',
          boxShadow: isDark
            ? '0 28px 80px rgba(2, 6, 23, 0.35)'
            : '0 24px 60px rgba(79, 70, 229, 0.08)',
        }}
      >
        <Box
          sx={{
            position: 'absolute', right: 0, top: 0, height: 160, width: 160,
            borderRadius: '50%', filter: 'blur(48px)',
            backgroundColor: `${theme.colors.accent}22`,
          }}
        />
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: { md: 'center' }, justifyContent: { md: 'space-between' } }}>
          <Box sx={{ maxWidth: '640px' }}>
            <Chip
              icon={<IconDisplay name="Sparkles" size={14} />}
              label="Analisis AI"
              size="small"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                backgroundColor: isDark ? 'rgba(129,140,248,0.18)' : '#EEF2FF',
                color: isDark ? '#C7D2FE' : '#4338CA',
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: theme.colors.textPrimary }}>
              Analisis keuangan yang hanya berbasis transaksi Anda
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, maxWidth: '560px', lineHeight: 1.8, color: theme.colors.textSecondary }}>
              Sistem hanya mengirim ringkasan dan sampel transaksi yang paling relevan agar hemat token, lalu AI diminta memberi insight berdasarkan data Anda saja tanpa asumsi di luar transaksi.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleAiAnalysis}
            disabled={isLoadingAi || transactions.length === 0}
            startIcon={isLoadingAi ? <CircularProgress size={16} color="inherit" /> : <IconDisplay name="Zap" size={18} />}
            sx={{
              borderRadius: '16px',
              px: 4, py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.colors.accent} 0%, ${isDark ? '#8B5CF6' : '#6366F1'} 100%)`,
              boxShadow: isDark
                ? '0 18px 36px rgba(99, 102, 241, 0.28)'
                : '0 18px 36px rgba(79, 70, 229, 0.22)',
              '&:hover': { opacity: 0.9 },
              whiteSpace: 'nowrap',
            }}
          >
            {isLoadingAi ? 'Menganalisis...' : 'Jalankan Analisis'}
          </Button>
        </Box>
      </Paper>

      {/* Mode Selection */}
      <Grid container spacing={1.5}>
        {AI_MODE_OPTIONS.map((mode) => {
          const isActive = aiAnalysisMode === mode.id;
          return (
            <Grid size={{ xs: 12, md: 4 }} key={mode.id}>
              <Paper
                elevation={0}
                onClick={() => {
                  setAiAnalysisMode(mode.id);
                  setAiAnalysis(null);
                  setAiAnalysisError(null);
                }}
                sx={{
                  borderRadius: '24px',
                  border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                  p: 2.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? (isDark
                      ? 'linear-gradient(135deg, rgba(79,70,229,0.30) 0%, rgba(99,102,241,0.18) 100%)'
                      : 'linear-gradient(135deg, rgba(238,242,255,1) 0%, rgba(224,231,255,0.92) 100%)')
                    : theme.colors.bgCard,
                  boxShadow: isActive
                    ? (isDark
                      ? '0 20px 40px rgba(79, 70, 229, 0.18)'
                      : '0 20px 40px rgba(99, 102, 241, 0.12)')
                    : 'none',
                  '&:hover': {
                    borderColor: theme.colors.accent,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex', height: 44, width: 44, alignItems: 'center', justifyContent: 'center',
                      borderRadius: '16px',
                      backgroundColor: isActive ? (isDark ? 'rgba(99,102,241,0.22)' : '#FFFFFF') : theme.colors.bgHover,
                      color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                    }}
                  >
                    <IconDisplay name={mode.icon} size={20} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                      {mode.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>
                      {mode.shortLabel}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, lineHeight: 1.7, color: theme.colors.textSecondary }}>
                  {mode.description}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* No Transactions Warning */}
      {transactions.length === 0 && (
        <Alert
          severity="warning"
          sx={{
            borderRadius: '16px',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A'}`,
            backgroundColor: isDark ? 'rgba(120, 53, 15, 0.22)' : '#FFFBEB',
          }}
        >
          Belum ada data transaksi. Tambahkan transaksi terlebih dahulu agar Analisis AI bisa memberi insight yang relevan.
        </Alert>
      )}

      {/* Info Cards (pre-analysis) */}
      {!aiAnalysis && !isLoadingAi && transactions.length > 0 && (
        <Grid container spacing={2}>
          {[
            {
              title: 'Data yang dipakai',
              value: `${transactions.length} transaksi`,
              description: 'AI hanya melihat data transaksi dan kategori Anda.'
            },
            {
              title: 'Hemat token',
              value: 'Ringkasan + sampel',
              description: 'Yang dikirim bukan seluruh histori mentah, tapi agregasi dan transaksi penting.'
            },
            {
              title: 'Batas pengetahuan',
              value: 'Data Anda saja',
              description: 'Analisis dilarang menebak kondisi di luar angka transaksi.'
            }
          ].map((item) => (
            <Grid size={{ xs: 12, md: 4 }} key={item.title}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${theme.colors.border}`,
                  p: 2.5,
                  backgroundColor: theme.colors.bgCard,
                }}
              >
                <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.14em', color: theme.colors.textMuted }}>
                  {item.title}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7, color: theme.colors.textSecondary }}>
                  {item.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Loading State */}
      {isLoadingAi && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '28px',
            border: `1px solid ${theme.colors.border}`,
            p: { xs: 3, md: 4 },
            backgroundColor: theme.colors.bgCard,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={20} sx={{ color: theme.colors.accent }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                Sedang menyusun analisis
              </Typography>
              <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                AI sedang menyusun mode {AI_MODE_OPTIONS.find((m) => m.id === aiAnalysisMode)?.label.toLowerCase()} dari ringkasan transaksi dan sampel transaksi penting Anda.
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Error State */}
      {aiAnalysisError && !isLoadingAi && (
        <Alert
          severity="error"
          sx={{
            borderRadius: '16px',
            border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.25)' : '#FECACA'}`,
            backgroundColor: isDark ? 'rgba(127, 29, 29, 0.24)' : '#FEF2F2',
          }}
        >
          <AlertTitle>Analisis belum bisa ditampilkan</AlertTitle>
          {aiAnalysisError}
        </Alert>
      )}

      {/* Results */}
      {aiAnalysis && (
        <>
          {/* Summary Stats */}
          <Grid container spacing={2}>
            {[
              {
                title: 'Transaksi dianalisis',
                value: `${aiAnalysis.summary.totalTransactionsAnalyzed}/${aiAnalysis.summary.totalTransactions}`,
                description: 'Sampel terpilih setelah diringkas untuk efisiensi token.'
              },
              {
                title: 'Total pemasukan',
                value: formatBalance(aiAnalysis.summary.incomeTotal),
                description: 'Akumulasi transaksi kategori pemasukan.'
              },
              {
                title: 'Total pengeluaran',
                value: formatBalance(aiAnalysis.summary.expenseTotal),
                description: 'Akumulasi transaksi kategori pengeluaran.'
              },
              {
                title: 'Saldo bersih data',
                value: formatBalance(aiAnalysis.summary.netBalance),
                description: 'Selisih pemasukan dan pengeluaran pada data yang tersedia.'
              },
              {
                title: 'Mode analisis',
                value: AI_MODE_OPTIONS.find((m) => m.id === aiAnalysis.mode)?.shortLabel || 'AI',
                description: 'Jenis pembacaan data yang sedang aktif saat ini.'
              },
              {
                title: 'Sisa token harian',
                value: aiAnalysis.usage
                  ? `${aiAnalysis.usage.remainingDailyTokens.toLocaleString('id-ID')}/${aiAnalysis.usage.dailyTokenLimit.toLocaleString('id-ID')}`
                  : '-',
                description: 'Kuota biaya Analisis AI per user per hari dari backend.'
              }
            ].map((item) => (
              <Grid size={{ xs: 12, md: 4, xl: 2 }} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${theme.colors.border}`,
                    p: 2.5,
                    backgroundColor: theme.colors.bgCard,
                    height: '100%',
                  }}
                >
                  <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.14em', color: theme.colors.textMuted }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, lineHeight: 1.3, color: theme.colors.textPrimary }}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7, color: theme.colors.textSecondary }}>
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Markdown & Side Details */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, xl: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '28px',
                  border: `1px solid ${theme.colors.border}`,
                  p: { xs: 3, md: 4 },
                  backgroundColor: theme.colors.bgCard,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute', inset: '0 0 auto 0', height: '6px',
                    background: `linear-gradient(90deg, ${theme.colors.accent} 0%, ${isDark ? '#8B5CF6' : '#A5B4FC'} 100%)`,
                  }}
                />
                <Box sx={{ '& > *': { mb: 0 } }}>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <Typography variant="h6" sx={{ mt: 3, mb: 1.5, fontWeight: 700, color: theme.colors.textPrimary }}>
                          {children}
                        </Typography>
                      ),
                      p: ({ children }) => (
                        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.8, color: theme.colors.textSecondary }}>
                          {children}
                        </Typography>
                      ),
                      ul: ({ children }) => (
                        <Box component="ul" sx={{ mb: 2, pl: 2.5, '& li': { color: theme.colors.textSecondary } }}>
                          {children}
                        </Box>
                      ),
                      li: ({ children }) => (
                        <Typography component="li" variant="body2" sx={{ lineHeight: 1.8 }}>
                          {children}
                        </Typography>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: theme.colors.textPrimary }}>{children}</strong>
                      ),
                      code: ({ children }) => (
                        <Box
                          component="code"
                          sx={{
                            borderRadius: 1, px: 0.75, py: 0.25, fontSize: '0.75rem',
                            backgroundColor: theme.colors.bgHover,
                            color: theme.colors.textPrimary,
                          }}
                        >
                          {children}
                        </Box>
                      ),
                    }}
                  >
                    {aiAnalysis.markdown}
                  </ReactMarkdown>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, xl: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Analysis Basis */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '28px',
                    border: `1px solid ${theme.colors.border}`,
                    p: 2.5,
                    backgroundColor: theme.colors.bgCard,
                  }}
                >
                  <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.14em', color: theme.colors.textMuted }}>
                    Dasar Analisis
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>Rentang data</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>
                        {aiAnalysis.summary.analyzedDateRange
                          ? `${formatShortDate(aiAnalysis.summary.analyzedDateRange.start)} - ${formatShortDate(aiAnalysis.summary.analyzedDateRange.end)}`
                          : 'Tidak tersedia'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>Komposisi sampel</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.7, color: theme.colors.textPrimary }}>
                        {aiAnalysis.summary.samplesUsed.recent} terbaru, {aiAnalysis.summary.samplesUsed.largestExpense} terbesar, {aiAnalysis.summary.samplesUsed.categoryAnchors} jangkar kategori, {aiAnalysis.summary.samplesUsed.incomeAnchors} pemasukan
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Top Categories */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '28px',
                    border: `1px solid ${theme.colors.border}`,
                    p: 2.5,
                    backgroundColor: theme.colors.bgCard,
                  }}
                >
                  <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.14em', color: theme.colors.textMuted }}>
                    Kategori Pengeluaran Utama
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {aiAnalysis.summary.topCategories.length > 0 ? aiAnalysis.summary.topCategories.map((category) => (
                      <Box key={category.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>{category.name}</Typography>
                            <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>{category.count} transaksi</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>{formatBalance(category.total)}</Typography>
                            <Typography variant="caption" sx={{ color: theme.colors.textMuted }}>{category.percentage}%</Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(category.percentage, 100)}
                          sx={{
                            mt: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.colors.bgHover,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: `linear-gradient(90deg, ${theme.colors.accent} 0%, ${isDark ? '#A78BFA' : '#818CF8'} 100%)`,
                            },
                          }}
                        />
                      </Box>
                    )) : (
                      <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                        Belum ada pengeluaran yang cukup untuk diringkas per kategori.
                      </Typography>
                    )}
                  </Box>
                </Paper>

                {/* Monthly Summaries */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '28px',
                    border: `1px solid ${theme.colors.border}`,
                    p: 2.5,
                    backgroundColor: theme.colors.bgCard,
                  }}
                >
                  <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: '0.14em', color: theme.colors.textMuted }}>
                    Ringkasan Bulanan
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {aiAnalysis.summary.monthlySummaries.length > 0 ? aiAnalysis.summary.monthlySummaries.map((month) => (
                      <Box
                        key={month.month}
                        sx={{
                          borderRadius: '16px',
                          px: 2, py: 1.5,
                          backgroundColor: theme.colors.bgHover,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.colors.textPrimary }}>{month.month}</Typography>
                          <Typography variant="body2" sx={{ color: month.net >= 0 ? theme.colors.income : theme.colors.expense }}>
                            {formatBalance(month.net)}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: theme.colors.textSecondary }}>Pemasukan {formatBalance(month.income)}</Typography>
                          <Typography variant="caption" sx={{ color: theme.colors.textSecondary }}>Pengeluaran {formatBalance(month.expense)}</Typography>
                        </Box>
                      </Box>
                    )) : (
                      <Typography variant="body2" sx={{ color: theme.colors.textSecondary }}>
                        Ringkasan bulanan belum tersedia.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AiAdvisor;
