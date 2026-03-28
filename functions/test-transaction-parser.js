const {
  parseTransactionMessageHybrid,
  normalizeParsedTransactionDrafts,
  shouldAttemptTransactionParsing,
} = require('./lib/services/transactionParsingService');

async function run() {
  const cases = [
    {
      name: 'single simple transaction',
      input: 'makan siang 25rb',
      expectCount: 1,
      expectAttempt: true,
    },
    {
      name: 'multiple simple transactions',
      input: 'makan 25rb, parkir 5rb',
      expectCount: 2,
      expectAttempt: true,
    },
    {
      name: 'mixed bill and food transactions',
      input: 'bayar hutang 10k, makan malam 40k',
      expectCount: 2,
      expectAttempt: true,
      expectHints: ['Bill', 'Food'],
    },
    {
      name: 'three mixed transactions with one uncategorized hint',
      input: 'hutang 10k, parkir 10k, beli hadiah 100k',
      expectCount: 3,
      expectAttempt: true,
      expectHints: ['Bill', 'Transportation', null],
    },
    {
      name: 'multiple transactions separated by semicolon',
      input: 'parkir 5rb; beli hadiah 100rb',
      expectCount: 2,
      expectAttempt: true,
    },
    {
      name: 'multiple transactions separated by newline',
      input: `makan 25rb
parkir 5rb`,
      expectCount: 2,
      expectAttempt: true,
    },
    {
      name: 'multiple transactions separated by dan',
      input: 'makan 25rb dan parkir 5rb',
      expectCount: 2,
      expectAttempt: true,
    },
    {
      name: 'explicit add command',
      input: 'tambah 150rb beli obat kategori kesehatan',
      expectCount: 1,
      expectAttempt: true,
    },
    {
      name: 'query should not be parsed as transaction',
      input: 'berapa pengeluaran minggu ini?',
      expectCount: 0,
      expectAttempt: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  console.log('🧪 TRANSACTION PARSER TEST SUITE');
  console.log('==================================================\n');

  for (const testCase of cases) {
    const attempt = shouldAttemptTransactionParsing(testCase.input);
    const parsed = await parseTransactionMessageHybrid(testCase.input);
    const count = parsed?.items?.length || 0;
    const hints = parsed?.items?.map((item) => item.category_hint || null) || [];
    const hintOk = !testCase.expectHints || JSON.stringify(hints) === JSON.stringify(testCase.expectHints);
    const ok = attempt === testCase.expectAttempt && count === testCase.expectCount && hintOk;

    if (ok) {
      passed += 1;
      console.log(`✅ PASS: ${testCase.name}`);
    } else {
      failed += 1;
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   expected attempt=${testCase.expectAttempt}, count=${testCase.expectCount}`);
      console.log(`   received attempt=${attempt}, count=${count}`);
      if (testCase.expectHints) {
        console.log(`   expected hints=${JSON.stringify(testCase.expectHints)}`);
        console.log(`   received hints=${JSON.stringify(hints)}`);
      }
    }
  }

  const normalizedDrafts = normalizeParsedTransactionDrafts([
    { amount: '25rb', description: 'makan siang', category_hint: null },
    { amount: 10000, description: 'parkir', category_hint: 'Transportation' },
    { amount: 'invalid', description: 'should drop', category_hint: null },
    { amount: 5000, description: '   ', category_hint: 'Food' },
  ], 'pesan asli');

  if (
    normalizedDrafts.length !== 2 ||
    normalizedDrafts[0].amount !== 25000 ||
    normalizedDrafts[0].sourceText !== 'pesan asli' ||
    normalizedDrafts[1].category_hint !== 'Transportation'
  ) {
    failed += 1;
    console.log('❌ FAIL: normalizeParsedTransactionDrafts');
    console.log(`   received=${JSON.stringify(normalizedDrafts)}`);
  } else {
    passed += 1;
    console.log('✅ PASS: normalizeParsedTransactionDrafts');
  }

  console.log('\n==================================================');
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }

  console.log('✅ ALL TESTS PASSED');
}

run().catch((error) => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
