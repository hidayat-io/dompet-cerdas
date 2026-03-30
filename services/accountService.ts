import {
  collection,
  CollectionReference,
  DocumentData,
  doc,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import { AccountType, DebtRecord, FinancialAccount, SharedAccount, SharedAccountMember } from '../types';

export type AccountScopedCollectionName = 'categories' | 'transactions' | 'plans' | 'budgets' | 'simulations' | 'debts';

export const DEFAULT_ACCOUNT_NAME = 'Pribadi';
export const DEFAULT_ACCOUNT_TYPE: AccountType = 'PERSONAL';

type UserMeta = {
  activeAccountId?: string;
  categoriesSeeded?: boolean;
  accountMigrationVersion?: number;
  accountMigrationCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getUserDocRef = (db: Firestore, userId: string): DocumentReference<UserMeta> =>
  doc(db, 'users', userId) as DocumentReference<UserMeta>;

export const getAccountsCollectionRef = (db: Firestore, userId: string): CollectionReference<FinancialAccount> =>
  collection(db, 'users', userId, 'accounts') as CollectionReference<FinancialAccount>;

export const getAccountDocRef = (db: Firestore, userId: string, accountId: string): DocumentReference<FinancialAccount> =>
  doc(db, 'users', userId, 'accounts', accountId) as DocumentReference<FinancialAccount>;

export const getSharedAccountsCollectionRef = (db: Firestore): CollectionReference<SharedAccount> =>
  collection(db, 'sharedAccounts') as CollectionReference<SharedAccount>;

export const getSharedAccountDocRef = (db: Firestore, sharedAccountId: string): DocumentReference<SharedAccount> =>
  doc(db, 'sharedAccounts', sharedAccountId) as DocumentReference<SharedAccount>;

export const getSharedAccountMembersCollectionRef = (db: Firestore, sharedAccountId: string): CollectionReference<SharedAccountMember> =>
  collection(db, 'sharedAccounts', sharedAccountId, 'members') as CollectionReference<SharedAccountMember>;

export const getAccountScopedCollectionRef = <T>(
  db: Firestore,
  userId: string,
  accountId: string,
  collectionName: AccountScopedCollectionName
): CollectionReference<T> =>
  collection(db, 'users', userId, 'accounts', accountId, collectionName) as CollectionReference<T>;

export const getCategoriesCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DocumentData>(db, userId, accountId, 'categories');

export const getTransactionsCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DocumentData>(db, userId, accountId, 'transactions');

export const getPlansCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DocumentData>(db, userId, accountId, 'plans');

export const getBudgetsCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DocumentData>(db, userId, accountId, 'budgets');

export const getLegacySimulationsCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DocumentData>(db, userId, accountId, 'simulations');

export const getDebtsCollectionRef = (db: Firestore, userId: string, accountId: string) =>
  getAccountScopedCollectionRef<DebtRecord>(db, userId, accountId, 'debts');

export const getScopedCollectionRefForAccount = <T>(
  db: Firestore,
  userId: string,
  account: Pick<FinancialAccount, 'id' | 'sharedAccountId'>,
  collectionName: AccountScopedCollectionName
): CollectionReference<T> => (
  account.sharedAccountId
    ? collection(db, 'sharedAccounts', account.sharedAccountId, collectionName)
    : collection(db, 'users', userId, 'accounts', account.id, collectionName)
) as CollectionReference<T>;

export const getScopedStoragePath = (
  userId: string,
  account: Pick<FinancialAccount, 'id' | 'sharedAccountId'>,
  fileName: string
) => account.sharedAccountId
  ? `sharedAccounts/${account.sharedAccountId}/attachments/${fileName}`
  : `users/${userId}/accounts/${account.id}/attachments/${fileName}`;

export const createAccountPayload = (
  name: string,
  type: AccountType = DEFAULT_ACCOUNT_TYPE,
  now = new Date().toISOString(),
  extra: Partial<Omit<FinancialAccount, 'id' | 'name' | 'type' | 'role' | 'createdAt' | 'updatedAt'>> = {}
): Omit<FinancialAccount, 'id'> => ({
  name,
  type,
  role: 'OWNER',
  createdAt: now,
  updatedAt: now,
  ...extra,
});
