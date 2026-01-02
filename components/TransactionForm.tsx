import React, { useState, useEffect, useRef } from 'react';
import { Category, TransactionType, Transaction } from '../types';
import IconDisplay from './IconDisplay';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from './ConfirmDialog';

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
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, initialData, onAdd, onUpdate, onDelete, onClose }) => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfType = 'application/pdf';

    if (!validImageTypes.includes(file.type) && file.type !== validPdfType) {
      setError('⚠️ Hanya file foto (JPG, PNG, GIF, WEBP) atau PDF yang diizinkan.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('⚠️ Ukuran file maksimal 5MB.');
      return;
    }

    // Set attachment
    setAttachment(file);
    setIsAttachmentDeleted(false); // Reset delete flag because we added new one

    if (validImageTypes.includes(file.type)) {
      setAttachmentType('image');
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentType('pdf');
      setAttachmentPreview(null);
    }

    setError('');
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    setAttachmentType(null);

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
        <div className="p-4 flex justify-between items-center flex-shrink-0" style={{ backgroundColor: theme.colors.accent }}>
          <h3 className="text-white font-semibold text-lg">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
          <button onClick={onClose} className="text-white hover:text-indigo-200 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

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
            <label className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.colors.textMuted }}>Kategori</label>
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
              <p className="text-xs text-center py-2" style={{ color: theme.colors.textMuted }}>Belum ada kategori {type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'}.</p>
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
            <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>Maksimal 5MB. Format: JPG, PNG, GIF, WEBP, PDF</p>
          </div>

          <div className="flex gap-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 px-4 font-bold rounded-lg shadow-sm transition-colors focus:outline-none"
                style={{
                  backgroundColor: theme.colors.expenseBg,
                  color: theme.colors.expense
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                title="Hapus Transaksi"
              >
                <IconDisplay name="Trash2" size={20} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none"
              style={{ backgroundColor: theme.colors.accent }}
            >
              {initialData ? 'Update Transaksi' : 'Simpan Transaksi'}
            </button>
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
    </div>
  );
};

export default TransactionForm;