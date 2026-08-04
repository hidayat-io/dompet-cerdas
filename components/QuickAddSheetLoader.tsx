import React, { useState, useEffect, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import QuickAddSheet from './QuickAddSheet';
import type { TransactionType, Category, Transaction } from '../types';
import type { NotificationType } from './NotificationModal';
import { scanReceiptImage } from '../services/geminiService';
import { processFileForUpload } from '../utils/fileCompression';

interface QuickAddSheetLoaderProps {
    quickAddType: TransactionType;
    categories: Category[];
    transactions: Transaction[];
    onClose: () => void;
    onAdd: (amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' }) => Promise<void>;
    onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
    onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
    userId?: string | null;
    activeAccountId?: string | null;
    // Edit mode (optional) — when initialData is provided, the sheet edits instead of adding
    initialData?: Transaction | null;
    prefill?: {
        amount: number;
        categoryId: string;
        date: string;
        description: string;
    };
    latestData?: Transaction | null;
    currentUserId?: string | null;
    activeAccountRole?: 'OWNER' | 'MEMBER';
    onUpdate?: (id: string, amount: number, categoryId: string, date: string, description: string, attachment?: { file: File; type: 'image' | 'pdf' } | null) => Promise<void>;
    onDelete?: (id: string) => void;
}

const QuickAddSheetLoader: React.FC<QuickAddSheetLoaderProps> = ({
    quickAddType,
    categories,
    transactions,
    onClose,
    onAdd,
    onAddCategory,
    onShowNotification,
    userId,
    activeAccountId,
    initialData = null,
    prefill,
    latestData = null,
    currentUserId = null,
    activeAccountRole,
    onUpdate,
    onDelete,
}) => {
    const isEditMode = !!initialData;
    const canEditTransaction = !initialData || !currentUserId || !initialData.createdByUserId || initialData.createdByUserId === currentUserId || activeAccountRole === 'OWNER';
    const isReadOnly = isEditMode && !canEditTransaction;
    const initialAmount = initialData?.amount ?? prefill?.amount;
    const initialCategoryId = initialData?.categoryId ?? prefill?.categoryId;
    const initialDescription = initialData?.description ?? prefill?.description;
    const initialDate = initialData?.date ?? prefill?.date;
    const [type, setType] = useState<TransactionType>(initialCategoryId
        ? (categories.find(c => c.id === initialCategoryId)?.type || 'EXPENSE')
        : quickAddType);
    const [amount, setAmount] = useState(initialAmount === undefined ? '' : String(initialAmount));
    const [description, setDescription] = useState(initialDescription || '');
    const [categoryId, setCategoryId] = useState(initialCategoryId || '');
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [attachment, setAttachment] = useState<{ file: File; type: 'image' | 'pdf' } | null>(null);
    const [existingAttachment, setExistingAttachment] = useState(
        initialData?.attachment || (initialData?.attachmentUrl
            ? { url: initialData.attachmentUrl, name: initialData.attachmentName || 'Lampiran', type: (initialData.attachmentType || 'image') as 'image' | 'pdf' }
            : null)
    );
    const [isAttachmentDeleted, setIsAttachmentDeleted] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanError, setScanError] = useState('');
    const scanRequestedRef = useRef(false);

    useEffect(() => {
        if (initialData || prefill) return; // edit/prefill mode — keep the provided type/category
        setType(quickAddType);
        const belanja = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'belanja');
        if (quickAddType === 'EXPENSE' && belanja) {
            setCategoryId(belanja.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quickAddType, categories]);

    const recentCategoryIds = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

        const recentTx = transactions.filter(tx => tx.date >= cutoff);
        const categoryCount: Record<string, number> = {};

        recentTx.forEach(tx => {
            categoryCount[tx.categoryId] = (categoryCount[tx.categoryId] || 0) + 1;
        });

        return Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id)
            .slice(0, 5);
    }, [transactions]);

    const validateScanDate = (dateStr: string): string => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

    const handleScanButtonClick = () => {
        if (!navigator.onLine) {
            setScanError('Fitur scan struk membutuhkan koneksi internet.');
            return;
        }
        scanRequestedRef.current = true;
    };

    const handleScanCancelled = () => {
        scanRequestedRef.current = false;
    };

    const handleAttachmentChange = async (attachment: { file: File; type: 'image' | 'pdf' } | null) => {
        // Clear scan UI when attachment is removed
        if (!attachment) {
            setScanMessage('');
            setScanError('');
            setIsScanning(false);
            setAttachment(null);
            if (isEditMode && existingAttachment) setIsAttachmentDeleted(true);
            return;
        }
        const wasScanRequested = scanRequestedRef.current;
        scanRequestedRef.current = false;
        setScanError('');
        setScanMessage('');
        setIsScanning(false);
        if (wasScanRequested && !['image/jpeg', 'image/png', 'image/webp'].includes(attachment.file.type)) {
            setScanError('Scan struk hanya mendukung foto JPG, PNG, atau WEBP. Lampiran tetap tersimpan.');
            return;
        }
        try {
            const result = await processFileForUpload(attachment.file);
            const processed = { file: result.file, type: result.type };
            setAttachment(processed);
            setIsAttachmentDeleted(false);
            if (wasScanRequested) {
                runReceiptScan(processed);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memproses file.');
        }
    };

    const runReceiptScan = async (attachment: { file: File; type: 'image' | 'pdf' }) => {
        if (!navigator.onLine) {
            setScanError('Fitur scan struk membutuhkan koneksi internet. Lampiran tetap tersimpan.');
            return;
        }
        setIsScanning(true);
        setScanMessage('Menganalisis struk...');
        try {
            const scanResult = await scanReceiptImage(attachment.file);
            if (scanResult.is_receipt === false) {
                setScanError('Foto ini sepertinya bukan struk belanja. Mohon upload foto struk yang valid.');
                return;
            }
            if (!scanResult.totalAmount || scanResult.totalAmount <= 0) {
                setScanError('Nominal total tidak terbaca. Pastikan angka "Total" terlihat jelas di foto.');
                return;
            }
            setAmount(String(Math.abs(Math.round(scanResult.totalAmount))));
            if (scanResult.date) setDate(validateScanDate(scanResult.date));
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
        } catch (scanErr) {
            const msg = scanErr instanceof Error ? scanErr.message : 'Gagal menganalisis struk. Silakan coba lagi.';
            setScanError(msg);
        } finally {
            setIsScanning(false);
        }
    };

    const getTransactionSnapshot = (transaction?: Transaction | null) => {
        if (!transaction) return '';
        const attachmentInfo = transaction.attachment
            ? JSON.stringify({ name: transaction.attachment.name, type: transaction.attachment.type, path: transaction.attachment.path, url: transaction.attachment.url })
            : (transaction.attachmentUrl ? JSON.stringify({ name: transaction.attachmentName, type: transaction.attachmentType, url: transaction.attachmentUrl }) : 'none');
        return JSON.stringify({
            amount: transaction.amount,
            categoryId: transaction.categoryId,
            date: transaction.date,
            description: transaction.description,
            attachment: attachmentInfo,
        });
    };

    const [conflictBaseline, setConflictBaseline] = useState<Transaction | null>(initialData || null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);

    const hasRemoteConflict = !!(isEditMode && latestData && latestData.id === initialData?.id
        && getTransactionSnapshot(conflictBaseline) !== getTransactionSnapshot(latestData));

    const handleSave = async (forceSave = false) => {
        if (isReadOnly) return;
        if (!amount || parseInt(amount) <= 0) {
            setError('Masukkan nominal transaksi');
            return;
        }
        if (!categoryId) {
            setError('Pilih kategori');
            return;
        }
        if (!description.trim()) {
            setError('Catatan / Keterangan transaksi wajib diisi');
            return;
        }
        if (!date) {
            setError('Tanggal transaksi harus diisi');
            return;
        }
        if (!forceSave && hasRemoteConflict) {
            setShowConflictDialog(true);
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const today = new Date().toISOString().split('T')[0];
            const finalDesc = description.trim();
            const finalDate = date || today;
            if (isEditMode && onUpdate && initialData) {
                let attachmentPayload: { file: File; type: 'image' | 'pdf' } | null | undefined = undefined;
                if (attachment) attachmentPayload = attachment;
                else if (isAttachmentDeleted) attachmentPayload = null;
                await onUpdate(initialData.id, parseInt(amount), categoryId, finalDate, finalDesc, attachmentPayload);
            } else {
                await onAdd(parseInt(amount), categoryId, finalDate, finalDesc, attachment || undefined);
            }
            onShowNotification?.('success', 'Tersimpan!', isEditMode
                ? 'Transaksi berhasil diupdate.'
                : `Rp ${parseInt(amount).toLocaleString('id-ID')} berhasil dicatat.`, true);
            onClose();
        } catch (err) {
            setError('Gagal menyimpan transaksi');
            onShowNotification?.('error', 'Gagal', 'Gagal menyimpan transaksi. Coba lagi.', true);
        } finally {
            setIsSaving(false);
        }
    };

    const applyLatestVersion = () => {
        if (!latestData) {
            setShowConflictDialog(false);
            return;
        }
        setAmount(String(latestData.amount));
        setCategoryId(latestData.categoryId);
        setDate(latestData.date);
        setDescription(latestData.description);
        setAttachment(null);
        setExistingAttachment(latestData.attachment || (latestData.attachmentUrl
            ? { url: latestData.attachmentUrl, name: latestData.attachmentName || 'Lampiran', type: (latestData.attachmentType || 'image') as 'image' | 'pdf' }
            : null));
        setIsAttachmentDeleted(false);
        setConflictBaseline(latestData);
        setShowConflictDialog(false);
    };

    const keepMyVersion = async () => {
        if (latestData) setConflictBaseline(latestData);
        setShowConflictDialog(false);
        await handleSave(true);
    };

    const handleConfirmDelete = () => {
        if (initialData && onDelete) {
            onDelete(initialData.id);
            setShowDeleteConfirm(false);
            onClose();
        }
    };

    return (
        <QuickAddSheet
            open
            type={type}
            amount={amount}
            description={description}
            categoryId={categoryId}
            categories={categories}
            recentCategoryIds={recentCategoryIds}
            onTypeChange={setType}
            onAmountChange={setAmount}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategoryId}
            date={date}
            attachment={attachment}
            onDateChange={setDate}
            onAttachmentChange={handleAttachmentChange}
            onScanButtonClick={handleScanButtonClick}
            onScanCancelled={handleScanCancelled}
            isScanning={isScanning}
            scanMessage={scanMessage}
            scanError={scanError}
            onClearScanMessage={() => setScanMessage('')}
            onClearScanError={() => setScanError('')}
            onSave={handleSave}
            onClose={onClose}
            isSaving={isSaving}
            error={error}
            // Edit mode
            isEditMode={isEditMode}
            isReadOnly={isReadOnly}
            initialData={initialData || undefined}
            existingAttachment={existingAttachment}
            isAttachmentDeleted={isAttachmentDeleted}
            hasRemoteConflict={hasRemoteConflict}
            showConflictDialog={showConflictDialog}
            onApplyLatestVersion={applyLatestVersion}
            onKeepMyVersion={() => void keepMyVersion()}
            onOpenConflictDialog={() => setShowConflictDialog(true)}
            onCloseConflictDialog={() => setShowConflictDialog(false)}
            onRequestDelete={() => setShowDeleteConfirm(true)}
            showDeleteConfirm={showDeleteConfirm}
            onCloseDeleteConfirm={() => setShowDeleteConfirm(false)}
            onConfirmDelete={handleConfirmDelete}
            onAddCategory={onAddCategory}
            showCategoryModal={showCategoryModal}
            onOpenCategoryModal={() => setShowCategoryModal(true)}
            onCloseCategoryModal={() => setShowCategoryModal(false)}
            onCategorySaved={(newId) => setCategoryId(newId)}
            latestData={latestData || undefined}
        />
    );
};

export default QuickAddSheetLoader;
