/**
 * Query Service
 * Handles querying transaction data from Firestore
 */

import * as admin from 'firebase-admin';
import { TimeRange } from './nluService';

/**
 * Category breakdown data
 */
export interface CategoryData {
    category: string;
    amount: number;
    percentage: number;
    count: number;
}

/**
 * Get specific date string for N days ago
 */
function getDateForDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

/**
 * Calculate date range from time range string
 */
function getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (timeRange) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;

        case 'yesterday':
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            break;

        case 'this_week':
            // Monday to today
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            start.setDate(now.getDate() + mondayOffset);
            start.setHours(0, 0, 0, 0);
            break;

        case 'last_week':
            // Last 7 days (including today)
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;

        case 'this_month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;

        case 'last_month':
            start.setMonth(now.getMonth() - 1);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            end.setDate(0); // Last day of previous month
            end.setHours(23, 59, 59, 999);
            break;
    }

    return { start, end };
}

/**
 * Get total expenses for a time range or specific days ago
 */
export async function getTotalExpenses(
    userId: string,
    timeRange?: TimeRange,
    daysAgo?: number
): Promise<{ total: number; count: number }> {
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
        const { start, end } = getDateRange(timeRange || 'today');
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
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
    const { start, end } = getDateRange(timeRange);

    // Format dates as YYYY-MM-DD string to match web app schema
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

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
export async function getBalance(userId: string): Promise<number> {
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

    // Get all transactions
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .get();

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
        const { start, end } = getDateRange(timeRange || 'this_month');
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
    }

    // Get categories first
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categories = new Map<string, { name: string; type: string }>();
    const expenseCategoryIds = new Set<string>();
    
    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        categories.set(doc.id, { name: cat.name, type: cat.type });
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
    const categoryMap: { [key: string]: { amount: number; count: number } } = {};
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
        const amount = data.amount || 0;

        if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = { amount: 0, count: 0 };
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
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
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
}

/**
 * Get transaction details with category names
 */
export async function getTransactionDetails(
    userId: string,
    timeRange?: TimeRange,
    categoryFilter?: string,
    daysAgo?: number
): Promise<TransactionDetail[]> {
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
        const { start, end } = getDateRange(timeRange || 'today');
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
    }

    // Get categories first
    const categoriesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('categories')
        .get();

    const categories = new Map<string, { name: string; type: string }>();
    const expenseCategoryIds = new Set<string>();
    
    categoriesSnapshot.forEach(doc => {
        const cat = doc.data();
        categories.set(doc.id, { name: cat.name, type: cat.type });
        if (cat.type === 'EXPENSE') {
            expenseCategoryIds.add(doc.id);
        }
    });

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

        // Apply category filter if specified
        if (categoryFilter && categoryName.toLowerCase() !== categoryFilter.toLowerCase()) {
            return;
        }

        details.push({
            description: data.description || '-',
            amount: data.amount || 0,
            category: categoryName,
            date: data.date,
            createdAt: data.createdAt || data.date
        });
    });

    // Sort in memory: by date desc, then by createdAt desc
    details.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.createdAt.localeCompare(a.createdAt);
    });

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
        default:
            return timeRange;
    }
}
