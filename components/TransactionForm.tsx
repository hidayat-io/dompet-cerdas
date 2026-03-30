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
  onAdd?: (amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' }) => Promise<void>;
  onUpdate?: (id: string, amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' } | null) => Promise<void>;
  onDelete?: (id: string) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
  onClose: () => void;
  onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onAdd, onUpdate, onDelete, onAddCategory, onClose, onShowNotification }) => {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      const cat = categories.find(c => c.id === initialData.categoryId);
      if (cat) { setType(cat.type); setCategoryId(initialData.categoryId); }
      const ns = initialData.amount.toString().split(',');
      const sisa = ns[0].length % 3;
      let rupiah = ns[0].substr(0, sisa);
      const ribuan = ns[0].substr(sisa).match(/\d{3}/gi);
      if (ribuan) rupiah += (sisa ? '.' : '') + ribuan.join('.');
      setDisplayAmount(rupiah);
      setDate(initialData.date);
      setDescription(initialData.description);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const hasAttachment = (attachment || (existingAttachment && !isAttachmentDeleted));
  const showImagePreview = (attachmentType === 'image' && attachmentPreview) || (existingAttachment?.type === 'image' && existingAttachment.url && !isAttachmentDeleted);

  const formContent = (
    <Box component="form" id="transaction-form" onSubmit={handleSubmit}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Type Toggle */}
        <ToggleButtonGroup
          fullWidth
          exclusive
          value={type}
          onChange={(_, val) => val && setType(val)}
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
          disabled={isSaving}
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
              <Button size="small" variant="outlined" startIcon={<IconDisplay name="Plus" size={14} />} onClick={() => setShowCategoryModal(true)}>
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
                onClick={() => setCategoryId(cat.id)}
                sx={{
                  p: 1.25, borderRadius: 2, border: '1px solid', cursor: 'pointer',
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
                <Typography variant="caption" fontWeight={600} textAlign="center" noWrap sx={{ width: '100%' }}>{cat.name}</Typography>
              </Box>
            ))}
          </Box>
          {filteredCategories.length === 0 && (
            <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 1 }}>
              Belum ada kategori {type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'}.
              {onAddCategory && (
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
          disabled={isSaving}
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
          disabled={isSaving}
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
          <input type="file" ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileSelect} disabled={isSaving} style={{ display: 'none' }} />
          {!hasAttachment ? (
            <Paper
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
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
                <IconButton size="small" onClick={removeAttachment} disabled={isSaving}>
                  <IconDisplay name="X" size={18} />
                </IconButton>
              </Box>
            </Paper>
          )}
          {compressionMessage && (
            <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>{compressionMessage}</Alert>
          )}
        </Box>
    </Box>
  );

  const formActions = (
    <>
      {initialData && onDelete ? (
        <Button
          variant="outlined"
          color="error"
          onClick={handleDelete}
          disabled={isSaving}
          startIcon={<IconDisplay name="Trash2" size={18} />}
        >
          Hapus
        </Button>
      ) : null}
      <Box sx={{ flex: 1 }} />
      <Button variant="outlined" onClick={onClose} disabled={isSaving}>
        Batal
      </Button>
      <Button
        type="submit"
        form="transaction-form"
        variant="contained"
        disabled={isSaving}
        startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <IconDisplay name={initialData ? 'Check' : 'Save'} size={18} sx={{ color: '#fff' }} />}
      >
        {isSaving ? 'Menyimpan...' : initialData ? 'Update' : 'Simpan'}
      </Button>
    </>
  );

  return (
    <>
      <FullScreenDialog
        open
        onClose={onClose}
        title={initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}
        description="Gunakan pola input yang sama untuk semua transaksi agar pencatatan tetap konsisten dan mudah dibaca."
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

      {onAddCategory && (
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
    </>
  );
};

export default TransactionForm;
