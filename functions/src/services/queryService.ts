/**
 * Query Service
 * Handles querying transaction data from Firestore
 */

import * as admin from 'firebase-admin';
import { TimeRange } from './nluService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getJakartaDate } from '../utils/date';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Category breakdown data
 */
export interface CategoryData {
    category: string;
    amount: number;
    percentage: number;
    count: number;
    icon?: string;
}

/**
 * Get specific date string for N days ago (Jakarta Time)
 */
function getDateForDaysAgo(daysAgo: number): string {
    const date = getJakartaDate();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

/**
 * Calculate date range from time range string (Jakarta Time)
 */
function getDateRange(timeRange: TimeRange): { startStr: string; endStr: string } {
    const now = getJakartaDate();
    let startStr: string;
    let endStr: string;

    // Helper to format Date to YYYY-MM-DD
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    switch (timeRange) {
        case 'today':
            startStr = fmt(now);
            endStr = startStr;
            break;

        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startStr = fmt(yesterday);
            endStr = startStr;
            break;

        case 'this_week':
            // Monday to today
            const startWeek = new Date(now);
            const dayOfWeek = startWeek.getDay(); // 0 is Sunday
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startWeek.setDate(now.getDate() + mondayOffset);
            startStr = fmt(startWeek);
            endStr = fmt(now);
            break;

        case 'last_week':
            // Last 7 days (including today)
            const startLastWeek = new Date(now);
            startLastWeek.setDate(now.getDate() - 6);
            startStr = fmt(startLastWeek);
            endStr = fmt(now);
            break;

        case 'this_month':
            const startMonth = new Date(now);
            startMonth.setDate(1);
            startStr = fmt(startMonth);

            // End of month
            const endMonth = new Date(now);
            endMonth.setMonth(endMonth.getMonth() + 1);
            endMonth.setDate(0);
            endStr = fmt(endMonth);
            break;

        case 'last_month':
            const startPrevMonth = new Date(now);
            startPrevMonth.setMonth(now.getMonth() - 1);
            startPrevMonth.setDate(1);
            startStr = fmt(startPrevMonth);

            const endPrevMonth = new Date(now);
            endPrevMonth.setDate(0); // Last day of previous month relative to now
            // Wait, if now is March, setDate(0) is Feb 28.
            // If now is Feb 1st (Jakarta).
            // now.setDate(0) -> Jan 31. Correct.
            endStr = fmt(endPrevMonth);
            break;

        case 'all_time':
            startStr = '2020-01-01'; // Arbitrary start
            endStr = fmt(now);
            break;

        default:
            startStr = fmt(now);
            endStr = fmt(now);
    }

    return { startStr, endStr };
}

/**
 * Get date range for custom month (YYYY-MM format)
 */
function getCustomMonthRange(customMonth: string): { startStr: string; endStr: string } {
    const [year, month] = customMonth.split('-').map(Number);
    // Construct date string manually
    const lastDay = new Date(year, month, 0).getDate();

    return {
        startStr: `${year}-${String(month).padStart(2, '0')}-01`,
        endStr: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
}

/**
 * Get total expenses for a time range or specific days ago
 */
export async function getTotalExpenses(
    userId: string,
    timeRange?: TimeRange,
    daysAgo?: number,
    customMonth?: string
): Promise<{ total: number; count: number }> {
    const db = admin.firestore();

    // Get date range
    let startStr: string;
    let endStr: string;

    if (customMonth) {
        // Custom month (YYYY-MM)
        const range = getCustomMonthRange(customMonth);
        startStr = range.startStr;
        endStr = range.endStr;
    } else if (daysAgo !== undefined) {
        // Specific day N days ago
        startStr = getDateForDaysAgo(daysAgo);
        endStr = startStr;
    } else {
        // Use time range
        const range = getDateRange(timeRange || 'today');
        startStr = range.startStr;
        endStr = range.endStr;
    }

    // Query by date string (web app uses string format, not Timestamp)
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('date', '>=', startStr)
        .where('date', '<=', endStr)
        .get();

    // Get categories to determine which are expenses
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const expenseCategoryIds = new Set<string>();
    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        if (cat.type === 'EXPENSE') {
            expenseCategoryIds.add(doc.id);
        }
    });

    // Filter and sum only expense transactions
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (expenseCategoryIds.has(data.categoryId)) {
            total += data.amount || 0;
            count++;
        }
    });

    return { total, count };
}

/**
 * Get total income for a time range
 */
export async function getTotalIncome(
    userId: string,
    timeRange: TimeRange = 'this_month'
): Promise<{ total: number; count: number }> {
    const db = admin.firestore();
    const { startStr, endStr } = getDateRange(timeRange);

    // Query by date string (web app uses string format, not Timestamp)
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('date', '>=', startStr)
        .where('date', '<=', endStr)
        .get();

    // Get categories to determine which are income
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const incomeCategoryIds = new Set<string>();
    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        if (cat.type === 'INCOME') {
            incomeCategoryIds.add(doc.id);
        }
    });

    // Filter and sum only income transactions
    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (incomeCategoryIds.has(data.categoryId)) {
            total += data.amount || 0;
            count++;
        }
    });

    return { total, count };
}

/**
 * Get current balance (income - expenses)
 */
export async function getBalance(
    userId: string,
    timeRange?: TimeRange,
    daysAgo?: number,
    customMonth?: string
): Promise<number> {
    const db = admin.firestore();

    // Get categories to determine income vs expense
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categoryTypes = new Map<string, string>();
    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        categoryTypes.set(doc.id, cat.type);
    });

    // Get date range if specified
    let transactionQuery = db
        .collection('users')
        .doc(userId)
        .collection('transactions');

    if (customMonth) {
        const { startStr, endStr } = getCustomMonthRange(customMonth);
        transactionQuery = transactionQuery
            .where('date', '>=', startStr)
            .where('date', '<=', endStr) as any;
    } else if (daysAgo !== undefined) {
        const dateStr = getDateForDaysAgo(daysAgo);
        transactionQuery = transactionQuery.where('date', '==', dateStr) as any;
    } else if (timeRange) {
        const { startStr, endStr } = getDateRange(timeRange);
        transactionQuery = transactionQuery
            .where('date', '>=', startStr)
            .where('date', '<=', endStr) as any;
    }

    const snapshot = await transactionQuery.get();

    let balance = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        const categoryType = categoryTypes.get(data.categoryId);
        if (categoryType === 'INCOME') {
            balance += data.amount || 0;
        } else if (categoryType === 'EXPENSE') {
            balance -= data.amount || 0;
        }
    });

    return balance;
}

/**
 * Get category breakdown for expenses
 */
export async function getCategoryBreakdown(
    userId: string,
    timeRange?: TimeRange,
    daysAgo?: number
): Promise<CategoryData[]> {
    const db = admin.firestore();

    // Get date range
    let startStr: string;
    let endStr: string;

    if (daysAgo !== undefined) {
        // Specific day N days ago
        startStr = getDateForDaysAgo(daysAgo);
        endStr = startStr;
    } else {
        // Use time range
        const range = getDateRange(timeRange || 'this_month');
        startStr = range.startStr;
        endStr = range.endStr;
    }

    // Get categories first
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categories = new Map<string, { name: string; type: string; icon: string }>();
    const expenseCategoryIds = new Set<string>();

    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        categories.set(doc.id, { name: cat.name, type: cat.type, icon: cat.icon || 'Package' });
        if (cat.type === 'EXPENSE') {
            expenseCategoryIds.add(doc.id);
        }
    });

    // Query transactions by date
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('date', '>=', startStr)
        .where('date', '<=', endStr)
        .get();

    // Aggregate by category (only expenses)
    const categoryMap: { [key: string]: { amount: number; count: number; icon: string } } = {};
    let totalAmount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const categoryId = data.categoryId;

        // Only process expense categories
        if (!expenseCategoryIds.has(categoryId)) {
            return;
        }

        const categoryInfo = categories.get(categoryId);
        const categoryName = categoryInfo?.name || 'Other';
        const categoryIcon = categoryInfo?.icon || 'Package';
        const amount = data.amount || 0;

        if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = { amount: 0, count: 0, icon: categoryIcon };
        }

        categoryMap[categoryName].amount += amount;
        categoryMap[categoryName].count += 1;
        totalAmount += amount;
    });

    // Convert to array and calculate percentages
    const breakdown: CategoryData[] = Object.entries(categoryMap).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        icon: data.icon
    }));

    // Sort by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    return breakdown;
}

/**
 * Transaction detail item
 */
export interface TransactionDetail {
    description: string;
    amount: number;
    category: string;
    date: string;
    createdAt: string;
    icon?: string;
}

/**
 * Use Gemini AI to match category filter intelligently
 * For example: "food" should match "FnB" or "Food and Beverage"
 * Returns the matched category name or null if no match found
 */
async function matchCategoryFilter(
    userQuery: string,
    availableCategories: string[]
): Promise<string | null> {
    if (!userQuery || availableCategories.length === 0) {
        return null;
    }

    console.log(`[CategoryMatch] User query: "${userQuery}"`);
    console.log(`[CategoryMatch] Available categories:`, availableCategories);

    // First check for exact match (case-insensitive)
    const exactMatch = availableCategories.find(
        cat => cat.toLowerCase() === userQuery.toLowerCase()
    );
    if (exactMatch) {
        console.log(`[CategoryMatch] Exact match found: "${exactMatch}"`);
        return exactMatch;
    }

    // Check for partial match (e.g., "Other" matches "Others" or "Lainnya")
    const partialMatch = availableCategories.find(cat => {
        const catLower = cat.toLowerCase();
        const queryLower = userQuery.toLowerCase();
        return catLower.includes(queryLower) || queryLower.includes(catLower);
    });
    if (partialMatch) {
        console.log(`[CategoryMatch] Partial match found: "${partialMatch}"`);
        return partialMatch;
    }

    // Use Gemini AI to find semantic match
    try {
        const prompt = `
Kamu adalah AI untuk mencocokkan kategori transaksi.

User mencari kategori: "${userQuery}"

Daftar kategori yang tersedia:
${availableCategories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Tugas kamu:
1. Cari kategori yang paling sesuai dengan pencarian user
2. Pertimbangkan sinonim bahasa Indonesia dan Inggris
   - Contoh: "food" = "FnB" = "Food and Beverage" = "Makanan"
   - Contoh: "fnb" = "Food" = "Food and Beverage"
   - Contoh: "bill" = "tagihan"
   - Contoh: "transport" = "transportasi"
   - Contoh: "others" = "lainnya" = "other"
3. Jika ada yang sedikit mendekati, pilih yang paling cocok
4. HANYA return null jika BENAR-BENAR tidak ada yang berhubungan sama sekali

Return ONLY valid JSON (no markdown, no code blocks):
{
  "matchedCategory": "string atau null",
  "confidence": "high | medium | low"
}

Contoh:
- User: "food", Available: ["FnB", "Transport"] → {"matchedCategory": "FnB", "confidence": "high"}
- User: "fnb", Available: ["Food and Beverage"] → {"matchedCategory": "Food and Beverage", "confidence": "high"}
- User: "bill", Available: ["Tagihan", "Transport"] → {"matchedCategory": "Tagihan", "confidence": "high"}
- User: "others", Available: ["Lainnya", "Transport"] → {"matchedCategory": "Lainnya", "confidence": "high"}
- User: "xyz123", Available: ["Food", "Transport"] → {"matchedCategory": null, "confidence": "low"}
`.trim();

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanText) as {
            matchedCategory: string | null;
            confidence: 'high' | 'medium' | 'low';
        };

        console.log(`[CategoryMatch] AI result:`, parsed);

        // Accept any confidence level if a match is found (including low)
        // Only return null if AI explicitly returns null
        if (parsed.matchedCategory) {
            console.log(`[CategoryMatch] AI matched: "${parsed.matchedCategory}" (confidence: ${parsed.confidence})`);
            return parsed.matchedCategory;
        }

        console.log(`[CategoryMatch] No match found`);
        return null;

    } catch (error) {
        console.error('[CategoryMatch] Error matching category with Gemini:', error);
        // Fallback to null if AI fails
        return null;
    }
}

/**
 * Get transaction details with category names
 */
export async function getTransactionDetails(
    userId: string,
    timeRange?: TimeRange,
    categoryFilter?: string,
    daysAgo?: number,
    limit?: number,
    specificDate?: string,
    sortBy?: 'date' | 'amount' // 'date' = recent first, 'amount' = highest first
): Promise<TransactionDetail[]> {
    const db = admin.firestore();

    // Get date range
    let startStr: string;
    let endStr: string;

    if (specificDate) {
        // Specific date (YYYY-MM-DD)
        startStr = specificDate;
        endStr = specificDate;
    } else if (daysAgo !== undefined) {
        // Specific day N days ago
        startStr = getDateForDaysAgo(daysAgo);
        endStr = startStr;
    } else {
        // Use time range
        const range = getDateRange(timeRange || 'today');
        startStr = range.startStr;
        endStr = range.endStr;
    }

    // Get categories first
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categories = new Map<string, { name: string; type: string; icon: string }>();
    const expenseCategoryIds = new Set<string>();

    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        categories.set(doc.id, { name: cat.name, type: cat.type, icon: cat.icon || 'Package' });
        if (cat.type === 'EXPENSE') {
            expenseCategoryIds.add(doc.id);
        }
    });

    // Use AI to match category filter if provided
    let matchedCategoryName: string | null = null;
    if (categoryFilter) {
        // Get ALL category names for matching (not just expense)
        const allCategoryNames: string[] = [];
        categories.forEach((catInfo) => {
            allCategoryNames.push(catInfo.name);
        });

        // Use AI to find matching category
        matchedCategoryName = await matchCategoryFilter(categoryFilter, allCategoryNames);

        if (!matchedCategoryName) {
            // No matching category found at all - return empty array
            console.log(`[CategoryMatch] No category found matching "${categoryFilter}"`);
            return [];
        }

        // Check if matched category is EXPENSE type
        let isExpenseCategory = false;
        console.log(`[CategoryMatch] Checking if "${matchedCategoryName}" is EXPENSE type...`);
        console.log(`[CategoryMatch] Expense category IDs:`, Array.from(expenseCategoryIds));

        categories.forEach((catInfo, catId) => {
            if (catInfo.name === matchedCategoryName) {
                console.log(`[CategoryMatch] Found category "${catInfo.name}" with id=${catId}, type=${catInfo.type}, isInExpenseSet=${expenseCategoryIds.has(catId)}`);
                if (expenseCategoryIds.has(catId)) {
                    isExpenseCategory = true;
                }
            }
        });

        console.log(`[CategoryMatch] isExpenseCategory result: ${isExpenseCategory}`);

        if (!isExpenseCategory) {
            // Category found but it's INCOME, not EXPENSE
            console.log(`[CategoryMatch] Category "${matchedCategoryName}" found but it's INCOME type, bot only shows EXPENSE details`);
            return [];
        }

        console.log(`[CategoryMatch] Successfully matched EXPENSE category: "${matchedCategoryName}"`);
    }

    // Query transactions by date (no orderBy to avoid index requirement)
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('date', '>=', startStr)
        .where('date', '<=', endStr)
        .get();

    // Build transaction details (only expenses)
    const details: TransactionDetail[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const categoryId = data.categoryId;

        // Only process expense categories
        if (!expenseCategoryIds.has(categoryId)) {
            return;
        }

        const categoryInfo = categories.get(categoryId);
        const categoryName = categoryInfo?.name || 'Other';
        const categoryIcon = categoryInfo?.icon || 'Package';

        // Apply AI-matched category filter if specified
        if (matchedCategoryName && categoryName !== matchedCategoryName) {
            return;
        }

        details.push({
            description: data.description || '-',
            amount: data.amount || 0,
            category: categoryName,
            date: data.date,
            createdAt: data.createdAt || data.date,
            icon: categoryIcon
        });
    });

    // Sort based on sortBy parameter
    if (sortBy === 'amount') {
        // Sort by amount descending (highest first)
        details.sort((a, b) => b.amount - a.amount);
    } else {
        // Default: sort by date desc, then by createdAt desc (most recent first)
        details.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return b.createdAt.localeCompare(a.createdAt);
        });
    }

    if (limit && limit > 0) {
        return details.slice(0, limit);
    }

    return details;
}

/**
 * Format time range for display
 */
export function formatTimeRange(timeRange: TimeRange): string {
    switch (timeRange) {
        case 'today':
            return 'hari ini';
        case 'yesterday':
            return 'kemarin';
        case 'this_week':
            return 'minggu ini';
        case 'last_week':
            return '7 hari terakhir';
        case 'this_month':
            return 'bulan ini';
        case 'last_month':
            return 'bulan lalu';
        case 'all_time':
            return 'semua waktu';
        default:
            return timeRange;
    }
}
