/**
 * Gemini AI Service
 * Handles receipt analysis using Gemini Vision API
 */

import { GoogleGenAI } from '@google/genai';
import { escapeMarkdown } from './responseFormatter';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export function logGeminiError(operation: string, model: string, error: unknown): void {
    const candidate = error as {
        status?: unknown;
        code?: unknown;
        message?: unknown;
        response?: { status?: unknown; data?: unknown; body?: unknown; text?: unknown };
        body?: unknown;
        data?: unknown;
    };
    const body = candidate.response?.data ?? candidate.response?.body ?? candidate.response?.text ?? candidate.body ?? candidate.data;

    console.error('[Gemini] operation failed', {
        operation,
        model,
        status: candidate.status ?? candidate.response?.status,
        code: candidate.code,
        message: candidate.message ?? (error instanceof Error ? error.message : String(error)),
        body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Receipt data structure returned by Gemini Vision
 */
/**
 * Receipt data structure returned by Gemini Vision
 */
export interface ReceiptData {
    merchant: string;
    totalAmount: number;
    date: string; // YYYY-MM-DD format
    items?: string[];
    categorySuggestion: string;
    receiptType: 'retail' | 'restaurant' | 'transport' | 'bill' | 'other';
    confidence: 'high' | 'medium' | 'low';
    currency: string;
    notes?: string;
    is_receipt?: boolean;
}

export interface FinancialInsightsResult {
    text: string;
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
}

export async function transcribeAudioToText(audioBuffer: Buffer, mimeType: string): Promise<string> {
    try {
        const prompt = `
Transkripsikan audio bahasa Indonesia ini menjadi teks singkat yang mudah diparse untuk catatan transaksi.

Aturan:
- Return teks biasa saja, tanpa markdown, tanpa penjelasan tambahan.
- Jika ada beberapa transaksi, pisahkan dengan koma.
- Pertahankan nominal agar mudah dipahami, misalnya: 25rb, 10 ribu, 2,5 juta.
- Jika audio terlalu tidak jelas untuk ditranskripsikan, return string kosong.
`.trim();

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                prompt,
                {
                    inlineData: {
                        data: audioBuffer.toString('base64'),
                        mimeType,
                    }
                }
            ]
        });

        return (result.text || '').replace(/```[\s\S]*?```/g, '').trim();
    } catch (error) {
        logGeminiError('transcribeAudioToText', GEMINI_MODEL, error);
        throw new Error('Failed to transcribe audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}

/**
 * Analyze receipt image using Gemini Vision API
 * @param imageBuffer - Image buffer from Telegram
 * @returns Extracted receipt data
 */
export async function analyzeReceipt(imageBuffer: Buffer): Promise<ReceiptData> {
    try {
        const prompt = `
Analyze this Indonesian receipt image and extract transaction information.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "is_receipt": boolean (true if image is a receipt/invoice/bill, false otherwise),
  "merchant": "store/restaurant name",
  "totalAmount": number (final total only, not subtotals. Return 0 if not found),
  "date": "YYYY-MM-DD" (if found, else today's date),
  "items": ["item1", "item2"],
  "categorySuggestion": "Makanan | Belanja Harian | Transport | Kesehatan | Hiburan | Tagihan | Lainnya",
  "receiptType": "retail | restaurant | transport | bill | other",
  "confidence": "high | medium | low",
  "currency": "IDR",
  "notes": "any special observations"
}

Rules:
1. Set "is_receipt" to false if the image does not look like a shopping receipt, invoice, or payment proof.
2. Extract ONLY the final total (Grand Total / Total Bayar / Total).
3. Ignore tax, service charge, subtotals individually.
4. If date not found, use today's date.
5. Suggest category based on merchant type and items.
6. For handwritten receipts, mark confidence as "medium" or "low".
7. Return only the JSON object, no other text.

Examples:
- Indomaret receipt → category: "Belanja Harian", type: "retail"
- Restaurant receipt → category: "Makanan", type: "restaurant"
- Grab/Gojek receipt → category: "Transport", type: "transport"
- PLN/PDAM bill → category: "Tagihan", type: "bill"
- Cat photo → is_receipt: false
`.trim();

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                prompt,
                {
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                }
            ]
        });

        const text = result.text || '';

        // Clean response - remove markdown code blocks if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON response
        const receiptData: ReceiptData = JSON.parse(cleanText);

        // Validation happens in the bot handler now
        return receiptData;

    } catch (error) {
        logGeminiError('analyzeReceipt', GEMINI_MODEL, error);
        throw new Error('Failed to analyze receipt: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}

/**
 * Format receipt data for display
 */
export function formatReceiptData(data: ReceiptData, caption?: string, categoryOverride?: string): string {
    const formattedAmount = data.totalAmount.toLocaleString('id-ID');
    const displayCategory = categoryOverride && categoryOverride.trim()
        ? categoryOverride.trim()
        : data.categorySuggestion;

    let message = `📸 *Struk berhasil dianalisis!*

💰 Total: Rp ${formattedAmount}
🏪 Merchant: ${escapeMarkdown(data.merchant)}
📅 Tanggal: ${formatDate(data.date)}
🏷️ Kategori: ${escapeMarkdown(displayCategory)}`;

    // Add caption/description if provided
    if (caption && caption.trim()) {
        message += `\n📝 Deskripsi: _${escapeMarkdown(caption.trim())}_`;
    }

    // Add items if available
    if (data.items && data.items.length > 0) {
        const escapedItems = data.items.slice(0, 3).map(item => escapeMarkdown(item)).join(', ');
        message += `\n\n📦 Items: ${escapedItems}${data.items.length > 3 ? '...' : ''}`;
    }

    // Add confidence level
    message += `\n\n${data.confidence === 'high' ? '✅ Confidence: High' : data.confidence === 'medium' ? '⚠️ Confidence: Medium - mohon cek kembali' : '❌ Confidence: Low - harap verifikasi manual'}`;

    message += `\n\nApakah data sudah benar?`;

    return message;
}

/**
 * Format date to Indonesian format
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
}

/**
 * Generate financial insights using Gemini AI
 * Optimized for financial advisor with strict scope limiting
 * Updated: Using stable gemini-2.5-flash model (Jan 2026)
 */
export async function generateFinancialInsights(dataPrompt: string): Promise<string> {
    const result = await generateFinancialInsightsWithUsage(dataPrompt);
    return result.text;
}

/**
 * Generate financial insights and return token usage metadata when available.
 */
export async function generateFinancialInsightsWithUsage(dataPrompt: string): Promise<FinancialInsightsResult> {
    try {
        const systemInstruction = `Kamu adalah AI Financial Advisor untuk DompetCerdas, aplikasi manajemen keuangan personal.

ATURAN KETAT (WAJIB DIIKUTI):
1. Kamu HANYA boleh menganalisis data transaksi yang diberikan user
2. JANGAN jawab pertanyaan tentang:
   - Investasi saham/crypto/reksadana/trading
   - Berita ekonomi/politik/sosial
   - Topik di luar manajemen keuangan personal user
   - Hal-hal tidak berhubungan dengan data transaksi yang diberikan
   - Pertanyaan umum tentang finansial yang tidak spesifik ke data user

3. Jika user tanya off-topic atau data tidak cukup, jawab:
   "Maaf, saya hanya bisa menganalisis data transaksi keuangan yang tersedia. Ketik /help untuk panduan."

4. Format output:
   - Bahasa Indonesia casual tapi profesional
   - Gunakan emoji untuk readability (📊 💡 💰 🎯 ✅ ⚠️)
   - Max 500 kata per response
   - Fokus pada actionable insights, bukan general advice
   - Berikan estimasi penghematan konkret dalam Rupiah
   - Sebutkan kategori & nominal spesifik dari DATA

5. Struktur jawaban standar:
   📊 Summary (ringkas 1-2 kalimat)
   💡 Key Insights (2-4 poin berdasarkan data)
   💰 Rekomendasi (3-5 action items konkret)
   🎯 Quick Wins (1-2 tips termudah)

6. JANGAN:
   - Membuat asumsi di luar data yang diberikan
   - Memberikan saran investasi
   - Membahas topik politik/agama/sosial
   - Menggunakan bahasa formal kaku
   - Memberikan saran umum seperti "sebaiknya menabung" tanpa data spesifik

7. DO:
   - Analisa pola spending dari data
   - Identifikasi outlier & anomali
   - Berikan rekomendasi spesifik dengan estimasi saving
   - Referensi kategori & transaksi konkret
   - Gunakan bahasa yang encouraging tapi honest`;

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: dataPrompt,
            config: {
                systemInstruction,
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.9,
                topK: 40
            }
        });
        const response = result.text || '';
        const usage = result.usageMetadata;
        const estimatedPromptTokens = Math.ceil(dataPrompt.length / 4);
        const estimatedResponseTokens = Math.ceil(response.length / 4);
        const promptTokens = usage?.promptTokenCount ?? estimatedPromptTokens;
        const candidateTokens = usage?.candidatesTokenCount ?? estimatedResponseTokens;
        const totalTokens = usage?.totalTokenCount ?? (promptTokens + candidateTokens);
        
        // Validate response is not off-topic
        if (isOffTopicResponse(response)) {
            return {
                text: "Maaf, terjadi kesalahan dalam analisis. Pastikan pertanyaan kamu terkait data transaksi keuangan. Ketik /help untuk panduan.",
                promptTokens,
                candidateTokens,
                totalTokens
            };
        }
        
        return {
            text: response,
            promptTokens,
            candidateTokens,
            totalTokens
        };
        
    } catch (error) {
        logGeminiError('generateFinancialInsightsWithUsage', GEMINI_MODEL, error);
        throw new Error('Gagal menghasilkan insight keuangan. Coba lagi atau hubungi support.');
    }
}

/**
 * Check if response is off-topic (hallucination detection)
 */
function isOffTopicResponse(response: string): boolean {
    const offTopicKeywords = [
        'investasi saham',
        'beli saham',
        'cryptocurrency',
        'bitcoin',
        'crypto',
        'trading forex',
        'politik',
        'pemerintah',
        'pemilu',
        'pilpres',
        'i don\'t have access',
        'i cannot access',
        'i am unable to',
        'as an ai',
        'i\'m sorry, but'
    ];
    
    const lower = response.toLowerCase();
    return offTopicKeywords.some(kw => lower.includes(kw));
}
