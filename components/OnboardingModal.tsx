import React from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';

interface OnboardingModalProps {
    isOpen: boolean;
    accountName: string;
    telegramLinked: boolean;
    onClose: () => void;
    onGoToTransactions: () => void;
    onGoToBudgets: () => void;
    onGoToSettings: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    accountName,
    telegramLinked,
    onClose,
    onGoToTransactions,
    onGoToBudgets,
    onGoToSettings,
}) => {
    const { theme } = useTheme();

    const quickSteps = [
        {
            title: 'Mulai dari transaksi',
            description: 'Catat pemasukan dan pengeluaran harian dulu. Ini fondasi semua ringkasan lain.',
            actionLabel: 'Buka Transaksi',
            action: onGoToTransactions,
            icon: 'BookOpen',
        },
        {
            title: 'Atur batas pengeluaran',
            description: 'Setelah transaksi mulai rutin, baru atur anggaran untuk kategori yang ingin dipantau.',
            actionLabel: 'Buka Anggaran',
            action: onGoToBudgets,
            icon: 'PiggyBank',
        },
        {
            title: telegramLinked ? 'Telegram sudah siap' : 'Hubungkan Telegram',
            description: telegramLinked
                ? 'Bot sudah terhubung. Anda bisa catat transaksi lewat chat atau voice note.'
                : 'Kalau ingin lebih praktis, hubungkan Telegram supaya bisa catat tanpa buka aplikasi.',
            actionLabel: telegramLinked ? 'Buka Pengaturan' : 'Hubungkan Sekarang',
            action: onGoToSettings,
            icon: 'Send',
        },
    ];

    const examples = [
        'makan siang 25rb',
        'kopi 18rb, parkir 5rb',
        'bulan ini jatah makan 2 juta',
        'aku pinjem ke Andi 300rb',
    ];

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
        >
            {/* Gradient Header */}
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    px: { xs: 3, md: 4 },
                    py: { xs: 3, md: 3.5 },
                    background: `linear-gradient(135deg, ${theme.colors.accent} 0%, ${theme.colors.accentHover} 100%)`,
                    color: '#fff',
                }}
            >
                {/* Decorative blur circle */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: -48,
                        top: -56,
                        width: 176,
                        height: 176,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        filter: 'blur(32px)',
                        pointerEvents: 'none',
                    }}
                />
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ maxWidth: 480 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                            Panduan Singkat
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, mb: 1.5 }}>
                            Mulai pakai {accountName}
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
                            Tidak perlu paham akuntansi. Fokus kita cuma tiga hal: catat transaksi, lihat ringkasan, lalu atur yang ingin dipantau.
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        aria-label="Tutup panduan"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.9)',
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                        }}
                    >
                        <IconDisplay name="X" size={18} />
                    </IconButton>
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
                {/* Step cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {quickSteps.map((step) => (
                        <Grid size={{ xs: 12, md: 4 }} key={step.title}>
                            <Box
                                sx={{
                                    borderRadius: '28px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 2.5,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        bgcolor: 'primary.light',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'primary.main',
                                    }}
                                >
                                    <IconDisplay name={step.icon} size={20} />
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                                    {step.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>
                                    {step.description}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={step.action}
                                    sx={{ mt: 2.5, borderRadius: '999px', fontWeight: 600, alignSelf: 'flex-start', px: 2 }}
                                >
                                    {step.actionLabel}
                                </Button>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Examples section */}
                <Box
                    sx={{
                        borderRadius: '28px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                        p: { xs: 2.5, md: 3 },
                        mb: 3,
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Box
                            sx={{
                                mt: 0.25,
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'primary.main',
                                flexShrink: 0,
                            }}
                        >
                            <IconDisplay name="Sparkles" size={18} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Contoh input yang bisa dipakai
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                                Ini dipakai saat Anda mencatat transaksi lewat Telegram, voice note Telegram, atau nanti saat input natural tersedia di aplikasi. Gunakan kalimat biasa, lalu sistem akan minta konfirmasi sebelum menyimpan.
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {examples.map((example) => (
                                    <Chip
                                        key={example}
                                        label={example}
                                        size="small"
                                        sx={{ fontFamily: 'monospace', bgcolor: 'background.paper' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Footer */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Kalau nanti lupa cara pakainya, panduan ini bisa dibuka lagi dari menu Pengaturan.
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{ borderRadius: '999px', fontWeight: 600, whiteSpace: 'nowrap', px: 3 }}
                    >
                        Tutup Panduan
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default OnboardingModal;
