/**
 * Telegram Bot initialization and message routing
 */

import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand } from './commands/start';
import { handleHelpCommand } from './commands/help';
import { checkTelegramLink, updateLastInteraction } from '../services/linkService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

let bot: TelegramBot | null = null;

/**
 * Initialize Telegram Bot (lazy)
 */
export function initBot(): TelegramBot {
    if (bot) {
        return bot;
    }

    if (!BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    // Create bot instance (webhook mode for Cloud Functions)
    bot = new TelegramBot(BOT_TOKEN);

    return bot;
}

/**
 * Get bot instance (initializes if needed)
 */
function getBot(): TelegramBot {
    if (!bot) {
        return initBot();
    }
    return bot;
}

/**
 * Process incoming update from Telegram
 */
export async function processUpdate(update: TelegramBot.Update): Promise<void> {
    try {
        // Handle messages
        if (update.message) {
            await handleMessage(update.message);
        }

        // Handle callback queries (inline button clicks)
        if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
        }
    } catch (error) {
        console.error('Error processing update:', error);
    }
}

/**
 * Handle incoming messages
 */
async function handleMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.from) return;

    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const text = msg.text || '';

    // Update last interaction
    await updateLastInteraction(telegramId);

    // Handle commands
    if (text.startsWith('/')) {
        await handleCommand(msg);
        return;
    }

    // Check if user is linked
    const userId = await checkTelegramLink(telegramId);
    if (!userId) {
        await getBot().sendMessage(
            chatId,
            '⚠️ Akun belum terhubung. Ketik /start untuk menghubungkan akun.'
        );
        return;
    }

    // Handle photo (receipt upload)
    if (msg.photo) {
        await handlePhotoMessage(msg, userId);
        return;
    }

    // Handle text (natural language query)
    if (text) {
        await handleTextMessage(msg, userId);
        return;
    }
}

/**
 * Handle commands
 */
async function handleCommand(msg: TelegramBot.Message): Promise<void> {
    const command = msg.text?.split(' ')[0].toLowerCase();

    switch (command) {
        case '/start':
            await handleStartCommand(getBot(), msg);
            break;

        case '/help':
        case '/bantuan':
            await handleHelpCommand(getBot(), msg);
            break;

        case '/link':
        case '/hubungkan':
            // Same as /start for now
            await handleStartCommand(getBot(), msg);
            break;

        default:
            await getBot().sendMessage(
                msg.chat.id,
                '❓ Command tidak dikenal. Ketik /help untuk melihat panduan.'
            );
    }
}

/**
 * Handle photo messages (receipt upload)
 * TODO: Implement in Phase 2
 */
async function handlePhotoMessage(
    msg: TelegramBot.Message,
    userId: string
): Promise<void> {
    await getBot().sendMessage(
        msg.chat.id,
        '📸 Fitur upload struk akan segera hadir di Phase 2!\n\n' +
        'Untuk saat ini, kamu bisa tambah transaksi manual dengan mengetik:\n' +
        '"tambah 50000 makan siang"'
    );
}

/**
 * Handle text messages (natural language)
 * TODO: Implement in Phase 3
 */
async function handleTextMessage(
    msg: TelegramBot.Message,
    userId: string
): Promise<void> {
    await getBot().sendMessage(
        msg.chat.id,
        '🤖 Fitur natural language akan segera hadir di Phase 3!\n\n' +
        'Untuk saat ini, gunakan command /help untuk melihat panduan.'
    );
}

/**
 * Handle callback queries (inline button clicks)
 */
async function handleCallbackQuery(
    query: TelegramBot.CallbackQuery
): Promise<void> {
    // TODO: Implement callback handlers in later phases
    await getBot().answerCallbackQuery(query.id, {
        text: 'Fitur ini akan segera hadir!',
    });
}

export { bot };
