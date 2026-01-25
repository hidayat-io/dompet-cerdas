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

import { AttachmentData } from './storageService';

/**
 * Create a transaction from receipt data
 * @param userId - Firebase user ID
 * @param receiptData - Data extracted from receipt
 * @param telegramId - Telegram user ID
 * @param attachment - Optional attachment data
 * @returns Transaction ID
 */
export async function createTransactionFromReceipt(
    userId: string,
    receiptData: ReceiptData,
    telegramId: number,
    attachment?: AttachmentData
): Promise<string> {
    console.log('[TRANSACTION] Starting createTransactionFromReceipt for user:', userId);
    console.log('[TRANSACTION] ReceiptData:', JSON.stringify(receiptData));
    if (attachment) {
        console.log('[TRANSACTION] Attachment:', JSON.stringify(attachment));
    }

    const db = admin.firestore();

    // Parse date from receipt or use today
    let transactionDate: Date;
    try {
        transactionDate = new Date(receiptData.date);
    } catch (error) {
        transactionDate = new Date();
    }

    // Map category suggestion to category name
    const categoryMapping: { [key: string]: string } = {
        'Makanan': 'Food',
        'Belanja Harian': 'Shopping',
        'Transport': 'Transportation',
        'Kesehatan': 'Health',
        'Hiburan': 'Entertainment',
        'Tagihan': 'Bills',
        'Lainnya': 'Other'
    };

    const mappedCategoryName = categoryMapping[receiptData.categorySuggestion] || 'Other';
    console.log('[TRANSACTION] Mapped category:', mappedCategoryName);

    // Get categoryId from categories collection
    console.log('[TRANSACTION] Looking up categoryId for:', mappedCategoryName);
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .where('name', '==', mappedCategoryName)
        .where('type', '==', 'EXPENSE')
        .limit(1)
        .get();

    console.log('[TRANSACTION] Categories found:', categoriesSnapshot.size);

    let categoryId: string;
    if (categoriesSnapshot.empty) {
        console.log('[TRANSACTION] No exact match, trying fallback...');
        // Fallback: get any expense category
        const fallbackSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('categories')
            .where('type', '==', 'EXPENSE')
            .limit(1)
            .get();

        console.log('[TRANSACTION] Fallback categories found:', fallbackSnapshot.size);

        if (fallbackSnapshot.empty) {
            console.error('[TRANSACTION] ERROR: No expense categories found for user');
            throw new Error('No expense categories found for user');
        }
        categoryId = fallbackSnapshot.docs[0].id;
    } else {
        categoryId = categoriesSnapshot.docs[0].id;
    }

    console.log('[TRANSACTION] Using categoryId:', categoryId);

    // Format date as YYYY-MM-DD
    const dateString = transactionDate.toISOString().split('T')[0];

    // Create transaction object matching web app schema
    const transaction: Record<string, unknown> = {
        amount: receiptData.totalAmount,
        categoryId,
        description: receiptData.merchant || 'Receipt purchase',
        date: dateString,
        createdAt: new Date().toISOString()
    };

    // Add attachment if provided
    if (attachment) {
        transaction.attachment = attachment;
    }

    console.log('[TRANSACTION] Transaction object:', JSON.stringify(transaction));

    // Add to user's transactions collection
    const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .add(transaction);

    console.log('[TRANSACTION] SUCCESS! Created transaction:', docRef.id);

    return docRef.id;
}

/**
 * Create a manual transaction (for Phase 3 - Natural Language)
 * @param userId - Firebase user ID
 * @param amount - Transaction amount
 * @param description - Transaction description
 * @param categoryName - Transaction category name (will be mapped to ID)
 * @param telegramId - Telegram user ID
 * @returns Transaction ID
 */
export async function createManualTransaction(
    userId: string,
    amount: number,
    description: string,
    categoryName: string,
    telegramId?: number
): Promise<string> {
    const db = admin.firestore();

    // Get categoryId from categories collection
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .where('name', '==', categoryName)
        .limit(1)
        .get();

    let categoryId: string;
    if (categoriesSnapshot.empty) {
        // Fallback: get first category of type EXPENSE
        const fallbackSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('categories')
            .where('type', '==', 'EXPENSE')
            .limit(1)
            .get();

        if (fallbackSnapshot.empty) {
            throw new Error('No categories found for user');
        }
        categoryId = fallbackSnapshot.docs[0].id;
    } else {
        categoryId = categoriesSnapshot.docs[0].id;
    }

    // Format date as YYYY-MM-DD
    const dateString = new Date().toISOString().split('T')[0];

    const transaction = {
        amount,
        categoryId,
        description,
        date: dateString,
        createdAt: new Date().toISOString()
    };

    const docRef = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .add(transaction);

    console.log(`Created manual transaction ${docRef.id} for user ${userId}`);

    return docRef.id;
}
