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
export type TimeRange = 'today' | 'this_week' | 'this_month' | 'last_month';

/**
 * Parsed intent structure
 */
export interface ParsedIntent {
    intent: IntentType;
    confidence: 'high' | 'medium' | 'low';
    parameters: {
        time_range?: TimeRange;
        amount?: number;
        description?: string;
        category_hint?: string;
    };
    clarification_needed?: string;
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
    "time_range": "today | this_week | this_month | last_month",
    "amount": number (hanya untuk add_transaction),
    "description": "string" (hanya untuk add_transaction),
    "category_hint": "string" (optional, tebak kategori dari deskripsi)
  },
  "clarification_needed": "string atau null jika tidak jelas"
}

Rules:
1. Intent "query_expenses" = tanya total pengeluaran (berapa/total)
2. Intent "query_details" = minta detail/list transaksi (apa aja/detailkan/list/rincian)
3. Intent "add_transaction" = tambah/catat transaksi manual
4. Intent "category_breakdown" = tanya breakdown per kategori
5. Time range mapping:
   - "hari ini" / "today" → "today"
   - "minggu ini" / "this week" → "this_week"
   - "bulan ini" / "this month" → "this_month"
   - "bulan lalu" / "last month" → "last_month"
6. Untuk add_transaction, extract angka sebagai amount
7. Category hint dari kata kunci: makan/food → "Food", transport/grab/gojek → "Transportation", belanja/shopping → "Shopping"
8. Confidence "low" jika pesan ambiguous atau tidak lengkap

Contoh:
"berapa pengeluaran minggu ini?" → intent: query_expenses, time_range: this_week, confidence: high
"apa aja pengeluaran hari ini?" → intent: query_details, time_range: today, confidence: high
"tolong detailkan" → intent: query_details, time_range: today, confidence: medium
"tambah 50000 makan siang" → intent: add_transaction, amount: 50000, description: "makan siang", category_hint: "Food", confidence: high
"pengeluaran" → intent: query_expenses, confidence: low, clarification_needed: "Periode mana? (hari ini/minggu ini/bulan ini)"
`.trim();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean response - remove markdown if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON
        const parsedIntent: ParsedIntent = JSON.parse(cleanText);

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
