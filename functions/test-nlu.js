/**
 * NLU Test Script
 * Run this before every deployment to ensure all features work correctly
 *
 * Usage: node test-nlu.js
 */

// Simulate the detectSimpleIntent function logic
function detectSimpleIntent(message) {
    const lower = message.toLowerCase().trim();
    const currentYear = new Date().getFullYear();

    // Helper to parse Indonesian months
    const monthMap = {
        'jan': '01', 'januari': '01',
        'feb': '02', 'februari': '02',
        'mar': '03', 'maret': '03',
        'apr': '04', 'april': '04',
        'mei': '05',
        'jun': '06', 'juni': '06',
        'jul': '07', 'juli': '07',
        'agt': '08', 'agustus': '08',
        'sep': '09', 'september': '09',
        'okt': '10', 'oktober': '10',
        'nov': '11', 'november': '11',
        'des': '12', 'desember': '12'
    };

    // Extract specific date
    let specific_date;

    // Pattern 1: DD Month (e.g., "27 jan")
    const dateMonthMatch = lower.match(/\b(\d{1,2})\s+(jan|januari|feb|februari|mar|maret|apr|april|mei|jun|juni|jul|juli|agt|agustus|sep|september|okt|oktober|nov|november|des|desember)\b/i);
    if (dateMonthMatch) {
        const day = dateMonthMatch[1].padStart(2, '0');
        const monthStr = dateMonthMatch[2];
        const month = monthMap[monthStr];
        specific_date = `${currentYear}-${month}-${day}`;
    }

    // Pattern 2: "tgl 27" / "tanggal 27"
    if (!specific_date) {
        const tglMatch = lower.match(/\b(?:tgl|tanggal)\s+(\d{1,2})\b/i);
        if (tglMatch) {
            const day = tglMatch[1].padStart(2, '0');
            const now = new Date();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            specific_date = `${now.getFullYear()}-${month}-${day}`;
        }
    }

    // Balance queries
    if (/^(berapa\s+)?(saldo|balance|sisa\s+uang)(\s+(sekarang|saya|kamu|aku|gw))?(\s+berapa)?$/i.test(lower)) {
        return { intent: 'query_balance', confidence: 'high', parameters: {} };
    }

    // Balance with time range
    if (/saldo|balance|sisa\s+uang/.test(lower)) {
        let time_range;
        if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        if (time_range) {
            return { intent: 'query_balance', confidence: 'high', parameters: { time_range } };
        }
    }

    // Transaction details / list queries (check BEFORE expense/income queries for "detail pengeluaran")
    if (/transaksi|trans\b|detail|rincian|apa\s+aja|apa\s+saja|list|tampilkan|lihat|show|tunjukkan/i.test(lower)) {
        let time_range;
        
        // Check for "N hari terakhir" pattern first (e.g., "detail pengeluaran 7 hari terakhir") - maps to last_week
        if (/\d+\s+hari\s+ter[a-z]+/i.test(lower)) {
            time_range = 'last_week'; // Last 7 days including today
        } else if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        // Extract category filter
        let category_filter;
        const categoryMatch = lower.match(/kategori\s+(\w+)/i);
        if (categoryMatch) {
            category_filter = categoryMatch[1];
        }

        // Direct category name mentions
        if (!category_filter) {
            const categoryNames = [
                { pattern: /\bfood\b|\bmakan(an)?\b/i, name: 'Food' },
                { pattern: /\bshopping\b|\bbelanja\b/i, name: 'Shopping' },
                { pattern: /\bbill\b|\btagihan\b/i, name: 'Bill' },
                { pattern: /\btransport(asi)?\b|\bgojek\b|\bgrab\b/i, name: 'Transportation' },
                { pattern: /\bentertainment\b|\bhiburan\b/i, name: 'Entertainment' },
                { pattern: /\bhealth\b|\bkesehatan\b/i, name: 'Health' },
            ];
            for (const cat of categoryNames) {
                if (cat.pattern.test(lower)) {
                    category_filter = cat.name;
                    break;
                }
            }
        }

        // Extract limit and sort_by
        let limit;
        let sort_by;

        // Pattern for "tertinggi/terbesar" (highest by amount)
        const highestMatch = lower.match(/(?:^|\s)(\d+)\s+(?:transaksi|trans|pengeluaran)?\s*(?:tertinggi|terbesar|terbanyak)/i);
        if (highestMatch) {
            limit = parseInt(highestMatch[1], 10);
            sort_by = 'amount';
        }

        // Pattern for "top N" (usually means highest) - check BEFORE terakhir
        if (!limit) {
            const topMatch = lower.match(/top\s+(\d+)/i);
            if (topMatch) {
                limit = parseInt(topMatch[1], 10);
                sort_by = 'amount';
            }
        }

        // Pattern for "terakhir" (recent by date) - only if not already matched
        if (!limit) {
            const recentMatch = lower.match(/(?:^|\s)(\d+)\s+(?:transaksi|trans|item|data)?\s*terakhir|last\s+(\d+)/i);
            if (recentMatch) {
                const numStr = recentMatch.slice(1).find(v => v !== undefined);
                if (numStr) {
                    limit = parseInt(numStr, 10);
                    sort_by = 'date';
                }
            }
        }

        return {
            intent: 'query_details',
            confidence: 'high',
            parameters: {
                time_range: specific_date ? undefined : (time_range || 'this_week'),
                category_filter,
                limit,
                specific_date,
                sort_by
            }
        };
    }

    // Expense queries - more flexible pattern
    if (/pengeluaran/.test(lower)) {
        // Check if it's an expense query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);

        // If it has "pengeluaran" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range;
            
            // Check for "N hari terakhir" pattern (e.g., "7 hari terakhir") - maps to last_week
            if (/\d+\s+hari\s+ter[a-z]+/i.test(lower)) {
                time_range = 'last_week'; // Last 7 days including today
            } else if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return { intent: 'query_expenses', confidence: 'high', parameters: { time_range: time_range || 'this_month' } };
        }
    }

    // Income queries - more flexible pattern
    if (/pemasukan/.test(lower)) {
        // Check if it's an income query (not just mentioning the word)
        const hasQueryIndicator = /(berapa|total|ada|apa|cek|check)/i.test(lower);
        const hasTimeIndicator = /(hari|kemarin|minggu|bulan|today|yesterday|week|month)/i.test(lower);

        // If it has "pemasukan" with either query indicator OR time indicator, treat as query
        if (hasQueryIndicator || hasTimeIndicator) {
            let time_range;
            
            // Check for "N hari terakhir" pattern (e.g., "7 hari terakhir") - maps to last_week
            if (/\d+\s+hari\s+ter[a-z]+/i.test(lower)) {
                time_range = 'last_week'; // Last 7 days including today
            } else if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
            else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
            else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
            else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
            else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

            return { intent: 'query_income', confidence: 'high', parameters: { time_range: time_range || 'this_month' } };
        }
    }

    // Category breakdown queries
    if (/breakdown|boros|paling\s+banyak/i.test(lower)) {
        let time_range;
        if (/hari\s+ini|today/i.test(lower)) time_range = 'today';
        else if (/kemarin|yesterday/i.test(lower)) time_range = 'yesterday';
        else if (/minggu\s+ini|this\s+week/i.test(lower)) time_range = 'this_week';
        else if (/bulan\s+ini|this\s+month/i.test(lower)) time_range = 'this_month';
        else if (/bulan\s+lalu|last\s+month/i.test(lower)) time_range = 'last_month';

        return { intent: 'category_breakdown', confidence: 'high', parameters: { time_range: time_range || 'this_month' } };
    }

    return null;
}

// Test cases
const testCases = [
    // ============ BASIC QUERIES ============
    {
        name: "Pengeluaran bulan ini",
        input: "berapa pengeluaran bulan ini",
        expected: { intent: "query_expenses", time_range: "this_month" }
    },
    {
        name: "Pengeluaran hari ini",
        input: "pengeluaran hari ini berapa",
        expected: { intent: "query_expenses", time_range: "today" }
    },
    {
        name: "Hari ini ada pengeluaran ga (flexible)",
        input: "hari ini ada pengeluaran ga",
        expected: { intent: "query_expenses", time_range: "today" }
    },
    {
        name: "Pengeluaran hari ini (tanpa kata tanya)",
        input: "pengeluaran hari ini",
        expected: { intent: "query_expenses", time_range: "today" }
    },
    {
        name: "Pengeluaran kemarin",
        input: "pengeluaran kemarin",
        expected: { intent: "query_expenses", time_range: "yesterday" }
    },
    {
        name: "Pengeluaran 7 hari terakhir",
        input: "pengeluaran 7 hari terakhir",
        expected: { intent: "query_expenses", time_range: "last_week" }
    },
    {
        name: "Berapa pengeluaran total 7 hari terakhir",
        input: "berapa pengeluaran total 7 hari terakhir",
        expected: { intent: "query_expenses", time_range: "last_week" }
    },
    {
        name: "Detail pengeluaran kemarin",
        input: "detail pengeluaran kemarin",
        expected: { intent: "query_details", time_range: "yesterday" }
    },
    {
        name: "Detail pengeluaran 7 hari terakhir",
        input: "detail pengeluaran 7 hari terakhir",
        expected: { intent: "query_details", time_range: "last_week" }
    },
    {
        name: "Saldo sekarang",
        input: "saldo",
        expected: { intent: "query_balance" }
    },
    {
        name: "Saldo bulan ini",
        input: "saldo bulan ini",
        expected: { intent: "query_balance", time_range: "this_month" }
    },
    {
        name: "Pemasukan bulan ini",
        input: "berapa pemasukan bulan ini",
        expected: { intent: "query_income", time_range: "this_month" }
    },

    // ============ TRANSACTION DETAILS ============
    {
        name: "Detail transaksi minggu ini",
        input: "detailkan transaksi minggu ini",
        expected: { intent: "query_details", time_range: "this_week" }
    },
    {
        name: "Transaksi bulan ini",
        input: "transaksi bulan ini",
        expected: { intent: "query_details", time_range: "this_month" }
    },
    {
        name: "Tampilkan transaksi",
        input: "tampilkan transaksi",
        expected: { intent: "query_details", time_range: "this_week" }
    },

    // ============ LIMIT FEATURE (terakhir = by date) ============
    {
        name: "5 transaksi terakhir",
        input: "5 transaksi terakhir",
        expected: { intent: "query_details", limit: 5, sort_by: "date" }
    },
    {
        name: "Last 10 trans",
        input: "last 10 trans",
        expected: { intent: "query_details", limit: 10, sort_by: "date" }
    },

    // ============ LIMIT FEATURE (tertinggi = by amount) ============
    {
        name: "3 transaksi tertinggi bulan ini",
        input: "3 transaksi tertinggi bulan ini",
        expected: { intent: "query_details", limit: 3, sort_by: "amount", time_range: "this_month" }
    },
    {
        name: "Top 10 transaksi",
        input: "top 10 transaksi",
        expected: { intent: "query_details", limit: 10, sort_by: "amount" }
    },

    // ============ SPECIFIC DATE FEATURE ============
    {
        name: "Transaksi 27 jan",
        input: "transaksi 27 jan",
        expected: { intent: "query_details", specific_date_pattern: /^\d{4}-01-27$/ }
    },
    {
        name: "Tampilkan transaksi tanggal 27 jan",
        input: "tampilkan transaksi tanggal 27 jan",
        expected: { intent: "query_details", specific_date_pattern: /^\d{4}-01-27$/ }
    },
    {
        name: "Transaksi tgl 15",
        input: "transaksi tgl 15",
        expected: { intent: "query_details", specific_date_pattern: /^\d{4}-\d{2}-15$/ }
    },

    // ============ CATEGORY FILTER FEATURE ============
    {
        name: "Detail kategori food bulan ini",
        input: "tampilkan detail transaksi food bulan ini",
        expected: { intent: "query_details", time_range: "this_month", category_filter: "Food" }
    },
    {
        name: "Transaksi shopping",
        input: "transaksi shopping minggu ini",
        expected: { intent: "query_details", time_range: "this_week", category_filter: "Shopping" }
    },
    {
        name: "Detail kategori bill",
        input: "detailkan kategori bill",
        expected: { intent: "query_details", category_filter: "bill" }
    },

    // ============ CATEGORY BREAKDOWN ============
    {
        name: "Kategori paling boros",
        input: "kategori paling boros bulan ini",
        expected: { intent: "category_breakdown", time_range: "this_month" }
    },
];

// Run tests
console.log("🧪 NLU TEST SUITE\n" + "=".repeat(50) + "\n");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
    const result = detectSimpleIntent(tc.input);

    let testPassed = true;
    let errors = [];

    if (!result) {
        testPassed = false;
        errors.push("No result returned (null)");
    } else {
        // Check intent
        if (result.intent !== tc.expected.intent) {
            testPassed = false;
            errors.push(`Intent: expected "${tc.expected.intent}", got "${result.intent}"`);
        }

        // Check time_range
        if (tc.expected.time_range !== undefined) {
            if (result.parameters.time_range !== tc.expected.time_range) {
                testPassed = false;
                errors.push(`time_range: expected "${tc.expected.time_range}", got "${result.parameters.time_range}"`);
            }
        }

        // Check limit
        if (tc.expected.limit !== undefined) {
            if (result.parameters.limit !== tc.expected.limit) {
                testPassed = false;
                errors.push(`limit: expected ${tc.expected.limit}, got ${result.parameters.limit}`);
            }
        }

        // Check sort_by
        if (tc.expected.sort_by !== undefined) {
            if (result.parameters.sort_by !== tc.expected.sort_by) {
                testPassed = false;
                errors.push(`sort_by: expected "${tc.expected.sort_by}", got "${result.parameters.sort_by}"`);
            }
        }

        // Check specific_date pattern
        if (tc.expected.specific_date_pattern) {
            if (!result.parameters.specific_date || !tc.expected.specific_date_pattern.test(result.parameters.specific_date)) {
                testPassed = false;
                errors.push(`specific_date: expected pattern ${tc.expected.specific_date_pattern}, got "${result.parameters.specific_date}"`);
            }
        }

        // Check category_filter
        if (tc.expected.category_filter !== undefined) {
            const expectedLower = tc.expected.category_filter.toLowerCase();
            const gotLower = (result.parameters.category_filter || '').toLowerCase();
            if (gotLower !== expectedLower) {
                testPassed = false;
                errors.push(`category_filter: expected "${tc.expected.category_filter}", got "${result.parameters.category_filter}"`);
            }
        }
    }

    if (testPassed) {
        console.log(`✅ PASS: ${tc.name}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${tc.name}`);
        console.log(`   Input: "${tc.input}"`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        for (const err of errors) {
            console.log(`   ⚠️  ${err}`);
        }
        failed++;
    }
}

console.log("\n" + "=".repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log("✅ ALL TESTS PASSED - Safe to deploy!");
} else {
    console.log("❌ TESTS FAILED - DO NOT DEPLOY!");
    process.exit(1);
}
