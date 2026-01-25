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

        case 'this_week':
            // Monday to today
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            start.setDate(now.getDate() + mondayOffset);
            start.setHours(0, 0, 0, 0);
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
 * Get total expenses for a time range
 */
export async function getTotalExpenses(
    userId: string,
    timeRange: TimeRange = 'this_month'
): Promise<{ total: number; count: number }> {
    const db = admin.firestore();
    const { start, end } = getDateRange(timeRange);

    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('type', '==', 'expense')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

    let total = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        total += data.amount || 0;
    });

    return {
        total,
        count: snapshot.size
    };
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

    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('type', '==', 'income')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

    let total = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        total += data.amount || 0;
    });

    return {
        total,
        count: snapshot.size
    };
}

/**
 * Get current balance (income - expenses)
 */
export async function getBalance(userId: string): Promise<number> {
    const db = admin.firestore();

    // Get all transactions
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .get();

    let balance = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'income') {
            balance += data.amount || 0;
        } else if (data.type === 'expense') {
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
    timeRange: TimeRange = 'this_month'
): Promise<CategoryData[]> {
    const db = admin.firestore();
    const { start, end } = getDateRange(timeRange);

    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('type', '==', 'expense')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

    // Aggregate by category
    const categoryMap: { [key: string]: { amount: number; count: number } } = {};
    let totalAmount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'Other';
        const amount = data.amount || 0;

        if (!categoryMap[category]) {
            categoryMap[category] = { amount: 0, count: 0 };
        }

        categoryMap[category].amount += amount;
        categoryMap[category].count += 1;
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
 * Format time range for display
 */
export function formatTimeRange(timeRange: TimeRange): string {
    switch (timeRange) {
        case 'today':
            return 'hari ini';
        case 'this_week':
            return 'minggu ini';
        case 'this_month':
            return 'bulan ini';
        case 'last_month':
            return 'bulan lalu';
        default:
            return timeRange;
    }
}
