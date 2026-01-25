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
Bot ini menggunakan bahasa natural - kamu bisa ngobrol seperti biasa!

📝 *Contoh Pertanyaan:*
• "berapa pengeluaran minggu ini?"
• "total belanja bulan ini berapa?"
• "kategori apa yang paling boros?"
• "saldo saya berapa?"
• "bandingkan bulan ini vs bulan lalu"

➕ *Tambah Transaksi:*
• Ketik: "tambah 50000 makan siang"
• Atau upload foto struk 📸

📸 *Upload Struk:*
1. Kirim foto struk belanja
2. Bot akan analisis otomatis
3. Konfirmasi data yang terdeteksi
4. Selesai! ✅

⚙️ *Commands:*
/start - Hubungkan akun
/link - Generate link token
/unlink - Putuskan koneksi akun
/help - Panduan ini

💡 *Tips:*
• Foto struk harus jelas
• Max 5MB per foto
• Limit 20 struk/hari

Butuh bantuan? Tanya aja! 😊
  `.trim();

    await bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
    });
}
