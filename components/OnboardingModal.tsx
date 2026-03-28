import React from 'react';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

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

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-3xl overflow-hidden rounded-[32px] border shadow-2xl"
                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
            >
                <div
                    className="relative overflow-hidden px-6 py-6 md:px-8 md:py-7"
                    style={{
                        background: `linear-gradient(135deg, ${theme.colors.accent} 0%, ${theme.colors.accentHover} 100%)`,
                        color: '#ffffff',
                    }}
                >
                    <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                                Panduan Singkat
                            </p>
                            <h3 className="mt-2 text-2xl font-bold md:text-3xl">
                                Mulai pakai {accountName}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-white/85 md:text-base">
                                Tidak perlu paham akuntansi. Fokus kita cuma tiga hal: catat transaksi, lihat ringkasan, lalu atur yang ingin dipantau.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl p-2.5 text-white/90"
                            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
                            aria-label="Tutup panduan"
                        >
                            <IconDisplay name="X" size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        {quickSteps.map((step) => (
                            <div
                                key={step.title}
                                className="rounded-[28px] border p-5"
                                style={{ backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }}
                            >
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                                >
                                    <IconDisplay name={step.icon} size={20} />
                                </div>
                                <h4 className="mt-4 text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                                    {step.title}
                                </h4>
                                <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                    {step.description}
                                </p>
                                <button
                                    type="button"
                                    onClick={step.action}
                                    className="mt-5 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
                                    style={{ backgroundColor: theme.colors.accent }}
                                >
                                    {step.actionLabel}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div
                        className="rounded-[28px] border p-5 md:p-6"
                        style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.accent }}
                            >
                                <IconDisplay name="Sparkles" size={18} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                                    Contoh input yang bisa dipakai
                                </h4>
                                <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                    Ini dipakai saat Anda mencatat transaksi lewat Telegram, voice note Telegram, atau nanti saat input natural tersedia di aplikasi. Gunakan kalimat biasa, lalu sistem akan minta konfirmasi sebelum menyimpan.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {examples.map((example) => (
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
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between" style={{ borderColor: theme.colors.border }}>
                        <p className="text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                            Kalau nanti lupa cara pakainya, panduan ini bisa dibuka lagi dari menu Pengaturan.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full px-5 py-3 text-sm font-semibold"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                        >
                            Tutup Panduan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
