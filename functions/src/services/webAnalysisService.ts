import { getDb } from '../index';
import { generateFinancialInsightsWithUsage } from './geminiService';
import { getScopedCollections } from './accountService';

export type WebFinancialAnalysisMode = 'HEALTH' | 'SPENDING' | 'SAVINGS';

type TransactionType = 'INCOME' | 'EXPENSE';

interface CategoryDoc {
    id: string;
    name: string;
    type: TransactionType;
}

interface TransactionDoc {
    id: string;
    amount: number;
    date: string;
    description?: string;
    categoryId: string;
    createdAt?: string;
}

interface CategorySummary {
    name: string;
    total: number;
    count: number;
    percentage: number;
}

interface MonthSummary {
    month: string;
    income: number;
    expense: number;
    net: number;
}

interface SampleTransaction {
    id: string;
    date: string;
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
}

export interface WebFinancialAnalysisResult {
    mode: WebFinancialAnalysisMode;
    markdown: string;
    summary: {
        totalTransactions: number;
        totalTransactionsAnalyzed: number;
        analyzedDateRange: { start: string; end: string } | null;
        incomeTotal: number;
        expenseTotal: number;
        netBalance: number;
        topCategories: CategorySummary[];
        monthlySummaries: MonthSummary[];
        samplesUsed: {
            recent: number;
            largestExpense: number;
            categoryAnchors: number;
            incomeAnchors: number;
        };
    };
    usage: {
        promptTokens: number;
        candidateTokens: number;
        totalTokens: number;
        remainingDailyTokens: number;
        dailyTokenLimit: number;
    };
}

const WEB_ANALYSIS_LIMITS = {
    cooldownMs: 20000,
    dailyTokenLimit: 30000,
    dailyRequestLimit: 12,
    estimatedMaxPromptTokens: 3500,
    estimatedMaxResponseTokens: 1200,
};

const MODE_CONFIG: Record<WebFinancialAnalysisMode, {
    title: string;
    focus: string;
    summaryHeading: string;
    findingsHeading: string;
    actionHeading: string;
}> = {
    HEALTH: {
        title: 'Kesehatan Finansial',
        focus: 'nilai kesehatan arus kas, keseimbangan pemasukan vs pengeluaran, stabilitas bulan ke bulan, dan titik risiko yang langsung terlihat dari data transaksi.',
        summaryHeading: '## Ringkasan Kesehatan Finansial',
        findingsHeading: '## Temuan Kunci',
        actionHeading: '## Tindakan Prioritas',
    },
    SPENDING: {
        title: 'Pola Pengeluaran',
        focus: 'pola pengeluaran: kategori dominan, transaksi besar, frekuensi, dan perubahan perilaku belanja dari data yang tersedia.',
        summaryHeading: '## Ringkasan Pola Pengeluaran',
        findingsHeading: '## Pola yang Terlihat',
        actionHeading: '## Langkah Perbaikan',
    },
    SAVINGS: {
        title: 'Saran Hemat',
        focus: 'peluang penghematan yang realistis berdasarkan kategori dominan, transaksi berulang, dan pengeluaran besar tanpa mengarang data di luar transaksi.',
        summaryHeading: '## Ringkasan Peluang Hemat',
        findingsHeading: '## Area yang Bisa Dihemat',
        actionHeading: '## Saran Hemat Berbasis Data',
    },
};

function sortTransactionsNewestFirst(transactions: TransactionDoc[]) {
    return [...transactions].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.date).getTime();
        const bTime = new Date(b.createdAt || b.date).getTime();
        return bTime - aTime;
    });
}

function getMonthKey(date: string) {
    return date.slice(0, 7);
}

function buildCategoryLookup(categories: CategoryDoc[]) {
    return categories.reduce<Record<string, CategoryDoc>>((acc, category) => {
        acc[category.id] = category;
        return acc;
    }, {});
}

function summarizeMonthlyData(transactions: TransactionDoc[], categoriesById: Record<string, CategoryDoc>): MonthSummary[] {
    const bucket = new Map<string, { income: number; expense: number }>();

    for (const transaction of transactions) {
        const type = categoriesById[transaction.categoryId]?.type;
        if (!type || !transaction.date) continue;

        const key = getMonthKey(transaction.date);
        const current = bucket.get(key) || { income: 0, expense: 0 };

        if (type === 'INCOME') current.income += transaction.amount;
        if (type === 'EXPENSE') current.expense += transaction.amount;

        bucket.set(key, current);
    }

    return [...bucket.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 3)
        .map(([month, values]) => ({
            month,
            income: values.income,
            expense: values.expense,
            net: values.income - values.expense,
        }));
}

function summarizeTopExpenseCategories(
    transactions: TransactionDoc[],
    categoriesById: Record<string, CategoryDoc>,
    totalExpense: number
): CategorySummary[] {
    const bucket = new Map<string, { total: number; count: number }>();

    for (const transaction of transactions) {
        const category = categoriesById[transaction.categoryId];
        if (category?.type !== 'EXPENSE') continue;

        const current = bucket.get(category.name) || { total: 0, count: 0 };
        current.total += transaction.amount;
        current.count += 1;
        bucket.set(category.name, current);
    }

    return [...bucket.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 6)
        .map(([name, values]) => ({
            name,
            total: values.total,
            count: values.count,
            percentage: totalExpense > 0 ? Number(((values.total / totalExpense) * 100).toFixed(1)) : 0,
        }));
}

function toSampleTransaction(
    transaction: TransactionDoc,
    categoriesById: Record<string, CategoryDoc>
): SampleTransaction {
    return {
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        type: categoriesById[transaction.categoryId]?.type || 'EXPENSE',
        category: categoriesById[transaction.categoryId]?.name || 'Tanpa Kategori',
        description: transaction.description?.trim() || '-',
    };
}

function selectAnalysisSamples(transactions: TransactionDoc[], categoriesById: Record<string, CategoryDoc>) {
    const sorted = sortTransactionsNewestFirst(transactions);
    const expenses = sorted.filter((transaction) => categoriesById[transaction.categoryId]?.type === 'EXPENSE');
    const incomes = sorted.filter((transaction) => categoriesById[transaction.categoryId]?.type === 'INCOME');

    const recent = sorted.slice(0, 10);
    const largestExpense = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 6);

    const categoryAnchors: TransactionDoc[] = [];
    const seenExpenseCategories = new Set<string>();
    for (const transaction of expenses) {
        const categoryName = categoriesById[transaction.categoryId]?.name;
        if (!categoryName || seenExpenseCategories.has(categoryName)) continue;
        seenExpenseCategories.add(categoryName);
        categoryAnchors.push(transaction);
        if (categoryAnchors.length >= 5) break;
    }

    const incomeAnchors = incomes.slice(0, 3);

    const deduped = new Map<string, TransactionDoc>();
    [...recent, ...largestExpense, ...categoryAnchors, ...incomeAnchors].forEach((transaction) => {
        deduped.set(transaction.id, transaction);
    });

    const sampledTransactions = [...deduped.values()]
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
        .slice(0, 20)
        .map((transaction) => toSampleTransaction(transaction, categoriesById));

    return {
        sampledTransactions,
        samplesUsed: {
            recent: recent.length,
            largestExpense: largestExpense.length,
            categoryAnchors: categoryAnchors.length,
            incomeAnchors: incomeAnchors.length,
        },
    };
}

function buildPrompt(mode: WebFinancialAnalysisMode, context: {
    totalTransactions: number;
    dateRange: { start: string; end: string } | null;
    incomeTotal: number;
    expenseTotal: number;
    netBalance: number;
    monthlySummaries: MonthSummary[];
    topCategories: CategorySummary[];
    sampledTransactions: SampleTransaction[];
}) {
    const modeConfig = MODE_CONFIG[mode];
    return `
Anda adalah analis keuangan pribadi untuk aplikasi Dompet Cerdas.

Aturan wajib:
1. Gunakan HANYA data yang diberikan di bawah.
2. Jangan menebak pekerjaan, tujuan hidup, kondisi keluarga, hutang, aset, investasi, atau hal lain yang tidak tertulis di data.
3. Jangan memberi saran yang membutuhkan data eksternal, berita, harga pasar, atau pengetahuan di luar transaksi user.
4. Jika data tidak cukup untuk menyimpulkan sesuatu, katakan dengan jelas bahwa data belum cukup.
5. Fokus utama mode ini adalah: ${modeConfig.focus}
6. Gunakan Bahasa Indonesia yang ringkas, jelas, dan praktis.

Susun jawaban dalam markdown dengan struktur berikut:
${modeConfig.summaryHeading}
2-3 bullet tentang kondisi keuangan berdasarkan data.

${modeConfig.findingsHeading}
3 bullet yang spesifik, wajib menyebut angka dari data bila relevan.

${modeConfig.actionHeading}
3 bullet saran praktis yang hanya bersumber dari pola transaksi user.

## Batas Analisis
1-2 bullet singkat tentang keterbatasan data bila ada.

DATA_PENGGUNA:
${JSON.stringify(context)}
    `.trim();
}

function getLimitDocRef(userId: string) {
    return getDb().collection('web_ai_limits').doc(userId);
}

async function checkAndReserveDailyBudget(userId: string) {
    const ref = getLimitDocRef(userId);
    const snapshot = await ref.get();
    const now = Date.now();

    let data = snapshot.exists ? snapshot.data() || {} : {};
    let dayStart = typeof data.dayStart === 'number' ? data.dayStart : now;
    let dailyTokensUsed = typeof data.dailyTokensUsed === 'number' ? data.dailyTokensUsed : 0;
    let dailyRequests = typeof data.dailyRequests === 'number' ? data.dailyRequests : 0;
    const lastRequest = typeof data.lastRequest === 'number' ? data.lastRequest : 0;

    if (now - dayStart >= 86400000) {
        dayStart = now;
        dailyTokensUsed = 0;
        dailyRequests = 0;
    }

    if (lastRequest && now - lastRequest < WEB_ANALYSIS_LIMITS.cooldownMs) {
        const waitSeconds = Math.ceil((WEB_ANALYSIS_LIMITS.cooldownMs - (now - lastRequest)) / 1000);
        throw new Error(`Mohon tunggu ${waitSeconds} detik sebelum analisis berikutnya.`);
    }

    if (dailyRequests >= WEB_ANALYSIS_LIMITS.dailyRequestLimit) {
        throw new Error(`Batas analisis harian tercapai (${WEB_ANALYSIS_LIMITS.dailyRequestLimit} analisis per hari).`);
    }

    const estimatedRequestTokens = WEB_ANALYSIS_LIMITS.estimatedMaxPromptTokens + WEB_ANALYSIS_LIMITS.estimatedMaxResponseTokens;
    if (dailyTokensUsed + estimatedRequestTokens > WEB_ANALYSIS_LIMITS.dailyTokenLimit) {
        throw new Error(`Batas token harian tercapai (${WEB_ANALYSIS_LIMITS.dailyTokenLimit.toLocaleString('id-ID')} token per hari).`);
    }

    await ref.set({
        dayStart,
        dailyTokensUsed,
        dailyRequests: dailyRequests + 1,
        lastRequest: now,
        updatedAt: now,
    }, { merge: true });

    return {
        dayStart,
        dailyTokensUsed,
    };
}

async function commitUsage(userId: string, previousDailyTokensUsed: number, totalTokens: number) {
    const ref = getLimitDocRef(userId);
    const nextTotal = previousDailyTokensUsed + totalTokens;

    await ref.set({
        dailyTokensUsed: nextTotal,
        updatedAt: Date.now(),
    }, { merge: true });

    return Math.max(0, WEB_ANALYSIS_LIMITS.dailyTokenLimit - nextTotal);
}

async function getUserData(userId: string, accountId?: string) {
    const { categoriesCollection, transactionsCollection } = await getScopedCollections(userId, accountId);
    const [categoriesSnap, transactionsSnap] = await Promise.all([
        categoriesCollection.get(),
        transactionsCollection.get(),
    ]);

    const categories: CategoryDoc[] = categoriesSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CategoryDoc, 'id'>),
    }));

    const transactions: TransactionDoc[] = transactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TransactionDoc, 'id'>),
    }));

    return { categories, transactions };
}

export async function analyzeFinancialDataForWeb(
    userId: string,
    mode: WebFinancialAnalysisMode,
    accountId?: string
): Promise<WebFinancialAnalysisResult> {
    const reservation = await checkAndReserveDailyBudget(userId);
    const { categories, transactions } = await getUserData(userId, accountId);

    if (transactions.length === 0) {
        throw new Error('Belum ada transaksi yang bisa dianalisis.');
    }

    const categoriesById = buildCategoryLookup(categories);
    const sortedTransactions = sortTransactionsNewestFirst(transactions);

    const incomeTotal = sortedTransactions.reduce((total, transaction) => (
        categoriesById[transaction.categoryId]?.type === 'INCOME' ? total + transaction.amount : total
    ), 0);
    const expenseTotal = sortedTransactions.reduce((total, transaction) => (
        categoriesById[transaction.categoryId]?.type === 'EXPENSE' ? total + transaction.amount : total
    ), 0);

    const topCategories = summarizeTopExpenseCategories(sortedTransactions, categoriesById, expenseTotal);
    const monthlySummaries = summarizeMonthlyData(sortedTransactions, categoriesById);
    const { sampledTransactions, samplesUsed } = selectAnalysisSamples(sortedTransactions, categoriesById);

    const validDates = sortedTransactions
        .map((transaction) => transaction.date)
        .filter((date): date is string => Boolean(date))
        .sort();

    const analyzedDateRange = validDates.length > 0
        ? { start: validDates[0], end: validDates[validDates.length - 1] }
        : null;

    const prompt = buildPrompt(mode, {
        totalTransactions: transactions.length,
        dateRange: analyzedDateRange,
        incomeTotal,
        expenseTotal,
        netBalance: incomeTotal - expenseTotal,
        monthlySummaries,
        topCategories,
        sampledTransactions,
    });

    const aiResult = await generateFinancialInsightsWithUsage(prompt);
    const remainingDailyTokens = await commitUsage(userId, reservation.dailyTokensUsed, aiResult.totalTokens);

    return {
        mode,
        markdown: aiResult.text,
        summary: {
            totalTransactions: transactions.length,
            totalTransactionsAnalyzed: sampledTransactions.length,
            analyzedDateRange,
            incomeTotal,
            expenseTotal,
            netBalance: incomeTotal - expenseTotal,
            topCategories,
            monthlySummaries,
            samplesUsed,
        },
        usage: {
            promptTokens: aiResult.promptTokens,
            candidateTokens: aiResult.candidateTokens,
            totalTokens: aiResult.totalTokens,
            remainingDailyTokens,
            dailyTokenLimit: WEB_ANALYSIS_LIMITS.dailyTokenLimit,
        },
    };
}
