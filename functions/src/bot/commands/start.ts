/**
 * /start command handler
 * Welcome message and account linking
 */

import TelegramBot from 'node-telegram-bot-api';
import { generateLinkToken, checkTelegramLink, getTelegramAccountState } from '../../services/linkService';
import { escapeMarkdown, withAccountHeader } from '../../services/responseFormatter';

const WEB_APP_URL = process.env.WEB_APP_URL || 'https://dompas.indoomega.my.id';

export async function handleStartCommand(
    bot: TelegramBot,
    msg: TelegramBot.Message
): Promise<void> {
    const chatId = msg.chat.id;
    const telegramId = msg.from!.id;
    const firstName = escapeMarkdown(msg.from!.first_name || 'teman');

    // Check if already linked
    const userId = await checkTelegramLink(telegramId);

    if (userId) {
        const telegramAccountState = await getTelegramAccountState(telegramId);
        await bot.sendMessage(
            chatId,
            withAccountHeader(
                `✅ Halo ${firstName}! Akun kamu sudah terhubung.\n\n` +
                `Silakan tanya apa saja tentang keuangan kamu, atau upload foto struk untuk mencatat transaksi! 📸\n\n` +
                `Ketik /help untuk melihat panduan, atau /akun untuk ganti akun Telegram.`,
                telegramAccountState?.defaultAccountName
            ),
            { parse_mode: 'Markdown' }
        );
        return;
    }

    // Generate link token
    const token = await generateLinkToken({
        id: telegramId,
        username: msg.from?.username,
        first_name: msg.from!.first_name,
        last_name: msg.from?.last_name,
    });
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
