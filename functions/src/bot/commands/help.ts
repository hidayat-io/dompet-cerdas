/**
 * /help command handler
 * Display usage guide and examples
 */

import TelegramBot from 'node-telegram-bot-api';

export async function handleHelpCommand(
    bot: TelegramBot,
    msg: TelegramBot.Message
): Promise<void> {
    const chatId = msg.chat.id;

    const helpMessage = `
📚 *Panduan DompetCerdas Bot*

🤖 *Cara Pakai:*
Bot ini menggunakan bahasa natural - ngobrol seperti biasa!

━━━━━━━━━━━━━━━━━━━━━

📊 *Cek Pengeluaran:*
• "berapa pengeluaran minggu ini?"
• "total belanja bulan ini"
• "pengeluaran hari ini berapa?"

📈 *Analisis Kategori:*
• "kategori apa yang paling boros?"
• "breakdown pengeluaran bulan ini"

💰 *Cek Saldo:*
• "saldo saya berapa?"
• "total uang saya"

➕ *Tambah Transaksi Manual:*
• "tambah 50000 makan siang"
• "catat 25000 ongkos ojol"
• "beli kopi 35000"

━━━━━━━━━━━━━━━━━━━━━

📸 *Upload Struk:*
1️⃣ Kirim 1 foto struk (JPG/PNG)
2️⃣ Bot analisis dengan AI
3️⃣ Konfirmasi data yang terdeteksi
4️⃣ Tersimpan otomatis! ✅

⚠️ *Syarat Foto Struk:*
• Hanya 1 foto per upload
• Format: JPG atau PNG saja
• Ukuran: Max 5MB
• Pastikan angka total terlihat jelas
• PDF/dokumen tidak diterima

━━━━━━━━━━━━━━━━━━━━━

⚙️ *Commands:*
/start - Hubungkan akun
/unlink - Disconnect akun
/help - Panduan ini

Butuh bantuan? Tanya aja! 😊
  `.trim();

    await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
    });
}
