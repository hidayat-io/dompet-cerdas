/**
 * Transaction Service
 * Handles creating and managing transactions in Firestore
 */

import * as admin from 'firebase-admin';
import { ReceiptData } from './geminiService';
import { classifyCategory } from './nluService';

const CATEGORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const categoryCache = new Map<string, { expiresAt: number; categories: UserCategory[] }>();

export interface UserCategory {
    id: string;
    name: string;
    type?: string;
}

export async function getUserCategories(userId: string, forceRefresh = false): Promise<UserCategory[]> {
    const cached = categoryCache.get(userId);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        return cached.categories;
    }

    const db = admin.firestore();
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categories = snapshot.docs.map((doc) => {
        const data = doc.data() as { name?: string; type?: string };
        return {
            id: doc.id,
            name: data.name || 'Lainnya',
            type: data.type
        };
    });

    categoryCache.set(userId, {
        expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
        categories
    });

    return categories;
}

function getFallbackCategory(categories: UserCategory[]): UserCategory {
    const fallbackNames = new Set(['lainnya', 'other', 'others']);
    const otherCategory = categories.find((category) => fallbackNames.has(category.name.toLowerCase()));
    return otherCategory || categories[0];
}

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

    // Use today's date instead of receipt date
    const transactionDate = new Date();

    console.log('[TRANSACTION] Using today\'s date:', transactionDate.toISOString());

    const categories = await getUserCategories(userId);
    if (categories.length === 0) {
        console.error('[TRANSACTION] ERROR: No categories found for user');
        throw new Error('No categories found for user');
    }

    let categoryId: string;
    let categoryName: string;
    const suggestion = (receiptData.categorySuggestion || '').trim();
    const directMatch = suggestion
        ? categories.find((category) => category.name.toLowerCase() === suggestion.toLowerCase())
        : undefined;

    if (directMatch) {
        categoryId = directMatch.id;
        categoryName = directMatch.name;
    } else {
        try {
            const description = [receiptData.merchant, ...(receiptData.items || [])]
                .filter(Boolean)
                .join(' ')
                .trim();
            const classification = await classifyCategory(description || 'Receipt purchase', categories);
            const matched = categories.find((category) => category.id === classification.categoryId);
            if (!matched) {
                throw new Error('Classification returned unknown categoryId');
            }
            categoryId = matched.id;
            categoryName = matched.name;
        } catch (classificationError) {
            console.error('Receipt category classification failed:', classificationError);
            const fallbackCategory = getFallbackCategory(categories);
            categoryId = fallbackCategory.id;
            categoryName = fallbackCategory.name;
        }
    }

    console.log('[TRANSACTION] Using categoryId:', categoryId, 'name:', categoryName);

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
    console.log('[TRANSACTION] About to write to Firestore path:', `users/${userId}/transactions`);

    // Add to user's transactions collection
    try {
        const docRef = await db
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .add(transaction);

        console.log('[TRANSACTION] Firestore write completed successfully');
        console.log('[TRANSACTION] Document path:', docRef.path);
        console.log('[TRANSACTION] SUCCESS! Created transaction:', docRef.id);

        // Verify the write by reading it back
        const verifyDoc = await docRef.get();
        if (verifyDoc.exists) {
            console.log('[TRANSACTION] VERIFIED: Document exists in Firestore');
        } else {
            console.error('[TRANSACTION] ERROR: Document not found after write!');
        }

        return docRef.id;
    } catch (writeError) {
        console.error('[TRANSACTION] Firestore write FAILED:', writeError);
        throw writeError;
    }
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
    telegramId?: number,
    categoryIdOverride?: string
): Promise<string> {
    const db = admin.firestore();

    let categoryId: string;
    if (categoryIdOverride) {
        categoryId = categoryIdOverride;
    } else {
        const categories = await getUserCategories(userId);
        if (categories.length === 0) {
            throw new Error('No categories found for user');
        }

        const normalizedCategoryName = categoryName.toLowerCase();
        const directMatch = categories.find(
            (category) => category.name.toLowerCase() === normalizedCategoryName
        );

        categoryId = (directMatch || getFallbackCategory(categories)).id;
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
