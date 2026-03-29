/**
 * AI Financial Advisor Service
 * Provides intelligent financial analysis and recommendations using Gemini AI
 * Optimized for token efficiency with smart data aggregation
 */

import * as admin from 'firebase-admin';
import { TimeRange } from './nluService';
import { getTotalExpenses, getTotalIncome, getCategoryBreakdown, getTransactionDetails, getBalance } from './queryService';
import { generateFinancialInsights } from './geminiService';
import { getDb } from '../index';

/**
 * Monthly aggregate summary
 */
interface MonthlyAggregate {
    month: string;
    year: number;
    expenses: number;
    income: number;
    net: number;
    topCategory: string;
    topPercentage: number;
    transactionCount: number;
}

/**
 * Transaction for analysis (sanitized)
 */
interface AnalysisTransaction {
    amount: number;
    description: string;
    categoryName: string;
    categoryType: string;
    date: string;
}

/**
 * Rate limit configuration for advisor
 */
const ADVISOR_RATE_LIMITS = {
    cooldownMs: 30000,      // 30 seconds between requests
    perHour: 10,            // Max 10 analyses per hour
    perDay: 50,             // Max 50 analyses per day
};

/**
 * Check and enforce rate limits for advisor service
 */
async function checkAdvisorRateLimit(userId: string): Promise<void> {
    const limitsRef = getDb().collection('advisor_limits').doc(userId);
    const doc = await limitsRef.get();
    const now = Date.now();
    
    if (!doc.exists) {
        await limitsRef.set({
            hourlyCount: 1,
            dailyCount: 1,
            lastRequest: now,
            hourStart: now,
            dayStart: now
        });
        return;
    }
    
    const data = doc.data()!;
    
    // Reset counters if time window expired
    let hourlyCount = data.hourlyCount || 0;
    let dailyCount = data.dailyCount || 0;
    let hourStart = data.hourStart || now;
    let dayStart = data.dayStart || now;
    
    if (now - hourStart > 3600000) { // 1 hour
        hourlyCount = 0;
        hourStart = now;
    }
    if (now - dayStart > 86400000) { // 1 day
        dailyCount = 0;
        dayStart = now;
    }
    
    // Check cooldown
    if (data.lastRequest && now - data.lastRequest < ADVISOR_RATE_LIMITS.cooldownMs) {
        const waitSeconds = Math.ceil((ADVISOR_RATE_LIMITS.cooldownMs - (now - data.lastRequest)) / 1000);
        throw new Error(`⏰ Mohon tunggu ${waitSeconds} detik lagi sebelum analisa berikutnya.`);
    }
    
    // Check hourly limit
    if (hourlyCount >= ADVISOR_RATE_LIMITS.perHour) {
        throw new Error('⚠️ Limit analisis per jam tercapai (10 analisis). Coba lagi nanti ya!');
    }
    
    // Check daily limit
    if (dailyCount >= ADVISOR_RATE_LIMITS.perDay) {
        throw new Error('⚠️ Limit analisis harian tercapai (50 analisis). Coba lagi besok!');
    }
    
    // Update counters
    await limitsRef.set({
        hourlyCount: hourlyCount + 1,
        dailyCount: dailyCount + 1,
        lastRequest: now,
        hourStart,
        dayStart
    });
}

/**
 * Get monthly aggregates for historical context
 */
async function getMonthlyAggregates(userId: string, months: number, accountId?: string): Promise<MonthlyAggregate[]> {
    const aggregates: MonthlyAggregate[] = [];
    
    for (let i = 0; i < months; i++) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - i);
        
        const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        
        try {
            // Query aggregated data (not individual transactions)
            // Note: Using 'this_month' with manual date filtering would be ideal,
            // but for now we'll use all_time and filter manually or implement monthly queries differently
            const [expenses, income, breakdown] = await Promise.all([
                getTotalExpenses(userId, 'this_month', undefined, undefined, accountId),  // TODO: Implement proper monthly query
                getTotalIncome(userId, 'this_month', accountId),
                getCategoryBreakdown(userId, 'this_month', undefined, accountId)
            ]);
            
            const topCategory = breakdown[0];
            
            aggregates.push({
                month: targetDate.toLocaleString('id', { month: 'long' }),
                year: targetDate.getFullYear(),
                expenses: expenses.total,
                income: income.total,
                net: income.total - expenses.total,
                topCategory: topCategory?.category || 'N/A',
                topPercentage: topCategory?.percentage || 0,
                transactionCount: expenses.count
            });
        } catch (error) {
            console.error(`Error fetching data for month ${monthStr}:`, error);
        }
    }
    
    return aggregates;
}

/**
 * Select relevant transactions using smart sampling
 * Mix of: largest amounts + most recent + diverse categories
 */
function selectRelevantTransactions(transactions: any[], maxCount: number = 50): AnalysisTransaction[] {
    // Filter only expenses (skip income for expense analysis)
    const expenses = transactions.filter(t => t.categoryType === 'EXPENSE');
    
    if (expenses.length === 0) return [];
    
    // Strategy 1: Top by amount (outliers are important)
    const topByAmount = [...expenses]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, Math.min(30, maxCount));
    
    // Strategy 2: Most recent (current trends)
    const mostRecent = [...expenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, Math.min(20, maxCount));
    
    // Strategy 3: One from each category (diversity)
    const categoryMap = new Map<string, any>();
    expenses.forEach(t => {
        if (!categoryMap.has(t.categoryId)) {
            categoryMap.set(t.categoryId, t);
        }
    });
    const diverse = Array.from(categoryMap.values());
    
    // Combine and deduplicate
    const idSet = new Set<string>();
    const combined: any[] = [];
    
    [...topByAmount, ...mostRecent, ...diverse].forEach(t => {
        if (!idSet.has(t.id) && combined.length < maxCount) {
            idSet.add(t.id);
            combined.push(t);
        }
    });
    
    // Sanitize data (remove sensitive info)
    return combined.map(t => ({
        amount: t.amount,
        description: t.description || 'No description',
        categoryName: t.categoryName || 'Uncategorized',
        categoryType: t.categoryType,
        date: t.date
    }));
}

/**
 * Detect spending patterns for better insights
 */
function detectSpendingPatterns(transactions: AnalysisTransaction[]): string[] {
    const patterns: string[] = [];
    
    if (transactions.length === 0) return patterns;
    
    // Pattern 1: Frequent small transactions
    const smallTransactions = transactions.filter(t => t.amount < 50000).length;
    if (smallTransactions > 15) {
        patterns.push(`Banyak transaksi kecil: ${smallTransactions} transaksi < Rp 50rb`);
    }
    
    // Pattern 2: Large outlier transactions
    const amounts = transactions.map(t => t.amount);
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const largeOnes = transactions.filter(t => t.amount > avgAmount * 2);
    if (largeOnes.length > 0) {
        patterns.push(`${largeOnes.length} transaksi besar (>2x rata-rata) terdeteksi`);
    }
    
    // Pattern 3: Category concentration
    const categoryCount = new Set(transactions.map(t => t.categoryName)).size;
    if (categoryCount <= 3 && transactions.length > 20) {
        patterns.push(`Spending terkonsentrasi di ${categoryCount} kategori saja`);
    }
    
    // Pattern 4: Daily spending habit
    const uniqueDates = new Set(transactions.map(t => t.date)).size;
    if (uniqueDates > 25) {
        patterns.push('Transaksi hampir setiap hari');
    }
    
    return patterns;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}rb`;
    }
    return amount.toString();
}

/**
 * Analyze financial health - General overview with insights
 */
export async function analyzeFinancialHealth(
    userId: string,
    timeRange: TimeRange = 'this_month',
    accountId?: string
): Promise<string> {
    // Check rate limit
    await checkAdvisorRateLimit(userId);
    
    // Gather data in parallel
    const [
        thisMonth,
        lastMonth,
        breakdown,
        recentTransactions,
        balance,
        monthlyHistory
    ] = await Promise.all([
        getTotalExpenses(userId, timeRange, undefined, undefined, accountId),
        getTotalExpenses(userId, 'last_month', undefined, undefined, accountId),
        getCategoryBreakdown(userId, timeRange, undefined, accountId),
        getTransactionDetails(userId, timeRange, undefined, undefined, 100, undefined, 'amount', undefined, accountId),
        getBalance(userId, undefined, undefined, undefined, accountId),
        getMonthlyAggregates(userId, 3, accountId)  // Last 3 months aggregate
    ]);
    
    // Select relevant transactions (token efficient)
    const selectedTransactions = selectRelevantTransactions(recentTransactions, 50);
    
    // Calculate insights
    const trend = lastMonth.total > 0 
        ? ((thisMonth.total - lastMonth.total) / lastMonth.total * 100).toFixed(1)
        : '0';
    
    const patterns = detectSpendingPatterns(selectedTransactions);
    
    const topCategories = breakdown
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    
    // Compose compact prompt
    const prompt = `
ANALISA KEUANGAN USER (${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}):

📊 CURRENT PERIOD:
Total pengeluaran: Rp ${formatCurrency(thisMonth.total)} (${thisMonth.count} transaksi)
Trend vs bulan lalu: ${trend}% ${parseFloat(trend) > 0 ? '↑ naik' : '↓ turun'}
Saldo saat ini: Rp ${formatCurrency(balance)}

BREAKDOWN KATEGORI:
${topCategories.map(c => `- ${c.category}: ${c.percentage}% (Rp ${formatCurrency(c.amount)}, ${c.count} transaksi)`).join('\n')}

TOP 50 TRANSAKSI TERBESAR:
${selectedTransactions.slice(0, 50).map((t, i) => `${i+1}. Rp ${formatCurrency(t.amount)} - ${t.description} [${t.categoryName}] (${t.date})`).join('\n')}

📈 HISTORICAL CONTEXT (3 Bulan Terakhir):
${monthlyHistory.map(m => `- ${m.month} ${m.year}: Rp ${formatCurrency(m.expenses)} (${m.transactionCount} transaksi, top: ${m.topCategory} ${m.topPercentage}%)`).join('\n')}

POLA SPENDING:
${patterns.length > 0 ? patterns.map(p => `- ${p}`).join('\n') : '- Pola spending normal'}

TUGAS:
1. Analisa kesehatan keuangan user secara keseluruhan
2. Identifikasi pola spending yang baik/buruk
3. Berikan 3-5 insight spesifik berdasarkan DATA DI ATAS
4. Rekomendasi konkret & actionable (bukan general advice)
5. Estimasi potensi penghematan jika ada

FORMAT JAWABAN (gunakan emoji untuk readability):
📊 Summary (2-3 kalimat ringkas)

💡 Key Insights (3-4 poin penting):
- [insight 1]
- [insight 2]
...

💰 Rekomendasi (3-5 action items spesifik):
1. [rekomendasi konkret dengan estimasi saving]
2. [rekomendasi konkret dengan estimasi saving]
...

🎯 Quick Win (1-2 tips termudah untuk immediate action)

ATURAN:
- Bahasa Indonesia casual tapi profesional
- Fokus pada DATA yang diberikan, jangan membuat asumsi
- Sebutkan nominal & kategori spesifik
- Max 400 kata
- NO general advice (contoh buruk: "sebaiknya menabung", "kurangi pengeluaran")
- YES specific advice (contoh baik: "Kurangi 3x makan di warteg mahal (Rp 450rb) → switch ke warteg biasa = save Rp 900rb/bulan")
`;

    // Generate insights with Gemini
    const insights = await generateFinancialInsights(prompt);
    
    // Log usage for analytics
    await logAdvisorUsage(userId, 'financial_advice', selectedTransactions.length);
    
    return insights;
}

/**
 * Generate savings strategy - Forward-looking recommendations
 */
export async function generateSavingsStrategy(
    userId: string,
    timeRange: TimeRange = 'this_month',
    accountId?: string
): Promise<string> {
    await checkAdvisorRateLimit(userId);
    
    const [
        thisMonth,
        breakdown,
        monthlyHistory,
        recentTransactions
    ] = await Promise.all([
        getTotalExpenses(userId, timeRange, undefined, undefined, accountId),
        getCategoryBreakdown(userId, timeRange, undefined, accountId),
        getMonthlyAggregates(userId, 3, accountId),
        getTransactionDetails(userId, timeRange, undefined, undefined, 100, undefined, 'amount', undefined, accountId)
    ]);
    
    const selectedTransactions = selectRelevantTransactions(recentTransactions, 50);
    const topCategories = breakdown.slice(0, 5);
    
    const prompt = `
STRATEGI HEMAT UNTUK USER (Target: Bulan Depan):

📊 DATA BULAN INI:
Total pengeluaran: Rp ${formatCurrency(thisMonth.total)}

BREAKDOWN KATEGORI:
${topCategories.map(c => `- ${c.category}: Rp ${formatCurrency(c.amount)} (${c.percentage}%)`).join('\n')}

SAMPLE TRANSAKSI BESAR:
${selectedTransactions.slice(0, 30).map((t, i) => `${i+1}. Rp ${formatCurrency(t.amount)} - ${t.description} [${t.categoryName}]`).join('\n')}

TREND 3 BULAN:
${monthlyHistory.map(m => `- ${m.month}: Rp ${formatCurrency(m.expenses)}`).join('\n')}

TUGAS:
Buat strategi hemat untuk bulan depan yang:
1. REALISTIS - bisa diterapkan tanpa mengurangi quality of life
2. KONKRET - dengan target nominal saving per kategori
3. PRIORITAS - dari yang termudah ke tersulit
4. ACTIONABLE - user bisa langsung execute

FORMAT:
🎯 Target Hemat Bulan Depan: [nominal total]

💰 Strategi Hemat (by priority):

1️⃣ [Kategori]: [Action konkret]
   Current: Rp [X]
   Target: Rp [Y]
   Saving: Rp [X-Y]
   Cara: [step-by-step]

2️⃣ [dst...]

📝 Tips Eksekusi:
- [tips praktis 1]
- [tips praktis 2]

ATURAN:
- Target saving total 15-25% dari pengeluaran current
- Prioritas kategori discretionary (Food, Shopping, Entertainment)
- Jangan touch kategori essential (Bill, Healthcare)
- Bahasa Indonesian, max 350 kata
`;

    const insights = await generateFinancialInsights(prompt);
    await logAdvisorUsage(userId, 'savings_strategy', selectedTransactions.length);
    
    return insights;
}

/**
 * Analyze expense reduction - Identify what can be cut
 */
export async function analyzeExpenseReduction(
    userId: string,
    timeRange: TimeRange = 'this_month',
    accountId?: string
): Promise<string> {
    await checkAdvisorRateLimit(userId);
    
    const [
        breakdown,
        allTransactions
    ] = await Promise.all([
        getCategoryBreakdown(userId, timeRange, undefined, accountId),
        getTransactionDetails(userId, timeRange, undefined, undefined, 150, undefined, 'amount', undefined, accountId)
    ]);
    
    // For expense analysis, we want more detail
    const selectedTransactions = selectRelevantTransactions(allTransactions, 100);
    
    // Group by category for analysis
    const categoryGroups = breakdown.map(cat => {
        const catTransactions = allTransactions.filter(t => t.category === cat.category);
        const amounts = catTransactions.map(t => t.amount);
        const avg = amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0;
        const max = amounts.length > 0 ? Math.max(...amounts) : 0;
        const min = amounts.length > 0 ? Math.min(...amounts) : 0;
        
        return {
            category: cat.category,
            count: cat.count,
            total: cat.amount,
            avg: avg,
            max: max,
            min: min,
            variance: max - min
        };
    });
    
    const prompt = `
ANALISA PENGELUARAN YANG BISA DIKURANGI (Tanpa Suffering):

📋 SEMUA TRANSAKSI BULAN INI (${selectedTransactions.length} items):
${selectedTransactions.map((t, i) => `${i+1}. Rp ${formatCurrency(t.amount)} - ${t.description} [${t.categoryName}] (${t.date})`).join('\n')}

📊 BREAKDOWN PER KATEGORI:
${categoryGroups.map(g => `- ${g.category}: ${g.count} transaksi, total Rp ${formatCurrency(g.total)}, avg Rp ${formatCurrency(g.avg)}, range Rp ${formatCurrency(g.min)}-${formatCurrency(g.max)}`).join('\n')}

TUGAS:
Identifikasi 5-7 area spending yang BISA DIKURANGI tanpa mengurangi quality of life:

KRITERIA:
✅ Frekuensi tinggi + nilai besar (habit expensive)
✅ Kategori discretionary (Food, Shopping, Entertainment)  
✅ Variasi harga tinggi (ada alternatif lebih murah)
✅ Bukan essential (bukan Bill, Healthcare, commute transport)

FORMAT:
🔍 Temuan Pengeluaran Bisa Dihemat:

1️⃣ [Kategori/Item Spesifik]
   📌 Terdeteksi: [frekuensi & pattern]
   💰 Alternative: [solusi lebih murah]
   💵 Potensi Saving: Rp [X]/bulan
   😊 Impact: [tingkat kesulitan: mudah/medium/sulit]

2️⃣ [dst...]

📊 TOTAL POTENSI HEMAT: Rp [X]/bulan (-[Y]%)

🎯 LOW-HANGING FRUITS (prioritas tertinggi):
- [item termudah 1]
- [item termudah 2]

ATURAN:
- Fokus pada DATA yang terlihat (jangan asumsi)
- Sebutkan nominal & frekuensi spesifik
- Beri alternatif konkret, bukan saran umum
- Sort by potential saving (terbesar dulu)
- Bahasa Indonesia, max 400 kata
`;

    const insights = await generateFinancialInsights(prompt);
    await logAdvisorUsage(userId, 'expense_analysis', selectedTransactions.length);
    
    return insights;
}

/**
 * Log advisor usage for analytics
 */
async function logAdvisorUsage(userId: string, intentType: string, transactionCount: number): Promise<void> {
    try {
        await getDb().collection('advisor_analytics').add({
            userId,
            intentType,
            transactionCount,
            timestamp: new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging advisor usage:', error);
        // Don't throw - logging failure shouldn't block user
    }
}
