/**
 * /help command handler
 * Display usage guide and examples
 */

import TelegramBot from 'node-telegram-bot-api';
import { withAccountHeader } from '../../services/responseFormatter';

export async function handleHelpCommand(
    bot: TelegramBot,
    msg: TelegramBot.Message,
    accountName?: string
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
• "makan 25rb, parkir 5rb"

🧾 *Multi-Transaksi:*
• Bot akan tampilkan preview dulu sebelum simpan
• Kalau ada item yang salah, klik tombol *Hapus 1 / Hapus 2 / ...*
• Setelah sudah benar, klik *Simpan Semua*

🎤 *Voice Note Transaksi:*
• Kirim voice note singkat, misalnya: "makan 25 ribu, parkir 5 ribu"
• Bot akan transkrip dulu, lalu tampilkan preview sebelum simpan

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
/akun - Lihat atau ganti akun Telegram
/unlink - Disconnect akun
/help - Panduan ini

Butuh bantuan? Tanya aja! 😊
  `.trim();

    await bot.sendMessage(chatId, withAccountHeader(helpMessage, accountName), {
        parse_mode: 'Markdown',
    });
}
