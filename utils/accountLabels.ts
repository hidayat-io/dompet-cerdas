import { FinancialAccount } from '../types';

export const getAccountStatusLabel = (account?: Pick<FinancialAccount, 'sharedAccountId' | 'role'> | null) => {
  if (!account) return 'Akun';
  if (account.sharedAccountId) {
    return account.role === 'OWNER' ? 'Akun Bersama • Pemilik' : 'Akun Bersama • Anggota';
  }
  return 'Akun Pribadi';
};

export const sanitizeAccountNameForFilename = (name: string) => (
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
);
