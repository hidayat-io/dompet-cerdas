/**
 * Natural Language Understanding Service
 * Parses Indonesian natural language messages into structured intents using Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Supported intent types
 */
export type IntentType =
    | 'query_expenses'
    | 'query_income'
    | 'query_balance'
    | 'add_transaction'
    | 'category_breakdown'
    | 'query_details'
    | 'unknown';

/**
 * Time range options
 */
export type TimeRange = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month';

/**
 * Parsed intent structure
 */
export interface ParsedIntent {
    intent: IntentType;
    confidence: 'high' | 'medium' | 'low';
    parameters: {
        time_range?: TimeRange;
        days_ago?: number;
        custom_month?: string; // YYYY-MM format
        specific_date?: string; // YYYY-MM-DD format
        amount?: number;
        description?: string;
        category_hint?: string;
        category_filter?: string;
        limit?: number;
        sort_by?: 'date' | 'amount'; // 'date' = terakhir (recent), 'amount' = tertinggi (highest)
    };
    clarification_needed?: string;
}

export interface CategoryCandidate {
    id: string;
    name: string;
    type?: string;
}

const QUERY_KEYWORDS = [
    'berapa',
    'total',
    'pengeluaran',
    'pemasukan',
    'saldo',
    'balance',
    'transaksi',
    'detail',
    'rincian',
    'kategori',
    'breakdown',
    'boros'
];

function containsQueryKeywords(message: string): boolean {
    const lower = message.toLowerCase();
    return QUERY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function detectSimpleIntent(message: string): ParsedIntent | null {
    const lower = message.toLowerCase().trim();
    const currentYear = new Date().getFullYear();

    // Helper to parse Indonesian months
    const monthMap: { [key: string]: string } = {
        'jan': '01', 'januari': '01',
        'feb': '02', 'februari': '02',
        'mar': '03', 'maret': '03',
        'apr': '04', 'april': '04',
        'mei': '05',
        'jun': '06', 'juni': '06',
        'jul': '07', 'juli': '07',
        'agt': '08', 'agustus': '08',
        'sep': '09', 'september': '09',
        'okt': '10', 'oktober': '10',
        'nov': '11', 'november': '11',
        'des': '12', 'desember': '12'
    };

    // Extract specific date (e.g., "27 jan", "27 januari", "tgl 27", "tanggal 5")
    let specific_date: string | undefined;

    // Pattern 1: DD Month (e.g., "27 jan")
    const dateMonthMatch = lower.match(/\b(\d{1,2})\s+(jan|januari|feb|februari|mar|maret|apr|april|mei|jun|juni|jul|juli|agt|agustus|sep|september|okt|oktober|nov|november|des|desember)\b/i);
    if (dateMonthMatch) {
        const day = dateMonthMatch[1].padStart(2, '0');
        const monthStr = dateMonthMatch[2];
        const month = monthMap[monthStr];
        specific_date = `${currentYear}-${month}-${day}`;
    }

    // Pattern 2: "tgl 27" / "tanggal 27" (assuming current month if not specified? Or maybe just simple date?)
    // If user says "transaksi tanggal 27", usually means this month.
    // However, sticking to "27 jan" request for now which is clear.
    // Let's also support "tanggal 27" -> 27th of current month
    if (!specific_date) {
        const tglMatch = lower.match(/\b(?:tgl|tanggal)\s+(\d{1,2})\b/i);
        if (tglMatch) {
            const day = tglMatch[1].padStart(2, '0');
            const now = new Date();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            specific_date = `${now.getFullYear()}-${month}-${day}`;
        }
    }

    // Balance queries
    if (/^(berapa\s+)?(saldo|balance|sisa\s+uang)(\s+(sekarang|saya|kamu|aku|gw))?(\s+berapa)?$/i.test(lower)) {
        return {
            intent: 'query_balance',
            confidence: 'high',
            parameters: {}
        };
    }

    // Balance with time range
    if (/saldo|balance|sisa\s+uang/.test(lower)) {
        let time_range: TimeRange | undefined;
        if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        if (time_range) {
            return {
                intent: 'query_balance',
                confidence: 'high',
                parameters: { time_range }
            };
        }
    }

    // Transaction details / list queries (check BEFORE expense/income queries for "detail pengeluaran")
    if (/transaksi|trans\b|detail|rincian|apa\s+aja|apa\s+saja|list|tampilkan|lihat|show|tunjukkan/i.test(lower)) {
        let time_range: TimeRange | undefined;
        
        // Check for "N hari terakhir" pattern first (e.g., "detail pengeluaran 7 hari terakhir") - maps to last_week
        if (/\d+\s+hari\s+ter[a-z]+/i.test(lower)) {
            time_range = 'last_week'; // Last 7 days including today
        } else if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        // Extract category filter if present
        let category_filter: string | undefined;

        // Pattern 1: "kategori X" (explicit)
        const categoryMatch = lower.match(/kategori\s+(\w+)/i);
        if (categoryMatch) {
            category_filter = categoryMatch[1];
        }

        // Pattern 2: Direct category name mentions (common categories)
        if (!category_filter) {
            const categoryNames = [
                { pattern: /\bfood\b|\bmakan(an)?\b/i, name: 'Food' },
                { pattern: /\bshopping\b|\bbelanja\b/i, name: 'Shopping' },
                { pattern: /\bbill\b|\btagihan\b/i, name: 'Bill' },
                { pattern: /\btransport(asi)?\b|\bgojek\b|\bgrab\b/i, name: 'Transportation' },
                { pattern: /\bentertainment\b|\bhiburan\b/i, name: 'Entertainment' },
                { pattern: /\bhealth\b|\bkesehatan\b/i, name: 'Health' },
            ];
            for (const cat of categoryNames) {
                if (cat.pattern.test(lower)) {
                    category_filter = cat.name;
                    break;
                }
            }
        }

        // Extract limit and sort_by
        // "5 transaksi terakhir" = limit 5, sort by date (recent)
        // "5 transaksi tertinggi" = limit 5, sort by amount (highest)
        // "top 10" = limit 10, sort by amount (highest)
        let limit: number | undefined;
        let sort_by: 'date' | 'amount' | undefined;

        // Pattern for "tertinggi/terbesar" (highest by amount)
        const highestMatch = lower.match(/(?:^|\s)(\d+)\s+(?:transaksi|trans|pengeluaran)?\s*(?:tertinggi|terbesar|terbanyak)/i);
        if (highestMatch) {
            limit = parseInt(highestMatch[1], 10);
            sort_by = 'amount';
        }

        // Pattern for "top N" (usually means highest) - check BEFORE terakhir
        if (!limit) {
            const topMatch = lower.match(/top\s+(\d+)/i);
            if (topMatch) {
                limit = parseInt(topMatch[1], 10);
                sort_by = 'amount';
            }
        }

        // Pattern for "terakhir" (recent by date) - only if not already matched
        if (!limit) {
            const recentMatch = lower.match(/(?:^|\s)(\d+)\s+(?:transaksi|trans|item|data)?\s*terakhir|last\s+(\d+)/i);
            if (recentMatch) {
                const numStr = recentMatch.slice(1).find(v => v !== undefined);
                if (numStr) {
                    limit = parseInt(numStr, 10);
                    sort_by = 'date';
                }
            }
        }

        return {
            intent: 'query_details',
            confidence: 'high',
            parameters: { 
                time_range: specific_date ? undefined : (time_range || 'this_week'), 
                category_filter, 
                limit, 
                sort_by, 
                specific_date
            }
        };
    }

    // Expense queries - more flexible pattern
    // Match: "berapa pengeluaran", "total pengeluaran", "pengeluaran berapa", 
    // "pengeluaran hari ini", "hari ini ada pengeluaran", "pengeluaran 7 hari terakhir", etc.
    if (/pengeluaran/.test(lower)) {
        // Check if it's an expense query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);
        
        // If it has "pengeluaran" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range: TimeRange | undefined;
            
            // Check for "N hari terakhir" pattern (e.g., "7 hari terakhir") - maps to last_week
            if (/\d+\s+hari\s+ter[a-z]+/i.test(lower)) {
                time_range = 'last_week'; // Last 7 days including today
            } else if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return {
                intent: 'query_expenses',
                confidence: 'high',
                parameters: { time_range: time_range || 'this_month' }
            };
        }
    }

    // Income queries - more flexible pattern
    // Match: "berapa pemasukan", "total pemasukan", "pemasukan berapa",
    // "pemasukan hari ini", "hari ini ada pemasukan", etc.
    if (/pemasukan/.test(lower)) {
        // Check if it's an income query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);
        
        // If it has "pemasukan" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range: TimeRange | undefined;
            if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return {
                intent: 'query_income',
                confidence: 'high',
                parameters: { time_range: time_range || 'this_month' }
            };
        }
    }

    // Expense queries - more flexible pattern
    // Match: "berapa pengeluaran", "total pengeluaran", "pengeluaran berapa",
    // "pengeluaran hari ini", "hari ini ada pengeluaran", etc.
    if (/pengeluaran/.test(lower)) {
        // Check if it's an expense query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);
        
        // If it has "pengeluaran" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range: TimeRange | undefined;
            if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return {
                intent: 'query_expenses',
                confidence: 'high',
                parameters: { time_range: time_range || 'this_month' }
            };
        }
    }

    // Income queries - more flexible pattern
    // Match: "berapa pemasukan", "total pemasukan", "pemasukan berapa",
    // "pemasukan hari ini", "hari ini ada pemasukan", etc.
    if (/pemasukan/.test(lower)) {
        // Check if it's an income query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);
        
        // If it has "pemasukan" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range: TimeRange | undefined;
            if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return {
                intent: 'query_income',
                confidence: 'high',
                parameters: { time_range: time_range || 'this_month' }
            };
        }
    }

    // Category breakdown queries (only if no detail/list keywords)
    if (/breakdown|boros|paling\s+banyak/i.test(lower)) {
        let time_range: TimeRange | undefined;
        if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        return {
            intent: 'category_breakdown',
            confidence: 'high',
            parameters: { time_range: time_range || 'this_month' }
        };
    }

    return null;
}

function collapseRepeatedMessage(message: string): string {
    const trimmed = message.trim();
    if (trimmed.length < 40) return trimmed;

    const maxLen = Math.min(80, Math.floor(trimmed.length / 2));
    for (let len = 10; len <= maxLen; len += 1) {
        const prefix = trimmed.slice(0, len);
        if (trimmed.startsWith(prefix + prefix)) {
            return prefix.trim();
        }
    }

    return trimmed;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumberString(raw: string, hasSuffix: boolean): number | null {
    if (!raw) return null;

    // If suffix present, treat comma as decimal separator and dot as decimal separator
    if (hasSuffix) {
        const normalized = raw.replace(/,/g, '.');
        const value = parseFloat(normalized);
        return Number.isFinite(value) ? value : null;
    }

    // No suffix: remove thousand separators and parse as integer
    const digitsOnly = raw.replace(/[.,]/g, '');
    const value = parseInt(digitsOnly, 10);
    return Number.isFinite(value) ? value : null;
}

function parseAmountToken(token: string): number | null {
    const cleaned = token
        .toLowerCase()
        .replace(/^rp\s*/i, '')
        .replace(/^idr\s*/i, '')
        .trim();

    const suffixMatch = cleaned.match(/(k|rb|ribu|jt|juta|m|milyar|miliar)$/i);
    const suffix = suffixMatch ? suffixMatch[0].toLowerCase() : '';
    const numberPart = suffix
        ? cleaned.slice(0, cleaned.length - suffix.length).trim()
        : cleaned;

    const baseValue = normalizeNumberString(numberPart, Boolean(suffix));
    if (baseValue === null) return null;

    let multiplier = 1;
    if (['k', 'rb', 'ribu'].includes(suffix)) multiplier = 1000;
    else if (['jt', 'juta'].includes(suffix)) multiplier = 1_000_000;
    else if (['m', 'milyar', 'miliar'].includes(suffix)) multiplier = 1_000_000_000;

    return Math.round(baseValue * multiplier);
}

function extractManualTransaction(message: string): { amount: number; description: string; category_hint?: string } | null {
    const normalizedMessage = collapseRepeatedMessage(message);
    const matchAll = [...normalizedMessage.matchAll(/(?:rp\s*)?\d[\d.,]*\s*(?:k|rb|ribu|jt|juta|m|milyar|miliar)?\b/gi)];
    if (matchAll.length === 0) return null;

    const lastMatch = matchAll[matchAll.length - 1];
    const amountToken = lastMatch[0];
    const amount = parseAmountToken(amountToken);
    if (!amount || amount <= 0) return null;

    let description = normalizedMessage;
    for (const match of matchAll) {
        const token = match[0];
        const tokenRegex = new RegExp(escapeRegex(token), 'gi');
        description = description.replace(tokenRegex, ' ');
    }

    description = description
        .replace(/[\s:;\-–—]+$/g, '')
        .trim();

    if (!description) return null;

    const lowerDesc = description.toLowerCase();
    let category_hint: string | undefined;
    if (/makan|sarapan|breakfast|lunch|dinner|warteg|warung|kopi|cafe|resto|restaurant|snack|camil|camilan|keripik|chips|cassava|casava/.test(lowerDesc)) {
        category_hint = 'Food';
    } else if (/grab|gojek|ojek|bus|kereta|taxi|tol|parkir|bensin|bbm|pertamina/.test(lowerDesc)) {
        category_hint = 'Transportation';
    } else if (/belanja|shopping|market|minimarket|indomaret|alfamart|supermarket|mall/.test(lowerDesc)) {
        category_hint = 'Shopping';
    }

    return { amount, description, category_hint };
}

/**
 * Parse user message to extract intent and parameters
 * @param message - User's natural language message in Indonesian
 * @returns Parsed intent with parameters
 */
export async function parseIntent(message: string): Promise<ParsedIntent> {
    try {
        // Try simple rule-based intent detection first
        const simpleIntent = detectSimpleIntent(message);
        if (simpleIntent) {
            return simpleIntent;
        }

        const manualParsed = extractManualTransaction(message);
        if (manualParsed && !containsQueryKeywords(message)) {
            return {
                intent: 'add_transaction',
                confidence: 'high',
                parameters: {
                    amount: manualParsed.amount,
                    description: manualParsed.description,
                    category_hint: manualParsed.category_hint
                }
            };
        }

        const prompt = `
Kamu adalah AI assistant untuk aplikasi keuangan DompetCerdas.
Parse pesan bahasa Indonesia ini dan extract intent + parameter.

Current date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)
User message: "${message}"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "query_expenses | query_income | query_balance | add_transaction | category_breakdown | query_details | unknown",
  "confidence": "high | medium | low",
  "parameters": {
    "time_range": "today | yesterday | this_week | last_week | this_month | last_month",
    "days_ago": number (jika user tanya "N hari lalu" contoh: "2 hari lalu" = 2, "3 hari lalu" = 3),
    "custom_month": "YYYY-MM" (jika user sebut bulan+tahun spesifik, contoh: "desember 2025" = "2025-12"),
    "specific_date": "YYYY-MM-DD" (jika user sebut tanggal spesifik, contoh: "27 jan" = "2026-01-27", "tgl 5" = "2026-01-05" - asumsikan tahun saat ini ${new Date().getFullYear()} jika tidak disebut),
    "amount": number (hanya untuk add_transaction),
    "description": "string" (hanya untuk add_transaction),
    "category_hint": "string" (optional, tebak kategori dari deskripsi),
    "category_filter": "string" (jika user menyebut kategori spesifik untuk filter, contoh: 'Bill', 'Food', 'Shopping'),
    "limit": number (jika user menyebut jumlah item yang diminta, contoh: "5 transaksi terakhir" => 5)
  },
  "clarification_needed": "string atau null jika tidak jelas"
}

Rules:
1. Intent "query_expenses" = tanya total pengeluaran (berapa/total/pengeluaran)
2. Intent "query_income" = tanya total pemasukan (berapa/total/pemasukan)
3. Intent "query_balance" = tanya saldo/balance sekarang (berapa saldo/sisa uang/balance)
4. Intent "query_details" = minta detail/list transaksi (apa aja/detailkan/list/rincian/5 transaksi terakhir/transaksi tgl 27)
   - Jika menyebut kategori spesifik ("detailkan kategori Bill"), isi category_filter
   - Jika menyebut jumlah item ("5 transaksi terakhir", "top 10 pengeluaran", "last 3"), isi parameter "limit" dengan angka tersebut.
   - **Jika menyebut tanggal spesifik ("tgl 27", "27 jan", "tanggal 5 kemarin"), isi parameter "specific_date" (YYYY-MM-DD).**
5. Intent "add_transaction" = tambah/catat transaksi manual
6. Intent "category_breakdown" = tanya breakdown/rincian per kategori, atau tanya kategori paling boros/paling banyak
5. Time range mapping - BACA DENGAN TELITI:
   - "hari ini" / "today" → "today"
   - "kemarin" / "yesterday" → "yesterday"
   - "minggu ini" / "this week" / "seminggu ini" (tanpa kata "terakhir") → "this_week"
   - **"7 hari terakhir" / "seminggu terakhir" / "1 minggu terakhir" / "selama 1 minggu" / "selama seminggu" → "last_week"**
   - "bulan ini" / "this month" → "this_month"
   - "bulan lalu" / "last month" → "last_month"
   - **Bulan+tahun spesifik**: "desember 2025" = "2025-12", "januari 2026" = "2026-01", "februari 2025" = "2025-02", dll.
6. **PENTING**: Jika user menyebut bulan+tahun spesifik, isi "custom_month" dengan format "YYYY-MM"
6. Untuk add_transaction, extract angka sebagai amount. Pahami format informal:
    - "35jt" = 35000000, "2,5jt" = 2500000
    - "150rb" = 150000, "1.2rb" = 1200
    - "35 juta" = 35000000, "1,5 juta" = 1500000
7. Anggap format "Label : amount" sebagai add_transaction, contoh:
    - "Salary Feb : 35jt" → intent: add_transaction, amount: 35000000, description: "Salary Feb"
    - "Gaji Feb: 35 juta" → intent: add_transaction, amount: 35000000, description: "Gaji Feb"
7. Category hint dari kata kunci: makan/food → "Food", transport/grab/gojek → "Transportation", belanja/shopping → "Shopping"
8. **PENTING**: Jika tidak ada time range disebutkan, gunakan default "this_week" untuk query
9. **PENTING**: Kata "terakhir" / "lalu" setelah angka hari = last_week (7 hari terakhir = last_week). TAPI jika angka < 7 dan konteksnya "transaksi terakhir", mungkin maksudnya "limit".
    - "3 hari terakhir" = query_details, time_range: last_week (atau custom logic), days_ago: 3
    - "3 transaksi terakhir" = query_details, limit: 3
10. Jangan terlalu strict - pahami maksud user, jangan sering minta klarifikasi

Contoh:
"berapa pengeluaran minggu ini?" → intent: query_expenses, time_range: this_week, confidence: high
"pengeluaran hari ini" → intent: query_expenses, time_range: today, confidence: high
"pengeluaran minggu ini" → intent: query_expenses, time_range: this_week, confidence: high
"pengeluaran bulan ini" → intent: query_expenses, time_range: this_month, confidence: high
"berapa pengeluaran bulan desember 2025?" → intent: query_expenses, custom_month: "2025-12", confidence: high
"pengeluaran januari 2026" → intent: query_expenses, custom_month: "2026-01", confidence: high
"transaksi 27 jan" → intent: query_details, specific_date: "2026-01-27", confidence: high
"transaksi tanggal 5" → intent: query_details, specific_date: "2026-01-05", confidence: high
"berapa pemasukan bulan ini?" → intent: query_income, time_range: this_month, confidence: high
"pemasukan hari ini" → intent: query_income, time_range: today, confidence: high
"saldo ada berapa sekarang?" → intent: query_balance, confidence: high
"berapa saldo saya?" → intent: query_balance, confidence: high
"sisa uang berapa?" → intent: query_balance, confidence: high
"saldo" → intent: query_balance, confidence: high
"saldo bulan ini" → intent: query_balance, time_range: this_month, confidence: high
"saldo kemarin" → intent: query_balance, time_range: yesterday, confidence: high
"saldo minggu ini" → intent: query_balance, time_range: this_week, confidence: high
"pengeluaran 7 hari terakhir" → intent: query_expenses, time_range: last_week, confidence: high
"transaksi 2 hari lalu" → intent: query_details, days_ago: 2, confidence: high
"pengeluaran 3 hari lalu berapa" → intent: query_expenses, days_ago: 3, confidence: high
"detailkan 5 hari yang lalu" → intent: query_details, days_ago: 5, confidence: high
"detailkan transaksi 7 hari terakhir" → intent: query_details, time_range: last_week, confidence: high
"detailkan kategori Bill bulan ini" → intent: query_details, time_range: this_month, category_filter: "Bill", confidence: high
"rincian Food minggu ini" → intent: query_details, time_range: this_week, category_filter: "Food", confidence: high
"kategori paling boros bulan ini" → intent: category_breakdown, time_range: this_month, confidence: high
"bulan ini transaksi paling boros apa" → intent: category_breakdown, time_range: this_month, confidence: high
"apa aja pengeluaran hari ini?" → intent: query_details, time_range: today, confidence: high
"detailkan" → intent: query_details, time_range: this_week, confidence: high
"tolong detailkan" → intent: query_details, time_range: this_week, confidence: high
"tambah 50000 makan siang" → intent: add_transaction, amount: 50000, description: "makan siang", category_hint: "Food", confidence: high
"Salary Feb : 35jt" → intent: add_transaction, amount: 35000000, description: "Salary Feb", confidence: high
"Gaji Feb: 35 juta" → intent: add_transaction, amount: 35000000, description: "Gaji Feb", confidence: high
"last 5 trans" → intent: query_details, limit: 5, confidence: high
"5 transaksi terakhir" → intent: query_details, limit: 5, confidence: high
`.trim();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean response - extract JSON object specifically
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        let jsonString = text;
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = text.substring(firstBrace, lastBrace + 1);
        } else {
            // Fallback cleanup if no braces (unlikely but possible for plain JSON)
            jsonString = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }

        // Parse JSON
        const parsedIntent: ParsedIntent = JSON.parse(jsonString);

        // Sanitize numeric fields that might be null/undefined/string
        const params = parsedIntent.parameters || {} as any;
        if (typeof params.days_ago !== 'number' || Number.isNaN(params.days_ago)) {
            delete params.days_ago;
        }
        if (typeof params.limit !== 'number' || Number.isNaN(params.limit)) {
            delete params.limit;
        }
        // Remove invalid time_range values
        const validRanges = new Set(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month']);
        if (params.time_range && !validRanges.has(params.time_range)) {
            delete params.time_range;
        }
        // Normalize custom_month format YYYY-MM
        if (params.custom_month && !/^\d{4}-\d{2}$/.test(params.custom_month)) {
            delete params.custom_month;
        }
        // Normalize specific_date format YYYY-MM-DD
        if (params.specific_date) {
            // Allow YYYY-M-D and normalize to YYYY-MM-DD
            const dateMatch = params.specific_date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (dateMatch) {
                const year = dateMatch[1];
                const month = dateMatch[2].padStart(2, '0');
                const day = dateMatch[3].padStart(2, '0');
                params.specific_date = `${year}-${month}-${day}`;
            } else {
                delete params.specific_date;
            }
        }
        parsedIntent.parameters = params;

        // Validate intent
        if (!parsedIntent.intent || !parsedIntent.confidence) {
            throw new Error('Invalid intent structure from Gemini');
        }

        return parsedIntent;

    } catch (error) {
        console.error('Error parsing intent:', error);

        // Fallback to unknown intent
        return {
            intent: 'unknown',
            confidence: 'low',
            parameters: {},
            clarification_needed: 'Maaf, saya kurang mengerti. Coba ketik /help untuk contoh.'
        };
    }
}

/**
 * Check if intent is actionable (high confidence)
 */
export function isActionable(parsedIntent: ParsedIntent): boolean {
    return parsedIntent.confidence === 'high' && parsedIntent.intent !== 'unknown';
}

/**
 * Classify category using Gemini based on description and available categories.
 */
export async function classifyCategory(
    description: string,
    categories: CategoryCandidate[]
): Promise<{ categoryId: string; categoryName: string; confidence: 'high' | 'medium' | 'low' }> {
    if (categories.length === 0) {
        throw new Error('No categories available for classification');
    }

    const prompt = `
Kamu adalah AI untuk memilih kategori transaksi.

Deskripsi transaksi: "${description}"

Daftar kategori (id, name, type):
${categories.map((c) => `- ${c.id} | ${c.name} | ${c.type || 'UNKNOWN'}`).join('\n')}

Pilih satu kategori yang paling cocok.
Jika tidak ada yang cocok, pilih kategori bernama "Lainnya" atau "Other" jika tersedia.
Return ONLY valid JSON (no markdown, no code blocks):
{
  "categoryId": "string",
  "categoryName": "string",
  "confidence": "high | medium | low"
}
`.trim();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText) as {
        categoryId?: string;
        categoryName?: string;
        confidence?: 'high' | 'medium' | 'low';
    };

    if (!parsed.categoryId || !parsed.categoryName) {
        throw new Error('Invalid category classification response');
    }

    return {
        categoryId: parsed.categoryId,
        categoryName: parsed.categoryName,
        confidence: parsed.confidence || 'medium'
    };
}
