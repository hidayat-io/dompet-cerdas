// Pengganti services/geminiService.ts di harness.
export const scanReceiptImage = async (): Promise<never> => {
  throw new Error('harness: scan struk tidak tersedia');
};
