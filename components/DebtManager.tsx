import React, { useMemo, useState } from 'react';
import { DebtKind, DebtPayment, DebtRecord } from '../types';
import ConfirmDialog from './ConfirmDialog';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

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
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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
    if (legacyTitle && legacyTitle.toLowerCase() !== debt.personName.trim().toLowerCase()) return legacyTitle;
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

    const activeDebts = useMemo(() => debts.filter((debt) => debt.status !== 'PAID'), [debts]);

    const summary = useMemo(() => ({
        totalOwe: activeDebts.filter((d) => d.kind === 'DEBT').reduce((t, d) => t + d.remainingAmount, 0),
        totalCollect: activeDebts.filter((d) => d.kind === 'RECEIVABLE').reduce((t, d) => t + d.remainingAmount, 0),
        oweCount: activeDebts.filter((d) => d.kind === 'DEBT').length,
        collectCount: activeDebts.filter((d) => d.kind === 'RECEIVABLE').length,
        overdueCount: activeDebts.filter((d) => isOverdue(d)).length,
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
            if (activeDebtId === deleteTarget.id) setActiveDebtId(null);
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

    const getStatusChipSx = (debt: DebtRecord) => {
        if (debt.status === 'PAID') return { bgcolor: theme.colors.incomeBg, color: theme.colors.income };
        if (isOverdue(debt)) return { bgcolor: theme.colors.expenseBg, color: theme.colors.expense };
        return { bgcolor: theme.colors.accentLight, color: theme.colors.accent };
    };

    const heroGradient = (kind: DebtKind) => {
        const c = kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense;
        return `linear-gradient(145deg, ${c} 0%, ${c}dd 100%)`;
    };

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

    // ── Form modal ──────────────────────────────────────────────────
    const formModal = (
        <Dialog
            open={showForm}
            onClose={resetForm}
            maxWidth="sm"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
            PaperProps={{ sx: { borderRadius: 4 } }}
        >
            <Box sx={{ px: 3, pt: 3, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.16em' }} color="text.secondary">
                        Hutang Piutang
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                        {draft.debtId ? 'Ubah Catatan' : 'Catat Baru'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Isi yang penting dulu. Detail tambahan tetap ada kalau memang dibutuhkan.
                    </Typography>
                </Box>
                <IconButton onClick={resetForm} aria-label="Tutup" sx={{ flexShrink: 0 }}>
                    <IconDisplay name="X" size={18} />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pb: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Kind selector */}
                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                        {(['RECEIVABLE', 'DEBT'] as DebtKind[]).map((kindOption) => {
                            const selected = draft.kind === kindOption;
                            const isReceivable = kindOption === 'RECEIVABLE';
                            return (
                                <Grid size={{ xs: 12, sm: 6 }} key={kindOption}>
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => setDraft((c) => ({ ...c, kind: kindOption }))}
                                        sx={{
                                            width: '100%',
                                            borderRadius: 6,
                                            px: 2.5,
                                            py: 2,
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            bgcolor: selected ? theme.colors.accent : 'action.hover',
                                            color: selected ? '#fff' : 'text.primary',
                                            boxShadow: selected ? `0 16px 35px ${theme.colors.accent}25` : 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{
                                                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: selected ? 'rgba(255,255,255,0.18)' : 'background.paper',
                                                color: selected ? '#fff' : 'text.secondary',
                                            }}>
                                                <IconDisplay name={isReceivable ? 'ArrowDown' : 'ArrowUp'} size={16} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: 'inherit' }}>
                                                    {isReceivable ? 'Orang Pinjam ke Saya' : 'Saya Pinjam ke Orang'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: selected ? 'rgba(255,255,255,0.82)' : 'text.secondary' }}>
                                                    {getKindSummary(kindOption).helper}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Name */}
                    <TextField
                        label="Nama Orang"
                        fullWidth
                        size="small"
                        value={draft.personName}
                        onChange={(e) => setDraft((c) => ({ ...c, personName: e.target.value }))}
                        placeholder={draft.kind === 'RECEIVABLE' ? 'Siapa yang meminjam?' : 'Saya pinjam dari siapa?'}
                        sx={{ mb: 2 }}
                    />

                    {/* Amount */}
                    <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" fontWeight={600} color="text.secondary">Rp</Typography>
                        <Box
                            component="input"
                            type="text"
                            inputMode="numeric"
                            value={draft.amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((c) => ({ ...c, amount: formatRupiahInput(e.target.value) }))}
                            placeholder="0"
                            sx={{
                                flex: 1, border: 'none', bgcolor: 'transparent', outline: 'none',
                                fontSize: '1.75rem', fontWeight: 700, fontFamily: 'inherit',
                                color: 'text.primary',
                            }}
                        />
                    </Box>

                    {/* Notes */}
                    <TextField
                        label="Catatan"
                        fullWidth
                        multiline
                        rows={3}
                        value={draft.notes}
                        onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))}
                        placeholder="Untuk keperluan apa? Misalnya makan siang, bensin, patungan, atau titip beli sesuatu."
                        sx={{ mb: 2 }}
                    />

                    {/* Info box */}
                    <Paper variant="outlined" sx={{ px: 2.5, py: 2, borderRadius: 3, mb: 2, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: theme.colors.accentLight, color: theme.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                                <IconDisplay name="Info" size={16} />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={700}>Pencatatan Aman</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                    Catatan ini membantu kita melacak siapa yang masih perlu dibayar atau ditagih tanpa harus melihat transaksi satu per satu.
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Advanced toggle */}
                    <Button
                        size="small"
                        startIcon={<IconDisplay name={showAdvancedFields ? 'Minus' : 'Plus'} size={16} />}
                        onClick={() => setShowAdvancedFields((c) => !c)}
                        sx={{ color: theme.colors.accent, mb: showAdvancedFields ? 2 : 0, fontWeight: 600 }}
                    >
                        {showAdvancedFields ? 'Sembunyikan detail tambahan' : 'Tambahkan detail'}
                    </Button>

                    {showAdvancedFields && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Tanggal Catat"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    value={draft.transactionDate}
                                    onChange={(e) => setDraft((c) => ({ ...c, transactionDate: e.target.value }))}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Jatuh Tempo"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    value={draft.dueDate}
                                    onChange={(e) => setDraft((c) => ({ ...c, dueDate: e.target.value }))}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={!isDraftValid || saving}
                            startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                            sx={{ borderRadius: 99, py: 1.5, fontWeight: 700, fontSize: 16 }}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
                        </Button>
                        <Button fullWidth onClick={resetForm} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Batal
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );

    // ── Payment modal ────────────────────────────────────────────────
    const paymentModal = (
        <Dialog
            open={!!paymentDraft}
            onClose={() => setPaymentDraft(null)}
            maxWidth="sm"
            fullWidth
            slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
            PaperProps={{ sx: { borderRadius: 4 } }}
        >
            <Box sx={{ px: 3, pt: 3, pb: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.16em' }} color="text.secondary">
                        Hutang Piutang
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>Catat Pembayaran</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Simpan nominal yang sudah dibayar. Catatan tambahan tetap opsional.
                    </Typography>
                </Box>
                <IconButton onClick={() => setPaymentDraft(null)} aria-label="Tutup" sx={{ flexShrink: 0 }}>
                    <IconDisplay name="X" size={18} />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, pb: 3 }}>
                <Box component="form" onSubmit={handleSavePayment}>
                    {/* Amount */}
                    <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h6" fontWeight={600} color="text.secondary">Rp</Typography>
                        <Box
                            component="input"
                            type="text"
                            inputMode="numeric"
                            value={paymentDraft?.amount || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentDraft((c) => c ? ({ ...c, amount: formatRupiahInput(e.target.value) }) : c)}
                            sx={{
                                flex: 1, border: 'none', bgcolor: 'transparent', outline: 'none',
                                fontSize: '1.75rem', fontWeight: 700, fontFamily: 'inherit',
                                color: 'text.primary',
                            }}
                        />
                    </Box>

                    <TextField
                        label="Tanggal Bayar"
                        type="date"
                        size="small"
                        fullWidth
                        value={paymentDraft?.date || ''}
                        onChange={(e) => setPaymentDraft((c) => c ? ({ ...c, date: e.target.value }) : c)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Catatan"
                        fullWidth
                        multiline
                        rows={3}
                        value={paymentDraft?.note || ''}
                        onChange={(e) => setPaymentDraft((c) => c ? ({ ...c, note: e.target.value }) : c)}
                        placeholder="Opsional"
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={!isPaymentValid || savingPayment}
                            startIcon={savingPayment ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
                            sx={{ borderRadius: 99, py: 1.5, fontWeight: 700, fontSize: 16 }}
                        >
                            {savingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
                        </Button>
                        <Button fullWidth onClick={() => setPaymentDraft(null)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Batal
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );

    const deleteDialog = (
        <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => !deleting && setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
            title="Hapus Catatan"
            message={deleteTarget ? (
                <Box>
                    <Typography>Catatan untuk <strong>{deleteTarget.personName}</strong> akan dihapus.</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Riwayat pembayaran di catatan ini juga ikut terhapus.</Typography>
                </Box>
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
                <Box>
                    <Typography>Catatan untuk <strong>{payoffTarget.personName}</strong> akan ditandai lunas.</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Sisa nominal akan dianggap selesai.</Typography>
                </Box>
            ) : ''}
            confirmText="Tandai Lunas"
            type="success"
            icon="CheckCircle"
            isLoading={markingPaid}
        />
    );

    // ── Active debt detail ───────────────────────────────────────────
    if (activeDebt) {
        return (
            <Box sx={{ pb: { xs: 10, md: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<IconDisplay name="ArrowLeft" size={16} />}
                        onClick={() => setActiveDebtId(null)}
                        sx={{ borderRadius: 99, fontWeight: 600 }}
                    >
                        Kembali ke Daftar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => openCreateForm(activeDebt.kind)}
                        sx={{ borderRadius: 99, fontWeight: 600 }}
                    >
                        + Tambah Catatan
                    </Button>
                </Box>

                <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, boxShadow: isDark ? 0 : 4 }}>
                    {/* Hero card */}
                    <Box sx={{ background: heroGradient(activeDebt.kind), borderRadius: 4, px: { xs: 3, md: 3.5 }, py: { xs: 3, md: 3.5 }, color: '#fff', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                                {getInitials(activeDebt.personName)}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => openEditForm(activeDebt)}
                                    title="Ubah"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                >
                                    <IconDisplay name="Edit" size={16} />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => setDeleteTarget(activeDebt)}
                                    title="Hapus"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                >
                                    <IconDisplay name="Trash2" size={16} />
                                </IconButton>
                            </Box>
                        </Box>

                        <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.16em', color: 'rgba(255,255,255,0.72)' }}>
                            {getKindSummary(activeDebt.kind).detailLabel}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>{activeDebt.personName}</Typography>
                        <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.82)' }}>
                            Total sisa {activeDebt.kind === 'RECEIVABLE' ? 'yang perlu diterima' : 'yang perlu dibayar'}
                        </Typography>
                        <Typography sx={{ mt: 0.5, fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, lineHeight: 1.2 }}>
                            {formatRp(activeDebt.remainingAmount)}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {[getStatusLabel(activeDebt.status), `Dicatat ${formatShortDate(activeDebt.transactionDate)}`, ...(activeDebt.dueDate ? [`Jatuh tempo ${formatShortDate(activeDebt.dueDate)}`] : [])].map((tag) => (
                                <Box key={tag} sx={{ bgcolor: 'rgba(255,255,255,0.14)', px: 1.5, py: 0.75, borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                    {tag}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Stats */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        {[
                            { label: 'Nominal Awal', value: formatRp(activeDebt.amount) },
                            { label: 'Sudah Dibayar', value: formatRp(activeDebt.paidAmount) },
                            { label: 'Sisa', value: formatRp(activeDebt.remainingAmount) },
                        ].map((item) => (
                            <Grid size={{ xs: 12, md: 4 }} key={item.label}>
                                <Paper variant="outlined" sx={{ px: 2, py: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.14em' }} color="text.secondary">
                                        {item.label}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{item.value}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Actions */}
                    {activeDebt.status !== 'PAID' && (
                        <Grid container spacing={1.5} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => setPaymentDraft({
                                        debtId: activeDebt.id,
                                        amount: activeDebt.remainingAmount > 0
                                            ? new Intl.NumberFormat('id-ID').format(activeDebt.remainingAmount)
                                            : '',
                                        date: getToday(),
                                        note: '',
                                    })}
                                    sx={{ borderRadius: 99, py: 1.5, fontWeight: 700 }}
                                >
                                    {activeDebt.kind === 'RECEIVABLE' ? 'Terima Pembayaran' : 'Catat Pembayaran'}
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setPayoffTarget(activeDebt)}
                                    sx={{ borderRadius: 99, py: 1.5, fontWeight: 700 }}
                                >
                                    Tandai Lunas
                                </Button>
                            </Grid>
                        </Grid>
                    )}

                    {/* Payment history */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Riwayat Pembayaran</Typography>
                            <Typography variant="body2" color="text.secondary">Semua pembayaran yang sudah tercatat ada di sini.</Typography>
                        </Box>
                        <Chip label={`${activeDebt.payments.length} pembayaran`} size="small" />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Initial record */}
                        <Paper variant="outlined" sx={{ px: 2, py: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>Catatan dibuat</Typography>
                                    <Typography variant="caption" color="text.secondary">{formatShortDate(activeDebt.transactionDate)}</Typography>
                                </Box>
                                <Typography variant="body2" fontWeight={600}>{formatRp(activeDebt.amount)}</Typography>
                            </Box>
                        </Paper>

                        {activeDebt.payments.length === 0 ? (
                            <Paper variant="outlined" sx={{ px: 2, py: 3, borderRadius: 3, borderStyle: 'dashed', textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Belum ada pembayaran tercatat.</Typography>
                            </Paper>
                        ) : activeDebt.payments.map((payment: DebtPayment, index) => (
                            <Paper key={payment.id} variant="outlined" sx={{ px: 2, py: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'background.paper', color: theme.colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                                        <IconDisplay name="CheckCircle" size={18} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    Pembayaran {index === 0 ? 'Terbaru' : `Ke-${index + 1}`}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{formatShortDate(payment.date)}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={700} sx={{ color: activeDebt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense, flexShrink: 0 }}>
                                                {formatRp(payment.amount)}
                                            </Typography>
                                        </Box>
                                        {payment.note && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                                                {payment.note}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Paper>

                {formModal}
                {paymentModal}
                {deleteDialog}
                {paidDialog}
            </Box>
        );
    }

    // ── Main list view ───────────────────────────────────────────────
    return (
        <Box sx={{ pb: { xs: 10, md: 0 } }}>
            {/* Header */}
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, mb: 3, boxShadow: isDark ? 0 : 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'flex-start' }, justifyContent: 'space-between', gap: 3, mb: 3 }}>
                    <Box>
                        <Typography variant="caption" fontWeight={700} textTransform="uppercase" sx={{ letterSpacing: '0.16em' }} color="text.secondary">
                            Hutang Piutang
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>Ringkas, jelas, dan gampang dipantau</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 600 }}>
                            Kita fokus ke yang paling penting: siapa yang terlibat, berapa nominalnya, dan masih sisa berapa sampai selesai.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => openCreateForm()}
                        sx={{ borderRadius: 99, px: 3, py: 1.5, fontWeight: 700, flexShrink: 0 }}
                    >
                        + Tambah Catatan
                    </Button>
                </Box>

                {/* Summary cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {[
                        { key: 'collect', title: 'Piutang Saya', subtitle: 'Orang berhutang ke saya', amount: summary.totalCollect, count: summary.collectCount, kind: 'RECEIVABLE' as DebtKind },
                        { key: 'owe', title: 'Hutang Saya', subtitle: 'Saya masih berhutang', amount: summary.totalOwe, count: summary.oweCount, kind: 'DEBT' as DebtKind },
                    ].map((card) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={card.key}>
                            <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 4, px: { xs: 2.5, md: 3 }, py: { xs: 2.5, md: 3 }, background: heroGradient(card.kind), color: '#fff' }}>
                                <Box sx={{ position: 'absolute', right: -16, top: -20, opacity: 0.1 }}>
                                    <IconDisplay name={card.kind === 'RECEIVABLE' ? 'Wallet' : 'BadgeDollarSign'} size={92} />
                                </Box>
                                <Typography variant="body2" fontWeight={600}>{card.title}</Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.25 }}>{card.subtitle}</Typography>
                                <Typography sx={{ mt: 2, fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 700, lineHeight: 1 }}>
                                    {formatRp(card.amount)}
                                </Typography>
                                <Box sx={{ mt: 2, display: 'inline-flex', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 99, px: 1.5, py: 0.75, fontSize: 12, fontWeight: 700 }}>
                                    {card.count} catatan
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Chip
                        size="small"
                        icon={<IconDisplay name="AlertCircle" size={13} style={{ color: summary.overdueCount > 0 ? theme.colors.expense : undefined }} />}
                        label={summary.overdueCount > 0 ? `${summary.overdueCount} catatan lewat jatuh tempo` : 'Belum ada yang lewat jatuh tempo'}
                    />
                    <Chip size="small" icon={<IconDisplay name="RefreshCw" size={13} />} label="Data otomatis menyesuaikan saat ada pembayaran baru" />
                </Box>
            </Paper>

            {/* Tabs */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                {[
                    { id: 'OWE' as DebtView, label: 'Perlu Dibayar' },
                    { id: 'COLLECT' as DebtView, label: 'Perlu Ditagih' },
                    { id: 'PAID' as DebtView, label: 'Selesai' },
                ].map((tab) => {
                    const active = activeView === tab.id;
                    return (
                        <Box
                            key={tab.id}
                            component="button"
                            onClick={() => { setActiveView(tab.id); setActiveDebtId(null); }}
                            sx={{
                                borderRadius: 99, px: 2, py: 1.25, border: 'none', cursor: 'pointer',
                                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                                bgcolor: active ? theme.colors.accent : 'action.hover',
                                color: active ? '#fff' : 'text.secondary',
                                transition: 'all 0.15s',
                            }}
                        >
                            {tab.label}
                        </Box>
                    );
                })}
            </Box>

            {/* Debt list */}
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, boxShadow: isDark ? 0 : 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Aktivitas Terkini</Typography>
                        <Typography variant="body2" color="text.secondary">{sectionTitle}</Typography>
                    </Box>
                    <Chip label={`${filteredDebts.length} catatan`} size="small" />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {filteredDebts.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 5, borderRadius: 3.5, borderStyle: 'dashed', textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>
                        </Paper>
                    ) : filteredDebts.map((debt) => (
                        <Paper
                            key={debt.id}
                            variant="outlined"
                            component="button"
                            onClick={() => setActiveDebtId(debt.id)}
                            sx={{
                                px: 2, py: 2, borderRadius: 3.5, cursor: 'pointer', textAlign: 'left', width: '100%',
                                bgcolor: 'background.paper', transition: 'box-shadow 0.15s',
                                '&:hover': { boxShadow: 3 },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 48, height: 48, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700,
                                    bgcolor: debt.kind === 'RECEIVABLE' ? theme.colors.incomeBg : theme.colors.expenseBg,
                                    color: debt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense,
                                }}>
                                    {getInitials(debt.personName)}
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body1" fontWeight={600} noWrap>{debt.personName}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {getSupportingText(debt)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight={700} sx={{ color: debt.kind === 'RECEIVABLE' ? theme.colors.income : theme.colors.expense, flexShrink: 0 }}>
                                            {formatRp(debt.remainingAmount)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip
                                            size="small"
                                            label={getStatusLabel(debt.status)}
                                            sx={{ ...getStatusChipSx(debt), height: 22, fontSize: 11, fontWeight: 700 }}
                                        />
                                        {debt.dueDate && (
                                            <Chip
                                                size="small"
                                                label={isOverdue(debt) ? 'Lewat jatuh tempo' : `Jatuh tempo ${formatShortDate(debt.dueDate)}`}
                                                sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </Paper>

            {formModal}
            {paymentModal}
            {deleteDialog}
            {paidDialog}
        </Box>
    );
};

export default DebtManager;
