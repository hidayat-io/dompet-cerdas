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

export const validateCategoryWithAI = async (
  newName: string,
  existingCategories: Category[]
): Promise<string[]> => {
  if (!apiKey) return [];

  // Optimization: If list is empty, no need to check
  if (existingCategories.length === 0) return [];

  const categoryNames = existingCategories.map(c => c.name).join(", ");

  const prompt = `
    Bertindaklah sebagai sistem validasi data yang cerdas.
    Tugas Anda adalah mengecek apakah nama kategori baru yang diinput user memiliki kemiripan makna (sinonim) atau kemiripan penulisan (typo) dengan daftar kategori yang sudah ada.

    Kategori Baru: "${newName}"
    Daftar Kategori Existing: [${categoryNames}]

    Instruksi:
    1. Bandingkan "Kategori Baru" dengan setiap item di "Daftar Kategori Existing".
    2. Cari yang artinya SAMA PERCIS, MIRIP (Synonym), atau TYPO (e.g. "Fud" vs "Food", "Bill" vs "Tagihan").
    3. Jika dtemukan kemiripan yang signifikan, sebutkan nama kategori existing tersebut.
    4. JANGAN sebutkan jika maknanya berbeda jauh (misal "Investasi" vs "Makan" itu beda).
    5. Outputkan HANYA dalam format JSON Array string berisi nama-nama kategori existing yang konflik. Contoh: ["Makan", "Jajan"].
    6. Jika tidak ada yang mirip, outputkan array kosong: [].
    
    Hanya outputkan JSON murni tanpa markdown block.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    // Clean up markdown code blocks if any
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return [];
  }
};