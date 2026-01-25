/**
 * Transaction Service
 * Handles creating and managing transactions in Firestore
 */

import * as admin from 'firebase-admin';
import { ReceiptData } from './geminiService';

/**
 * Transaction type structure for Firestore
 */
export interface Transaction {
    amount: number;
    category: string;
    description: string;
    merchant?: string;
    date: admin.firestore.Timestamp;
    type: 'expense' | 'income';
    source: 'receipt' | 'manual' | 'telegram';
    photoUrl?: string;
    createdAt: admin.firestore.Timestamp;
    createdBy: 'telegram';
    telegramId?: number;
    receiptConfidence?: 'high' | 'medium' | 'low';
}

/**
 * Create a transaction from receipt data
 * @param userId - Firebase user ID
 * @param receiptData - Data extracted from receipt
 * @param telegramId - Telegram user ID
 * @returns Transaction ID
 */
export async function createTransactionFromReceipt(
    userId: string,
    receiptData: ReceiptData,
    telegramId: number
): Promise<string> {
    const db = admin.firestore();

    // Parse date from receipt or use today
    let transactionDate: admin.firestore.Timestamp;
    try {
        const parsedDate = new Date(receiptData.date);
        transactionDate = admin.firestore.Timestamp.fromDate(parsedDate);
    } catch (error) {
        transactionDate = admin.firestore.Timestamp.now();
    }

    // Map category suggestion to existing category
    const categoryMapping: { [key: string]: string } = {
        'Makanan': 'Food',
        'Belanja Harian': 'Shopping',
        'Transport': 'Transportation',
        'Kesehatan': 'Health',
        'Hiburan': 'Entertainment',
        'Tagihan': 'Bills',
        'Lainnya': 'Other'
    };

    const mappedCategory = categoryMapping[receiptData.categorySuggestion] || 'Other';

    // Create transaction object
    const transaction: Transaction = {
        amount: receiptData.totalAmount,
        category: mappedCategory,
        description: receiptData.merchant || 'Receipt purchase',
        merchant: receiptData.merchant,
        date: transactionDate,
        type: 'expense', // Receipts are always expenses
        source: 'receipt',
        createdAt: admin.firestore.Timestamp.now(),
        createdBy: 'telegram',
        telegramId,
        receiptConfidence: receiptData.confidence
    };

    // Add to user's transactions collection
    const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .add(transaction);

    console.log(`Created transaction ${docRef.id} for user ${userId} from receipt`);

    return docRef.id;
}

/**
 * Create a manual transaction (for Phase 3 - Natural Language)
 * @param userId - Firebase user ID
 * @param amount - Transaction amount
 * @param description - Transaction description
 * @param category - Transaction category
 * @param telegramId - Telegram user ID
 * @returns Transaction ID
 */
export async function createManualTransaction(
    userId: string,
    amount: number,
    description: string,
    category: string,
    telegramId?: number
): Promise<string> {
    const db = admin.firestore();

    const transaction: Transaction = {
        amount,
        category,
        description,
        date: admin.firestore.Timestamp.now(),
        type: amount < 0 ? 'income' : 'expense',
        source: 'manual',
        createdAt: admin.firestore.Timestamp.now(),
        createdBy: 'telegram',
        telegramId
    };

    const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .add(transaction);

    console.log(`Created manual transaction ${docRef.id} for user ${userId}`);

    return docRef.id;
}
