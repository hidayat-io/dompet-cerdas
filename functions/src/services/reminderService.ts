import { getDb } from '../index';
import { initBot } from '../bot';

const formatRp = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export async function processRoutineExpenseReminders() {
    const db = getDb();
    const bot = initBot();
    
    // Get current date in Asia/Jakarta
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
    });
    
    // Formatter outputs MM/DD/YYYY, HH
    const parts = formatter.formatToParts(now);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1970', 10);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    
    const currentHourStr = `${String(hour).padStart(2, '0')}:00`;
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    // Determine if today is end of month
    // Date(year, month, 0) gives the last day of the previous month.
    // So to get the last day of the current month, we need Date(year, month, 0) since 'month' from parts is 1-indexed (1-12).
    // Actually, in JS Date, month is 0-indexed. So if current month is August (8), new Date(2023, 8, 0) gives Aug 31.
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const isEndOfMonth = lastDayOfMonth === day;
    const isStartOfMonth = day === 1;

    try {
        // Collect all matching accounts/expenses using collectionGroup
        const expensesSnapshot = await db.collectionGroup('routine_expenses')
            .where('reminderEnabled', '==', true)
            .get();
            
        console.log(`Found ${expensesSnapshot.docs.length} active routine expense reminders.`);

        for (const doc of expensesSnapshot.docs) {
            const expense = doc.data();
            
            // Check if this expense matches today's criteria
            let shouldRemind = false;
            
            if (expense.reminderType === 'AWAL_BULAN' && isStartOfMonth) {
                shouldRemind = true;
            } else if (expense.reminderType === 'AKHIR_BULAN' && isEndOfMonth) {
                shouldRemind = true;
            } else if (expense.reminderType === 'CUSTOM' && expense.reminderDate === day) {
                shouldRemind = true;
            }
            
            // Handle edge case: if CUSTOM date is 31, but month has 30 days, remind on the 30th.
            if (expense.reminderType === 'CUSTOM' && expense.reminderDate > day && isEndOfMonth) {
                shouldRemind = true;
            }

            // Check if time matches (default to 08:00 if not set for backward compatibility)
            const expenseTime = expense.reminderTime || '08:00';
            if (expenseTime !== currentHourStr) {
                shouldRemind = false;
            }

            if (!shouldRemind) continue;
            
            // Check if already paid this month
            const accountRef = doc.ref.parent.parent;
            if (!accountRef) continue;
            
            const recordId = `${doc.id}_${currentMonthStr}`;
            const recordSnap = await accountRef.collection('routine_expense_records').doc(recordId).get();
            
            if (recordSnap.exists) {
                // Already paid
                continue;
            }
            
            const userIdToNotify = expense.createdByUserId;
            if (!userIdToNotify) continue;
            
            // Check if user has telegram linked
            const tgLinkSnap = await db.collection('users').doc(userIdToNotify).collection('telegram_link').doc('main').get();
            if (!tgLinkSnap.exists) continue;
            
            const tgLink = tgLinkSnap.data();
            if (!tgLink || !tgLink.active || !tgLink.telegramId) continue;
            
            // Send Telegram message
            const message = `🔔 *Pengingat Pengeluaran Rutin*\n\n` +
                            `Kamu punya tagihan/pengeluaran rutin yang belum dibayar untuk bulan ini:\n\n` +
                            `📋 *${expense.name}*\n` +
                            `💰 *${formatRp(expense.amount)}*\n\n` +
                            `Segera catat pembayarannya di aplikasi Dompet Cerdas.`;
                            
            try {
                await bot.sendMessage(tgLink.telegramId, message, { parse_mode: 'Markdown' });
                console.log(`Sent reminder for ${expense.name} to user ${userIdToNotify} (TG: ${tgLink.telegramId})`);
            } catch (err) {
                console.error(`Failed to send reminder to telegram ID ${tgLink.telegramId}:`, err);
            }
        }
    } catch (error) {
        console.error('Error processing routine expense reminders:', error);
    }
}
