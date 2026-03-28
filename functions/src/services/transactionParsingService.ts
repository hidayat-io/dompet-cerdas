import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ParsedTransactionDraft {
    amount: number;
    description: string;
    category_hint?: string;
    sourceText: string;
}

export interface HybridTransactionParseResult {
    items: ParsedTransactionDraft[];
    usedAI: boolean;
    confidence: 'high' | 'medium' | 'low';
    clarificationNeeded?: string;
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
    'boros',
    'gimana',
    'bagaimana',
    'tips',
    'saran',
    'analisa',
    'analisis',
];

const ENTRY_PREFIX_REGEX = /^(tambah(?:in)?|catat(?:kan)?|input|masukin|masukan|record|log)\s+/i;
const AMOUNT_REGEX = /(?:rp\s*|idr\s*)?\d[\d.,]*\s*(?:k|rb|ribu|jt|juta|m|milyar|miliar)?\b/gi;
const LOCAL_MULTI_ENTRY_SEPARATOR_REGEX = /\s+(?:dan|lalu|terus|trus|&)\s+/i;
const MAX_PARSED_TRANSACTION_ITEMS = 20;

function containsQueryKeywords(message: string): boolean {
    const lower = message.toLowerCase();
    return QUERY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function hasAmountLikeToken(message: string): boolean {
    return AMOUNT_REGEX.test(message);
}

function resetAmountRegex() {
    AMOUNT_REGEX.lastIndex = 0;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumberString(raw: string, hasSuffix: boolean): number | null {
    if (!raw) return null;

    if (hasSuffix) {
        const normalized = raw.replace(/,/g, '.');
        const value = parseFloat(normalized);
        return Number.isFinite(value) ? value : null;
    }

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

function normalizeParsedAmount(rawAmount: unknown): number | null {
    if (typeof rawAmount === 'number') {
        return Number.isFinite(rawAmount) && rawAmount > 0
            ? Math.round(rawAmount)
            : null;
    }

    if (typeof rawAmount === 'string') {
        return parseAmountToken(rawAmount.trim());
    }

    return null;
}

function normalizeCategoryHint(rawHint: unknown, description: string): string | undefined {
    if (typeof rawHint === 'string' && rawHint.trim()) {
        return rawHint.trim();
    }

    return inferCategoryHint(description);
}

function extractCategoryKeyword(message: string): { cleanedMessage: string; categoryHint?: string } {
    const keywordRegex = /\b(cat|categ|category|kategori|kat|ktg|ktgr|kate)\b\s*[:\-]?\s*([a-zA-ZÀ-ÿ0-9]+(?:\s+[a-zA-ZÀ-ÿ0-9]+){0,2})/i;
    const match = message.match(keywordRegex);
    if (!match) {
        return { cleanedMessage: message };
    }

    const categoryHint = match[2]?.trim();
    const cleanedMessage = message
        .replace(match[0], ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return { cleanedMessage, categoryHint };
}

function inferCategoryHint(description: string, currentHint?: string): string | undefined {
    if (currentHint) return currentHint;

    const lowerDesc = description.toLowerCase();
    if (/makan|sarapan|breakfast|lunch|dinner|warteg|warung|kopi|cafe|resto|restaurant|snack|camil|camilan|keripik|chips|roti|ayam|nasi|minum/.test(lowerDesc)) {
        return 'Food';
    }
    if (/grab|gojek|ojek|bus|kereta|taxi|tol|parkir|bensin|bbm|pertamina|transport/.test(lowerDesc)) {
        return 'Transportation';
    }
    if (/belanja|shopping|market|minimarket|indomaret|alfamart|supermarket|mall/.test(lowerDesc)) {
        return 'Shopping';
    }
    if (/tagihan|bill|bayar\s+hutang|bayar\s+utang|hutang|utang|cicilan|kredit|pinjaman/.test(lowerDesc)) {
        return 'Bill';
    }
    if (/gaji|salary|fee|bayaran|komisi|bonus|thr|income|pemasukan/.test(lowerDesc)) {
        return 'Income';
    }

    return undefined;
}

function cleanEntryPrefix(segment: string): string {
    return segment.replace(ENTRY_PREFIX_REGEX, '').trim();
}

function splitCandidateSegments(message: string): string[] {
    const normalized = message
        .replace(/\n+/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const amountMatches = normalized.match(AMOUNT_REGEX) || [];
    resetAmountRegex();

    let rawSegments: string[] = [normalized];

    if (normalized.includes('\n')) {
        rawSegments = normalized.split('\n');
    } else if (normalized.includes(';')) {
        rawSegments = normalized.split(';');
    } else if (amountMatches.length > 1 && normalized.includes(',')) {
        rawSegments = normalized.split(',');
    } else if (amountMatches.length > 1 && LOCAL_MULTI_ENTRY_SEPARATOR_REGEX.test(normalized)) {
        rawSegments = normalized.split(LOCAL_MULTI_ENTRY_SEPARATOR_REGEX);
    }

    return rawSegments
        .map((segment) => cleanEntryPrefix(segment).trim())
        .filter(Boolean);
}

function extractManualTransactionLocal(segment: string): ParsedTransactionDraft | null {
    const { cleanedMessage, categoryHint } = extractCategoryKeyword(segment);
    const matchAll = [...cleanedMessage.matchAll(AMOUNT_REGEX)];
    resetAmountRegex();

    if (matchAll.length !== 1) return null;

    const amountToken = matchAll[0][0];
    const amount = parseAmountToken(amountToken);
    if (!amount || amount <= 0) return null;

    const tokenRegex = new RegExp(escapeRegex(amountToken), 'gi');
    const description = cleanedMessage
        .replace(tokenRegex, ' ')
        .replace(/[\s:;\-–—]+$/g, '')
        .trim();

    if (!description) return null;

    return {
        amount,
        description,
        category_hint: inferCategoryHint(description, categoryHint),
        sourceText: segment,
    };
}

function parseLocally(message: string): HybridTransactionParseResult | null {
    const segments = splitCandidateSegments(message);
    if (segments.length === 0) return null;

    const items = segments
        .map((segment) => extractManualTransactionLocal(segment))
        .filter((item): item is ParsedTransactionDraft => !!item);

    if (items.length === 0 || items.length !== segments.length) {
        return null;
    }

    return {
        items,
        usedAI: false,
        confidence: items.length === 1 ? 'high' : 'medium',
    };
}

export function normalizeParsedTransactionDrafts(
    items: Array<{ amount?: unknown; description?: unknown; category_hint?: unknown }>,
    fallbackSourceText?: string
): ParsedTransactionDraft[] {
    return items
        .map((item): ParsedTransactionDraft | null => {
            const description = typeof item.description === 'string'
                ? item.description.trim()
                : '';
            const amount = normalizeParsedAmount(item.amount);
            const categoryHint = normalizeCategoryHint(item.category_hint, description);

            if (!description || !amount) {
                return null;
            }

            return {
                amount,
                description,
                sourceText: fallbackSourceText?.trim() || description,
                ...(categoryHint ? { category_hint: categoryHint } : {}),
            };
        })
        .filter((item): item is ParsedTransactionDraft => item !== null)
        .slice(0, MAX_PARSED_TRANSACTION_ITEMS);
}

async function parseWithAI(message: string): Promise<HybridTransactionParseResult | null> {
    if (!GEMINI_API_KEY) {
        return null;
    }

    const prompt = `
Kamu membantu parse input transaksi untuk aplikasi keuangan pribadi.

Tugas:
- Baca pesan user berbahasa Indonesia.
- Jika isinya adalah satu atau beberapa transaksi, extract semuanya.
- Jika pesannya bukan input transaksi, return transactions kosong.
- Jangan jawab teks biasa. Return JSON valid saja.

User message:
"${message}"

Format output:
{
  "transactions": [
    {
      "amount": 25000,
      "description": "makan siang",
      "category_hint": "Food"
    }
  ],
  "confidence": "high | medium | low",
  "clarification_needed": null
}

Rules:
- Pahami format informal: 25rb, 2,5jt, 100 ribu, rp 20.000
- Kalau ada banyak transaksi, pecah jadi array
- Deskripsi harus singkat dan bersih
- category_hint boleh null jika tidak yakin
- Kalau pesannya ambigu sekali, return transactions kosong dan isi clarification_needed
- Jangan buat transaksi palsu kalau amount tidak jelas

Contoh:
"makan 25rb, parkir 5rb" ->
{
  "transactions": [
    { "amount": 25000, "description": "makan", "category_hint": "Food" },
    { "amount": 5000, "description": "parkir", "category_hint": "Transportation" }
  ],
  "confidence": "high",
  "clarification_needed": null
}

"berapa pengeluaran minggu ini?" ->
{
  "transactions": [],
  "confidence": "low",
  "clarification_needed": null
}
`.trim();

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        const jsonString = firstBrace !== -1 && lastBrace !== -1
            ? response.slice(firstBrace, lastBrace + 1)
            : response.trim();
        const parsed = JSON.parse(jsonString) as {
            transactions?: Array<{ amount?: number; description?: string; category_hint?: string | null }>;
            confidence?: 'high' | 'medium' | 'low';
            clarification_needed?: string | null;
        };

        const items = normalizeParsedTransactionDrafts(parsed.transactions || [], message);

        if (items.length === 0) {
            return parsed.clarification_needed
                ? {
                    items: [],
                    usedAI: true,
                    confidence: parsed.confidence || 'low',
                    clarificationNeeded: parsed.clarification_needed,
                }
                : null;
        }

        return {
            items,
            usedAI: true,
            confidence: parsed.confidence || 'medium',
            clarificationNeeded: parsed.clarification_needed || undefined,
        };
    } catch (error) {
        console.error('AI transaction parsing failed:', error);
        return null;
    }
}

export function shouldAttemptTransactionParsing(message: string): boolean {
    const trimmed = message.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('/')) return false;
    if (/[?？]/.test(trimmed)) return false;
    resetAmountRegex();
    if (!hasAmountLikeToken(trimmed)) {
        resetAmountRegex();
        return false;
    }
    resetAmountRegex();

    const lower = trimmed.toLowerCase();
    const hasExplicitEntryVerb = /^(tambah(?:in)?|catat(?:kan)?|input|masukin|masukan)\b/.test(lower);

    if (containsQueryKeywords(trimmed) && !hasExplicitEntryVerb) {
        return false;
    }

    return true;
}

export async function parseTransactionMessageHybrid(message: string): Promise<HybridTransactionParseResult | null> {
    if (!shouldAttemptTransactionParsing(message)) {
        return null;
    }

    const localResult = parseLocally(message);
    if (localResult) {
        return localResult;
    }

    return parseWithAI(message);
}
