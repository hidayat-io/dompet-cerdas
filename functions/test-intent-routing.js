const { shouldPreferAIIntentParsing } = require('./lib/services/nluService');

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error });
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
  }
}

console.log('🧪 INTENT ROUTING TEST SUITE');
console.log('='.repeat(50));
console.log();

test('simple total expense query stays local', () => {
  if (shouldPreferAIIntentParsing('pengeluaran bulan ini', { intent: 'query', confidence: 'high', parameters: { time_range: 'this_month' } })) {
    throw new Error('Expected local routing');
  }
});

test('top expense query prefers AI', () => {
  if (!shouldPreferAIIntentParsing('top 10 pengeluaran bulan ini', { intent: 'query_details', confidence: 'medium', parameters: { time_range: 'this_month', limit: 10, sort_by: 'amount', type_filter: 'EXPENSE' } })) {
    throw new Error('Expected AI routing');
  }
});

test('typo transaction query prefers AI', () => {
  if (!shouldPreferAIIntentParsing('top 10 transaski bulan ini', { intent: 'query_details', confidence: 'medium', parameters: { time_range: 'this_month', limit: 10, sort_by: 'amount' } })) {
    throw new Error('Expected AI routing');
  }
});

test('canonical recent query stays local', () => {
  if (shouldPreferAIIntentParsing('10 transaksi terakhir', { intent: 'query_details', confidence: 'high', parameters: { limit: 10, sort_by: 'date' } })) {
    throw new Error('Expected local routing');
  }
});

test('shorthand ranking query prefers AI', () => {
  if (!shouldPreferAIIntentParsing('10 trans terbesar bln ini', { intent: 'query_details', confidence: 'medium', parameters: { time_range: 'this_month', limit: 10, sort_by: 'amount' } })) {
    throw new Error('Expected AI routing');
  }
});

console.log();
const passed = results.filter((entry) => entry.passed).length;
const failed = results.length - passed;
console.log('='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('✅ ALL TESTS PASSED');
