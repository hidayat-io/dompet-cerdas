import { Category, Transaction } from '../types';

interface ExportOptions {
    transactions: Transaction[];
    categories: Category[];
    startDate?: string;
    endDate?: string;
    filename?: string;
}

const MAX_EXPORT_SIZE_MB = 10;

export const exportToExcel = async ({
    transactions,
    categories,
    startDate,
    endDate,
    filename
}: ExportOptions) => {
    let filteredTransactions = [...transactions];

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredTransactions = transactions.filter((transaction) => {
            const txDate = new Date(transaction.date);
            return txDate >= start && txDate <= end;
        });
    }

    filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalIncome = filteredTransactions.reduce((acc, transaction) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        return category?.type === 'INCOME' ? acc + transaction.amount : acc;
    }, 0);

    const totalExpense = filteredTransactions.reduce((acc, transaction) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        return category?.type === 'EXPENSE' ? acc + transaction.amount : acc;
    }, 0);

    const balance = totalIncome - totalExpense;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dompet Cerdas';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(getSheetName(startDate, endDate));

    worksheet.columns = [
        { header: 'Tanggal', key: 'date', width: 14 },
        { header: 'Kategori', key: 'category', width: 22 },
        { header: 'Tipe', key: 'type', width: 16 },
        { header: 'Jumlah', key: 'amount', width: 18, style: { numFmt: '#,##0' } },
        { header: 'Catatan', key: 'notes', width: 34 }
    ];

    worksheet.getRow(1).font = { bold: true };

    filteredTransactions.forEach((transaction) => {
        const category = categories.find((item) => item.id === transaction.categoryId);
        const isIncome = category?.type === 'INCOME';

        worksheet.addRow({
            date: transaction.date,
            category: category?.name || 'Kategori Dihapus',
            type: isIncome ? 'Pemasukan' : 'Pengeluaran',
            amount: transaction.amount,
            notes: transaction.description || '-'
        });
    });

    worksheet.addRow({});

    [
        { type: 'TOTAL PEMASUKAN', amount: totalIncome },
        { type: 'TOTAL PENGELUARAN', amount: totalExpense },
        { type: 'SALDO', amount: balance }
    ].forEach((summary) => {
        const row = worksheet.addRow({
            type: summary.type,
            amount: summary.amount
        });
        row.font = { bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileSizeMB = blob.size / (1024 * 1024);
    if (fileSizeMB > MAX_EXPORT_SIZE_MB) {
        throw new Error(
            `File terlalu besar (${fileSizeMB.toFixed(1)} MB). Maksimal ${MAX_EXPORT_SIZE_MB} MB. Silakan pilih rentang tanggal yang lebih kecil.`
        );
    }

    const finalFilename = getFilename(filename, startDate, endDate);
    const url = URL.createObjectURL(blob);

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }

    return {
        success: true,
        filename: finalFilename,
        recordCount: filteredTransactions.length,
        totalIncome,
        totalExpense,
        balance
    };
};

const getFilename = (filename?: string, startDate?: string, endDate?: string) => {
    let finalFilename = filename || 'Transaksi.xlsx';

    if (!finalFilename.endsWith('.xlsx')) {
        finalFilename += '.xlsx';
    }

    if (startDate && endDate && !filename) {
        return `Transaksi_${startDate}_${endDate}.xlsx`;
    }

    return finalFilename;
};

const getSheetName = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) {
        return 'Transaksi';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }

    return `${start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
};

const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startDate: formatLocalDate(firstDay),
        endDate: formatLocalDate(lastDay)
    };
};

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
