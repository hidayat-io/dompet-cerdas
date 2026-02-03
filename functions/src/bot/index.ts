/**
 * Telegram Bot initialization and message routing
 */

import TelegramBot from 'node-telegram-bot-api';
import { handleStartCommand } from './commands/start';
import { handleHelpCommand } from './commands/help';
import { checkTelegramLink, updateLastInteraction, unlinkTelegramAccount } from '../services/linkService';
import { analyzeReceipt, formatReceiptData } from '../services/geminiService';
import { createTransactionFromReceipt, createManualTransaction, getUserCategories, UserCategory } from '../services/transactionService';
import { parseIntent, isActionable, classifyCategory } from '../services/nluService';
import { getTotalExpenses, getTotalIncome, getBalance, getCategoryBreakdown, getTransactionDetails, formatTimeRange } from '../services/queryService';
import { analyzeFinancialHealth, generateSavingsStrategy, analyzeExpenseReduction } from '../services/advisorService';
import * as responseFormatter from '../services/responseFormatter';
import { getDb } from '../index';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

let bot: TelegramBot | null = null;

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const DUPLICATE_SUPPRESS_MS = 5_000;
const userRateLimit = new Map<number, { windowStart: number; count: number; lastText?: string; lastTextAt?: number }>();

function extractCaptionCategoryHint(caption: string): string | undefined {
    const keywordRegex = /\b(cat|categ|category|kategori|kat|ktg|ktgr|kate)\b\s*[:\-]?\s*([a-zA-ZÀ-ÿ0-9]+(?:\s+[a-zA-ZÀ-ÿ0-9]+){0,2})/i;
    const match = caption.match(keywordRegex);
    if (!match) return undefined;

    let hint = match[2]?.trim() || '';
    const lowerHint = hint.toLowerCase();
    if (lowerHint === 'shoping') hint = 'shopping';

    return hint;
}

function cleanCaptionDescription(caption: string): string {
    const keywordRegex = /\b(cat|categ|category|kategori|kat|ktg|ktgr|kate)\b\s*[:\-]?\s*([a-zA-ZÀ-ÿ0-9]+(?:\s+[a-zA-ZÀ-ÿ0-9]+){0,2})/i;
    const match = caption.match(keywordRegex);
    if (!match) return caption.trim();

    // Remove the category keyword and hint from caption
    const cleanedCaption = caption
        .replace(match[0], ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return cleanedCaption;
}

async function resolveCaptionCategoryName(caption: string, categories: UserCategory[]): Promise<string | undefined> {
    const hint = extractCaptionCategoryHint(caption);
    if (!hint) return undefined;

    const normalizedHint = hint.toLowerCase();

    // 1. Try direct match (exact name)
    const directMatch = categories.find((category) => category.name.toLowerCase() === normalizedHint);
    if (directMatch) return directMatch.name;

    // 2. Try fuzzy match (contains)
    const fuzzyMatch = categories.find((category) => {
        const name = category.name.toLowerCase();
        return name.includes(normalizedHint) || normalizedHint.includes(name);
    });
    if (fuzzyMatch) return fuzzyMatch.name;

    // 3. Use AI classification for dynamic matching (supports any custom category)
    try {
        const { classifyCategory } = await import('../services/nluService');
        const classification = await classifyCategory(hint, categories);
        return classification.categoryName;
    } catch (error) {
        console.error('[CAPTION] AI category classification failed:', error);
        return undefined;
    }
}

function shouldThrottleUser(telegramId: number, text?: string): { blocked: boolean; reason?: string } {
    const now = Date.now();
    const state = userRateLimit.get(telegramId) || { windowStart: now, count: 0 };

    if (now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
        state.windowStart = now;
        state.count = 0;
    }

    if (text && state.lastText && state.lastTextAt && now - state.lastTextAt < DUPLICATE_SUPPRESS_MS) {
        if (state.lastText === text) {
            state.lastTextAt = now;
            userRateLimit.set(telegramId, state);
            return { blocked: true, reason: 'duplicate' };
        }
    }

    state.count += 1;
    state.lastText = text;
    state.lastTextAt = now;
    userRateLimit.set(telegramId, state);

    if (state.count > RATE_LIMIT_MAX_REQUESTS) {
        return { blocked: true, reason: 'rate_limit' };
    }

    return { blocked: false };
}

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

    const throttle = shouldThrottleUser(telegramId, text);
    if (throttle.blocked) {
        if (throttle.reason === 'rate_limit') {
            await getBot().sendMessage(
                chatId,
                '⚠️ Terlalu banyak permintaan dalam waktu singkat. Coba lagi sebentar ya.'
            );
        }
        return;
    }

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

    // Handle documents/files (image files as documents)
    if (msg.document) {
        await handleDocumentMessage(msg, userId);
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
    const photoCaption = msg.caption || ''; // Get photo caption/description

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

        const categories = await getUserCategories(userId);
        const captionCategoryName = await resolveCaptionCategoryName(photoCaption, categories);
        const cleanedCaption = cleanCaptionDescription(photoCaption);

        // Create session ID for confirmation
        // Create session ID (short random string max 10 chars)
        const sessionId = require('crypto').randomBytes(4).toString('hex');

        // Store in Firestore temporary session
        await getDb().collection('receipt_sessions').doc(sessionId).set({
            userId,
            telegramId: msg.from!.id,
            receiptData,
            photoFileId: photo.file_id,
            photoCaption: cleanedCaption, // Store cleaned caption without category keyword
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });

        // Format confirmation message with caption
        const confirmationText = formatReceiptData(receiptData, cleanedCaption, captionCategoryName);

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
 * Handle document messages (image files sent as documents)
 */
async function handleDocumentMessage(
    msg: TelegramBot.Message,
    userId: string
): Promise<void> {
    const chatId = msg.chat.id;
    const document = msg.document!;
    const documentCaption = msg.caption || ''; // Get document caption/description

    try {
        // Validate mime type (must be image)
        const mimeType = document.mime_type || '';
        const supportedMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!supportedMimes.includes(mimeType)) {
            await getBot().sendMessage(
                chatId,
                '⚠️ Format file tidak didukung.\n\n' +
                'Mohon kirim gambar dalam format: JPG, PNG, atau WEBP.\n\n' +
                '_Cara upload:_\n' +
                '1. Buka Telegram\n' +
                '2. Tekan paperclip (attach)\n' +
                '3. Pilih foto struk\n' +
                '4. Telegram akan tanya "Send as photo/file?"\n' +
                '5. Pilih "Send as photo" (JANGAN "Send as file")',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Validate file size (max 5MB before compression)
        const fileSizeMB = (document.file_size || 0) / (1024 * 1024);
        if (fileSizeMB > 5) {
            await getBot().sendMessage(
                chatId,
                `⚠️ Ukuran file terlalu besar!\n\nFile: ${fileSizeMB.toFixed(2)}MB (Max: 5MB)\n\nSilakan kompres terlebih dahulu.`
            );
            return;
        }

        // Send analyzing message
        const analyzingMsg = await getBot().sendMessage(
            chatId,
            '📄 Menganalisis file...\n\nMohon tunggu beberapa detik...'
        );

        // Download file from Telegram
        const fileLink = await getBot().getFileLink(document.file_id);
        const response = await fetch(fileLink);

        if (!response.ok) {
            throw new Error('Failed to download document');
        }

        const arrayBuffer = await response.arrayBuffer();
        let imageBuffer = Buffer.from(arrayBuffer);

        console.log(`[DOCUMENT] Downloaded document: ${document.file_name}, Original size: ${imageBuffer.length} bytes`);

        // Compress image
        const sharp = require('sharp');
        try {
            imageBuffer = await sharp(imageBuffer)
                .resize(1920, 1920, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            const compressedSizeMB = imageBuffer.length / (1024 * 1024);
            console.log(`[DOCUMENT] Compressed size: ${compressedSizeMB.toFixed(2)}MB`);

            // Validate compressed size (max 1MB)
            if (imageBuffer.length > 1024 * 1024) {
                await getBot().deleteMessage(chatId, analyzingMsg.message_id);
                await getBot().sendMessage(
                    chatId,
                    `⚠️ File terlalu besar setelah kompresi!\n\nUkuran: ${compressedSizeMB.toFixed(2)}MB\n` +
                    `Maksimal: 1MB\n\n` +
                    `Tips: Gunakan resolusi lebih rendah atau crop foto.`
                );
                return;
            }
        } catch (compressionError) {
            console.error('[DOCUMENT] Compression failed:', compressionError);
            await getBot().deleteMessage(chatId, analyzingMsg.message_id);
            await getBot().sendMessage(
                chatId,
                '⚠️ Gagal memproses gambar.\n\nPastikan file adalah gambar yang valid (JPG/PNG).'
            );
            return;
        }

        // Analyze receipt with Gemini Vision
        const receiptData = await analyzeReceipt(imageBuffer);

        // Validation: Check if it's a receipt/invoice/proof
        if (receiptData.is_receipt === false) {
            await getBot().deleteMessage(chatId, analyzingMsg.message_id);
            await getBot().sendMessage(
                chatId,
                '⚠️ File ini sepertinya bukan struk/invoice/bukti bayar.\n\n' +
                'Mohon upload:\n' +
                '• 🧾 Struk belanja\n' +
                '• 📋 Invoice\n' +
                '• 📸 Bukti penerimaan/pembayaran\n' +
                '• 💳 Bukti transfer/kartu kredit\n\n' +
                'File yang valid dan terang-terangan.'
            );
            return;
        }

        // Validation: Check total amount
        if (!receiptData.totalAmount || receiptData.totalAmount <= 0) {
            await getBot().deleteMessage(chatId, analyzingMsg.message_id);
            await getBot().sendMessage(
                chatId,
                '⚠️ Struk/invoice terdeteksi tapi nominal total tidak ditemukan.\n\n' +
                'Mohon upload ulang dengan pencahayaan yang baik dan pastikan:\n' +
                '• Angka "Total" terlihat jelas\n' +
                '• Foto tidak terlipat atau blur\n' +
                '• Semua bagian penting terlihat'
            );
            return;
        }

        const categories = await getUserCategories(userId);
        const captionCategoryName = await resolveCaptionCategoryName(documentCaption, categories);
        const cleanedCaption = cleanCaptionDescription(documentCaption);

        // Create session ID for confirmation
        const sessionId = require('crypto').randomBytes(4).toString('hex');

        // Store in Firestore temporary session
        await getDb().collection('receipt_sessions').doc(sessionId).set({
            userId,
            telegramId: msg.from!.id,
            receiptData,
            photoFileId: document.file_id,
            photoCaption: cleanedCaption, // Store cleaned caption without category keyword
            status: 'pending',
            source: 'document', // Mark as document source
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });

        // Format confirmation message with caption
        const confirmationText = formatReceiptData(receiptData, cleanedCaption, captionCategoryName);

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
        console.error('Error handling document:', error);
        await getBot().sendMessage(
            chatId,
            '❌ Terjadi kesalahan saat memproses file.\n\nSilakan coba lagi atau hubungi developer.'
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

    // Send processing message immediately
    const processingMsg = await getBot().sendMessage(
        chatId,
        '⏳ Mohon tunggu, permintaan sedang diproses...'
    );

    try {
        // Parse intent using Gemini NLU
        const parsedIntent = await parseIntent(text);

        // Handle low confidence or need clarification
        if (!isActionable(parsedIntent)) {
            // Delete processing message first
            await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });

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
                const timeRange = parsedIntent.parameters.time_range;
                const daysAgo = parsedIntent.parameters.days_ago;
                const customMonth = parsedIntent.parameters.custom_month;
                const { total, count } = await getTotalExpenses(userId, timeRange || 'this_month', daysAgo, customMonth);

                let timeRangeText: string;
                if (customMonth) {
                    const [year, month] = customMonth.split('-');
                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    timeRangeText = `${monthNames[parseInt(month)]} ${year}`;
                } else if (daysAgo !== undefined) {
                    timeRangeText = daysAgo === 0 ? 'hari ini' : `${daysAgo} hari lalu`;
                } else {
                    timeRangeText = formatTimeRange(timeRange || 'this_month');
                }

                const response = responseFormatter.formatExpenseResponse(total, count, timeRangeText);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'query_income': {
                const timeRange = parsedIntent.parameters.time_range;
                // For now, ignore daysAgo for income queries - use timeRange only
                const { total, count } = await getTotalIncome(userId, timeRange || 'this_month');
                const timeRangeText = formatTimeRange(timeRange || 'this_month');
                const response = responseFormatter.formatIncomeResponse(total, count, timeRangeText);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'query_balance': {
                const timeRange = parsedIntent.parameters.time_range;
                const daysAgoRaw = parsedIntent.parameters.days_ago;
                const customMonth = parsedIntent.parameters.custom_month;

                const hasDaysAgo = typeof daysAgoRaw === 'number' && !Number.isNaN(daysAgoRaw);
                const hasCustomMonth = typeof customMonth === 'string' && customMonth.length > 0;
                const hasTimeRange = typeof timeRange === 'string' && timeRange.length > 0;

                const daysAgo = hasDaysAgo ? daysAgoRaw : undefined;
                const balance = await getBalance(userId, hasTimeRange ? timeRange : undefined, daysAgo, hasCustomMonth ? customMonth : undefined);

                let timeRangeText = '';
                if (hasCustomMonth && customMonth) {
                    const [year, month] = customMonth.split('-');
                    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    timeRangeText = ` (${monthNames[parseInt(month)]} ${year})`;
                } else if (hasDaysAgo && daysAgo !== undefined) {
                    timeRangeText = ` (${daysAgo === 0 ? 'hari ini' : `${daysAgo} hari lalu`})`;
                } else if (hasTimeRange && timeRange) {
                    timeRangeText = ` (${formatTimeRange(timeRange)})`;
                }

                const response = responseFormatter.formatBalanceResponse(balance, timeRangeText || undefined);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'query_details': {
                const timeRange = parsedIntent.parameters.time_range;
                const categoryFilter = parsedIntent.parameters.category_filter;
                const daysAgo = parsedIntent.parameters.days_ago;
                const requestedLimit = parsedIntent.parameters.limit;
                const specificDate = parsedIntent.parameters.specific_date;
                const sortBy = parsedIntent.parameters.sort_by;

                let limit = requestedLimit;
                let limitNotice: string | undefined;

                if (requestedLimit && requestedLimit > 30) {
                    limit = 30;
                    limitNotice = '⚠️ Maksimal 30 transaksi. Menampilkan 30 transaksi terakhir.';
                }

                console.log('[query_details] Parameters:', { timeRange, categoryFilter, daysAgo, limit, specificDate, sortBy });

                // Default to 'this_month' for better UX when no time range specified
                // For limit-based queries without explicit time range, use all_time
                const effectiveTimeRange = (limit && !timeRange && !specificDate && daysAgo === undefined)
                    ? 'all_time'
                    : (timeRange || 'this_month');
                const details = await getTransactionDetails(userId, effectiveTimeRange, categoryFilter, daysAgo, limit, specificDate, sortBy);

                let timeRangeText: string;
                if (limit && sortBy === 'amount') {
                    // "3 transaksi tertinggi bulan ini"
                    timeRangeText = `${limit} transaksi tertinggi`;
                } else if (limit) {
                    // "5 transaksi terakhir"
                    timeRangeText = `${limit} transaksi terakhir`;
                } else if (specificDate) {
                    timeRangeText = `tanggal ${responseFormatter.formatDate(specificDate)}`;
                } else if (daysAgo !== undefined) {
                    timeRangeText = daysAgo === 0 ? 'hari ini' : `${daysAgo} hari lalu`;
                } else {
                    timeRangeText = formatTimeRange(effectiveTimeRange);
                }

                const categoryText = categoryFilter ? ` kategori ${categoryFilter}` : '';
                const response = responseFormatter.formatTransactionDetails(details, timeRangeText + categoryText, limitNotice);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'category_breakdown': {
                const timeRange = parsedIntent.parameters.time_range;
                const daysAgo = parsedIntent.parameters.days_ago;
                const categories = await getCategoryBreakdown(userId, timeRange || 'this_month', daysAgo);

                let timeRangeText: string;
                if (daysAgo !== undefined) {
                    timeRangeText = daysAgo === 0 ? 'hari ini' : `${daysAgo} hari lalu`;
                } else {
                    timeRangeText = formatTimeRange(timeRange || 'this_month');
                }

                const response = responseFormatter.formatCategoryBreakdown(categories, timeRangeText);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'add_transaction': {
                const { amount, description, category_hint } = parsedIntent.parameters;

                if (!amount || !description) {
                    await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                    await getBot().sendMessage(chatId, '❌ Jumlah atau deskripsi tidak ditemukan.\n\nContoh: "tambah 50000 makan siang"');
                    return;
                }

                const categories = await getUserCategories(userId);
                let categoryChoice: { categoryId: string; categoryName: string; confidence: 'high' | 'medium' | 'low' };
                const normalizedHint = category_hint?.toLowerCase().trim();
                const directMatch = normalizedHint
                    ? categories.find((category) => category.name.toLowerCase() === normalizedHint)
                    : undefined;

                const hintAliasMap: Record<string, string[]> = {
                    food: ['makan', 'makanan', 'kuliner', 'food', 'minum', 'snack', 'camil', 'camilan', 'warteg', 'warung', 'resto', 'restaurant', 'cafe', 'kopi'],
                    transportation: ['transport', 'transportasi', 'travel', 'perjalanan', 'bensin', 'bbm', 'parkir', 'taksi', 'ojek', 'gojek', 'grab', 'pertamina'],
                    shopping: ['belanja', 'shopping', 'market', 'minimarket', 'indomaret', 'alfamart', 'supermarket', 'mall']
                };

                const fuzzyMatch = normalizedHint
                    ? categories.find((category) => {
                        const name = category.name.toLowerCase();
                        if (normalizedHint && (name.includes(normalizedHint) || normalizedHint.includes(name))) {
                            return true;
                        }

                        const aliases = hintAliasMap[normalizedHint] || [];
                        return aliases.some((alias) => name.includes(alias));
                    })
                    : undefined;

                if (directMatch) {
                    categoryChoice = {
                        categoryId: directMatch.id,
                        categoryName: directMatch.name,
                        confidence: 'high'
                    };
                } else if (fuzzyMatch) {
                    categoryChoice = {
                        categoryId: fuzzyMatch.id,
                        categoryName: fuzzyMatch.name,
                        confidence: 'high'
                    };
                } else {
                    try {
                        categoryChoice = await classifyCategory(description, categories);
                    } catch (classificationError) {
                        console.error('Category classification failed:', classificationError);
                        const fallbackNames = new Set(['lainnya', 'other', 'others']);
                        const otherCategory = categories.find((category) => fallbackNames.has(category.name.toLowerCase()));
                        const fallbackCategory = otherCategory || categories[0];
                        categoryChoice = {
                            categoryId: fallbackCategory.id,
                            categoryName: fallbackCategory.name,
                            confidence: 'low' as const
                        };
                    }
                }

                // Create transaction
                const transactionId = await createManualTransaction(
                    userId,
                    amount,
                    description,
                    categoryChoice.categoryName,
                    msg.from?.id,
                    categoryChoice.categoryId
                );

                console.log(`Created manual transaction ${transactionId} for user ${userId}`);

                const response = responseFormatter.formatTransactionAdded(amount, categoryChoice.categoryName, description);
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                break;
            }

            case 'financial_advice': {
                try {
                    const timeRange = parsedIntent.parameters.time_range || 'this_month';
                    const advice = await analyzeFinancialHealth(userId, timeRange);

                    // Format with metadata
                    const formattedAdvice = responseFormatter.formatFinancialAdvice(advice);
                    await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                    await getBot().sendMessage(chatId, formattedAdvice, { parse_mode: 'Markdown' });
                } catch (error) {
                    console.error('Error in financial advice:', error);
                    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menganalisis data keuangan.';
                    await getBot().sendMessage(chatId, `❌ ${errorMsg}`);
                }
                break;
            }

            case 'savings_strategy': {
                try {
                    const timeRange = parsedIntent.parameters.time_range || 'this_month';
                    const strategy = await generateSavingsStrategy(userId, timeRange);

                    const formattedStrategy = responseFormatter.formatSavingsStrategy(strategy);
                    await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                    await getBot().sendMessage(chatId, formattedStrategy, { parse_mode: 'Markdown' });
                } catch (error) {
                    console.error('Error in savings strategy:', error);
                    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat strategi hemat.';
                    await getBot().sendMessage(chatId, `❌ ${errorMsg}`);
                }
                break;
            }

            case 'expense_analysis': {
                try {
                    const timeRange = parsedIntent.parameters.time_range || 'this_month';
                    const analysis = await analyzeExpenseReduction(userId, timeRange);

                    const formattedAnalysis = responseFormatter.formatExpenseAnalysis(analysis);
                    await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                    await getBot().sendMessage(chatId, formattedAnalysis, { parse_mode: 'Markdown' });
                } catch (error) {
                    console.error('Error in expense analysis:', error);
                    const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat menganalisis pengeluaran.';
                    await getBot().sendMessage(chatId, `❌ ${errorMsg}`);
                }
                break;
            }

            case 'list_categories': {
                try {
                    const categories = await getUserCategories(userId);
                    const response = responseFormatter.formatCategoryList(categories);
                    await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                    await getBot().sendMessage(chatId, response, { parse_mode: 'Markdown' });
                } catch (error) {
                    console.error('Error listing categories:', error);
                    await getBot().sendMessage(chatId, '❌ Gagal mengambil daftar kategori.');
                }
                break;
            }

            default:
                await getBot().deleteMessage(chatId, processingMsg.message_id).catch(() => { });
                await getBot().sendMessage(chatId, responseFormatter.formatUnknownIntent(), { parse_mode: 'Markdown' });
        }



    } catch (error) {
        console.error('Error handling text message:', error);
        console.error('Error details - message:', text);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        await getBot().sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.');
        // Try to delete processing message even on error
        try {
            await getBot().deleteMessage(chatId, processingMsg.message_id);
        } catch (deleteError) {
            // Ignore delete errors
        }
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

            const { receiptData, userId, telegramId, photoFileId, photoCaption } = sessionDoc.data()!;

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
                    attachmentData,
                    photoCaption // Pass photo caption as description
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
