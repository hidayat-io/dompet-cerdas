/**
 * Gemini AI Service
 * Handles receipt analysis using Gemini Vision API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
  "merchant": "store/restaurant name",
  "totalAmount": number (final total only, not subtotals),
  "date": "YYYY-MM-DD" (if found, else today's date),
  "items": ["item1", "item2"],
  "categorySuggestion": "Makanan | Belanja Harian | Transport | Kesehatan | Hiburan | Tagihan | Lainnya",
  "receiptType": "retail | restaurant | transport | bill | other",
  "confidence": "high | medium | low",
  "currency": "IDR",
  "notes": "any special observations"
}

Rules:
1. Extract ONLY the final total (Grand Total / Total Bayar / Total)
2. Ignore tax, service charge, subtotals individually
3. If date not found, use today's date
4. Suggest category based on merchant type and items
5. For handwritten receipts, mark confidence as "medium" or "low"
6. Return only the JSON object, no other text

Examples:
- Indomaret receipt → category: "Belanja Harian", type: "retail"
- Restaurant receipt → category: "Makanan", type: "restaurant"
- Grab/Gojek receipt → category: "Transport", type: "transport"
- PLN/PDAM bill → category: "Tagihan", type: "bill"
`.trim();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            }
        ]);

        const response = result.response;
        const text = response.text();

        // Clean response - remove markdown code blocks if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse JSON response
        const receiptData: ReceiptData = JSON.parse(cleanText);

        // Validate required fields
        if (!receiptData.merchant || !receiptData.totalAmount) {
            throw new Error('Missing required fields in vision response');
        }

        return receiptData;

    } catch (error) {
        console.error('Error analyzing receipt:', error);
        throw new Error('Failed to analyze receipt: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}

/**
 * Format receipt data for display
 */
export function formatReceiptData(data: ReceiptData): string {
    const formattedAmount = data.totalAmount.toLocaleString('id-ID');

    return `📸 *Struk berhasil dianalisis!*

💰 Total: Rp ${formattedAmount}
🏪 Merchant: ${data.merchant}
📅 Tanggal: ${formatDate(data.date)}
🏷️ Kategori: ${data.categorySuggestion}
${data.items && data.items.length > 0 ? `\n📝 Items: ${data.items.slice(0, 3).join(', ')}${data.items.length > 3 ? '...' : ''}` : ''}

${data.confidence === 'high' ? '✅ Confidence: High' : data.confidence === 'medium' ? '⚠️ Confidence: Medium - mohon cek kembali' : '❌ Confidence: Low - harap verifikasi manual'}

Apakah data sudah benar?`;
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
