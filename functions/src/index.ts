/**
 * Firebase Cloud Functions for DompetCerdas Telegram Bot
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { initBot, processUpdate } from './bot';
import { getUserCategories } from './services/transactionService';
import { linkTelegramAccount, validateLinkToken } from './services/linkService';
import { analyzeFinancialDataForWeb, WebFinancialAnalysisMode } from './services/webAnalysisService';
import { getActiveAccountSummary } from './services/accountService';
import { escapeMarkdown } from './services/responseFormatter';
import { buildSharedMemberPayload, generateInviteCode, normalizeInviteCode } from './services/collaborationService';
import {
    DEFAULT_SHARED_CATEGORIES,
    copyPrivateAccountScopedDataToSharedWorkspace,
    deletePrivateAccountScopedData,
    removeSharedAccountAccess,
} from './services/sharedAccountService';

// Initialize Firebase Admin
admin.initializeApp();
const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

/**
 * Get Firestore database reference
 */
export function getDb() {
    return firestore;
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

            const update = req.body;
            const updateId = update?.update_id;
            let processedUpdateRef: FirebaseFirestore.DocumentReference | null = null;

            if (updateId !== undefined && updateId !== null) {
                processedUpdateRef = firestore.collection('telegram_processed_updates').doc(String(updateId));
                try {
                    await processedUpdateRef.create({
                        updateId,
                        status: 'processing',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                } catch (error: any) {
                    if (error?.code === 6 || error?.code === 'already-exists' || error?.message?.includes('ALREADY_EXISTS')) {
                        console.log('Duplicate Telegram update ignored:', { updateId });
                        res.status(200).send('OK');
                        return;
                    }
                    throw error;
                }
            }

            try {
                await processUpdate(update);
                if (processedUpdateRef) {
                    await processedUpdateRef.set({
                        status: 'processed',
                        processedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
            } catch (error) {
                if (processedUpdateRef) {
                    await processedUpdateRef.set({
                        status: 'failed',
                        failedAt: admin.firestore.FieldValue.serverTimestamp(),
                        error: error instanceof Error ? error.message : String(error),
                    }, { merge: true });
                }
                throw error;
            }

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
    .https.onCall(async (data, context) => {
        // Enforce authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const userId = context.auth.uid;
        const { telegramId, accountName: accountNameFromRequest } = data;

        console.log('notifyLinkSuccess called:', { telegramId, userId });

        if (!telegramId) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing telegramId');
        }

        try {
            const accountSummary = await getActiveAccountSummary(userId);
            const accountName = accountNameFromRequest || accountSummary.name;

            // Send confirmation message to user
            const bot = initBot();
            await bot.sendMessage(
                telegramId,
                '✅ *Akun berhasil terhubung!*\n\n' +
                (accountName ? `Akun aktif saat ini: *${escapeMarkdown(accountName)}*\n\n` : '') +
                'Sekarang kamu bisa:\n' +
                '• Tanya tentang keuangan kamu\n' +
                '• Upload foto struk untuk catat transaksi\n' +
                '• Lihat ringkasan pengeluaran\n\n' +
                'Ketik /help untuk panduan lengkap! 😊',
                { parse_mode: 'Markdown' }
            );

            return { success: true };
        } catch (error) {
            console.error('Error in notifyLinkSuccess:', error);
            throw new functions.https.HttpsError(
                'internal',
                error instanceof Error ? error.message : 'Internal Server Error'
            );
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

/**
 * Link Telegram account via secure callable function
 */
export const linkTelegram = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const token = data?.token;
        if (!token || typeof token !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Token is required.');
        }

        const validation = await validateLinkToken(token);
        if (!validation.valid || !validation.telegramId) {
            const reasonMap: Record<string, string> = {
                'Token not found': 'invalid',
                'Token already used': 'used',
                'Token expired': 'expired',
            };
            const reason = validation.error ? (reasonMap[validation.error] || 'invalid') : 'invalid';
            throw new functions.https.HttpsError(
                'failed-precondition',
                validation.error || 'Invalid token',
                { reason }
            );
        }

        const telegramUser = validation.telegramUser || {
            id: validation.telegramId,
            first_name: 'Telegram',
        };

        await linkTelegramAccount(token, context.auth.uid, telegramUser);
        const accountSummary = await getActiveAccountSummary(context.auth.uid);

        return {
            success: true,
            telegramId: validation.telegramId,
            accountId: accountSummary.id,
            accountName: accountSummary.name,
        };
    });

/**
 * Refresh category cache for the authenticated user
 */
export const refreshCategoryCache = functions
    .region('asia-southeast1')
    .https.onCall(async (_, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const userId = context.auth.uid;
        await getUserCategories(userId, true);
        return { success: true };
    });

/**
 * Web AI financial analysis with per-user quota enforcement
 */
export const analyzeFinancialData = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const mode = (data?.mode || 'HEALTH') as WebFinancialAnalysisMode;
        if (!['HEALTH', 'SPENDING', 'SAVINGS'].includes(mode)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid analysis mode.');
        }

        try {
            return await analyzeFinancialDataForWeb(context.auth.uid, mode);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to analyze financial data.';
            throw new functions.https.HttpsError('failed-precondition', message);
        }
    });

export const createSharedAccount = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const name = typeof data?.name === 'string' ? data.name.trim() : '';
        if (!name) {
            throw new functions.https.HttpsError('invalid-argument', 'Nama akun wajib diisi.');
        }

        const now = new Date().toISOString();
        const userId = context.auth.uid;
        const userRef = firestore.collection('users').doc(userId);
        const userAccountRef = userRef.collection('accounts').doc();
        const sharedAccountRef = firestore.collection('sharedAccounts').doc();
        const sharedMemberRef = sharedAccountRef.collection('members').doc(userId);
        const batch = firestore.batch();

        batch.set(sharedAccountRef, {
            name,
            ownerUserId: userId,
            inviteCode: null,
            inviteCodeUpdatedAt: null,
            createdAt: now,
            updatedAt: now,
        });

        batch.set(sharedMemberRef, buildSharedMemberPayload({
            userId,
            role: 'OWNER',
            now,
            email: context.auth.token.email || null,
            displayName: context.auth.token.name || null,
        }));

        batch.set(userAccountRef, {
            name,
            role: 'OWNER',
            ownerUserId: userId,
            sharedAccountId: sharedAccountRef.id,
            createdAt: now,
            updatedAt: now,
        });

        DEFAULT_SHARED_CATEGORIES.forEach((category) => {
            batch.set(sharedAccountRef.collection('categories').doc(category.id), category);
        });

        batch.set(userRef, {
            activeAccountId: userAccountRef.id,
            updatedAt: now,
        }, { merge: true });

        await batch.commit();

        return {
            success: true,
            accountId: userAccountRef.id,
            sharedAccountId: sharedAccountRef.id,
            name,
        };
    });

export const shareExistingAccount = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const accountId = typeof data?.accountId === 'string' ? data.accountId.trim() : '';
        if (!accountId) {
            throw new functions.https.HttpsError('invalid-argument', 'Account ID is required.');
        }

        const userId = context.auth.uid;
        const userRef = firestore.collection('users').doc(userId);
        const userAccountRef = userRef.collection('accounts').doc(accountId);
        const userAccountSnap = await userAccountRef.get();

        if (!userAccountSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Akun tidak ditemukan.');
        }

        const accountData = userAccountSnap.data() as {
            name?: string;
            sharedAccountId?: string;
            role?: 'OWNER' | 'MEMBER';
            createdAt?: string;
        };

        if (accountData.sharedAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Akun ini sudah dibagikan.');
        }

        if (accountData.role && accountData.role !== 'OWNER') {
            throw new functions.https.HttpsError('permission-denied', 'Hanya pemilik yang bisa membagikan akun.');
        }

        const accountName = (accountData.name || 'Akun Keuangan').trim() || 'Akun Keuangan';
        const now = new Date().toISOString();
        const sharedAccountRef = firestore.collection('sharedAccounts').doc();

        try {
            // Step 1: Create shared account doc first
            const batch = firestore.batch();

            batch.set(sharedAccountRef, {
                name: accountName,
                ownerUserId: userId,
                inviteCode: null,
                inviteCodeUpdatedAt: null,
                createdAt: accountData.createdAt || now,
                updatedAt: now,
                sourceAccountId: accountId,
            });

            batch.set(sharedAccountRef.collection('members').doc(userId), buildSharedMemberPayload({
                userId,
                role: 'OWNER',
                now,
                email: context.auth.token.email || null,
                displayName: context.auth.token.name || null,
            }));

            batch.set(userAccountRef, {
                name: accountName,
                role: 'OWNER',
                ownerUserId: userId,
                sharedAccountId: sharedAccountRef.id,
                createdAt: accountData.createdAt || now,
                updatedAt: now,
            }, { merge: true });

            batch.set(userRef, {
                activeAccountId: accountId,
                updatedAt: now,
            }, { merge: true });

            await batch.commit();

            // Step 2: Copy data to shared workspace
            await copyPrivateAccountScopedDataToSharedWorkspace(userId, accountId, sharedAccountRef.id);

            // Step 3: Delete private data
            await deletePrivateAccountScopedData(userId, accountId);

            return {
                success: true,
                accountId,
                sharedAccountId: sharedAccountRef.id,
                name: accountName,
                role: 'OWNER',
            };
        } catch (error) {
            // Rollback: delete shared account if copy/delete failed
            try {
                await sharedAccountRef.delete();
                await sharedAccountRef.collection('members').doc(userId).delete();
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }
            throw error;
        }
    });

export const deleteSharedAccountAccess = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const accountId = typeof data?.accountId === 'string' ? data.accountId.trim() : '';
        if (!accountId) {
            throw new functions.https.HttpsError('invalid-argument', 'Account ID is required.');
        }

        const result = await removeSharedAccountAccess(context.auth.uid, accountId);
        return result;
    });

export const createSharedInviteCode = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const accountId = typeof data?.accountId === 'string' ? data.accountId.trim() : '';
        if (!accountId) {
            throw new functions.https.HttpsError('invalid-argument', 'Account ID is required.');
        }

        const userId = context.auth.uid;
        const userAccountRef = firestore.collection('users').doc(userId).collection('accounts').doc(accountId);
        const userAccountSnap = await userAccountRef.get();
        if (!userAccountSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Akun tidak ditemukan.');
        }

        const accountData = userAccountSnap.data() as { sharedAccountId?: string; role?: 'OWNER' | 'MEMBER' };
        if (!accountData.sharedAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Akun ini bukan akun bersama.');
        }
        if (accountData.role !== 'OWNER') {
            throw new functions.https.HttpsError('permission-denied', 'Hanya pemilik yang bisa membuat kode gabung.');
        }

        let code = '';
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const candidate = generateInviteCode();
            const existing = await firestore.collection('sharedAccounts')
                .where('inviteCode', '==', candidate)
                .limit(1)
                .get();
            if (existing.empty) {
                code = candidate;
                break;
            }
        }

        if (!code) {
            throw new functions.https.HttpsError('resource-exhausted', 'Gagal membuat kode gabung baru.');
        }

        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        await firestore.collection('sharedAccounts').doc(accountData.sharedAccountId).set({
            inviteCode: code,
            inviteCodeUpdatedAt: now,
            inviteCodeExpiresAt: expiresAt,
            updatedAt: now,
        }, { merge: true });

        return { success: true, code, expiresAt };
    });

export const joinSharedAccountByCode = functions
    .region('asia-southeast1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
        }

        const code = normalizeInviteCode(typeof data?.code === 'string' ? data.code : '');
        if (!code) {
            throw new functions.https.HttpsError('invalid-argument', 'Kode gabung wajib diisi.');
        }

        const sharedSnapshot = await firestore.collection('sharedAccounts')
            .where('inviteCode', '==', code)
            .limit(1)
            .get();

        if (sharedSnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'Kode gabung tidak ditemukan.');
        }

        const sharedAccountDoc = sharedSnapshot.docs[0];
        const sharedData = sharedAccountDoc.data() as {
            name?: string;
            ownerUserId?: string;
            inviteCodeExpiresAt?: string;
        };

        // Check expiry
        if (sharedData.inviteCodeExpiresAt) {
            const expiresAt = new Date(sharedData.inviteCodeExpiresAt).getTime();
            if (Date.now() > expiresAt) {
                throw new functions.https.HttpsError('failed-precondition', 'Kode gabung sudah kadaluarsa.');
            }
        }

        const userId = context.auth.uid;
        const userRef = firestore.collection('users').doc(userId);
        const existingStubSnapshot = await userRef.collection('accounts')
            .where('sharedAccountId', '==', sharedAccountDoc.id)
            .limit(1)
            .get();

        const accountRef = existingStubSnapshot.empty
            ? userRef.collection('accounts').doc()
            : existingStubSnapshot.docs[0].ref;

        const existingMemberRef = sharedAccountDoc.ref.collection('members').doc(userId);
        const existingMemberSnap = await existingMemberRef.get();
        const existingRole = existingMemberSnap.exists
            ? (existingMemberSnap.data() as { role?: 'OWNER' | 'MEMBER' }).role
            : undefined;
        const role = existingRole || (sharedData.ownerUserId === userId ? 'OWNER' : 'MEMBER');
        const now = new Date().toISOString();
        const existingAccountCreatedAt = existingStubSnapshot.empty
            ? now
            : ((existingStubSnapshot.docs[0].data() as { createdAt?: string }).createdAt || now);

        const batch = firestore.batch();
        batch.set(existingMemberRef, {
            ...buildSharedMemberPayload({
                userId,
                role,
                now,
                email: context.auth.token.email || null,
                displayName: context.auth.token.name || null,
            }),
            joinedAt: existingMemberSnap.exists
                ? ((existingMemberSnap.data() as { joinedAt?: string }).joinedAt || now)
                : now,
        }, { merge: true });

        batch.set(accountRef, {
            name: sharedData.name || 'Keuangan Bersama',
            role,
            ownerUserId: sharedData.ownerUserId || userId,
            sharedAccountId: sharedAccountDoc.id,
            createdAt: existingAccountCreatedAt,
            updatedAt: now,
        }, { merge: true });

        batch.set(userRef, {
            activeAccountId: accountRef.id,
            updatedAt: now,
        }, { merge: true });

        await batch.commit();

        return {
            success: true,
            accountId: accountRef.id,
            sharedAccountId: sharedAccountDoc.id,
            name: sharedData.name || 'Keuangan Bersama',
            role,
        };
    });
