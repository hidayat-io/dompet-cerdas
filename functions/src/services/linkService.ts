/**
 * Account linking service
 * Handles Telegram account linking to Firebase users
 */

import * as admin from 'firebase-admin';
import { generateSecureToken } from '../utils/crypto';

// Helper to get Firestore instance
const getDb = () => admin.firestore();

export interface LinkToken {
    token: string;
    telegramId: number;
    createdAt: admin.firestore.Timestamp;
    expiresAt: admin.firestore.Timestamp;
    used: boolean;
    usedAt?: admin.firestore.Timestamp;
}

export interface TelegramLink {
    telegramId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    linkedAt: admin.firestore.Timestamp;
    active: boolean;
    lastInteraction: admin.firestore.Timestamp;
}

/**
 * Generate and save a link token
 * @param telegramId - Telegram user ID
 * @returns Token string
 */
export async function generateLinkToken(telegramId: number): Promise<string> {
    const token = generateSecureToken(32);
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + 5 * 60 * 1000 // 5 minutes
    );

    const linkToken: LinkToken = {
        token,
        telegramId,
        createdAt: now,
        expiresAt,
        used: false,
    };

    await getDb().collection('link_tokens').doc(token).set(linkToken);

    return token;
}

/**
 * Validate a link token
 * @param token - Token to validate
 * @returns Validation result with telegram ID if valid
 */
export async function validateLinkToken(
    token: string
): Promise<{ valid: boolean; telegramId?: number; error?: string }> {
    const tokenDoc = await getDb().collection('link_tokens').doc(token).get();

    if (!tokenDoc.exists) {
        return { valid: false, error: 'Token not found' };
    }

    const data = tokenDoc.data() as LinkToken;

    if (data.used) {
        return { valid: false, error: 'Token already used' };
    }

    const now = admin.firestore.Timestamp.now();
    if (now.toMillis() > data.expiresAt.toMillis()) {
        return { valid: false, error: 'Token expired' };
    }

    return { valid: true, telegramId: data.telegramId };
}

/**
 * Link Telegram account to Firebase user
 * @param token - Link token
 * @param userId - Firebase user ID
 * @param telegramUser - Telegram user info
 */
export async function linkTelegramAccount(
    token: string,
    userId: string,
    telegramUser: {
        id: number;
        username?: string;
        first_name: string;
        last_name?: string;
    }
): Promise<void> {
    const now = admin.firestore.Timestamp.now();

    // Mark token as used
    await getDb().collection('link_tokens').doc(token).update({
        used: true,
        usedAt: now,
    });

    // Create telegram link
    const telegramLink: TelegramLink = {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        linkedAt: now,
        active: true,
        lastInteraction: now,
    };

    await getDb()
        .collection('users')
        .doc(userId)
        .collection('telegram_link')
        .doc('main')
        .set(telegramLink);
}

/**
 * Check if Telegram user is already linked
 * @param telegramId - Telegram user ID
 * @returns User ID if linked, null otherwise
 */
export async function checkTelegramLink(
    telegramId: number
): Promise<string | null> {
    const snapshot = await getDb()
        .collectionGroup('telegram_link')
        .where('telegramId', '==', telegramId)
        .where('active', '==', true)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    // Extract user ID from document path
    // Path format: users/{userId}/telegram_link/main
    const docPath = snapshot.docs[0].ref.path;
    const userId = docPath.split('/')[1];

    return userId;
}

/**
 * Update last interaction timestamp
 * @param telegramId - Telegram user ID
 */
export async function updateLastInteraction(telegramId: number): Promise<void> {
    const userId = await checkTelegramLink(telegramId);

    if (!userId) {
        return;
    }

    await getDb()
        .collection('users')
        .doc(userId)
        .collection('telegram_link')
        .doc('main')
        .update({
            lastInteraction: admin.firestore.Timestamp.now(),
        });
}
