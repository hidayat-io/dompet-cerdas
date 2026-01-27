/**
 * Response Formatter Service
 * Formats query results into user-friendly messages
 */

import { CategoryData, TransactionDetail } from './queryService';

/**
 * Emoji mapping for categories
 */
const CATEGORY_EMOJI: { [key: string]: string } = {
    'Food': '🍔',
    'Transportation': '🚗',
    'Shopping': '🛒',
    'Health': '💊',
    'Entertainment': '🎬',
    'Bills': '📄',
    'Other': '📦'
};

/**
 * Format number to Indonesian Rupiah
 */
function formatRupiah(amount: number): string {
    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    } else if (amount >= 1_000) {
        return `Rp ${(amount / 1_000).toFixed(0)}k`;
    } else {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    }
}

/**
 * Format exact Rupiah amount
 */
function formatExactRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Format expense query response
 */
export function formatExpenseResponse(
    total: number,
    count: number,
    timeRange: string
): string {
    const average = count > 0 ? total / count : 0;

    return `💰 *Pengeluaran ${timeRange}*: ${formatExactRupiah(total)}

📊 Detail:
• ${count} transaksi
• Rata-rata: ${formatRupiah(average)}/transaksi`;
}

/**
 * Format income query response
 */
export function formatIncomeResponse(
    total: number,
    count: number,
    timeRange: string
): string {
    return `💵 *Pemasukan ${timeRange}*: ${formatExactRupiah(total)}

📊 Detail:
• ${count} transaksi`;
}

/**
 * Format balance response
 */
export function formatBalanceResponse(balance: number, timeRangeText?: string): string {
    const emoji = balance >= 0 ? '💰' : '⚠️';
    const status = balance >= 0 ? 'Saldo positif' : 'Saldo negatif';
    const periodText = timeRangeText || '';

    return `${emoji} *Saldo kamu${periodText}*: ${formatExactRupiah(balance)}

${status}`;
}

/**
 * Format category breakdown response
 */
export function formatCategoryBreakdown(
    categories: CategoryData[],
    timeRange: string
): string {
    if (categories.length === 0) {
        return `📊 Belum ada pengeluaran ${timeRange}.`;
    }

    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
    const lines = categories.slice(0, 5).map(cat => {
        const emoji = CATEGORY_EMOJI[cat.category] || '📦';
        return `${emoji} ${cat.category}: ${formatRupiah(cat.amount)} (${cat.percentage.toFixed(0)}%)`;
    });

    return `📊 *Pengeluaran per kategori (${timeRange})*:

${lines.join('\n')}

💰 Total: ${formatExactRupiah(totalAmount)}`;
}

/**
 * Format transaction details list
 */
export function formatTransactionDetails(
    details: TransactionDetail[],
    timeRange: string
): string {
    if (details.length === 0) {
        return `📋 Belum ada pengeluaran ${timeRange}.`;
    }

    const total = details.reduce((sum, item) => sum + item.amount, 0);
    const header = `📋 *Detail pengeluaran ${timeRange}*\n\n💰 Total: ${formatExactRupiah(total)} (${details.length} transaksi)\n`;

    const items = details.map((item, index) => {
        const emoji = CATEGORY_EMOJI[item.category] || '📦';
        return `\n${index + 1}. ${item.description} : 💵 ${formatExactRupiah(item.amount)}\n    ${emoji} ${item.category}`;
    }).join('');

    return header + items;
}

/**
 * Format manual transaction added confirmation
 */
export function formatTransactionAdded(
    amount: number,
    category: string,
    description: string
): string {
    const emoji = CATEGORY_EMOJI[category] || '📦';

    return `✅ *Transaksi berhasil ditambahkan!*

💰 ${formatExactRupiah(amount)}
${emoji} Kategori: ${category}
📝 Deskripsi: ${description}
📅 Tanggal: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })}`;
}

/**
 * Format unknown intent response
 */
export function formatUnknownIntent(): string {
    return `🤔 *Maaf, saya belum mengerti.*

Coba:
• "berapa pengeluaran minggu ini?"
• "tambah 50000 makan siang"
• "kategori paling boros bulan ini"

Atau ketik /help untuk panduan lengkap.`;
}

/**
 * Format clarification request
 */
export function formatClarification(clarification: string): string {
    return `❓ ${clarification}`;
}
