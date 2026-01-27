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
        amount?: number;
        description?: string;
        category_hint?: string;
        category_filter?: string;
    };
    clarification_needed?: string;
}

export interface CategoryCandidate {
    id: string;
    name: string;
    type?: string;
}

/**
 * Parse user message to extract intent and parameters
 * @param message - User's natural language message in Indonesian
 * @returns Parsed intent with parameters
 */
export async function parseIntent(message: string): Promise<ParsedIntent> {
    try {
        const prompt = `
Kamu adalah AI assistant untuk aplikasi keuangan DompetCerdas.
Parse pesan bahasa Indonesia ini dan extract intent + parameter.

Pesan user: "${message}"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "intent": "query_expenses | query_income | query_balance | add_transaction | category_breakdown | query_details | unknown",
  "confidence": "high | medium | low",
  "parameters": {
    "time_range": "today | yesterday | this_week | last_week | this_month | last_month",
    "days_ago": number (jika user tanya "N hari lalu" contoh: "2 hari lalu" = 2, "3 hari lalu" = 3),
    "custom_month": "YYYY-MM" (jika user sebut bulan+tahun spesifik, contoh: "desember 2025" = "2025-12"),
    "amount": number (hanya untuk add_transaction),
    "description": "string" (hanya untuk add_transaction),
    "category_hint": "string" (optional, tebak kategori dari deskripsi),
    "category_filter": "string" (jika user menyebut kategori spesifik untuk filter, contoh: 'Bill', 'Food', 'Shopping')
  },
  "clarification_needed": "string atau null jika tidak jelas"
}

Rules:
1. Intent "query_expenses" = tanya total pengeluaran (berapa/total/pengeluaran)
2. Intent "query_income" = tanya total pemasukan (berapa/total/pemasukan)
3. Intent "query_balance" = tanya saldo/balance sekarang (berapa saldo/sisa uang/balance)
4. Intent "query_details" = minta detail/list transaksi (apa aja/detailkan/list/rincian)
   - Jika menyebut kategori spesifik ("detailkan kategori Bill"), isi category_filter
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
9. **PENTING**: Kata "terakhir" / "lalu" setelah angka hari = last_week (7 hari terakhir = last_week)
10. Jangan terlalu strict - pahami maksud user, jangan sering minta klarifikasi

Contoh:
"berapa pengeluaran minggu ini?" → intent: query_expenses, time_range: this_week, confidence: high
"pengeluaran hari ini" → intent: query_expenses, time_range: today, confidence: high
"pengeluaran minggu ini" → intent: query_expenses, time_range: this_week, confidence: high
"pengeluaran bulan ini" → intent: query_expenses, time_range: this_month, confidence: high
"berapa pengeluaran bulan desember 2025?" → intent: query_expenses, custom_month: "2025-12", confidence: high
"pengeluaran januari 2026" → intent: query_expenses, custom_month: "2026-01", confidence: high
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
`.trim();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean response - remove markdown if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON
        const parsedIntent: ParsedIntent = JSON.parse(cleanText);

        // Sanitize numeric fields that might be null/undefined/string
        const params = parsedIntent.parameters || {} as any;
        if (typeof params.days_ago !== 'number' || Number.isNaN(params.days_ago)) {
            delete params.days_ago;
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
