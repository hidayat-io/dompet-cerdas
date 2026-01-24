import { Category } from '../types';

// Group common synonyms for financial categories
// Keys are the "canonical" concept, values are arrays of synonyms (case-insensitive)
const SYNONYM_GROUPS: Record<string, string[]> = {
    'makan': ['makan', 'makanan', 'food', 'foods', 'meal', 'meals', 'snack', 'snacks', 'jajan', 'jajanan', 'f&b', 'food and beverage', 'fnb', 'food n beverage', 'food & beverage'],
    'transport': ['transport', 'transportasi', 'kendaraan', 'bensin', 'parkir', 'ojek', 'grab', 'gojek', 'uber', 'taxi', 'travel', 'commute', 'gas'],
    'tagihan': ['tagihan', 'bill', 'bills', 'listrik', 'air', 'internet', 'wifi', 'pln', 'pdam', 'telkom', 'utility', 'utilities'],
    'belanja': ['belanja', 'shopping', 'groceries', 'grocery', 'kebutuhan', 'mart', 'supermarket', 'mall'],
    'hiburan': ['hiburan', 'entertainment', 'nonton', 'movie', 'bioskop', 'game', 'games', 'netflix', 'spotify', 'subscription', 'langganan', 'healing'],
    'gaji': ['gaji', 'salary', 'income', 'pendapatan', 'pemasukan', 'upah', 'honor', 'bonus', 'thr'],
    'kesehatan': ['kesehatan', 'health', 'obat', 'dokter', 'rumahsakit', 'hospital', 'medis', 'medical', 'apotek'],
    'pendidikan': ['pendidikan', 'education', 'sekolah', 'school', 'kuliah', 'college', 'kursus', 'course', 'buku', 'book', 'books'],
    'asuransi': ['asuransi', 'insurance', 'bpjs', 'proteksi'],
    'amal': ['amal', 'donasi', 'sedekah', 'zakat', 'infaq', 'charity', 'donation', 'gift'],
    'investasi': ['investasi', 'investment', 'saham', 'reksadana', 'crypto', 'gold', 'emas', 'saving', 'tabungan'],
    'cicilan': ['cicilan', 'kredit', 'loan', 'hutang', 'debt', 'cicil'],
};

// Calculate Levenshtein distance for typo detection
const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,       // deletion
                matrix[i][j - 1] + 1,       // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
};

export interface SimilarityResult {
    isSimilar: boolean;
    conflictingCategories: Category[];
    message?: string;
}

export const checkCategorySimilarity = (
    newName: string,
    existingCategories: Category[]
): SimilarityResult => {
    const normalizedNewName = newName.trim().toLowerCase();
    const conflicts: Category[] = [];

    for (const category of existingCategories) {
        const normalizedExistingName = category.name.trim().toLowerCase();
        let isMatch = false;

        // 1. Exact Match Check
        if (normalizedNewName === normalizedExistingName) {
            isMatch = true;
        }

        // 2. Synonym Check
        if (!isMatch) {
            for (const groupKey in SYNONYM_GROUPS) {
                const synonyms = SYNONYM_GROUPS[groupKey];
                const isNewNameInGroup = synonyms.includes(normalizedNewName);
                const isExistingInGroup = synonyms.includes(normalizedExistingName);

                if (isNewNameInGroup && isExistingInGroup) {
                    isMatch = true;
                    break;
                }
            }
        }

        // 3. Levenshtein Distance Check (for typos)
        if (!isMatch) {
            const distanceThreshold = normalizedNewName.length < 5 ? 1 : 2;
            const distance = levenshteinDistance(normalizedNewName, normalizedExistingName);

            if (distance <= distanceThreshold) {
                isMatch = true;
            }
        }

        if (isMatch) {
            conflicts.push(category);
        }
    }

    if (conflicts.length > 0) {
        return {
            isSimilar: true,
            conflictingCategories: conflicts,
            message: `Kategori "${newName}" mirip dengan kategori existing:`
        };
    }

    return { isSimilar: false, conflictingCategories: [] };
};
