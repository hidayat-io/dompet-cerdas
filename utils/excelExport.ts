import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Transaction, Category } from '../types';

interface ExportOptions {
    transactions: Transaction[];
    categories: Category[];
    startDate?: string;
    endDate?: string;
    filename?: string;
}

export const exportToExcel = ({
    transactions,
    categories,
    startDate,
    endDate,
    filename
}: ExportOptions) => {
    // Filter transactions by date range if provided
    let filteredTransactions = [...transactions];

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= start && txDate <= end;
        });
    }

    // Sort by date descending
    filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Prepare data for Excel
    const excelData = filteredTransactions.map(t => {
        const category = categories.find(c => c.id === t.categoryId);
        const isIncome = category?.type === 'INCOME';

        return {
            'Tanggal': t.date,
            'Kategori': category?.name || 'Kategori Dihapus',
            'Tipe': isIncome ? 'Pemasukan' : 'Pengeluaran',
            'Jumlah': t.amount,
            'Catatan': t.description || '-'
        };
    });

    // Calculate totals
    const totalIncome = filteredTransactions.reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat?.type === 'INCOME' ? acc + t.amount : acc;
    }, 0);

    const totalExpense = filteredTransactions.reduce((acc, t) => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat?.type === 'EXPENSE' ? acc + t.amount : acc;
    }, 0);

    const balance = totalIncome - totalExpense;

    // Add summary rows
    excelData.push({
        'Tanggal': '',
        'Kategori': '',
        'Tipe': '',
        'Jumlah': undefined as any,
        'Catatan': ''
    });

    excelData.push({
        'Tanggal': '',
        'Kategori': '',
        'Tipe': 'TOTAL PEMASUKAN',
        'Jumlah': totalIncome,
        'Catatan': ''
    });

    excelData.push({
        'Tanggal': '',
        'Kategori': '',
        'Tipe': 'TOTAL PENGELUARAN',
        'Jumlah': totalExpense,
        'Catatan': ''
    });

    excelData.push({
        'Tanggal': '',
        'Kategori': '',
        'Tipe': 'SALDO',
        'Jumlah': balance,
        'Catatan': ''
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // Tanggal
        { wch: 20 },  // Kategori
        { wch: 15 },  // Tipe
        { wch: 15 },  // Jumlah
        { wch: 30 }   // Catatan
    ];

    // Format currency columns
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 3 }); // Column D (Jumlah)
        const cell = ws[cellAddress];
        if (cell && typeof cell.v === 'number') {
            cell.z = '#,##0';
        }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Generate sheet name
    let sheetName = 'Transaksi';
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            sheetName = `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
        } else {
            sheetName = `${start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename
    let finalFilename = filename || 'Transaksi.xlsx';
    if (!finalFilename.endsWith('.xlsx')) {
        finalFilename += '.xlsx';
    }

    if (startDate && endDate && !filename) {
        finalFilename = `Transaksi_${startDate}_${endDate}.xlsx`;
    }

    // Download file using Data URL approach (most reliable for filename preservation)
    try {
        console.log('Starting Excel export...');
        console.log('Filename:', finalFilename);
        console.log('Record count:', filteredTransactions.length);

        // Generate Excel buffer as base64
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

        // Calculate approximate file size
        const fileSizeBytes = (wbout.length * 3) / 4; // base64 to bytes approximation
        const fileSizeMB = fileSizeBytes / (1024 * 1024);

        console.log('File size:', fileSizeMB.toFixed(2), 'MB');

        // Check file size limit (10MB for Data URL approach)
        const MAX_SIZE_MB = 10;
        if (fileSizeMB > MAX_SIZE_MB) {
            throw new Error(
                `File terlalu besar (${fileSizeMB.toFixed(1)} MB). ` +
                `Maksimal ${MAX_SIZE_MB} MB. Silakan pilih rentang tanggal yang lebih kecil.`
            );
        }

        // Create data URL
        const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;

        // Create download link
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = finalFilename;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);

        console.log('Excel file download triggered via Data URL');

        return {
            success: true,
            filename: finalFilename,
            recordCount: filteredTransactions.length,
            totalIncome,
            totalExpense,
            balance
        };
    } catch (error) {
        console.error('Error during Excel export:', error);
        throw error;
    }
};

// Helper function to format date as YYYY-MM-DD in local time
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to get current month date range
export const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startDate: formatLocalDate(firstDay),
        endDate: formatLocalDate(lastDay)
    };
};

// Helper function to format date for display
export const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }

    return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};
