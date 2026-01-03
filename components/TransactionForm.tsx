import React, { useState, useEffect, useRef } from 'react';
import { Category, TransactionType, Transaction } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';
import { processFileForUpload } from '../utils/fileCompression';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction;
  onAdd?: (
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' }
  ) => void;
  onUpdate?: (
    id: string,
    amount: number,
    categoryId: string,
    date: string,
    description: string,
    attachment?: { file: File; type: 'image' | 'pdf' } | null
  ) => void;
  onDelete?: (id: string) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => void;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onAdd, onUpdate, onDelete, onAddCategory, onClose }) => {
  const { theme } = useTheme();

  // Determine initial state based on initialData
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [displayAmount, setDisplayAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Attachment state
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | null>(null);
  const [existingAttachment, setExistingAttachment] = useState(initialData?.attachment || (initialData?.attachmentUrl ? { url: initialData.attachmentUrl, name: initialData.attachmentName || 'Lampiran', type: initialData.attachmentType || 'image' } : null));
  const [isAttachmentDeleted, setIsAttachmentDeleted] = useState(false);

  // Delete confirmation dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Compression message state
  const [compressionMessage, setCompressionMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form if editing
  useEffect(() => {
    if (initialData) {
      // Find category to set type
      const cat = categories.find(c => c.id === initialData.categoryId);
      if (cat) {
        setType(cat.type);
        setCategoryId(initialData.categoryId);
      }

      // Set amount format
      const numberString = initialData.amount.toString();
      const split = numberString.split(',');
      const sisa = split[0].length % 3;
      let rupiah = split[0].substr(0, sisa);
      const ribuan = split[0].substr(sisa).match(/\d{3}/gi);
      if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
      }
      setDisplayAmount(rupiah);

      setDate(initialData.date);
      setDescription(initialData.description);
    }
  }, [initialData, categories]);

  const filteredCategories = categories.filter(c => c.type === type);

  // Effect to reset category if type changes manually (only if not initializing)
  useEffect(() => {
    if (!initialData || (initialData && categories.find(c => c.id === initialData.categoryId)?.type !== type)) {
      const currentCat = categories.find(c => c.id === categoryId);
      if (currentCat && currentCat.type !== type) {
        setCategoryId('');
      }
    }
    setError('');
  }, [type, categories, categoryId, initialData]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = formatRupiah(rawValue);
    setDisplayAmount(formatted);
    if (error) setError('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError('');
    setCompressionMessage('');

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfType = 'application/pdf';

    if (!validImageTypes.includes(file.type) && file.type !== validPdfType) {
      setError('⚠️ Hanya file foto (JPG, PNG, GIF, WEBP) atau PDF yang diizinkan.');
      return;
    }

    // Validate initial file size (max 10MB before compression)
    const maxInitialSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxInitialSize) {
      setError('⚠️ Ukuran file terlalu besar (maksimal 10MB).');
      return;
    }

    try {
      // Process file (compress images, validate PDFs)
      const result = await processFileForUpload(file);

      // Set attachment
      setAttachment(result.file);
      setIsAttachmentDeleted(false);
      setAttachmentType(result.type);

      // Set preview for images
      if (result.type === 'image') {
        setAttachmentPreview(URL.createObjectURL(result.file));
      } else {
        setAttachmentPreview(null);
      }

      // Show compression message
      if (result.message) {
        setCompressionMessage(result.message);
      }

    } catch (error) {
      setError(error instanceof Error ? `⚠️ ${error.message}` : '⚠️ Gagal memproses file.');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    setAttachmentType(null);
    setCompressionMessage('');

    // If there was an existing attachment, mark it as deleted
    if (existingAttachment) {
      setIsAttachmentDeleted(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const rawAmount = parseInt(displayAmount.replace(/\./g, ''), 10);

    if (!rawAmount || rawAmount <= 0) {
      setError("⚠️ Mohon isi jumlah uang dengan nominal yang valid.");
      return;
    }

    if (!categoryId) {
      setError("⚠️ Kategori transaksi wajib dipilih.");
      return;
    }

    if (!date) {
      setError("⚠️ Tanggal transaksi harus diisi.");
      return;
    }

    if (!description.trim()) {
      setError("⚠️ Catatan tidak boleh kosong.");
      return;
    }

    // Logic for Update vs Add
    if (initialData && onUpdate) {
      let attachmentPayload: { file: File; type: 'image' | 'pdf' } | null | undefined = undefined;

      if (attachment && attachmentType) {
        attachmentPayload = { file: attachment, type: attachmentType };
      } else if (isAttachmentDeleted) {
        attachmentPayload = null;
      }

      onUpdate(initialData.id, rawAmount, categoryId, date, description, attachmentPayload);

    } else if (onAdd) {
      if (attachment && attachmentType) {
        onAdd(rawAmount, categoryId, date, description, { file: attachment, type: attachmentType });
      } else {
        onAdd(rawAmount, categoryId, date, description);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up max-h-[90vh] flex flex-col"
        style={{ backgroundColor: theme.colors.bgCard }}
      >
        <div className="p-4 flex justify-between items-center gap-3 flex-shrink-0" style={{ backgroundColor: theme.colors.accent }}>
          <h3 className="text-white font-semibold text-lg flex-shrink-0">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>

          <div className="flex items-center gap-2">
            {/* Delete Button (only show when editing) */}
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg transition-all focus:outline-none flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Hapus Transaksi"
              >
                <IconDisplay name="Trash2" size={16} />
                <span className="text-sm font-medium">Hapus</span>
              </button>
            )}

            {/* Save Button */}
            <button
              type="submit"
              form="transaction-form"
              className="px-3 py-2 rounded-lg font-semibold transition-all focus:outline-none flex items-center gap-1.5"
              style={{
                backgroundColor: 'white',
                color: theme.colors.accent
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <IconDisplay name={initialData ? "Check" : "Save"} size={16} />
              <span className="text-sm font-medium">{initialData ? 'Update' : 'Simpan'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg transition-all focus:outline-none flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <IconDisplay name="X" size={16} />
            </button>
          </div>
        </div>

        <form id="transaction-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {error && (
            <div className="border-l-4 border-red-500 p-3 rounded-md text-sm font-medium flex items-center gap-2 animate-pulse"
              style={{
                backgroundColor: theme.colors.expenseBg,
                color: theme.colors.expense
              }}
            >
              <IconDisplay name="AlertCircle" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="flex p-1 rounded-lg" style={{ backgroundColor: theme.colors.bgMuted }}>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className="flex-1 py-2 text-sm font-bold rounded-md transition-all shadow-sm"
              style={{
                backgroundColor: type === 'EXPENSE' ? theme.colors.bgCard : 'transparent',
                color: type === 'EXPENSE' ? theme.colors.expense : theme.colors.textMuted
              }}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className="flex-1 py-2 text-sm font-bold rounded-md transition-all shadow-sm"
              style={{
                backgroundColor: type === 'INCOME' ? theme.colors.bgCard : 'transparent',
                color: type === 'INCOME' ? theme.colors.income : theme.colors.textMuted
              }}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.colors.textMuted }}>
              Jumlah (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 font-bold" style={{ color: theme.colors.textMuted }}>Rp</span>
              <input
                type="text"
                value={displayAmount}
                onChange={handleAmountChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-lg"
                style={{
                  backgroundColor: theme.colors.bgHover,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }}
                placeholder="0"
                inputMode="numeric"
                autoFocus={!initialData}
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: theme.colors.textMuted }}>Kategori</label>
              {onAddCategory && (
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full transition-all"
                  style={{
                    backgroundColor: theme.colors.accentLight,
                    color: theme.colors.accent
                  }}
                >
                  <IconDisplay name="Plus" size={12} />
                  Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all"
                  style={categoryId === cat.id ? {
                    backgroundColor: theme.colors.accentLight,
                    borderColor: theme.colors.accent,
                    color: theme.colors.textPrimary,
                    boxShadow: `0 0 0 2px ${theme.colors.accent}`
                  } : {
                    backgroundColor: theme.colors.bgHover,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mb-1"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconDisplay name={cat.icon} size={16} />
                  </div>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
            {filteredCategories.length === 0 && (
              <p className="text-xs text-center py-2" style={{ color: theme.colors.textMuted }}>
                Belum ada kategori {type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'}.
                {onAddCategory && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="ml-1 underline font-medium"
                    style={{ color: theme.colors.accent }}
                  >
                    Buat sekarang
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.colors.textMuted }}>Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              style={{
                backgroundColor: theme.colors.bgHover,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.colors.textMuted }}>Catatan</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              style={{
                backgroundColor: theme.colors.bgHover,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary
              }}
              rows={2}
              placeholder="Contoh: Makan siang, Gaji bulanan"
            />
          </div>

          {/* Attachment Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.colors.textMuted }}>
              Lampiran (opsional)
            </label>

            {!attachment && !existingAttachment || (isAttachmentDeleted && !attachment) ? (
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.bgHover
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                />
                <IconDisplay name="Camera" size={24} className="mx-auto mb-2" style={{ color: theme.colors.textMuted }} />
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>Tambah Foto atau PDF</p>
              </div>
            ) : (
              <div
                className="border rounded-lg p-3"
                style={{ backgroundColor: theme.colors.bgHover, borderColor: theme.colors.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Check if it's new attachment preview or existing one */}
                    {(attachmentType === 'image' && attachmentPreview) || (existingAttachment?.type === 'image' && existingAttachment.url && !isAttachmentDeleted) ? (
                      <img
                        src={attachmentPreview || existingAttachment?.url}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.colors.expenseBg }}>
                        <IconDisplay name="FileText" size={24} style={{ color: theme.colors.expense }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: theme.colors.textPrimary }}>
                        {attachment?.name || existingAttachment?.name}
                      </p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                        {attachment ? (attachment.size / 1024).toFixed(1) + ' KB' : 'Terlampir'} • {attachmentType === 'image' || existingAttachment?.type === 'image' ? 'Foto' : 'PDF'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 rounded transition-colors"
                    style={{
                      color: theme.colors.textMuted
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.expenseBg;
                      e.currentTarget.style.color = theme.colors.expense;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.colors.textMuted;
                    }}
                  >
                    <IconDisplay name="X" size={18} />
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>Maksimal 10MB. Format: JPG, PNG, GIF, WEBP, PDF</p>
            {compressionMessage && (
              <div
                className="text-xs mt-2 p-2 rounded-md flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.incomeBg,
                  color: theme.colors.income
                }}
              >
                <IconDisplay name="CheckCircle2" size={14} />
                <span>{compressionMessage}</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi"
        message={
          <div className="space-y-2">
            <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
            <div className="p-3 rounded-lg text-left" style={{ backgroundColor: theme.colors.bgHover }}>
              <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialData?.amount || 0)}
              </p>
              <p className="text-sm opacity-80">{initialData?.description || 'Tidak ada catatan'}</p>
            </div>
            <p className="text-sm opacity-80">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        }
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
        icon="Trash2"
      />

      {/* Category Form Modal */}
      {onAddCategory && (
        <CategoryFormModal
          isOpen={showCategoryModal}
          defaultType={type}
          onClose={() => setShowCategoryModal(false)}
          onSave={(categoryData) => {
            onAddCategory(categoryData);
            setShowCategoryModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TransactionForm;