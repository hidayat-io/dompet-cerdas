import React, { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import QuickAddSheet from './QuickAddSheet';
import type { TransactionType, Category, Transaction } from '../types';
import type { NotificationType } from './NotificationModal';

interface QuickAddSheetLoaderProps {
    quickAddType: TransactionType;
    categories: Category[];
    transactions: Transaction[];
    onClose: () => void;
    onOpenFullForm: () => void;
    onAdd: (amount: number, categoryId: string, date: string, description: string) => Promise<void>;
    onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
    onShowNotification?: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
    userId?: string | null;
    activeAccountId?: string | null;
}

const QuickAddSheetLoader: React.FC<QuickAddSheetLoaderProps> = ({
    quickAddType,
    categories,
    transactions,
    onClose,
    onOpenFullForm,
    onAdd,
    onAddCategory,
    onShowNotification,
    userId,
    activeAccountId,
}) => {
    const [type, setType] = useState<TransactionType>(quickAddType);
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setType(quickAddType);
        const belanja = categories.find(c => c.type === 'EXPENSE' && c.name.toLowerCase() === 'belanja');
        if (quickAddType === 'EXPENSE' && belanja) {
            setCategoryId(belanja.id);
        }
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

    const handleSave = async () => {
        if (!amount || parseInt(amount) <= 0) {
            setError('Masukkan nominal transaksi');
            return;
        }
        if (!categoryId) {
            setError('Pilih kategori');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const today = new Date().toISOString().split('T')[0];
            const category = categories.find(c => c.id === categoryId);
            const description = category ? `${category.name}` : 'Transaksi';
            await onAdd(parseInt(amount), categoryId, today, description);
            onShowNotification?.('success', 'Tersimpan!', `Rp ${parseInt(amount).toLocaleString('id-ID')} berhasil dicatat.`, true);
            onClose();
        } catch (err) {
            setError('Gagal menyimpan transaksi');
            onShowNotification?.('error', 'Gagal', 'Gagal menyimpan transaksi. Coba lagi.', true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <QuickAddSheet
            open
            type={type}
            amount={amount}
            categoryId={categoryId}
            categories={categories}
            recentCategoryIds={recentCategoryIds}
            onTypeChange={setType}
            onAmountChange={setAmount}
            onCategoryChange={setCategoryId}
            onSave={handleSave}
            onAddDetail={onOpenFullForm}
            isSaving={isSaving}
            error={error}
        />
    );
};

export default QuickAddSheetLoader;
