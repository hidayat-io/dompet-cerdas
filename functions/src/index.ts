/**
 * Firebase Cloud Functions for DompetCerdas Telegram Bot
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { initBot, processUpdate } from './bot';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Get Firestore database reference
 */
export function getDb() {
    return admin.firestore();
}

/**
 * Telegram Webhook Handler
 * Receives updates from Telegram Bot API
 */
export const telegramWebhook = functions
    .region('asia-southeast1') // Singapore region (closest to Indonesia)
    .https.onRequest(async (req, res) => {
        try {
            // Only accept POST requests
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            // Process the update
            const update = req.body;
            await processUpdate(update);

            // Respond to Telegram
            res.status(200).send('OK');
        } catch (error) {
            console.error('Error in telegramWebhook:', error);
            res.status(500).send('Internal Server Error');
        }
    });

/**
 * Notify bot when account is successfully linked
 * Called from web app after linking
 */
export const notifyLinkSuccess = functions
    .region('asia-southeast1')
    .https.onRequest(async (req, res) => {
        // Set CORS headers
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        try {
            // Only accept POST requests
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const { telegramId, userId } = req.body;

            console.log('notifyLinkSuccess called:', { telegramId, userId });

            if (!telegramId || !userId) {
                console.error('Missing parameters');
                res.status(400).json({ error: 'Missing telegramId or userId' });
                return;
            }

            // Send confirmation message to user
            const bot = initBot();
            await bot.sendMessage(
                telegramId,
                '✅ *Akun berhasil terhubung!*\n\n' +
                'Sekarang kamu bisa:\n' +
                '• Tanya tentang keuangan kamu\n' +
                '• Upload foto struk untuk catat transaksi\n' +
                '• Lihat ringkasan pengeluaran\n\n' +
                'Ketik /help untuk panduan lengkap! 😊',
                { parse_mode: 'Markdown' }
            );

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error in notifyLinkSuccess:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    });

/**
 * Health check endpoint
 */
export const healthCheck = functions
    .region('asia-southeast1')
    .https.onRequest((req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'dompetcerdas-telegram-bot',
        });
    });
