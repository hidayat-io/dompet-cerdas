import { AccountType } from '../types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  PERSONAL: 'Pribadi',
  FAMILY: 'Keluarga',
  BUSINESS: 'Bisnis',
  SHARED: 'Keuangan Bersama',
};

export const getAccountTypeLabel = (type?: AccountType | string) => {
  if (!type) return 'Akun';
  return ACCOUNT_TYPE_LABELS[type as AccountType] || type;
};

export const sanitizeAccountNameForFilename = (name: string) => (
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
);
