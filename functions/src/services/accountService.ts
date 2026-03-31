import * as admin from 'firebase-admin';

const getDb = () => admin.firestore();

export interface AccountContext {
    userId: string;
    accountId?: string;
    sharedAccountId?: string;
    role?: 'OWNER' | 'MEMBER';
    usesLegacyPaths: boolean;
}

export async function getAccountContext(userId: string, preferredAccountId?: string): Promise<AccountContext> {
    const userRef = getDb().collection('users').doc(userId);
    const userSnap = await userRef.get();
    const activeAccountId = userSnap.data()?.activeAccountId;
    const resolvedAccountId = preferredAccountId || activeAccountId;

    if (typeof resolvedAccountId === 'string' && resolvedAccountId.trim()) {
        const accountRef = userRef.collection('accounts').doc(resolvedAccountId);
        const accountSnap = await accountRef.get();

        if (accountSnap.exists) {
            const accountData = accountSnap.data() as { sharedAccountId?: string; role?: 'OWNER' | 'MEMBER' };
            return {
                userId,
                accountId: resolvedAccountId,
                sharedAccountId: accountData.sharedAccountId,
                role: accountData.role,
                usesLegacyPaths: false,
            };
        }
    }

    return {
        userId,
        usesLegacyPaths: true,
    };
}

export function getCategoriesCollection(context: AccountContext) {
    const userRef = getDb().collection('users').doc(context.userId);
    return context.usesLegacyPaths
        ? userRef.collection('categories')
        : context.sharedAccountId
            ? getDb().collection('sharedAccounts').doc(context.sharedAccountId).collection('categories')
            : userRef.collection('accounts').doc(context.accountId!).collection('categories');
}

export function getTransactionsCollection(context: AccountContext) {
    const userRef = getDb().collection('users').doc(context.userId);
    return context.usesLegacyPaths
        ? userRef.collection('transactions')
        : context.sharedAccountId
            ? getDb().collection('sharedAccounts').doc(context.sharedAccountId).collection('transactions')
            : userRef.collection('accounts').doc(context.accountId!).collection('transactions');
}

export function getPlansCollection(context: AccountContext) {
    const userRef = getDb().collection('users').doc(context.userId);
    return context.usesLegacyPaths
        ? userRef.collection('simulations')
        : context.sharedAccountId
            ? getDb().collection('sharedAccounts').doc(context.sharedAccountId).collection('plans')
            : userRef.collection('accounts').doc(context.accountId!).collection('plans');
}

export function getLegacySimulationsCollection(context: AccountContext) {
    const userRef = getDb().collection('users').doc(context.userId);
    return context.usesLegacyPaths
        ? userRef.collection('simulations')
        : context.sharedAccountId
            ? getDb().collection('sharedAccounts').doc(context.sharedAccountId).collection('simulations')
            : userRef.collection('accounts').doc(context.accountId!).collection('simulations');
}

export async function getScopedCollections(userId: string, preferredAccountId?: string) {
    const context = await getAccountContext(userId, preferredAccountId);

    return {
        context,
        categoriesCollection: getCategoriesCollection(context),
        transactionsCollection: getTransactionsCollection(context),
        plansCollection: getPlansCollection(context),
        legacySimulationsCollection: getLegacySimulationsCollection(context),
    };
}

export async function getActiveAccountId(userId: string): Promise<string | undefined> {
    const context = await getAccountContext(userId);
    return context.accountId;
}

export async function getActiveAccountSummary(userId: string): Promise<{ id?: string; name?: string; type?: string }> {
    const context = await getAccountContext(userId);
    if (context.usesLegacyPaths || !context.accountId) {
        return {};
    }

    const accountSnap = await getDb()
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc(context.accountId)
        .get();

    if (!accountSnap.exists) {
        return {};
    }

    const data = accountSnap.data() as { name?: string; type?: string };
    return {
        id: accountSnap.id,
        name: data.name,
        type: data.type,
    };
}

export async function getAccountSummary(userId: string, accountId?: string): Promise<{ id?: string; name?: string; type?: string }> {
    const context = await getAccountContext(userId, accountId);
    if (context.usesLegacyPaths || !context.accountId) {
        return {};
    }

    const accountSnap = await getDb()
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc(context.accountId)
        .get();

    if (!accountSnap.exists) {
        return {};
    }

    const data = accountSnap.data() as { name?: string; type?: string };
    return {
        id: accountSnap.id,
        name: data.name,
        type: data.type,
    };
}

export async function getUserAccounts(userId: string): Promise<Array<{ id: string; name: string; type?: string }>> {
    const snapshot = await getDb()
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .orderBy('createdAt', 'asc')
        .get();

    return snapshot.docs.map((accountDoc) => {
        const data = accountDoc.data() as { name?: string; type?: string };
        return {
            id: accountDoc.id,
            name: data.name || 'Akun',
            type: data.type,
        };
    });
}
