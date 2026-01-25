/**
 * Telegram Bot initialization and message routing
 */

import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand } from './commands/start';
import { handleHelpCommand } from './commands/help';
import { checkTelegramLink, updateLastInteraction, unlinkTelegramAccount } from '../services/linkService';
import { analyzeReceipt, formatReceiptData } from '../services/geminiService';
import { createTransactionFromReceipt, createManualTransaction } from '../services/transactionService';
import { parseIntent, isActionable } from '../services/nluService';
import { getTotalExpenses, getCategoryBreakdown, formatTimeRange } from '../services/queryService';
import * as responseFormatter from '../services/responseFormatter';
import { getDb } from '../index';

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

    // Reject documents/files (PDF, etc)
    if (msg.document) {
        await getBot().sendMessage(
            chatId,
            '⚠️ Format file tidak didukung.\n\nMohon kirim foto struk langsung sebagai gambar (JPG/PNG).\nJangan kirim sebagai file/dokumen.'
        );
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

        case '/unlink':
        case '/disconnect':
            await handleUnlinkCommand(msg);
            break;

        default:
            await getBot().sendMessage(
                msg.chat.id,
                '❓ Command tidak dikenal. Ketik /help untuk melihat panduan.'
            );
    }
}

/**
 * Handle /unlink command
 */
async function handleUnlinkCommand(msg: TelegramBot.Message): Promise<void> {
    const telegramId = msg.from!.id;
    const chatId = msg.chat.id;

    // Check if account is linked
    const userId = await checkTelegramLink(telegramId);
    if (!userId) {
        await getBot().sendMessage(
            chatId,
            '⚠️ Akun kamu belum terhubung dengan DompetCerdas.\n\n' +
            'Ketik /start untuk menghubungkan akun.'
        );
        return;
    }

    // Ask for confirmation with inline keyboard
    await getBot().sendMessage(
        chatId,
        '❓ *Konfirmasi Disconnect*\n\n' +
        'Apakah kamu yakin ingin memutuskan koneksi antara Telegram dan akun DompetCerdas?\n\n' +
        'Setelah disconnect, kamu bisa hubungkan lagi dengan akun yang berbeda menggunakan /start.',
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Ya, Disconnect', callback_data: 'confirm_unlink' },
                        { text: '❌ Batal', callback_data: 'cancel_unlink' }
                    ]
                ]
            }
        }
    );
}

/**
 * Handle photo messages (receipt upload)
 */
async function handlePhotoMessage(
    msg: TelegramBot.Message,
    userId: string
): Promise<void> {
    const chatId = msg.chat.id;
    const photo = msg.photo![msg.photo!.length - 1]; // Get highest resolution

    try {
        // Reject albums (multiple photos)
        if (msg.media_group_id) {
            await getBot().sendMessage(
                chatId,
                '⚠️ Mohon kirim 1 foto saja.\n\nSistem memproses struk satu per satu untuk akurasi terbaik.',
                { reply_to_message_id: msg.message_id }
            );
            return;
        }

        // Validate file size (5MB max)
        if (photo.file_size && photo.file_size > 5 * 1024 * 1024) {
            await getBot().sendMessage(
                chatId,
                '⚠️ Ukuran foto terlalu besar!\n\nMaksimal 5MB. Silakan kompres foto terlebih dahulu.'
            );
            return;
        }

        // Send analyzing message
        const analyzingMsg = await getBot().sendMessage(
            chatId,
            '📸 Menganalisis struk...\n\nMohon tunggu beberapa detik...'
        );

        // Download photo from Telegram
        const fileLink = await getBot().getFileLink(photo.file_id);
        const response = await fetch(fileLink);

        if (!response.ok) {
            throw new Error('Failed to download photo');
        }

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Analyze receipt with Gemini Vision
        const receiptData = await analyzeReceipt(imageBuffer);

        // Validation: Check if it's a receipt
        if (receiptData.is_receipt === false) {
            await getBot().deleteMessage(chatId, analyzingMsg.message_id);
            await getBot().sendMessage(
                chatId,
                '⚠️ Foto ini sepertinya bukan struk belanja.\n\nMohon upload foto struk, invoice, atau bukti bayar yang valid.'
            );
            return;
        }

        // Validation: Check total amount
        if (!receiptData.totalAmount || receiptData.totalAmount <= 0) {
            await getBot().deleteMessage(chatId, analyzingMsg.message_id);
            await getBot().sendMessage(
                chatId,
                '⚠️ Struk terdeteksi tapi nominal total tidak ditemukan.\n\nMohon foto ulang dengan pencahayaan yang baik dan pastikan angka "Total" terlihat jelas.\n\nTips: Pastikan kertas tidak terlipat.'
            );
            return;
        }

        // Create session ID for confirmation
        // Create session ID (short random string max 10 chars)
        const sessionId = require('crypto').randomBytes(4).toString('hex');

        // Store in Firestore temporary session
        await getDb().collection('receipt_sessions').doc(sessionId).set({
            userId,
            telegramId: msg.from!.id,
            receiptData,
            photoFileId: photo.file_id,
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });

        // Format confirmation message
        const confirmationText = formatReceiptData(receiptData);

        // Edit analyzing message with confirmation
        await getBot().editMessageText(
            confirmationText,
            {
                chat_id: chatId,
                message_id: analyzingMsg.message_id,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Ya, Simpan', callback_data: `c_${sessionId}` },
                        { text: '❌ Batal', callback_data: `x_${sessionId}` }
                    ]]
                }
            }
        );

    } catch (error) {
        console.error('Error handling photo:', error);
        await getBot().sendMessage(
            chatId,
            '❌ Terjadi kesalahan saat memproses foto.\n\nSilakan coba lagi atau hubungi developer.'
        );
    }
}

/**
 * Handle text messages (natural language)
 */
async function handleTextMessage(
    msg: TelegramBot.Message,
    userId: string
): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    try {
        // Parse intent using Gemini NLU
        const parsedIntent = await parseIntent(text);

        // Handle low confidence or need clarification
        if (!isActionable(parsedIntent)) {
            if (parsedIntent.clarification_needed) {
                await getBot().sendMessage(chatId, responseFormatter.formatClarification(parsedIntent.clarification_needed), { parse_mode: 'Markdown' });
            } else {
                await getBot().sendMessage(chatId, responseFormatter.formatUnknownIntent(), { parse_mode: 'Markdown' });
            }
            return;
        }

        // Handle different intents
        switch (parsedIntent.intent) {
            case 'query_expenses': {
                const timeRange = parsedIntent.parameters.time_range || 'this_month';
                const { total, count } = await getTotalExpenses(userId, timeRange);
                const timeRangeText = formatTimeRange(timeRange);
                const response = responseFormatter.formatExpenseResponse(total, count, timeRangeText);
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'category_breakdown': {
                const timeRange = parsedIntent.parameters.time_range || 'this_month';
                const categories = await getCategoryBreakdown(userId, timeRange);
                const timeRangeText = formatTimeRange(timeRange);
                const response = responseFormatter.formatCategoryBreakdown(categories, timeRangeText);
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'add_transaction': {
                const { amount, description, category_hint } = parsedIntent.parameters;

                if (!amount || !description) {
                    await getBot().sendMessage(chatId, '❌ Jumlah atau deskripsi tidak ditemukan.\n\nContoh: "tambah 50000 makan siang"');
                    return;
                }

                // Map category hint to actual category
                const categoryMap: { [key: string]: string } = {
                    'Food': 'Food',
                    'Transportation': 'Transportation',
                    'Shopping': 'Shopping',
                    'Health': 'Health',
                    'Entertainment': 'Entertainment',
                    'Bills': 'Bills'
                };
                const category = categoryMap[category_hint || 'Other'] || 'Other';

                // Create transaction
                const transactionId = await createManualTransaction(
                    userId,
                    amount,
                    description,
                    category,
                    msg.from?.id
                );

                console.log(`Created manual transaction ${transactionId} for user ${userId}`);

                const response = responseFormatter.formatTransactionAdded(amount, category, description);
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            default:
                await getBot().sendMessage(chatId, responseFormatter.formatUnknownIntent(), { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error('Error handling text message:', error);
        await getBot().sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
    }
}

/**
 * Handle callback queries (inline button clicks)
 */
async function handleCallbackQuery(
    query: TelegramBot.CallbackQuery
): Promise<void> {
    const callbackData = query.data;
    const chatId = query.message!.chat.id;
    const messageId = query.message!.message_id;
    const telegramId = query.from.id;

    // Handle unlink confirmation
    if (callbackData === 'confirm_unlink') {
        try {
            const success = await unlinkTelegramAccount(telegramId);

            if (success) {
                // Delete the confirmation message
                await getBot().deleteMessage(chatId, messageId);

                // Send success message
                await getBot().sendMessage(
                    chatId,
                    '✅ *Akun berhasil di-disconnect!*\n\n' +
                    'Koneksi antara Telegram dan DompetCerdas telah diputuskan.\n\n' +
                    'Kamu bisa:\n' +
                    '• Hubungkan lagi dengan akun yang sama\n' +
                    '• Hubungkan dengan akun DompetCerdas yang berbeda\n\n' +
                    'Ketik /start untuk menghubungkan akun lagi.',
                    { parse_mode: 'Markdown' }
                );

                await getBot().answerCallbackQuery(query.id, {
                    text: 'Akun berhasil di-disconnect'
                });
            } else {
                await getBot().answerCallbackQuery(query.id, {
                    text: 'Gagal disconnect - akun tidak terhubung',
                    show_alert: true
                });
            }
        } catch (error) {
            console.error('Error unlinking account:', error);
            await getBot().answerCallbackQuery(query.id, {
                text: 'Terjadi kesalahan. Silakan coba lagi.',
                show_alert: true
            });
        }
    }
    // Handle cancel unlink
    else if (callbackData === 'cancel_unlink') {
        // Delete the confirmation message
        await getBot().deleteMessage(chatId, messageId);

        // Send cancel message
        await getBot().sendMessage(
            chatId,
            '❌ Disconnect dibatalkan.\n\n' +
            'Akun kamu tetap terhubung dengan DompetCerdas. 👍'
        );

        await getBot().answerCallbackQuery(query.id, {
            text: 'Dibatalkan'
        });
    }
    // Handle receipt confirmation
    else if (callbackData?.startsWith('c_')) {
        const sessionId = callbackData.replace('c_', '');

        try {
            const sessionDoc = await getDb().collection('receipt_sessions').doc(sessionId).get();

            if (!sessionDoc.exists || sessionDoc.data()!.status !== 'pending') {
                await getBot().answerCallbackQuery(query.id, {
                    text: 'Session expired. Silakan upload struk lagi.',
                    show_alert: true
                });
                return;
            }

            const { receiptData, userId, telegramId, photoFileId } = sessionDoc.data()!;

            // Download photo for upload (if photoFileId exists)
            let attachmentData;
            try {
                if (photoFileId) {
                    // Get file path from Telegram
                    // Note: We need to get the file path again as file links expire
                    const file = await getBot().getFile(photoFileId);
                    if (file.file_path) {
                        const fileLink = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
                        const response = await fetch(fileLink);

                        if (response.ok) {
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);

                            // Upload to Firebase Storage
                            const { uploadReceiptImage } = require('../services/storageService');
                            attachmentData = await uploadReceiptImage(
                                userId,
                                buffer,
                                `telegram_receipt_${photoFileId}.jpg`
                            );
                        }
                    }
                }
            } catch (uploadError) {
                console.error('Error uploading attachment:', uploadError);
                // Continue without attachment if upload fails
            }

            // Save transaction to Firestore
            try {
                const transactionId = await createTransactionFromReceipt(
                    userId,
                    receiptData,
                    telegramId,
                    attachmentData
                );

                console.log(`Saved transaction ${transactionId} from receipt session ${sessionId}`);

                // Mark session as confirmed
                await sessionDoc.ref.update({
                    status: 'confirmed',
                    confirmedAt: new Date(),
                    transactionId
                });
            } catch (error) {
                console.error('Error saving transaction:', error);
                await getBot().answerCallbackQuery(query.id, {
                    text: 'Gagal menyimpan transaksi. Coba lagi.',
                    show_alert: true
                });
                return;
            }

            const formattedAmount = receiptData.totalAmount.toLocaleString('id-ID');

            await getBot().editMessageText(
                `✅ *Transaksi berhasil disimpan!*\n\n` +
                `💰 Total: Rp ${formattedAmount}\n` +
                `🏪 Merchant: ${receiptData.merchant}\n` +
                `📁 Kategori: ${receiptData.categorySuggestion}\n\n` +
                `Data sudah tersimpan ke DompetCerdas! 🎉`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            await getBot().answerCallbackQuery(query.id, {
                text: 'Tersimpan! ✅'
            });
        } catch (error) {
            console.error('Error confirming receipt:', error);
            await getBot().answerCallbackQuery(query.id, {
                text: 'Terjadi kesalahan. Silakan coba lagi.',
                show_alert: true
            });
        }
    }
    // Handle receipt cancellation
    else if (callbackData?.startsWith('x_')) {
        const sessionId = callbackData.replace('x_', '');

        try {
            const sessionDoc = await getDb().collection('receipt_sessions').doc(sessionId).get();

            if (sessionDoc.exists) {
                await sessionDoc.ref.update({ status: 'cancelled', cancelledAt: new Date() });
            }

            await getBot().editMessageText(
                '❌ *Dibatalkan*\n\nData struk tidak disimpan.',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                }
            );

            await getBot().answerCallbackQuery(query.id, {
                text: 'Dibatalkan'
            });
        } catch (error) {
            console.error('Error cancelling receipt:', error);
            await getBot().answerCallbackQuery(query.id, {
                text: 'Terjadi kesalahan.',
                show_alert: true
            });
        }
    }
    // Handle other callbacks
    else {
        await getBot().answerCallbackQuery(query.id, {
            text: 'Fitur ini akan segera hadir!',
        });
    }
}

export { bot };
