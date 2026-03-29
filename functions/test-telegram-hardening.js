const { sanitizeFirestoreData } = require('./lib/utils/firestore');
const { getFallbackCategory } = require('./lib/services/transactionService');
const {
  escapeMarkdown,
  withAccountHeader,
  formatTransactionDraftPreview,
  formatCategoryList,
} = require('./lib/services/responseFormatter');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  console.log('🧪 TELEGRAM HARDENING TEST SUITE');
  console.log('==================================================\n');

  const sanitized = sanitizeFirestoreData({
    status: 'pending',
    optional: undefined,
    nested: {
      keep: 'ok',
      drop: undefined,
      array: [1, undefined, { a: 'x', b: undefined }],
    },
  });

  assert(!('optional' in sanitized), 'top-level undefined field should be removed');
  assert(!('drop' in sanitized.nested), 'nested undefined field should be removed');
  assert(sanitized.nested.array.length === 2, 'undefined array items should be removed');
  assert(!('b' in sanitized.nested.array[1]), 'nested object field inside array should be removed');
  console.log('✅ PASS: sanitizeFirestoreData');

  const accountHeader = withAccountHeader('Halo', 'Pribadi_[1]');
  assert(accountHeader.includes('Pribadi\\_\\[1\\]'), 'account name should be escaped');
  console.log('✅ PASS: withAccountHeader escapes account name');

  assert(escapeMarkdown(undefined) === '', 'escapeMarkdown should safely handle undefined values');
  console.log('✅ PASS: escapeMarkdown handles undefined');

  const draftPreview = formatTransactionDraftPreview([
    { amount: 25000, description: 'kopi_[test]', categoryName: 'Belanja_[Mall]' },
  ], false);
  assert(draftPreview.includes('kopi\\_\\[test\\]'), 'draft description should be escaped');
  assert(draftPreview.includes('Belanja\\_\\[Mall\\]'), 'draft category should be escaped');
  assert(draftPreview.includes('Klik *Simpan* kalau sudah benar.'), 'single-item preview should use Simpan label');
  console.log('✅ PASS: formatTransactionDraftPreview escapes dynamic values');

  const multiDraftPreview = formatTransactionDraftPreview([
    { amount: 25000, description: 'makan', categoryName: 'Makanan' },
    { amount: 5000, description: 'parkir', categoryName: 'Transport' },
  ], false);
  assert(multiDraftPreview.includes('Hapus 1 / Hapus 2'), 'multi-item preview should mention remove-item hint');
  console.log('✅ PASS: multi-item preview shows edit hint');

  const categoryList = formatCategoryList([
    { id: '1', name: 'Belanja_[Mall]', type: 'EXPENSE' },
  ]);
  assert(categoryList.includes('Belanja\\_\\[Mall\\]'), 'category list should escape category name');
  console.log('✅ PASS: formatCategoryList escapes category names');

  const fallbackExpense = getFallbackCategory([
    { id: 'income-1', name: 'Gaji', type: 'INCOME' },
    { id: 'expense-1', name: 'Belanja', type: 'EXPENSE' },
  ]);
  assert(fallbackExpense.id === 'expense-1', 'expense fallback should not default to income category');

  const fallbackIncome = getFallbackCategory([
    { id: 'expense-1', name: 'Belanja', type: 'EXPENSE' },
    { id: 'income-1', name: 'Gaji', type: 'INCOME' },
  ], 'INCOME');
  assert(fallbackIncome.id === 'income-1', 'income fallback should prefer income category');
  console.log('✅ PASS: getFallbackCategory respects category type preference');

  console.log('\n==================================================');
  console.log('📊 Results: 6 passed, 0 failed');
  console.log('✅ ALL TESTS PASSED');
}

try {
  run();
} catch (error) {
  console.error('Test suite crashed:', error);
  process.exit(1);
}
