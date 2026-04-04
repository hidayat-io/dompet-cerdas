import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

export const DEFAULT_SHARED_CATEGORIES = [
    { id: 'c1', name: 'Gaji', type: 'INCOME', icon: 'Wallet', color: '#10b981' },
    { id: 'c2', name: 'Bonus', type: 'INCOME', icon: 'Gift', color: '#34d399' },
    { id: 'c3', name: 'Makanan', type: 'EXPENSE', icon: 'Utensils', color: '#f87171' },
    { id: 'c4', name: 'Transport', type: 'EXPENSE', icon: 'Car', color: '#60a5fa' },
    { id: 'c5', name: 'Belanja', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f472b6' },
    { id: 'c6', name: 'Tagihan', type: 'EXPENSE', icon: 'Zap', color: '#fbbf24' },
] as const;

const COLLECTION_COPY_BATCH_SIZE = 400;
const COLLECTION_DELETE_BATCH_SIZE = 400;

const getDb = () => admin.firestore();

const getCreatedAtSortKey = (value?: string) => (typeof value === 'string' && value.trim() ? value : '9999-12-31T23:59:59.999Z');

const sortByCreatedAtThenId = (left: { id: string; createdAt?: string }, right: { id: string; createdAt?: string }) => {
    const leftKey = getCreatedAtSortKey(left.createdAt);
    const rightKey = getCreatedAtSortKey(right.createdAt);
    if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey);
    }
    return left.id.localeCompare(right.id);
};

const getPrivateAccountCollections = (userId: string, accountId: string) => {
    const accountRef = getDb().collection('users').doc(userId).collection('accounts').doc(accountId);
    return {
        categories: accountRef.collection('categories'),
        transactions: accountRef.collection('transactions'),
        plans: accountRef.collection('plans'),
        budgets: accountRef.collection('budgets'),
        simulations: accountRef.collection('simulations'),
        debts: accountRef.collection('debts'),
    };
};

const getSharedAccountCollections = (sharedAccountId: string) => {
    const sharedAccountRef = getDb().collection('sharedAccounts').doc(sharedAccountId);
    return {
        categories: sharedAccountRef.collection('categories'),
        transactions: sharedAccountRef.collection('transactions'),
        plans: sharedAccountRef.collection('plans'),
        budgets: sharedAccountRef.collection('budgets'),
        simulations: sharedAccountRef.collection('simulations'),
        debts: sharedAccountRef.collection('debts'),
    };
};

async function copySnapshotToCollection(
    snapshot: admin.firestore.QuerySnapshot,
    targetCollection: admin.firestore.CollectionReference
) {
    if (snapshot.empty) {
        return;
    }

    for (let index = 0; index < snapshot.docs.length; index += COLLECTION_COPY_BATCH_SIZE) {
        const batch = getDb().batch();
        const slice = snapshot.docs.slice(index, index + COLLECTION_COPY_BATCH_SIZE);
        slice.forEach((document) => {
            batch.set(targetCollection.doc(document.id), document.data());
        });
        await batch.commit();
    }
}

async function deleteCollectionDocuments(collectionRef: admin.firestore.CollectionReference) {
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
        return;
    }

    for (let index = 0; index < snapshot.docs.length; index += COLLECTION_DELETE_BATCH_SIZE) {
        const batch = getDb().batch();
        const slice = snapshot.docs.slice(index, index + COLLECTION_DELETE_BATCH_SIZE);
        slice.forEach((document) => {
            batch.delete(document.ref);
        });
        await batch.commit();
    }
}

async function getFallbackUserAccountId(userId: string, excludedAccountId: string) {
    const snapshot = await getDb()
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .get();

    const remainingAccounts = snapshot.docs
        .map((document) => ({
            id: document.id,
            ...(document.data() as { createdAt?: string }),
        }))
        .filter((account) => account.id !== excludedAccountId)
        .sort(sortByCreatedAtThenId);

    return remainingAccounts[0]?.id || null;
}

async function updateUserRoutingAfterSharedAccountChange(userId: string, targetAccountId: string, fallbackAccountId: string) {
    const userRef = getDb().collection('users').doc(userId);
    const [userSnap, telegramSnap] = await Promise.all([
        userRef.get(),
        userRef.collection('telegram_link').doc('main').get(),
    ]);

    const userData = userSnap.data() as { activeAccountId?: string } | undefined;
    const now = new Date().toISOString();
    const userUpdates: Record<string, unknown> = {};

    if (userData?.activeAccountId === targetAccountId) {
        userUpdates.activeAccountId = fallbackAccountId;
        userUpdates.updatedAt = now;
    }

    if (Object.keys(userUpdates).length > 0) {
        await userRef.set(userUpdates, { merge: true });
    }

    if (telegramSnap.exists) {
        const telegramData = telegramSnap.data() as { defaultAccountId?: string } | undefined;
        if (telegramData?.defaultAccountId === targetAccountId) {
            await telegramSnap.ref.set({
                defaultAccountId: fallbackAccountId,
                updatedAt: now,
            }, { merge: true });
        }
    }
}

async function deleteSharedWorkspaceDocuments(ownerUserId: string, accountId: string, sharedAccountId: string) {
    const sharedAccountRef = getDb().collection('sharedAccounts').doc(sharedAccountId);
    const ownerAccountRef = getDb().collection('users').doc(ownerUserId).collection('accounts').doc(accountId);

    await Promise.all([
        deleteCollectionDocuments(sharedAccountRef.collection('members')),
        deleteCollectionDocuments(sharedAccountRef.collection('categories')),
        deleteCollectionDocuments(sharedAccountRef.collection('transactions')),
        deleteCollectionDocuments(sharedAccountRef.collection('plans')),
        deleteCollectionDocuments(sharedAccountRef.collection('budgets')),
        deleteCollectionDocuments(sharedAccountRef.collection('simulations')),
        deleteCollectionDocuments(sharedAccountRef.collection('debts')),
        ownerAccountRef.delete(),
    ]);

    await sharedAccountRef.delete();
}

export async function copyPrivateAccountScopedDataToSharedWorkspace(userId: string, accountId: string, sharedAccountId: string) {
    const sourceCollections = getPrivateAccountCollections(userId, accountId);
    const targetCollections = getSharedAccountCollections(sharedAccountId);

    const [
        categoriesSnap,
        transactionsSnap,
        plansSnap,
        budgetsSnap,
        simulationsSnap,
        debtsSnap,
    ] = await Promise.all([
        sourceCollections.categories.get(),
        sourceCollections.transactions.get(),
        sourceCollections.plans.get(),
        sourceCollections.budgets.get(),
        sourceCollections.simulations.get(),
        sourceCollections.debts.get(),
    ]);

    await copySnapshotToCollection(categoriesSnap, targetCollections.categories);

    if (categoriesSnap.empty) {
        const batch = getDb().batch();
        DEFAULT_SHARED_CATEGORIES.forEach((category) => {
            batch.set(targetCollections.categories.doc(category.id), category);
        });
        await batch.commit();
    }

    await Promise.all([
        copySnapshotToCollection(transactionsSnap, targetCollections.transactions),
        copySnapshotToCollection(plansSnap, targetCollections.plans),
        copySnapshotToCollection(budgetsSnap, targetCollections.budgets),
        copySnapshotToCollection(simulationsSnap, targetCollections.simulations),
        copySnapshotToCollection(debtsSnap, targetCollections.debts),
    ]);
}

export async function deletePrivateAccountScopedData(userId: string, accountId: string) {
    const sourceCollections = getPrivateAccountCollections(userId, accountId);
    await Promise.all([
        deleteCollectionDocuments(sourceCollections.categories),
        deleteCollectionDocuments(sourceCollections.transactions),
        deleteCollectionDocuments(sourceCollections.plans),
        deleteCollectionDocuments(sourceCollections.budgets),
        deleteCollectionDocuments(sourceCollections.simulations),
        deleteCollectionDocuments(sourceCollections.debts),
    ]);
}

export async function removeSharedAccountAccess(userId: string, accountId: string) {
    const userRef = getDb().collection('users').doc(userId);
    const userAccountRef = userRef.collection('accounts').doc(accountId);
    const userAccountSnap = await userAccountRef.get();

    if (!userAccountSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Akun tidak ditemukan.');
    }

    const accountData = userAccountSnap.data() as {
        name?: string;
        sharedAccountId?: string;
        role?: 'OWNER' | 'MEMBER';
    };

    if (!accountData.sharedAccountId) {
        throw new functions.https.HttpsError('failed-precondition', 'Akun ini bukan akun bersama.');
    }

    const sharedAccountRef = getDb().collection('sharedAccounts').doc(accountData.sharedAccountId);
    const sharedAccountSnap = await sharedAccountRef.get();

    if (!sharedAccountSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Akun bersama tidak ditemukan.');
    }

    const sharedData = sharedAccountSnap.data() as {
        name?: string;
        ownerUserId?: string;
    };
    const fallbackAccountId = await getFallbackUserAccountId(userId, accountId);

    if (!fallbackAccountId) {
        throw new functions.https.HttpsError('failed-precondition', 'Minimal harus ada satu Akun Keuangan yang tersisa.');
    }

    const accountName = (accountData.name || sharedData.name || 'Keuangan Bersama').trim() || 'Keuangan Bersama';
    const now = new Date().toISOString();

    if (sharedData.ownerUserId === userId) {
        const membersSnapshot = await sharedAccountRef.collection('members').get();
        if (membersSnapshot.size > 1) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `Akun bersama masih memiliki ${membersSnapshot.size - 1} anggota lain. Minta mereka keluar dulu sebelum akun bisa dihapus.`
            );
        }

        await deleteSharedWorkspaceDocuments(userId, accountId, accountData.sharedAccountId);
        await updateUserRoutingAfterSharedAccountChange(userId, accountId, fallbackAccountId);

        return {
            success: true,
            action: 'DELETED' as const,
            accountId,
            sharedAccountId: accountData.sharedAccountId,
            name: accountName,
            fallbackAccountId,
            updatedAt: now,
        };
    }

    await Promise.all([
        sharedAccountRef.collection('members').doc(userId).delete(),
        userAccountRef.delete(),
    ]);
    await updateUserRoutingAfterSharedAccountChange(userId, accountId, fallbackAccountId);

    return {
        success: true,
        action: 'LEFT' as const,
        accountId,
        sharedAccountId: accountData.sharedAccountId,
        name: accountName,
        fallbackAccountId,
        updatedAt: now,
    };
}
