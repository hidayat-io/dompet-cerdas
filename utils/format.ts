/**
 * Format angka ke format Rupiah standar Indonesia dengan titik separator ribuan yang konsisten.
 * Contoh: 733021 -> "Rp 733.021"
 * Contoh: -50000 -> "-Rp 50.000"
 * Contoh: 0 -> "Rp 0"
 */
export const formatRp = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
    const isNegative = val < 0;
    const absVal = Math.abs(Math.round(val));
    const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
};

/**
 * Format string input angka dengan titik ribuan saat diketik di TextField.
 * Contoh: "733021" -> "733.021"
 */
export const formatRupiahInput = (val: string): string => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    return parseInt(clean, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
