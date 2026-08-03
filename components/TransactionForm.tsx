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
import Tooltip from '@mui/material/Tooltip';
import { scanReceiptImage } from '../services/geminiService';
import { ReceiptScanResult } from '../types';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction;
  latestData?: Transaction | null;
  currentUserId?: string | null;
  activeAccountRole?: 'OWNER' | 'MEMBER';
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

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, latestData, currentUserId, activeAccountRole, onAdd, onUpdate, onDelete, onAddCategory, onClose, onShowNotification }) => {
  const { theme } = useTheme();
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [displayAmount, setDisplayAmount] = useState('');
  const [categoryId, setCategoryId] = useState(() => {
    if (initialData) return initialData.categoryId || '';
    const belanja = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'belanja');
    return belanja?.id || '';
  });
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const scanRequestedRef = useRef(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const canEditTransaction = !initialData || !currentUserId || !initialData.createdByUserId || initialData.createdByUserId === currentUserId || activeAccountRole === 'OWNER';
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

  const matchCategoryFromSuggestion = (suggestion: string): string => {
    const normalized = suggestion.toLowerCase().trim();
    const exactMatch = categories.find(c => c.name.toLowerCase() === normalized);
    if (exactMatch) return exactMatch.id;
    const containsMatch = categories.find(c =>
      c.name.toLowerCase().includes(normalized) || normalized.includes(c.name.toLowerCase())
    );
    if (containsMatch) return containsMatch.id;
    const aliasMap: Record<string, string[]> = {
      'makanan': ['makan', 'food', 'kuliner', 'resto', 'cafe'],
      'transport': ['transportasi', 'bensin', 'bbm', 'parkir', 'gojek', 'grab'],
      'belanja': ['shopping', 'market', 'minimarket'],
      'belanja harian': ['daily', 'sembako'],
      'tagihan': ['bill', 'pln', 'pdam', 'pulsa', 'internet'],
      'kesehatan': ['health', 'obat', 'dokter', 'rs'],
      'hiburan': ['entertain', 'movie', 'bioskop', 'game'],
      'gaji': ['salary', 'income', 'upah'],
    };
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (aliases.some(a => normalized.includes(a))) {
        const aliasMatch = categories.find(c => c.name.toLowerCase().includes(key));
        if (aliasMatch) return aliasMatch.id;
      }
    }
    const belanja = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'belanja');
    if (belanja) return belanja.id;
    const fallback = categories.find(c => c.type === 'EXPENSE');
    return fallback?.id || '';
  };

  const validateScanDate = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    setScanError('');
    setScanMessage('');
    setIsScanning(false);
    scanRequestedRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (initialData) {
      applyTransactionToForm(initialData);
      setConflictBaseline(initialData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, categories]);

  const filteredCategories = categories
    .filter(c => c.type === type)
    .sort((a, b) => {
      const isBelanjaA = ['belanja', 'shopping'].includes(a.name.toLowerCase());
      const isBelanjaB = ['belanja', 'shopping'].includes(b.name.toLowerCase());
      if (isBelanjaA && !isBelanjaB) return -1;
      if (!isBelanjaA && isBelanjaB) return 1;
      return 0;
    });

  useEffect(() => {
    if (!initialData || categories.find(c => c.id === initialData.categoryId)?.type !== type) {
      const currentCat = categories.find(c => c.id === categoryId);
      if (currentCat && currentCat.type !== type) {
        const belanja = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'belanja');
        setCategoryId(type === 'EXPENSE' ? (belanja?.id || '') : '');
      }
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
    if (!file) {
      // User cancelled file dialog — reset scan flag so next regular upload doesn't trigger scan
      scanRequestedRef.current = false;
      return;
    }

    // Capture and reset scan request flag IMMEDIATELY (no setTimeout)
    const wasScanRequested = scanRequestedRef.current;
    scanRequestedRef.current = false;

    setError(''); setCompressionMessage(''); setScanError(''); setScanMessage('');

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

      // AI Scan: only if triggered by scan button AND file is scan-eligible image
      const validScanTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (wasScanRequested && validScanTypes.includes(file.type)) {
        if (!navigator.onLine) {
          setScanError('Fitur scan struk membutuhkan koneksi internet. Lampiran tetap tersimpan.');
          return;
        }
        setIsScanning(true);
        setScanMessage('Menganalisis struk...');
        try {
          const scanResult = await scanReceiptImage(result.file);
          if (scanResult.is_receipt === false) {
            setScanError('Foto ini sepertinya bukan struk belanja. Mohon upload foto struk yang valid.');
            return;
          }
          if (!scanResult.totalAmount || scanResult.totalAmount <= 0) {
            setScanError('Nominal total tidak terbaca. Pastikan angka "Total" terlihat jelas di foto.');
            return;
          }
          setDisplayAmount(formatAmountInput(scanResult.totalAmount));
          if (scanResult.date) setDate(validateScanDate(scanResult.date));
          // Human-friendly description composition
          let humanDescription = '';
          if (scanResult.notes && scanResult.notes.trim()) {
            humanDescription = scanResult.notes.trim();
          } else if (scanResult.merchant && scanResult.items?.length) {
            humanDescription = `Belanja di ${scanResult.merchant}: ${scanResult.items.slice(0, 3).join(', ')}`;
          } else if (scanResult.merchant) {
            humanDescription = `Belanja di ${scanResult.merchant}`;
          } else if (scanResult.items?.length) {
            humanDescription = `Belanja: ${scanResult.items.slice(0, 3).join(', ')}`;
          } else {
            humanDescription = 'Belanja Struk';
          }
          setDescription(humanDescription);
          if (scanResult.categorySuggestion) {
            const matchedCategoryId = matchCategoryFromSuggestion(scanResult.categorySuggestion);
            if (matchedCategoryId) setCategoryId(matchedCategoryId);
          }
          setScanMessage('Struk berhasil dibaca! Silakan periksa dan sesuaikan.');
          setCompressionMessage(`AI: ${scanResult.merchant || 'Struk'} — Rp ${formatAmountInput(scanResult.totalAmount)} (confidence: ${scanResult.confidence})`);
        } catch (scanErr) {
          const msg = scanErr instanceof Error ? scanErr.message : 'Gagal menganalisis struk. Silakan coba lagi.';
          setScanError(msg);
        } finally {
          setIsScanning(false);
        }
      } else if (wasScanRequested) {
        setScanError('Scan struk hanya mendukung foto JPG, PNG, atau WEBP. Lampiran tetap tersimpan.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScanButtonClick = () => {
    if (!navigator.onLine) {
      setScanError('Fitur scan struk membutuhkan koneksi internet.');
      return;
    }
    scanRequestedRef.current = true;
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setAttachment(null); setAttachmentPreview(null); setAttachmentType(null); setCompressionMessage('');
    setScanMessage('');
    setScanError('');
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

        {/* Amount - Large Display */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Jumlah
          </Typography>
          <Box
            component="div"
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 0.5,
              borderBottom: '2px solid',
              borderColor: categoryId ? theme.colors.accent : 'divider',
              pb: 1,
              transition: 'border-color 0.2s',
            }}
          >
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.disabled' }}>Rp</Typography>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              disabled={isSaving || isReadOnly}
              placeholder="0"
              autoFocus={!initialData}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 40,
                fontWeight: 700,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                color: 'inherit',
                width: '100%',
                maxWidth: 200,
              }}
            />
          </Box>
          {error && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </Box>

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

        {/* Quick Date Chips */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Tanggal
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Hari ini', offset: 0 },
              { label: 'Kemarin', offset: 1 },
              { label: '2 hari lalu', offset: 2 },
            ].map((chip) => {
              const d = new Date();
              d.setDate(d.getDate() - chip.offset);
              const dateStr = d.toISOString().split('T')[0];
              const isActive = date === dateStr;
              return (
                <Chip
                  key={chip.label}
                  label={chip.label}
                  onClick={() => setDate(dateStr)}
                  disabled={isReadOnly}
                  sx={{
                    bgcolor: isActive ? theme.colors.accentLight : 'action.hover',
                    color: isActive ? theme.colors.accent : 'text.primary',
                    fontWeight: 600,
                    height: 36,
                  }}
                />
              );
            })}
            <Chip
              icon={<IconDisplay name="Calendar" size={14} />}
              label={date && !['Hari ini', 'Kemarin', '2 hari lalu'].includes(new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })) ? `Pilih: ${date}` : 'Pilih tanggal'}
              variant="outlined"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'date';
                input.value = date;
                input.onchange = (e) => setDate((e.target as HTMLInputElement).value);
                input.click();
              }}
              disabled={isReadOnly}
              sx={{ height: 36 }}
            />
          </Box>
        </Box>

        {/* Advanced Toggle */}
        <Button
          size="small"
          onClick={() => setShowAdvanced(!showAdvanced)}
          sx={{ mb: 2, color: theme.colors.accent, fontWeight: 600 }}
        >
          {showAdvanced ? 'Sembunyikan detail' : 'Tambah detail (catatan, lampiran)'}
        </Button>

        {showAdvanced && (
          <>
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
            <Paper sx={{ p: 1.5, bgcolor: 'action.hover', position: 'relative', overflow: 'hidden' }}>
              {isScanning && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                  {showImagePreview ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box component="img" src={attachmentPreview || existingAttachment?.url} alt="Preview" sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1.5, opacity: isScanning ? 0.6 : 1 }} />
                      {isScanning && (
                        <CircularProgress size={20} sx={{ position: 'absolute', top: 14, left: 14 }} />
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: theme.colors.expenseBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isScanning ? <CircularProgress size={20} /> : <IconDisplay name="FileText" size={24} sx={{ color: theme.colors.expense }} />}
                    </Box>
                  )}
                  <Box sx={{ overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{attachment?.name || existingAttachment?.name}</Typography>
                      {isScanning ? (
                        <Chip
                          icon={<CircularProgress size={10} sx={{ color: 'inherit !important' }} />}
                          label="Menganalisis AI..."
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                        />
                      ) : scanMessage && !scanError ? (
                        <Chip
                          label="AI"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ) : null}
                    </Box>
                    <Typography variant="caption" color="text.disabled">
                      {attachment ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Terlampir'} • {attachmentType === 'image' || existingAttachment?.type === 'image' ? 'Foto' : 'PDF'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={removeAttachment} disabled={isSaving || isScanning || isReadOnly}>
                  <IconDisplay name="X" size={18} />
                </IconButton>
              </Box>
            </Paper>
          )}
          {!hasAttachment && (
            <Tooltip title={!navigator.onLine ? 'Fitur ini membutuhkan koneksi internet' : 'Foto struk akan dianalisis AI untuk mengisi form otomatis'} arrow>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={handleScanButtonClick}
                disabled={isSaving || isScanning || isReadOnly || !navigator.onLine}
                startIcon={isScanning ? <CircularProgress size={14} /> : <IconDisplay name="Sparkles" size={16} />}
                sx={{ mt: 1, borderStyle: 'dashed', py: 0.75 }}
              >
                {isScanning ? 'Menganalisis struk...' : 'Scan Struk (AI)'}
              </Button>
            </Tooltip>
          )}
          {compressionMessage && !isScanning && !scanMessage && (
            <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>{compressionMessage}</Alert>
          )}
          {scanError && (
            <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={() => setScanError('')}>
              {scanError}
            </Alert>
          )}
          {scanMessage && !scanError && !isScanning && (
            <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={() => setScanMessage('')}>
              {scanMessage}
            </Alert>
          )}
            </Box>
          </>
        )}

        {initialData?.source && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            {initialData.source === 'telegram' ? 'Dicatat lewat Telegram' : 'Dicatat lewat Aplikasi'}
          </Typography>
        )}
        {initialData?.updatedByUserId && initialData.createdByUserId !== initialData.updatedByUserId && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
            Dibuat oleh {initialData.createdByName || 'anggota'} dan Diupdate oleh {initialData.updatedByName || 'anggota'}
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
