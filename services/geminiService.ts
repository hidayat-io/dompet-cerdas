import { GoogleGenAI } from "@google/genai";
import { Transaction, Category } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[]
): Promise<string> => {
  if (!apiKey) {
    return "API Key belum dikonfigurasi. Silakan atur process.env.API_KEY untuk menggunakan fitur analisis AI.";
  }

  // Prepare data context
  const categoriesMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  const dataSummary = transactions.map(t => ({
    date: t.date,
    amount: t.amount,
    category: categoriesMap[t.categoryId] || 'Unknown',
    desc: t.description
  })).slice(0, 50); // Limit to last 50 for token efficiency

  const prompt = `
    Bertindaklah sebagai penasihat keuangan pribadi yang bijak.
    Saya memiliki data transaksi berikut (dalam format JSON):
    ${JSON.stringify(dataSummary)}
    
    Tolong berikan analisis singkat dan 3 saran praktis dalam Bahasa Indonesia untuk memperbaiki kesehatan finansial saya.
    Fokus pada kategori pengeluaran terbesar atau pola yang tidak biasa.
    Gunakan format markdown yang rapi.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Maaf, saya tidak dapat menghasilkan analisis saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI.";
  }
};