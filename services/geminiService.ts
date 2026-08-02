import { callCloudFunction } from "./firebaseRuntime";
import { Category, ReceiptScanResult, Transaction } from "../types";

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
  _newName: string,
  _existingCategories: Category[]
): Promise<string[]> => {
  return [];
};

export const scanReceiptImage = async (compressedFile: File): Promise<ReceiptScanResult> => {
  const validScanTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validScanTypes.includes(compressedFile.type)) {
    throw new Error("Hanya file foto (JPG, PNG, WEBP) yang didukung untuk scan struk.");
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(compressedFile);
  });

  return callCloudFunction<{ imageBase64: string; mimeType: string }, ReceiptScanResult>(
    "scanReceipt",
    { imageBase64: base64, mimeType: "image/jpeg" }
  );
};
