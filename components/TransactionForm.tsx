import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Category, TransactionType, Transaction } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';
import FullScreenDialog from './FullScreenDialog';
import { processFileForUpload } from '../utils/fileCompression';
import Toast from './Toast';
import { NotificationType } from './NotificationModal';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction;
  latestData?: Transaction | null;
  currentUserId?: string | null;
  onAdd?: (amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' }) => Promise<void>;
  onUpdate?: (id: string, amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' } | null) => Promise<void>;
  onDelete?: (id: string) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onClose: () => void;
  onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
}

const getTransactionAttachmentSummary = (transaction?: Transaction | null) => {
  if (!transaction) return 'none';

  if (transaction.attachment) {
    return JSON.stringify({
      name: transaction.attachment.name,
      type: transaction.attachment.type,
      path: transaction.attachment.path,
      url: transaction.attachment.url,
    });
  }

  if (transaction.attachmentUrl || transaction.attachmentName || transaction.attachmentType) {
    return JSON.stringify({
      name: transaction.attachmentName || null,
      type: transaction.attachmentType || null,
      url: transaction.attachmentUrl || null,
    });
  }

  return 'none';
};

const getTransactionSnapshot = (transaction?: Transaction | null) => {
  if (!transaction) return '';

  return JSON.stringify({
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    date: transaction.date,
    description: transaction.description,
    attachment: getTransactionAttachmentSummary(transaction),
  });
};

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, latestData, currentUserId, onAdd, onUpdate, onDelete, onAddCategory, onClose, onShowNotification }) => {
  const { theme } = useTheme();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [displayAmount, setDisplayAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | null>(null);
  const [existingAttachment, setExistingAttachment] = useState(initialData?.attachment || (initialData?.attachmentUrl ? { url: initialData.attachmentUrl, name: initialData.attachmentName || 'Lampiran', type: initialData.attachmentType || 'image' } : null));
  const [isAttachmentDeleted, setIsAttachmentDeleted] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [compressionMessage, setCompressionMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictBaseline, setConflictBaseline] = useState<Transaction | undefined>(initialData);
  const canEditTransaction = !initialData || !currentUserId || !initialData.createdByUserId || initialData.createdByUserId === currentUserId;
  const isReadOnly = !!initialData && !canEditTransaction;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatAmountInput = (amount: number) => {
      const ns = amount.toString().split(',');
      const sisa = ns[0].length % 3;
      let rupiah = ns[0].substr(0, sisa);
      const ribuan = ns[0].substr(sisa).match(/\d{3}/gi);
      if (ribuan) rupiah += (sisa ? '.' : '') + ribuan.join('.');
      return rupiah;
  };

  const getAttachmentLabel = (transaction?: Transaction | null) => {
    if (transaction?.attachment?.name) return transaction.attachment.name;
    if (transaction?.attachmentName) return transaction.attachmentName;
    return 'Tanpa lampiran';
  };

  const applyTransactionToForm = (transaction: Transaction) => {
    const category = categories.find((entry) => entry.id === transaction.categoryId);
    setType(category?.type || 'EXPENSE');
    setCategoryId(transaction.categoryId);
    setDisplayAmount(formatAmountInput(transaction.amount));
    setDate(transaction.date);
    setDescription(transaction.description);
    setAttachment(null);
    setAttachmentType(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentPreview(null);
    setExistingAttachment(transaction.attachment || (transaction.attachmentUrl ? {
      url: transaction.attachmentUrl,
      name: transaction.attachmentName || 'Lampiran',
      type: transaction.attachmentType || 'image',
    } : null));
    setIsAttachmentDeleted(false);
    setCompressionMessage('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (initialData) {
      applyTransactionToForm(initialData);
      setConflictBaseline(initialData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, categories]);

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!initialData || categories.find(c => c.id === initialData.categoryId)?.type !== type) {
      const currentCat = categories.find(c => c.id === categoryId);
      if (currentCat && currentCat.type !== type) setCategoryId('');
    }
    setError('');
  }, [type, categories, categoryId, initialData]);

  useEffect(() => {
    return () => { if (attachmentPreview) URL.revokeObjectURL(attachmentPreview); };
  }, [attachmentPreview]);

  const hasRemoteConflict = !!(initialData && latestData && latestData.id === initialData.id && getTransactionSnapshot(conflictBaseline) !== getTransactionSnapshot(latestData));

  const formatRupiah = (value: string) => {
    const ns = value.replace(/[^,\d]/g, '').split(',');
    const sisa = ns[0].length % 3;
    let rupiah = ns[0].substr(0, sisa);
    const ribuan = ns[0].substr(sisa).match(/\d{3}/gi);
    if (ribuan) rupiah += (sisa ? '.' : '') + ribuan.join('.');
    return ns[1] !== undefined ? rupiah + ',' + ns[1] : rupiah;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayAmount(formatRupiah(e.target.value.replace(/\D/g, '')));
    if (error) setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setCompressionMessage('');
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type) && file.type !== 'application/pdf') {
      setError('Hanya file foto (JPG, PNG, GIF, WEBP) atau PDF yang diizinkan.'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file terlalu besar (maksimal 10MB).'); return;
    }
    try {
      const result = await processFileForUpload(file);
      setAttachment(result.file); setIsAttachmentDeleted(false); setAttachmentType(result.type);
      if (result.type === 'image') setAttachmentPreview(URL.createObjectURL(result.file));
      else setAttachmentPreview(null);
      if (result.message) setCompressionMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(null); setAttachmentPreview(null); setAttachmentType(null); setCompressionMessage('');
    if (existingAttachment) setIsAttachmentDeleted(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); };

  const handleConfirmDelete = () => {
    if (initialData && onDelete) { onDelete(initialData.id); setShowDeleteConfirm(false); onClose(); }
  };

  const persistTransaction = async (forceSave = false) => {
    if (isReadOnly) {
      return;
    }
    setError('');
    const rawAmount = parseInt(displayAmount.replace(/\./g, ''), 10);

    const validateAndNotify = (condition: boolean, title: string, msg: string) => {
      if (condition) {
        if (onShowNotification) onShowNotification('warning', title, msg, false);
        else setError(msg);
        return true;
      }
      return false;
    };

    if (validateAndNotify(!rawAmount || rawAmount <= 0, 'Jumlah Tidak Valid', 'Mohon isi jumlah uang dengan nominal yang valid.')) return;
    if (validateAndNotify(!categoryId, 'Kategori Wajib Dipilih', 'Kategori transaksi wajib dipilih.')) return;
    if (validateAndNotify(!date, 'Tanggal Harus Diisi', 'Tanggal transaksi harus diisi.')) return;
    if (validateAndNotify(!description.trim(), 'Catatan Tidak Boleh Kosong', 'Catatan tidak boleh kosong.')) return;
    if (!forceSave && hasRemoteConflict) {
      setShowConflictDialog(true);
      return;
    }

    setIsSaving(true);
    if (onShowNotification) {
      onShowNotification('loading', attachment ? 'Mengupload...' : 'Menyimpan...', attachment ? 'Sedang mengupload lampiran, mohon tunggu.' : 'Sedang menyimpan transaksi, mohon tunggu.', false);
    } else {
      setSavingMessage(attachment ? 'Mengupload lampiran...' : 'Menyimpan transaksi...');
    }

    try {
      if (initialData && onUpdate) {
        let attachmentPayload: { file: File; type: 'image' | 'pdf' } | null | undefined = undefined;
        if (attachment && attachmentType) attachmentPayload = { file: attachment, type: attachmentType };
        else if (isAttachmentDeleted) attachmentPayload = null;
        await onUpdate(initialData.id, rawAmount, categoryId, date, description, attachmentPayload);
      } else if (onAdd) {
        await onAdd(rawAmount, categoryId, date, description, attachment && attachmentType ? { file: attachment, type: attachmentType } : undefined);
      }

      if (onShowNotification) {
        onShowNotification('success', 'Berhasil!', initialData ? 'Transaksi berhasil diupdate!' : 'Transaksi berhasil disimpan!', true);
        onClose();
      } else {
        setToastMessage(initialData ? 'Transaksi berhasil diupdate!' : 'Transaksi berhasil disimpan!');
        setToastType('success'); setShowToast(true);
        setTimeout(() => onClose(), 200);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      if (onShowNotification) onShowNotification('error', 'Gagal Menyimpan', 'Gagal menyimpan transaksi. Silakan coba lagi.');
      else { setError('Gagal menyimpan transaksi. Silakan coba lagi.'); setToastMessage('Gagal menyimpan transaksi'); setToastType('error'); setShowToast(true); }
    } finally {
      setIsSaving(false); setSavingMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistTransaction();
  };

  const applyLatestVersion = () => {
    if (!latestData) {
      setShowConflictDialog(false);
      return;
    }

    applyTransactionToForm(latestData);
    setConflictBaseline(latestData);
    setShowConflictDialog(false);
  };

  const keepMyVersion = async () => {
    if (latestData) {
      setConflictBaseline(latestData);
    }
    setShowConflictDialog(false);
    await persistTransaction(true);
  };

  const hasAttachment = (attachment || (existingAttachment && !isAttachmentDeleted));
  const showImagePreview = (attachmentType === 'image' && attachmentPreview) || (existingAttachment?.type === 'image' && existingAttachment.url && !isAttachmentDeleted);

  const formContent = (
    <Box component="form" id="transaction-form" onSubmit={handleSubmit}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
        {initialData && isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
              Dibuat oleh: {initialData.createdByName || 'anggota lain'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transaksi ini hanya bisa diubah oleh pembuatnya.
            </Typography>
          </Alert>
        )}
        {hasRemoteConflict && initialData && latestData ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
              Transaksi ini berubah di perangkat atau tab lain.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tinjau versi terbaru sebelum menyimpan supaya perubahan tidak saling timpa.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" color="warning" onClick={applyLatestVersion}>
                Pakai versi terbaru
              </Button>
              <Button size="small" variant="contained" color="warning" onClick={() => setShowConflictDialog(true)}>
                Bandingkan dulu
              </Button>
            </Box>
          </Alert>
        ) : null}

        {/* Type Toggle */}
        <ToggleButtonGroup
          fullWidth
          exclusive
          value={type}
          onChange={(_, val) => !isReadOnly && val && setType(val)}
          disabled={isReadOnly}
          sx={{ mb: 2, bgcolor: 'action.hover', borderRadius: 2, p: 0.5 }}
        >
          <ToggleButton value="EXPENSE" sx={{ borderRadius: 1.5, fontWeight: 700, border: 'none', '&.Mui-selected': { bgcolor: 'background.paper', color: 'error.main', boxShadow: 1 } }}>
            Pengeluaran
          </ToggleButton>
          <ToggleButton value="INCOME" sx={{ borderRadius: 1.5, fontWeight: 700, border: 'none', '&.Mui-selected': { bgcolor: 'background.paper', color: 'info.main', boxShadow: 1 } }}>
            Pemasukan
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Amount */}
        <TextField
          fullWidth
          label="Jumlah (Rp)"
          value={displayAmount}
          onChange={handleAmountChange}
          disabled={isSaving || isReadOnly}
          inputProps={{ inputMode: 'numeric' }}
          autoFocus={!initialData}
          sx={{ mb: 2 }}
          InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.disabled', fontWeight: 700 }}>Rp</Typography> }}
        />

        {/* Category */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>Kategori</Typography>
            {onAddCategory && (
              <Button size="small" variant="outlined" startIcon={<IconDisplay name="Plus" size={14} />} onClick={() => setShowCategoryModal(true)} disabled={isReadOnly}>
                Kategori Baru
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {filteredCategories.map((cat) => (
              <Box
                key={cat.id}
                component="button"
                type="button"
                onClick={() => !isReadOnly && setCategoryId(cat.id)}
                sx={{
                  p: 1.25, borderRadius: 2, border: '1px solid', cursor: isReadOnly ? 'not-allowed' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                  transition: 'all 0.15s',
                  borderColor: categoryId === cat.id ? 'primary.main' : 'divider',
                  bgcolor: categoryId === cat.id ? 'primary.light' : 'action.hover',
                  boxShadow: categoryId === cat.id ? '0 0 0 2px ' + theme.colors.accent : 'none',
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconDisplay name={cat.icon} size={16} sx={{ color: '#fff' }} />
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  textAlign="center"
                  noWrap
                  sx={{ width: '100%', color: theme.colors.textPrimary }}
                >
                  {cat.name}
                </Typography>
              </Box>
            ))}
          </Box>
          {filteredCategories.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 1 }}>
              Belum ada kategori {type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'}.
              {onAddCategory && !isReadOnly && (
                <Box component="span" onClick={() => setShowCategoryModal(true)} sx={{ ml: 0.5, color: 'primary.main', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Buat sekarang
                </Box>
              )}
            </Typography>
          )}
        </Box>

        {/* Date */}
          <TextField
          fullWidth
          label="Tanggal"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isSaving || isReadOnly}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        {/* Description */}
        <TextField
          fullWidth
          label="Catatan"
          multiline
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving || isReadOnly}
          placeholder="Contoh: Makan siang, Gaji bulanan"
          sx={{ mb: 2 }}
          slotProps={{
            inputLabel: { shrink: true },
            input: { notched: true },
          }}
        />

        {/* Attachment */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Lampiran
          </Typography>
          <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileSelect} disabled={isSaving || isReadOnly} style={{ display: 'none' }} />
          {!hasAttachment ? (
            <Paper
              onClick={() => !isReadOnly && fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                p: 3,
                textAlign: 'center',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                bgcolor: 'action.hover',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <IconDisplay name="Camera" size={24} sx={{ color: theme.colors.textMuted, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Tambah foto atau PDF</Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Maksimal 10MB. Format JPG, PNG, GIF, WEBP, PDF
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                  {showImagePreview ? (
                    <Box component="img" src={attachmentPreview || existingAttachment?.url} alt="Preview" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1.5 }} />
                  ) : (
                    <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: theme.colors.expenseBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconDisplay name="FileText" size={24} sx={{ color: theme.colors.expense }} />
                    </Box>
                  )}
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{attachment?.name || existingAttachment?.name}</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {attachment ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Terlampir'} • {attachmentType === 'image' || existingAttachment?.type === 'image' ? 'Foto' : 'PDF'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={removeAttachment} disabled={isSaving || isReadOnly}>
                  <IconDisplay name="X" size={18} />
                </IconButton>
              </Box>
            </Paper>
          )}
          {compressionMessage && (
            <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>{compressionMessage}</Alert>
          )}
        </Box>

        {initialData?.source && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            {initialData.source === 'telegram' ? 'Dicatat lewat Telegram' : 'Dicatat lewat Aplikasi'}
          </Typography>
        )}
    </Box>
  );

  const formActions = (
    <>
      {initialData && onDelete && canEditTransaction ? (
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          disabled={isSaving || isReadOnly}
          startIcon={<IconDisplay name="Trash2" size={18} />}
        >
          Hapus
        </Button>
      ) : null}
      <Box sx={{ flex: 1 }} />
      <Button variant="outlined" onClick={onClose} disabled={isSaving}>
        Batal
      </Button>
      {!isReadOnly && (
        <Button
          type="submit"
          form="transaction-form"
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <IconDisplay name={initialData ? 'Check' : 'Save'} size={18} sx={{ color: '#fff' }} />}
        >
          {isSaving ? 'Menyimpan...' : initialData ? 'Update' : 'Simpan'}
        </Button>
      )}
    </>
  );

  return (
    <>
      <FullScreenDialog
        open
        onClose={onClose}
        title={initialData ? (isReadOnly ? 'Detail Transaksi' : 'Edit Transaksi') : 'Tambah Transaksi'}
        description={initialData && isReadOnly
          ? 'Transaksi ini hanya bisa dibaca karena dibuat oleh anggota lain.'
          : 'Gunakan pola input yang sama untuk semua transaksi agar pencatatan tetap konsisten dan mudah dibaca.'}
        actions={formActions}
      >
        {formContent}
      </FullScreenDialog>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi"
        message={
          <Box>
            <Typography sx={{ mb: 1 }}>Apakah Anda yakin ingin menghapus transaksi ini?</Typography>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography fontWeight={600}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialData?.amount || 0)}</Typography>
              <Typography variant="body2" color="text.secondary">{initialData?.description || 'Tidak ada catatan'}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Tindakan ini tidak dapat dibatalkan.</Typography>
          </Box>
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        icon="Trash2"
      />

      {onAddCategory && !isReadOnly && (
        <CategoryFormModal
          isOpen={showCategoryModal}
          defaultType={type}
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSave={async (categoryData) => {
            const newCategoryId = await onAddCategory(categoryData);
            if (newCategoryId) setCategoryId(newCategoryId);
          }}
        />
      )}

      {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}

      <Dialog
        open={showConflictDialog}
        onClose={isSaving ? undefined : () => setShowConflictDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Versi Transaksi Berubah
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ada perubahan dari tab atau perangkat lain sejak form ini dibuka. Pilih versi mana yang ingin kamu lanjutkan.
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Versi terbaru di server
              </Typography>
              <Typography variant="body2">Jumlah: {latestData ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(latestData.amount) : '-'}</Typography>
              <Typography variant="body2">Tanggal: {latestData?.date || '-'}</Typography>
              <Typography variant="body2">Catatan: {latestData?.description || '-'}</Typography>
              <Typography variant="body2">Lampiran: {getAttachmentLabel(latestData)}</Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Versi yang sedang kamu edit
              </Typography>
              <Typography variant="body2">Jumlah: {displayAmount ? `Rp ${displayAmount}` : '-'}</Typography>
              <Typography variant="body2">Tanggal: {date || '-'}</Typography>
              <Typography variant="body2">Catatan: {description || '-'}</Typography>
              <Typography variant="body2">
                Lampiran: {attachment ? `${attachment.name} (baru)` : isAttachmentDeleted ? 'Lampiran dihapus' : existingAttachment?.name || 'Tanpa lampiran'}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setShowConflictDialog(false)} disabled={isSaving}>
            Tutup
          </Button>
          <Button variant="outlined" color="warning" onClick={applyLatestVersion} disabled={isSaving}>
            Pakai versi terbaru
          </Button>
          <Button variant="contained" color="warning" onClick={() => void keepMyVersion()} disabled={isSaving}>
            Simpan versi saya
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionForm;
