/**
 * Cryptographic utilities for secure token generation
 */

import * as crypto from 'crypto';

/**
 * Generate a secure random token
 * @param length - Length of the token (default: 32)
 * @returns Hex string token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a short alphanumeric token (for display)
 * @param length - Length of the token (default: 6)
 * @returns Uppercase alphanumeric token
 */
export function generateShortToken(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }

    return result;
}

/**
 * Hash a string using SHA256
 * @param input - String to hash
 * @returns Hex string hash
 */
export function hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}
