import { Budget, Category, Transaction } from '../types';

export type BudgetSummary = {
  budget: Budget;
  categories: Category[];
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
};

export type BudgetOverview = {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overBudgetCount: number;
  activeBudgetCount: number;
};

export type BudgetTransactionItem = {
  transaction: Transaction;
  category: Category | undefined;
};

export const getMonthKey = (value = new Date()) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

export const getPreviousMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return getMonthKey(date);
};

export const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
};

export const getNormalizedBudget = (budget: Partial<Budget> & { id: string }, categories: Category[]): Budget => {
  const resolvedCategoryIds = Array.isArray(budget.categoryIds) && budget.categoryIds.length > 0
    ? budget.categoryIds
    : budget.categoryId
      ? [budget.categoryId]
      : [];

  const derivedName = budget.name?.trim()
    || resolvedCategoryIds
      .map((categoryId) => categories.find((category) => category.id === categoryId)?.name)
      .filter(Boolean)
      .join(' + ')
    || 'Anggaran';

  return {
    id: budget.id,
    month: budget.month || getMonthKey(),
    name: derivedName,
    categoryIds: resolvedCategoryIds,
    limitAmount: typeof budget.limitAmount === 'number' ? budget.limitAmount : 0,
    createdAt: budget.createdAt || new Date().toISOString(),
    updatedAt: budget.updatedAt || budget.createdAt || new Date().toISOString(),
    categoryId: budget.categoryId,
  };
};

export const getExpenseSpendByCategoriesForMonth = (
  transactions: Transaction[],
  categories: Category[],
  categoryIds: string[],
  monthKey: string
) => {
  const scopedCategoryIds = new Set(categoryIds);

  return transactions.reduce((total, transaction) => {
    if (!scopedCategoryIds.has(transaction.categoryId)) return total;
    if (!transaction.date?.startsWith(monthKey)) return total;

    const category = categories.find((entry) => entry.id === transaction.categoryId);
    if (category?.type !== 'EXPENSE') return total;

    return total + transaction.amount;
  }, 0);
};

export const getBudgetSummaries = (
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BudgetSummary[] => budgets
  .filter((budget) => budget.month === monthKey)
  .map((budget) => {
    const matchedCategories = budget.categoryIds
      .map((categoryId) => categories.find((entry) => entry.id === categoryId))
      .filter((category): category is Category => !!category);
    const spent = getExpenseSpendByCategoriesForMonth(transactions, categories, budget.categoryIds, monthKey);
    const remaining = budget.limitAmount - spent;
    const percentage = budget.limitAmount > 0 ? Math.min((spent / budget.limitAmount) * 100, 999) : 0;

    return {
      budget,
      categories: matchedCategories,
      spent,
      remaining,
      percentage,
      isOverBudget: remaining < 0,
    };
  })
  .sort((left, right) => {
    if (left.isOverBudget !== right.isOverBudget) return left.isOverBudget ? -1 : 1;
    return right.spent - left.spent;
  });

export const getBudgetOverview = (summaries: BudgetSummary[]): BudgetOverview => {
  const totalBudget = summaries.reduce((total, summary) => total + summary.budget.limitAmount, 0);
  const totalSpent = summaries.reduce((total, summary) => total + summary.spent, 0);

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    overBudgetCount: summaries.filter((summary) => summary.isOverBudget).length,
    activeBudgetCount: summaries.length,
  };
};

export const getBudgetTransactions = (
  budget: Budget,
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BudgetTransactionItem[] => {
  const scopedCategoryIds = new Set(budget.categoryIds);

  return transactions
    .filter((transaction) => {
      if (!scopedCategoryIds.has(transaction.categoryId)) return false;
      if (!transaction.date?.startsWith(monthKey)) return false;

      const category = categories.find((entry) => entry.id === transaction.categoryId);
      return category?.type === 'EXPENSE';
    })
    .map((transaction) => ({
      transaction,
      category: categories.find((entry) => entry.id === transaction.categoryId),
    }))
    .sort((left, right) => {
      const dateCompare = right.transaction.date.localeCompare(left.transaction.date);
      if (dateCompare !== 0) return dateCompare;

      const createdAtLeft = left.transaction.createdAt || '';
      const createdAtRight = right.transaction.createdAt || '';
      return createdAtRight.localeCompare(createdAtLeft);
    });
};
