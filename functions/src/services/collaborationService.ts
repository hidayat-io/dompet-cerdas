const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

export function normalizeInviteCode(rawCode: string): string {
    return rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function generateInviteCode(): string {
    let result = '';
    for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
        const charIndex = Math.floor(Math.random() * INVITE_ALPHABET.length);
        result += INVITE_ALPHABET[charIndex];
    }
    return result;
}

export function buildSharedMemberPayload(params: {
    userId: string;
    role: 'OWNER' | 'MEMBER';
    now?: string;
    email?: string | null;
    displayName?: string | null;
}) {
    const now = params.now || new Date().toISOString();
    return {
        userId: params.userId,
        role: params.role,
        email: params.email || null,
        displayName: params.displayName || null,
        joinedAt: now,
        updatedAt: now,
    };
}
