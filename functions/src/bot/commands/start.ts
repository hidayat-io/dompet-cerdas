/**
 * /start command handler
 * Welcome message and account linking
 */

import TelegramBot from 'node-telegram-bot-api';
import { generateLinkToken, checkTelegramLink } from '../../services/linkService';

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://dompas.indoomega.my.id';

export async function handleStartCommand(
    bot: TelegramBot,
    msg: TelegramBot.Message
): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id;
    const firstName = msg.from!.first_name;

    // Check if already linked
    const userId = await checkTelegramLink(telegramId);

    if (userId) {
        await bot.sendMessage(
            chatId,
            `✅ Halo ${firstName}! Akun kamu sudah terhubung.\n\n` +
            `Silakan tanya apa saja tentang keuangan kamu, atau upload foto struk untuk mencatat transaksi! 📸\n\n` +
            `Ketik /help untuk melihat panduan.`
        );
        return;
    }

    // Generate link token
    const token = await generateLinkToken(telegramId);
    const linkUrl = `${WEB_APP_URL}/link-telegram?token=${token}`;

    await bot.sendMessage(
        chatId,
        `👋 Selamat datang di *DompetCerdas Bot*, ${firstName}!\n\n` +
        `Untuk mulai menggunakan bot, kamu perlu menghubungkan akun Telegram dengan akun DompetCerdas.\n\n` +
        `🔗 Klik tombol di bawah untuk menghubungkan akun:\n\n` +
        `⏱️ Link berlaku selama 5 menit\n` +
        `🔒 Aman & terenkripsi`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🔗 Hubungkan Akun',
                            url: linkUrl,
                        },
                    ],
                ],
            },
        }
    );
}
