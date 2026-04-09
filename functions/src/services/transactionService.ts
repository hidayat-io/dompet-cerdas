/**
 * Transaction Service
 * Handles creating and managing transactions in Firestore
 */

import * as admin from 'firebase-admin';
import { ReceiptData } from './geminiService';
import { classifyCategory } from './nluService';
import { getJakartaDateString } from '../utils/date';
import { getAccountContext, getCategoriesCollection, getTransactionsCollection } from './accountService';

const CATEGORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const categoryCache = new Map<string, { expiresAt: number; categories: UserCategory[] }>();
const creatorNameCache = new Map<string, string>();
const DEFAULT_CATEGORY_DOCS = [
    { id: 'c1', name: 'Gaji', type: 'INCOME', icon: 'Wallet', color: '#10b981' },
    { id: 'c2', name: 'Bonus', type: 'INCOME', icon: 'Gift', color: '#34d399' },
    { id: 'c3', name: 'Makanan', type: 'EXPENSE', icon: 'Utensils', color: '#f87171' },
    { id: 'c4', name: 'Transport', type: 'EXPENSE', icon: 'Car', color: '#60a5fa' },
    { id: 'c5', name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f472b6' },
    { id: 'c6', name: 'Tagihan', type: 'EXPENSE', icon: 'Zap', color: '#fbbf24' },
] as const;

function extractCategoryFromCaption(caption: string): { cleanedDescription: string; categoryHint?: string } {
    const keywordRegex = /\b(cat|categ|category|kategori|kat|ktg|ktgr|kate)\b\s*[:\-]?\s*([a-zA-ZÀ-ÿ0-9]+(?:\s+[a-zA-ZÀ-ÿ0-9]+){0,2})/i;
    const match = caption.match(keywordRegex);
    if (!match) {
        return { cleanedDescription: caption.trim() };
    }

    const categoryHint = match[2]?.trim();
    const cleanedDescription = caption
        .replace(match[0], ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return { cleanedDescription, categoryHint };
}

export interface UserCategory {
    id: string;
    name: string;
    type?: string;
}

export type CategoryTypePreference = 'INCOME' | 'EXPENSE';
export interface ManualTransactionInput {
    amount: number;
    description: string;
    categoryName: string;
    categoryIdOverride?: string;
}

async function resolveCreatorName(userId: string): Promise<string> {
    const cached = creatorNameCache.get(userId);
    if (cached) {
        return cached;
    }

    try {
        const userRecord = await admin.auth().getUser(userId);
        const name = userRecord.displayName || userRecord.email || 'Member';
        creatorNameCache.set(userId, name);
        return name;
    } catch (error) {
        console.warn('[TRANSACTION] Failed to resolve creator name, falling back to default:', error);
        return 'Member';
    }
}

async function seedDefaultCategories(context: Awaited<ReturnType<typeof getAccountContext>>): Promise<UserCategory[]> {
    const categoriesCollection = getCategoriesCollection(context);
    const batch = admin.firestore().batch();

    DEFAULT_CATEGORY_DOCS.forEach((category) => {
        batch.set(categoriesCollection.doc(category.id), category, { merge: true });
    });

    await batch.commit();

    return DEFAULT_CATEGORY_DOCS.map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
    }));
}

export async function getUserCategories(userId: string, forceRefresh = false, accountId?: string): Promise<UserCategory[]> {
    const context = await getAccountContext(userId, accountId);
    const cacheKey = `${userId}:${context.usesLegacyPaths ? 'legacy' : context.accountId}`;
    const cached = categoryCache.get(cacheKey);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
        return cached.categories;
    }

    const snapshot = await getCategoriesCollection(context).get();

    let categories: UserCategory[] = snapshot.docs.map((doc) => {
        const data = doc.data() as { name?: string; type?: string };
        return {
            id: doc.id,
            name: data.name || 'Lainnya',
            type: data.type
        };
    });

    if (categories.length === 0) {
        categories = await seedDefaultCategories(context);
    }

    categoryCache.set(cacheKey, {
        expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
        categories
    });

    return categories;
}

export function getFallbackCategory(
    categories: UserCategory[],
    preferredType: CategoryTypePreference = 'EXPENSE'
): UserCategory {
    const fallbackNames = new Set(['lainnya', 'other', 'others']);
    const otherCategory = categories.find((category) => fallbackNames.has(category.name.toLowerCase()));
    if (otherCategory) {
        return otherCategory;
    }

    const preferredCategory = categories.find((category) => category.type === preferredType);
    if (preferredCategory) {
        return preferredCategory;
    }

    return categories[0];
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
    createdByUserId?: string;
    createdByName?: string;
    telegramId?: number;
    receiptConfidence?: 'high' | 'medium' | 'low';
}

import { AttachmentData } from './storageService';

async function resolveManualTransactionCategoryId(
    userId: string,
    categoryName: string,
    categoryIdOverride: string | undefined,
    categories: UserCategory[]
): Promise<string> {
    if (categoryIdOverride) {
        return categoryIdOverride;
    }

    if (categories.length === 0) {
        throw new Error('No categories found for user');
    }

    const normalizedCategoryName = categoryName.toLowerCase();
    const directMatch = categories.find(
        (category) => category.name.toLowerCase() === normalizedCategoryName
    );

    return (directMatch || getFallbackCategory(categories)).id;
}

function buildManualTransactionPayload(
    amount: number,
    categoryId: string,
    description: string,
    creator?: { userId: string; name: string }
) {
    const payload: Record<string, unknown> = {
        amount,
        categoryId,
        description,
        date: getJakartaDateString(),
        createdAt: new Date().toISOString(),
        source: 'telegram'
    };
    if (creator) {
        payload.createdByUserId = creator.userId;
        payload.createdByName = creator.name;
    }
    return payload;
}

/**
 * Create a transaction from receipt data
 * @param userId - Firebase user ID
 * @param receiptData - Data extracted from receipt
 * @param telegramId - Telegram user ID
 * @param attachment - Optional attachment data
 * @param photoCaption - Optional description from photo caption
 * @returns Transaction ID
 */
export async function createTransactionFromReceipt(
    userId: string,
    receiptData: ReceiptData,
    telegramId: number,
    attachment?: AttachmentData,
    photoCaption?: string,
    accountId?: string
): Promise<string> {
    console.log('[TRANSACTION] Starting createTransactionFromReceipt for user:', userId);
    console.log('[TRANSACTION] ReceiptData:', JSON.stringify(receiptData));
    if (attachment) {
        console.log('[TRANSACTION] Attachment:', JSON.stringify(attachment));
    }
    if (photoCaption) {
        console.log('[TRANSACTION] Photo caption:', photoCaption);
    }

    const context = await getAccountContext(userId, accountId);
    const transactionsCollection = getTransactionsCollection(context);
    const creatorName = await resolveCreatorName(userId);

    // Use today's date instead of receipt date
    const transactionDate = new Date();

    console.log('[TRANSACTION] Using today\'s date:', transactionDate.toISOString());

    const categories = await getUserCategories(userId, false, context.accountId);
    if (categories.length === 0) {
        console.error('[TRANSACTION] ERROR: No categories found for user');
        throw new Error('No categories found for user');
    }

    const captionParse = photoCaption ? extractCategoryFromCaption(photoCaption) : undefined;
    const captionCategoryHint = captionParse?.categoryHint?.trim();
    const captionDescription = captionParse?.cleanedDescription?.trim();

    let categoryId: string;
    let categoryName: string;
    const suggestion = (receiptData.categorySuggestion || '').trim();
    const captionDirectMatch = captionCategoryHint
        ? categories.find((category) => category.name.toLowerCase() === captionCategoryHint.toLowerCase())
        : undefined;
    const suggestionDirectMatch = suggestion
        ? categories.find((category) => category.name.toLowerCase() === suggestion.toLowerCase())
        : undefined;

    const captionFuzzyMatch = captionCategoryHint
        ? categories.find((category) => {
            const name = category.name.toLowerCase();
            const hint = captionCategoryHint.toLowerCase();
            return name.includes(hint) || hint.includes(name);
        })
        : undefined;

    if (captionDirectMatch) {
        categoryId = captionDirectMatch.id;
        categoryName = captionDirectMatch.name;
    } else if (captionFuzzyMatch) {
        categoryId = captionFuzzyMatch.id;
        categoryName = captionFuzzyMatch.name;
    } else if (suggestionDirectMatch) {
        categoryId = suggestionDirectMatch.id;
        categoryName = suggestionDirectMatch.name;
    } else {
        try {
            const description = [captionDescription, receiptData.merchant, ...(receiptData.items || [])]
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

    // Format date as YYYY-MM-DD (Jakarta Time)
    const dateString = getJakartaDateString(transactionDate);

    // Use photo caption as description if provided, otherwise use merchant name
    const description = captionDescription && captionDescription.trim()
        ? captionDescription.trim()
        : (receiptData.merchant || 'Receipt purchase');

    // Create transaction object matching web app schema
    const transaction: Record<string, unknown> = {
        amount: receiptData.totalAmount,
        categoryId,
        description,
        date: dateString,
        createdAt: new Date().toISOString(),
        createdByUserId: userId,
        createdByName: creatorName,
        source: 'telegram',
    };

    // Add attachment if provided
    if (attachment) {
        transaction.attachment = attachment;
    }

    console.log('[TRANSACTION] Transaction object:', JSON.stringify(transaction));
    console.log('[TRANSACTION] About to write to Firestore path:', transactionsCollection.path);

    // Add to user's transactions collection
    try {
        const docRef = await transactionsCollection.add(transaction);

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
    categoryIdOverride?: string,
    accountId?: string
): Promise<string> {
    const context = await getAccountContext(userId, accountId);
    const transactionsCollection = getTransactionsCollection(context);

    const categories = categoryIdOverride
        ? []
        : await getUserCategories(userId, false, context.accountId);
    const categoryId = await resolveManualTransactionCategoryId(
        userId,
        categoryName,
        categoryIdOverride,
        categories
    );
    const creatorName = await resolveCreatorName(userId);
    const transaction = buildManualTransactionPayload(amount, categoryId, description, {
        userId,
        name: creatorName,
    });

    const docRef = await transactionsCollection.add(transaction);

    console.log(`Created manual transaction ${docRef.id} for user ${userId}`);

    return docRef.id;
}

export async function createManualTransactionsBatch(
    userId: string,
    items: ManualTransactionInput[],
    accountId?: string
): Promise<string[]> {
    if (items.length === 0) {
        throw new Error('No transaction items provided');
    }

    const context = await getAccountContext(userId, accountId);
    const transactionsCollection = getTransactionsCollection(context);
    const categories = items.some((item) => !item.categoryIdOverride)
        ? await getUserCategories(userId, false, context.accountId)
        : [];
    const creatorName = await resolveCreatorName(userId);
    const creator = { userId, name: creatorName };

    const batch = admin.firestore().batch();
    const docIds: string[] = [];

    for (const item of items) {
        const categoryId = await resolveManualTransactionCategoryId(
            userId,
            item.categoryName,
            item.categoryIdOverride,
            categories
        );
        const docRef = transactionsCollection.doc();
        batch.set(docRef, buildManualTransactionPayload(item.amount, categoryId, item.description, creator));
        docIds.push(docRef.id);
    }

    await batch.commit();
    console.log(`Created ${docIds.length} manual transactions for user ${userId}`);

    return docIds;
}
