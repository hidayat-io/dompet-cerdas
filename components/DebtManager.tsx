import React, { useMemo, useState } from 'react';
import { DebtKind, DebtPayment, DebtRecord } from '../types';
import ConfirmDialog from './ConfirmDialog';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';

interface DebtManagerProps {
    debts: DebtRecord[];
    onSaveDebt: (payload: {
        debtId?: string;
        kind: DebtKind;
        personName: string;
        title: string;
        amount: number;
        transactionDate: string;
        dueDate?: string;
        notes?: string;
    }) => Promise<void>;
    onDeleteDebt: (debtId: string) => Promise<void>;
    onRecordPayment: (debtId: string, payload: { amount: number; date: string; note?: string }) => Promise<void>;
    onMarkAsPaid: (debtId: string) => Promise<void>;
}

type DebtView = 'OWE' | 'COLLECT' | 'PAID';

type DebtDraft = {
    debtId?: string;
    kind: DebtKind;
    personName: string;
    amount: string;
    transactionDate: string;
    dueDate: string;
    notes: string;
};

type PaymentDraft = {
    debtId: string;
    amount: string;
    date: string;
    note: string;
};

const getToday = () => new Date().toISOString().split('T')[0];

const emptyDraft = (kind: DebtKind = 'DEBT'): DebtDraft => ({
    kind,
    personName: '',
    amount: '',
    transactionDate: getToday(),
    dueDate: '',
    notes: '',
});

const parseLocalDate = (value?: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const formatRp = (value: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
}).format(value);

const formatShortDate = (value?: string) => {
    const date = parseLocalDate(value);
    if (!date) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

const formatRupiahInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '';
};

const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    return words.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
};

const isOverdue = (debt: DebtRecord) => debt.status !== 'PAID' && !!debt.dueDate && debt.dueDate < getToday();

const getStatusLabel = (status: DebtRecord['status']) => {
    if (status === 'PAID') return 'Lunas';
    if (status === 'PARTIAL') return 'Bayar Sebagian';
    return 'Belum Lunas';
};

const getKindSummary = (kind: DebtKind) => (
    kind === 'DEBT'
        ? {
            short: 'Saya pinjam ke orang',
            label: 'Perlu Dibayar',
            emptyLabel: 'Belum ada hutang aktif.',
            detailLabel: 'Saya pinjam dari',
            action: 'Catat Hutang',
            helper: 'Uang yang masih perlu saya kembalikan',
        }
        : {
            short: 'Orang pinjam ke saya',
            label: 'Perlu Ditagih',
            emptyLabel: 'Belum ada piutang aktif.',
            detailLabel: 'Yang pinjam ke saya',
            action: 'Catat Piutang',
            helper: 'Uang yang masih perlu dibayar ke saya',
        }
);

const getSupportingText = (debt: DebtRecord) => {
    const note = debt.notes?.trim();
    if (note) return note;

    const legacyTitle = debt.title?.trim();
    if (legacyTitle && legacyTitle.toLowerCase() !== debt.personName.trim().toLowerCase()) {
        return legacyTitle;
    }

    return debt.dueDate ? `Jatuh tempo ${formatShortDate(debt.dueDate)}` : 'Belum ada keterangan tambahan';
};

const DebtManager: React.FC<DebtManagerProps> = ({
    debts,
    onSaveDebt,
    onDeleteDebt,
    onRecordPayment,
    onMarkAsPaid,
}) => {
    const { theme, isDark } = useTheme();
    const [activeView, setActiveView] = useState<DebtView>('OWE');
    const [showForm, setShowForm] = useState(false);
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<DebtDraft>(emptyDraft());
    const [activeDebtId, setActiveDebtId] = useState<string | null>(null);
    const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
    const [savingPayment, setSavingPayment] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [payoffTarget, setPayoffTarget] = useState<DebtRecord | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    const activeDebts = useMemo(
        () => debts.filter((debt) => debt.status !== 'PAID'),
        [debts]
    );

    const summary = useMemo(() => ({
        totalOwe: activeDebts
            .filter((debt) => debt.kind === 'DEBT')
            .reduce((total, debt) => total + debt.remainingAmount, 0),
        totalCollect: activeDebts
            .filter((debt) => debt.kind === 'RECEIVABLE')
            .reduce((total, debt) => total + debt.remainingAmount, 0),
        oweCount: activeDebts.filter((debt) => debt.kind === 'DEBT').length,
        collectCount: activeDebts.filter((debt) => debt.kind === 'RECEIVABLE').length,
        overdueCount: activeDebts.filter((debt) => isOverdue(debt)).length,
    }), [activeDebts]);

    const filteredDebts = useMemo(() => {
        const base = debts.filter((debt) => {
            if (activeView === 'PAID') return debt.status === 'PAID';
            if (activeView === 'OWE') return debt.kind === 'DEBT' && debt.status !== 'PAID';
            return debt.kind === 'RECEIVABLE' && debt.status !== 'PAID';
        });

        return [...base].sort((left, right) => {
            if (activeView !== 'PAID') {
                const overdueDiff = Number(isOverdue(right)) - Number(isOverdue(left));
                if (overdueDiff !== 0) return overdueDiff;
            }
            return right.updatedAt.localeCompare(left.updatedAt);
        });
    }, [activeView, debts]);

    const activeDebt = filteredDebts.find((debt) => debt.id === activeDebtId) || null;

    const isDraftValid = !!draft.personName.trim() && Number(draft.amount.replace(/\./g, '')) > 0;
    const isPaymentValid = !!paymentDraft?.date && Number(paymentDraft?.amount.replace(/\./g, '') || '0') > 0;

    const resetForm = () => {
        setDraft(emptyDraft());
        setShowAdvancedFields(false);
        setShowForm(false);
    };

    const openCreateForm = (kind: DebtKind = activeView === 'COLLECT' ? 'RECEIVABLE' : 'DEBT') => {
        setDraft(emptyDraft(kind));
        setShowAdvancedFields(false);
        setShowForm(true);
    };

    const openEditForm = (debt: DebtRecord) => {
        setDraft({
            debtId: debt.id,
            kind: debt.kind,
            personName: debt.personName,
            amount: debt.amount > 0 ? new Intl.NumberFormat('id-ID').format(debt.amount) : '',
            transactionDate: debt.transactionDate,
            dueDate: debt.dueDate || '',
            notes: debt.notes || '',
        });
        setShowAdvancedFields(Boolean(debt.dueDate || debt.notes || debt.transactionDate !== getToday()));
        setShowForm(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const amount = Number(draft.amount.replace(/\./g, ''));
        if (!draft.personName.trim() || !amount) return;

        setSaving(true);
        try {
            await onSaveDebt({
                debtId: draft.debtId,
                kind: draft.kind,
                personName: draft.personName.trim(),
                title: draft.personName.trim(),
                amount,
                transactionDate: draft.transactionDate || getToday(),
                dueDate: draft.dueDate || undefined,
                notes: draft.notes.trim() || undefined,
            });
            resetForm();
        } finally {
            setSaving(false);
        }
    };

    const handleSavePayment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!paymentDraft) return;

        const amount = Number(paymentDraft.amount.replace(/\./g, ''));
        if (!amount || !paymentDraft.date) return;

        setSavingPayment(true);
        try {
            await onRecordPayment(paymentDraft.debtId, {
                amount,
                date: paymentDraft.date,
                note: paymentDraft.note.trim() || undefined,
            });
            setPaymentDraft(null);
        } finally {
            setSavingPayment(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await onDeleteDebt(deleteTarget.id);
            if (activeDebtId === deleteTarget.id) {
                setActiveDebtId(null);
            }
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    const handleConfirmPaid = async () => {
        if (!payoffTarget) return;
        setMarkingPaid(true);
        try {
            await onMarkAsPaid(payoffTarget.id);
            setPayoffTarget(null);
        } finally {
            setMarkingPaid(false);
        }
    };

    const getStatusStyle = (debt: DebtRecord) => {
        if (debt.status === 'PAID') {
            return {
                backgroundColor: theme.colors.incomeBg,
                color: theme.colors.income,
            };
        }
        if (isOverdue(debt)) {
            return {
                backgroundColor: theme.colors.expenseBg,
                color: theme.colors.expense,
            };
        }
        return {
            backgroundColor: theme.colors.accentLight,
            color: theme.colors.accent,
        };
    };

    const getSummaryCardStyle = (kind: DebtKind) => {
        const baseColor = kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense;
        return {
            background: `linear-gradient(145deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
            color: '#ffffff',
        };
    };

    const heroStyle = activeDebt
        ? {
            background: `linear-gradient(145deg, ${activeDebt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense} 0%, ${activeDebt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense}dd 100%)`,
            color: '#ffffff',
        }
        : undefined;

    const formModal = showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-[32px] p-6 shadow-xl md:p-7"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.textMuted }}>
                                Hutang Piutang
                            </p>
                            <h4 className="mt-2 text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                {draft.debtId ? 'Ubah Catatan' : 'Catat Baru'}
                            </h4>
                            <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                Isi yang penting dulu. Detail tambahan tetap ada kalau memang dibutuhkan.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-2xl p-2.5"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                            aria-label="Tutup"
                        >
                            <IconDisplay name="X" size={18} />
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(['RECEIVABLE', 'DEBT'] as DebtKind[]).map((kindOption) => {
                            const selected = draft.kind === kindOption;
                            const isReceivable = kindOption === 'RECEIVABLE';

                            return (
                                <button
                                    key={kindOption}
                                    type="button"
                                    onClick={() => setDraft((current) => ({ ...current, kind: kindOption }))}
                                    className="rounded-full px-5 py-4 text-left transition-all"
                                    style={{
                                        backgroundColor: selected ? theme.colors.accent : theme.colors.bgHover,
                                        color: selected ? '#ffffff' : theme.colors.textPrimary,
                                        boxShadow: selected ? `0 16px 35px ${theme.colors.accent}25` : 'none',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="flex h-8 w-8 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: selected ? 'rgba(255,255,255,0.18)' : theme.colors.bgCard,
                                                color: selected ? '#ffffff' : theme.colors.textSecondary,
                                            }}
                                        >
                                            <IconDisplay name={isReceivable ? 'ArrowDown' : 'ArrowUp'} size={16} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {isReceivable ? 'Orang Pinjam ke Saya' : 'Saya Pinjam ke Orang'}
                                            </p>
                                            <p className="mt-1 text-xs" style={{ color: selected ? 'rgba(255,255,255,0.82)' : theme.colors.textMuted }}>
                                                {getKindSummary(kindOption).helper}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Nama Orang
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-[26px] border px-4 py-4"
                                style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                            >
                                <IconDisplay name="CircleUser" size={18} style={{ color: theme.colors.textMuted }} />
                                <input
                                    type="text"
                                    value={draft.personName}
                                    onChange={(event) => setDraft((current) => ({ ...current, personName: event.target.value }))}
                                    placeholder={draft.kind === 'RECEIVABLE' ? 'Siapa yang meminjam?' : 'Saya pinjam dari siapa?'}
                                    className="w-full bg-transparent text-base outline-none"
                                    style={{ color: theme.colors.textPrimary }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Jumlah Uang
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-[26px] border px-4 py-4"
                                style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                            >
                                <span className="text-2xl font-semibold" style={{ color: theme.colors.textMuted }}>Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={draft.amount}
                                    onChange={(event) => setDraft((current) => ({ ...current, amount: formatRupiahInput(event.target.value) }))}
                                    placeholder="0"
                                    className="w-full bg-transparent text-3xl font-semibold outline-none"
                                    style={{ color: theme.colors.textPrimary }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Catatan
                            </label>
                            <textarea
                                rows={4}
                                value={draft.notes}
                                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                                placeholder="Untuk keperluan apa? Misalnya makan siang, bensin, patungan, atau titip beli sesuatu."
                                className="w-full resize-none rounded-[26px] border px-4 py-4 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className="mt-5 rounded-[28px] border px-5 py-4"
                        style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full"
                                style={{ backgroundColor: theme.colors.accentLight, color: theme.colors.accent }}
                            >
                                <IconDisplay name="Info" size={16} />
                            </span>
                            <div>
                                <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                                    Pencatatan Aman
                                </p>
                                <p className="mt-1 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                    Catatan ini membantu kita melacak siapa yang masih perlu dibayar atau ditagih tanpa harus melihat transaksi satu per satu.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={() => setShowAdvancedFields((current) => !current)}
                            className="inline-flex items-center gap-2 text-sm font-semibold"
                            style={{ color: theme.colors.accent }}
                        >
                            <IconDisplay name={showAdvancedFields ? 'Minus' : 'Plus'} size={16} />
                            {showAdvancedFields ? 'Sembunyikan detail tambahan' : 'Tambahkan detail'}
                        </button>
                    </div>

                    {showAdvancedFields && (
                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                    Tanggal Catat
                                </label>
                                <input
                                    type="date"
                                    value={draft.transactionDate}
                                    onChange={(event) => setDraft((current) => ({ ...current, transactionDate: event.target.value }))}
                                    className="w-full rounded-[22px] border px-4 py-3 outline-none"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                    Jatuh Tempo
                                </label>
                                <input
                                    type="date"
                                    value={draft.dueDate}
                                    onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                                    className="w-full rounded-[22px] border px-4 py-3 outline-none"
                                    style={{
                                        backgroundColor: theme.colors.bgHover,
                                        borderColor: theme.colors.border,
                                        color: theme.colors.textPrimary,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={!isDraftValid || saving}
                            className="w-full rounded-full px-5 py-4 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-sm font-medium"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;

    const paymentModal = paymentDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                className="w-full max-w-lg rounded-[32px] p-6 shadow-xl md:p-7"
                style={{ backgroundColor: theme.colors.bgCard }}
            >
                <form onSubmit={handleSavePayment}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.textMuted }}>
                                Hutang Piutang
                            </p>
                            <h4 className="mt-2 text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                Catat Pembayaran
                            </h4>
                            <p className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                Simpan nominal yang sudah dibayar. Catatan tambahan tetap opsional.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPaymentDraft(null)}
                            className="rounded-2xl p-2.5"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textMuted }}
                            aria-label="Tutup"
                        >
                            <IconDisplay name="X" size={18} />
                        </button>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Nominal Bayar
                            </label>
                            <div
                                className="flex items-center gap-3 rounded-[26px] border px-4 py-4"
                                style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
                            >
                                <span className="text-2xl font-semibold" style={{ color: theme.colors.textMuted }}>Rp</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={paymentDraft.amount}
                                    onChange={(event) => setPaymentDraft((current) => current ? ({
                                        ...current,
                                        amount: formatRupiahInput(event.target.value),
                                    }) : current)}
                                    className="w-full bg-transparent text-3xl font-semibold outline-none"
                                    style={{ color: theme.colors.textPrimary }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Tanggal Bayar
                            </label>
                            <input
                                type="date"
                                value={paymentDraft.date}
                                onChange={(event) => setPaymentDraft((current) => current ? ({ ...current, date: event.target.value }) : current)}
                                className="w-full rounded-[22px] border px-4 py-3 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                                Catatan
                            </label>
                            <textarea
                                rows={3}
                                value={paymentDraft.note}
                                onChange={(event) => setPaymentDraft((current) => current ? ({ ...current, note: event.target.value }) : current)}
                                placeholder="Opsional"
                                className="w-full resize-none rounded-[22px] border px-4 py-4 outline-none"
                                style={{
                                    backgroundColor: theme.colors.bgHover,
                                    borderColor: theme.colors.border,
                                    color: theme.colors.textPrimary,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={!isPaymentValid || savingPayment}
                            className="w-full rounded-full px-5 py-4 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            {savingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentDraft(null)}
                            className="text-sm font-medium"
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;

    const deleteDialog = (
        <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => !deleting && setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
            title="Hapus Catatan"
            message={deleteTarget ? (
                <div className="space-y-2">
                    <p>
                        Catatan untuk <strong>{deleteTarget.personName}</strong> akan dihapus.
                    </p>
                    <p className="text-sm opacity-80">
                        Riwayat pembayaran di catatan ini juga ikut terhapus.
                    </p>
                </div>
            ) : ''}
            confirmText="Hapus"
            type="danger"
            isLoading={deleting}
        />
    );

    const paidDialog = (
        <ConfirmDialog
            isOpen={!!payoffTarget}
            onClose={() => !markingPaid && setPayoffTarget(null)}
            onConfirm={handleConfirmPaid}
            title="Tandai Lunas"
            message={payoffTarget ? (
                <div className="space-y-2">
                    <p>
                        Catatan untuk <strong>{payoffTarget.personName}</strong> akan ditandai lunas.
                    </p>
                    <p className="text-sm opacity-80">
                        Sisa nominal akan dianggap selesai.
                    </p>
                </div>
            ) : ''}
            confirmText="Tandai Lunas"
            type="success"
            icon="CheckCircle"
            isLoading={markingPaid}
        />
    );

    const sectionTitle = activeView === 'OWE'
        ? 'Yang perlu saya bayar'
        : activeView === 'COLLECT'
            ? 'Yang perlu dibayar ke saya'
            : 'Yang sudah selesai';

    const emptyLabel = activeView === 'PAID'
        ? 'Belum ada catatan yang selesai.'
        : activeView === 'OWE'
            ? getKindSummary('DEBT').emptyLabel
            : getKindSummary('RECEIVABLE').emptyLabel;

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-fade-in-up">
            {activeDebt ? (
                <>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => setActiveDebtId(null)}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                            style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                        >
                            <IconDisplay name="ArrowLeft" size={16} />
                            Kembali ke Daftar
                        </button>
                        <button
                            onClick={() => openCreateForm(activeDebt.kind)}
                            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                            style={{ backgroundColor: theme.colors.accent }}
                        >
                            + Tambah Catatan
                        </button>
                    </div>

                    <section
                        className="rounded-[32px] border p-5 md:p-6"
                        style={{
                            backgroundColor: theme.colors.bgCard,
                            borderColor: theme.colors.border,
                            boxShadow: isDark ? 'none' : '0 18px 55px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div className="space-y-5">
                            <div
                                className="rounded-[32px] px-6 py-6 md:px-7 md:py-7"
                                style={heroStyle}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.16)' }}
                                    >
                                        {getInitials(activeDebt.personName)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditForm(activeDebt)}
                                            className="rounded-2xl p-2.5"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
                                            title="Ubah"
                                        >
                                            <IconDisplay name="Edit" size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(activeDebt)}
                                            className="rounded-2xl p-2.5"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
                                            title="Hapus"
                                        >
                                            <IconDisplay name="Trash2" size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/72">
                                        {getKindSummary(activeDebt.kind).detailLabel}
                                    </p>
                                    <h3 className="mt-2 text-3xl font-bold md:text-4xl">
                                        {activeDebt.personName}
                                    </h3>
                                    <p className="mt-4 text-sm text-white/82">
                                        Total sisa {activeDebt.kind === 'RECEIVABLE' ? 'yang perlu diterima' : 'yang perlu dibayar'}
                                    </p>
                                    <p className="mt-2 text-[2rem] font-bold leading-tight md:text-[2.5rem]">
                                        {formatRp(activeDebt.remainingAmount)}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white/90">
                                        {getStatusLabel(activeDebt.status)}
                                    </span>
                                    <span className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white/90">
                                        Dicatat {formatShortDate(activeDebt.transactionDate)}
                                    </span>
                                    {activeDebt.dueDate && (
                                        <span className="rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white/90">
                                            Jatuh tempo {formatShortDate(activeDebt.dueDate)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                {[
                                    { label: 'Nominal Awal', value: formatRp(activeDebt.amount) },
                                    { label: 'Sudah Dibayar', value: formatRp(activeDebt.paidAmount) },
                                    { label: 'Sisa', value: formatRp(activeDebt.remainingAmount) },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-[24px] px-4 py-4"
                                        style={{ backgroundColor: theme.colors.bgHover }}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: theme.colors.textMuted }}>
                                            {item.label}
                                        </p>
                                        <p className="mt-2 text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {activeDebt.status !== 'PAID' && (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <button
                                        onClick={() => setPaymentDraft({
                                            debtId: activeDebt.id,
                                            amount: activeDebt.remainingAmount > 0
                                                ? new Intl.NumberFormat('id-ID').format(activeDebt.remainingAmount)
                                                : '',
                                            date: getToday(),
                                            note: '',
                                        })}
                                        className="w-full rounded-full px-5 py-4 text-base font-semibold text-white"
                                        style={{ backgroundColor: theme.colors.accent }}
                                    >
                                        {activeDebt.kind === 'RECEIVABLE' ? 'Terima Pembayaran' : 'Catat Pembayaran'}
                                    </button>
                                    <button
                                        onClick={() => setPayoffTarget(activeDebt)}
                                        className="w-full rounded-full px-5 py-4 text-base font-semibold"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textPrimary }}
                                    >
                                        Tandai Lunas
                                    </button>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                            Riwayat Pembayaran
                                        </h4>
                                        <p className="mt-1 text-sm" style={{ color: theme.colors.textMuted }}>
                                            Semua pembayaran yang sudah tercatat ada di sini.
                                        </p>
                                    </div>
                                    <span
                                        className="rounded-full px-3 py-1.5 text-xs font-semibold"
                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                                    >
                                        {activeDebt.payments.length} pembayaran
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div
                                        className="rounded-[24px] px-4 py-4"
                                        style={{ backgroundColor: theme.colors.bgHover }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                                                    Catatan dibuat
                                                </p>
                                                <p className="mt-1 text-xs" style={{ color: theme.colors.textMuted }}>
                                                    {formatShortDate(activeDebt.transactionDate)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                                                {formatRp(activeDebt.amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {activeDebt.payments.length === 0 ? (
                                        <div
                                            className="rounded-[24px] border border-dashed px-4 py-5 text-sm"
                                            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                                        >
                                            Belum ada pembayaran tercatat.
                                        </div>
                                    ) : activeDebt.payments.map((payment: DebtPayment, index) => (
                                        <div
                                            key={payment.id}
                                            className="rounded-[24px] px-4 py-4"
                                            style={{ backgroundColor: theme.colors.bgHover }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                                    style={{ backgroundColor: theme.colors.bgCard, color: theme.colors.accent }}
                                                >
                                                    <IconDisplay name="CheckCircle" size={18} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
                                                                Pembayaran {index === 0 ? 'Terbaru' : `Ke-${index + 1}`}
                                                            </p>
                                                            <p className="mt-1 text-xs" style={{ color: theme.colors.textMuted }}>
                                                                {formatShortDate(payment.date)}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className="text-sm font-bold"
                                                            style={{ color: activeDebt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense }}
                                                        >
                                                            {formatRp(payment.amount)}
                                                        </span>
                                                    </div>
                                                    {payment.note && (
                                                        <p className="mt-3 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
                                                            {payment.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <>
                    <section
                        className="rounded-[32px] border p-6 md:p-8"
                        style={{
                            backgroundColor: theme.colors.bgCard,
                            borderColor: theme.colors.border,
                            boxShadow: isDark ? 'none' : '0 18px 55px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: theme.colors.textMuted }}>
                                    Hutang Piutang
                                </p>
                                <h2 className="mt-2 text-2xl font-bold md:text-3xl" style={{ color: theme.colors.textPrimary }}>
                                    Ringkas, jelas, dan gampang dipantau
                                </h2>
                                <p className="mt-3 text-sm leading-7 md:text-base" style={{ color: theme.colors.textSecondary }}>
                                    Kita fokus ke yang paling penting: siapa yang terlibat, berapa nominalnya, dan masih sisa berapa sampai selesai.
                                </p>
                            </div>

                            <button
                                onClick={() => openCreateForm()}
                                className="rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
                                style={{ backgroundColor: theme.colors.accent }}
                            >
                                + Tambah Catatan
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                {
                                    key: 'collect',
                                    title: 'Piutang Saya',
                                    subtitle: 'Orang berhutang ke saya',
                                    amount: summary.totalCollect,
                                    count: summary.collectCount,
                                    kind: 'RECEIVABLE' as DebtKind,
                                },
                                {
                                    key: 'owe',
                                    title: 'Hutang Saya',
                                    subtitle: 'Saya masih berhutang',
                                    amount: summary.totalOwe,
                                    count: summary.oweCount,
                                    kind: 'DEBT' as DebtKind,
                                },
                            ].map((card) => (
                                <div
                                    key={card.key}
                                    className="relative overflow-hidden rounded-[30px] px-5 py-5 md:px-6 md:py-6"
                                    style={getSummaryCardStyle(card.kind)}
                                >
                                    <div className="absolute -right-4 -top-5 opacity-10">
                                        <IconDisplay name={card.kind === 'RECEIVABLE' ? 'Wallet' : 'BadgeDollarSign'} size={92} />
                                    </div>
                                    <p className="text-sm font-semibold">{card.title}</p>
                                    <p className="mt-1 text-sm text-white/80">{card.subtitle}</p>
                                    <p className="mt-4 text-3xl font-bold md:text-[2rem]">{formatRp(card.amount)}</p>
                                    <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                                        {card.count} catatan
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                            <span
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                            >
                                <IconDisplay name="AlertCircle" size={14} style={{ color: summary.overdueCount > 0 ? theme.colors.expense : theme.colors.textMuted }} />
                                {summary.overdueCount > 0 ? `${summary.overdueCount} catatan lewat jatuh tempo` : 'Belum ada yang lewat jatuh tempo'}
                            </span>
                            <span
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                            >
                                <IconDisplay name="RefreshCw" size={14} style={{ color: theme.colors.textMuted }} />
                                Data otomatis menyesuaikan saat ada pembayaran baru
                            </span>
                        </div>
                    </section>

                    <div className="flex flex-wrap gap-3">
                        {[
                            { id: 'OWE' as const, label: 'Perlu Dibayar' },
                            { id: 'COLLECT' as const, label: 'Perlu Ditagih' },
                            { id: 'PAID' as const, label: 'Selesai' },
                        ].map((tab) => {
                            const active = activeView === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveView(tab.id);
                                        setActiveDebtId(null);
                                    }}
                                    className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all"
                                    style={{
                                        backgroundColor: active ? theme.colors.accent : theme.colors.bgHover,
                                        color: active ? '#ffffff' : theme.colors.textSecondary,
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <section
                        className="rounded-[32px] border p-5 md:p-6"
                        style={{
                            backgroundColor: theme.colors.bgCard,
                            borderColor: theme.colors.border,
                            boxShadow: isDark ? 'none' : '0 18px 55px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                                    Aktivitas Terkini
                                </h3>
                                <p className="mt-1 text-sm" style={{ color: theme.colors.textMuted }}>
                                    {sectionTitle}
                                </p>
                            </div>
                            <span
                                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                                style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                            >
                                {filteredDebts.length} catatan
                            </span>
                        </div>

                        <div className="space-y-3">
                            {filteredDebts.length === 0 ? (
                                <div
                                    className="rounded-[28px] border border-dashed p-8 text-center text-sm"
                                    style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}
                                >
                                    {emptyLabel}
                                </div>
                            ) : filteredDebts.map((debt) => (
                                <button
                                    key={debt.id}
                                    onClick={() => setActiveDebtId(debt.id)}
                                    className="w-full rounded-[28px] border px-4 py-4 text-left transition-all"
                                    style={{
                                        backgroundColor: theme.colors.bgCard,
                                        borderColor: theme.colors.border,
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                            style={{
                                                backgroundColor: debt.kind === 'RECEIVABLE' ? theme.colors.incomeBg : theme.colors.expenseBg,
                                                color: debt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense,
                                            }}
                                        >
                                            {getInitials(debt.personName)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                                                        {debt.personName}
                                                    </p>
                                                    <p className="mt-1 line-clamp-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                                                        {getSupportingText(debt)}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p
                                                        className="text-base font-bold"
                                                        style={{ color: debt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense }}
                                                    >
                                                        {formatRp(debt.remainingAmount)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <span
                                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                                    style={getStatusStyle(debt)}
                                                >
                                                    {getStatusLabel(debt.status)}
                                                </span>
                                                {debt.dueDate && (
                                                    <span
                                                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                                        style={{ backgroundColor: theme.colors.bgHover, color: theme.colors.textSecondary }}
                                                    >
                                                        {isOverdue(debt) ? 'Lewat jatuh tempo' : `Jatuh tempo ${formatShortDate(debt.dueDate)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </>
            )}

            {formModal}
            {paymentModal}
            {deleteDialog}
            {paidDialog}
        </div>
    );
};

export default DebtManager;
