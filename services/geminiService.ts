import { GoogleGenAI } from "@google/genai";
import { callCloudFunction } from "./firebaseRuntime";
import { Category, Transaction } from "../types";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";

const createAiClient = () => {
  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

export type FinancialAnalysisMode = "HEALTH" | "SPENDING" | "SAVINGS";

type CategorySummary = {
  name: string;
  total: number;
  count: number;
  percentage: number;
};

type MonthSummary = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export interface FinancialAnalysisResult {
  mode: FinancialAnalysisMode;
  markdown: string;
  summary: {
    totalTransactions: number;
    totalTransactionsAnalyzed: number;
    analyzedDateRange: {
      start: string;
      end: string;
    } | null;
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
  usage?: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
    remainingDailyTokens: number;
    dailyTokenLimit: number;
  };
}

export const getFinancialAdvice = async (
  _transactions: Transaction[],
  _categories: Category[],
  mode: FinancialAnalysisMode = "HEALTH"
): Promise<FinancialAnalysisResult> => {
  return callCloudFunction<{ mode: FinancialAnalysisMode }, FinancialAnalysisResult>(
    "analyzeFinancialData",
    { mode }
  );
};

export const validateCategoryWithAI = async (
  newName: string,
  existingCategories: Category[]
): Promise<string[]> => {
  const ai = createAiClient();
  if (!ai) return [];

  if (existingCategories.length === 0) return [];

  const categoryNames = existingCategories.map((category) => category.name).join(", ");

  const prompt = `
    Bertindaklah sebagai sistem validasi data yang cerdas.
    Tugas Anda adalah mengecek apakah nama kategori baru yang diinput user memiliki kemiripan makna (sinonim) atau kemiripan penulisan (typo) dengan daftar kategori yang sudah ada.

    Kategori Baru: "${newName}"
    Daftar Kategori Existing: [${categoryNames}]

    Instruksi:
    1. Bandingkan "Kategori Baru" dengan setiap item di "Daftar Kategori Existing".
    2. Cari yang artinya SAMA PERSIS, MIRIP (sinonim), atau TYPO.
    3. Jika ditemukan kemiripan yang signifikan, sebutkan nama kategori existing tersebut.
    4. Jangan sebutkan jika maknanya berbeda jauh.
    5. Outputkan HANYA JSON Array string berisi nama kategori existing yang konflik.
    6. Jika tidak ada yang mirip, outputkan [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const text = response.text || "[]";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return [];
  }
};
