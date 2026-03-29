process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '123456:TESTTOKEN';

const indexModule = require('./lib/index');
const botModule = require('./lib/bot/index');
const linkService = require('./lib/services/linkService');
const transactionService = require('./lib/services/transactionService');
const nluService = require('./lib/services/nluService');
const geminiService = require('./lib/services/geminiService');
const queryService = require('./lib/services/queryService');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMockDb() {
  const collections = new Map();

  function ensureCollection(name) {
    if (!collections.has(name)) {
      collections.set(name, new Map());
    }
    return collections.get(name);
  }

  function createDocRef(name, id) {
    const collection = ensureCollection(name);
    return {
      id,
      path: `${name}/${id}`,
      async set(data) {
        collection.set(id, JSON.parse(JSON.stringify(data)));
      },
      async get() {
        const current = collection.get(id);
        return {
          exists: current !== undefined,
          data: () => current,
          ref: createDocRef(name, id),
        };
      },
      async update(data) {
        const current = collection.get(id) || {};
        collection.set(id, { ...current, ...JSON.parse(JSON.stringify(data)) });
      },
    };
  }

  return {
    collection(name) {
      return {
        doc(id) {
          return createDocRef(name, id);
        },
      };
    },
    _collections: collections,
  };
}

function createBotRecorder() {
  const calls = [];
  return {
    calls,
    async sendMessage(chatId, text, options = {}) {
      calls.push({ method: 'sendMessage', chatId, text, options });
      return { message_id: calls.length };
    },
    async deleteMessage(chatId, messageId) {
      calls.push({ method: 'deleteMessage', chatId, messageId });
      return true;
    },
    async editMessageText(text, options = {}) {
      calls.push({ method: 'editMessageText', text, options });
      return true;
    },
    async answerCallbackQuery(id, options = {}) {
      calls.push({ method: 'answerCallbackQuery', id, options });
      return true;
    },
    async getFileLink(fileId) {
      calls.push({ method: 'getFileLink', fileId });
      return 'https://example.com/fake-audio.ogg';
    },
  };
}

function getLatestCall(recorder, method) {
  const filtered = recorder.calls.filter((call) => call.method === method);
  return filtered[filtered.length - 1];
}

function getLatestFinalSendMessage(recorder) {
  const filtered = recorder.calls.filter(
    (call) => call.method === 'sendMessage' && typeof call.text === 'string' && !call.text.startsWith('⏳')
  );
  return filtered[filtered.length - 1];
}

async function run() {
  console.log('🧪 TELEGRAM BOT FLOW TEST SUITE');
  console.log('==================================================\n');

  const mockDb = createMockDb();
  indexModule.getDb = () => mockDb;

  const categories = [
    { id: 'c1', name: 'Gaji', type: 'INCOME' },
    { id: 'c3', name: 'Makanan', type: 'EXPENSE' },
    { id: 'c4', name: 'Transport', type: 'EXPENSE' },
    { id: 'c5', name: 'Belanja', type: 'EXPENSE' },
    { id: 'c6', name: 'Tagihan', type: 'EXPENSE' },
  ];

  const accountStateByTelegramId = new Map([
    [9001, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9002, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9003, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9004, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9005, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9006, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9007, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9008, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
    [9009, {
      userId: 'user-1',
      defaultAccountId: 'personal',
      defaultAccountName: 'Pribadi',
      accounts: [
        { id: 'personal', name: 'Pribadi', type: 'PERSONAL' },
        { id: 'family', name: 'Keluarga', type: 'FAMILY' },
      ],
    }],
  ]);

  linkService.checkTelegramLink = async () => 'user-1';
  linkService.updateLastInteraction = async () => {};
  linkService.getTelegramAccountState = async (telegramId) => accountStateByTelegramId.get(telegramId) || null;
  linkService.updateTelegramDefaultAccountByTelegramId = async (telegramId, accountId) => {
    const current = accountStateByTelegramId.get(telegramId);
    const nextAccount = current.accounts.find((account) => account.id === accountId);
    if (!nextAccount) {
      return { userId: current.userId, accountId, accountName: undefined };
    }

    const nextState = {
      ...current,
      defaultAccountId: nextAccount.id,
      defaultAccountName: nextAccount.name,
    };
    accountStateByTelegramId.set(telegramId, nextState);

    return {
      userId: nextState.userId,
      accountId: nextState.defaultAccountId,
      accountName: nextState.defaultAccountName,
    };
  };

  transactionService.getUserCategories = async () => categories;
  const savedBatches = [];
  const detailRequests = [];
  transactionService.createManualTransactionsBatch = async (...args) => {
    savedBatches.push(args);
    return args[1].map((_, index) => `tx-${savedBatches.length}-${index + 1}`);
  };
  queryService.getTransactionDetails = async (...args) => {
    detailRequests.push(args);
    const typeFilter = args[7];

    if (typeFilter === 'INCOME') {
      return [
        {
          id: 'tx-income-1',
          amount: 2500000,
          description: 'Bonus proyek',
          type: 'INCOME',
          category: 'Gaji',
          date: '2026-03-29',
        },
        {
          id: 'tx-income-2',
          amount: 1750000,
          description: 'Freelance',
          type: 'INCOME',
          category: 'Gaji',
          date: '2026-03-28',
        },
      ];
    }

    if (typeFilter === 'EXPENSE') {
      return [
        {
          id: 'tx-expense-1',
          amount: 120000,
          description: 'Belanja mingguan',
          type: 'EXPENSE',
          category: 'Belanja',
          date: '2026-03-29',
        },
        {
          id: 'tx-expense-2',
          amount: 18000,
          description: 'Kopi',
          type: 'EXPENSE',
          category: 'Makanan',
          date: '2026-03-28',
        },
      ];
    }

    return [
      {
        id: 'tx-list-1',
        amount: 120000,
        description: 'Belanja mingguan',
        type: 'EXPENSE',
        category: 'Belanja',
        date: '2026-03-29',
      },
      {
        id: 'tx-list-2',
        amount: 18000,
        description: 'Kopi',
        type: 'EXPENSE',
        category: 'Makanan',
        date: '2026-03-28',
      },
    ];
  };
  nluService.classifyCategory = async (description, availableCategories) => {
    if (/hadiah/i.test(description)) {
      return { categoryId: 'c5', categoryName: 'Belanja', confidence: 'medium' };
    }
    if (/gaji|bonus/i.test(description)) {
      return { categoryId: 'c1', categoryName: 'Gaji', confidence: 'medium' };
    }
    const fallback = availableCategories.find((category) => category.type === 'EXPENSE') || availableCategories[0];
    return { categoryId: fallback.id, categoryName: fallback.name, confidence: 'low' };
  };
  geminiService.transcribeAudioToText = async () => 'makan 25rb, parkir 5rb';

  const bot = botModule.initBot();
  const recorder = createBotRecorder();
  bot.sendMessage = recorder.sendMessage;
  bot.deleteMessage = recorder.deleteMessage;
  bot.editMessageText = recorder.editMessageText;
  bot.answerCallbackQuery = recorder.answerCallbackQuery;
  bot.getFileLink = recorder.getFileLink;

  global.fetch = async () => ({
    ok: true,
    async arrayBuffer() {
      return new Uint8Array([1, 2, 3, 4]).buffer;
    },
  });

  let passed = 0;

  await botModule.processUpdate({
    update_id: 1,
    message: {
      message_id: 101,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9001, is_bot: false, first_name: 'Tester' },
      text: 'makan siang 25rb',
    },
  });

  const draftCollection = mockDb._collections.get('text_transaction_sessions');
  const firstSession = Array.from(draftCollection.values())[0];
  const firstSessionId = Array.from(draftCollection.keys())[0];
  const firstPreview = getLatestCall(recorder, 'sendMessage');

  assert(savedBatches.length === 0, 'single preview should not auto-save');
  assert(firstSession.items.length === 1, 'single preview should store 1 draft item');
  assert(firstPreview.text.includes('📁 *Akun: Pribadi*'), 'single preview should include account header');
  assert(firstPreview.text.includes('Klik *Simpan* kalau sudah benar.'), 'single preview should use Simpan label');
  passed += 1;
  console.log('✅ PASS: single transaction preview');

  await botModule.processUpdate({
    update_id: 2,
    callback_query: {
      id: 'cb-1',
      from: { id: 9001, is_bot: false, first_name: 'Tester' },
      data: `mtc_${firstSessionId}`,
      message: {
        message_id: 201,
        date: 1,
        chat: { id: 5001, type: 'private' },
      },
    },
  });

  const confirmedSession = draftCollection.get(firstSessionId);
  const confirmEdit = getLatestCall(recorder, 'editMessageText');
  assert(savedBatches.length === 1, 'confirm should save exactly one batch');
  assert(savedBatches[0][1].length === 1, 'confirm should save exactly one transaction item');
  assert(confirmedSession.status === 'confirmed', 'confirm should mark draft as confirmed');
  assert(confirmEdit.text.includes('Transaksi berhasil ditambahkan'), 'confirm should edit message to success state');
  passed += 1;
  console.log('✅ PASS: single transaction confirm');

  await botModule.processUpdate({
    update_id: 3,
    message: {
      message_id: 102,
      date: 1,
      chat: { id: 5002, type: 'private' },
      from: { id: 9002, is_bot: false, first_name: 'Tester' },
      text: 'makan 25rb, parkir 5rb',
    },
  });

  const secondSessionId = Array.from(draftCollection.keys())[1];
  const secondSession = draftCollection.get(secondSessionId);
  const multiPreview = getLatestCall(recorder, 'sendMessage');
  assert(secondSession.items.length === 2, 'comma-separated input should create 2 draft items');
  assert(multiPreview.text.includes('2 transaksi'), 'comma-separated input should preview 2 transactions');
  assert(multiPreview.text.includes('Hapus 1 / Hapus 2'), 'multi preview should show remove-item hint');
  assert(
    multiPreview.options.reply_markup.inline_keyboard[0][0].text.includes('Simpan Semua'),
    'multi preview should use Simpan Semua label'
  );
  assert(
    multiPreview.options.reply_markup.inline_keyboard[1][0].callback_data === `mtr_${secondSessionId}_0`,
    'multi preview should expose remove callback for first item'
  );
  passed += 1;
  console.log('✅ PASS: multi transaction preview');

  await botModule.processUpdate({
    update_id: 4,
    callback_query: {
      id: 'cb-2',
      from: { id: 9002, is_bot: false, first_name: 'Tester' },
      data: `mtr_${secondSessionId}_0`,
      message: {
        message_id: 202,
        date: 1,
        chat: { id: 5002, type: 'private' },
      },
    },
  });

  const trimmedSession = draftCollection.get(secondSessionId);
  const removeEdit = getLatestCall(recorder, 'editMessageText');
  assert(trimmedSession.items.length === 1, 'remove item should update draft session');
  assert(trimmedSession.items[0].description === 'parkir', 'remove item should keep the remaining item');
  assert(removeEdit.text.includes('Saya menemukan *1 transaksi*'), 'remove item should re-render preview as single item');
  assert(removeEdit.text.includes('Klik *Simpan* kalau sudah benar.'), 'remove item should downgrade save label to Simpan');
  passed += 1;
  console.log('✅ PASS: remove item from multi transaction draft');

  await botModule.processUpdate({
    update_id: 5,
    callback_query: {
      id: 'cb-3',
      from: { id: 9002, is_bot: false, first_name: 'Tester' },
      data: `mtx_${secondSessionId}`,
      message: {
        message_id: 202,
        date: 1,
        chat: { id: 5002, type: 'private' },
      },
    },
  });

  const cancelledSession = draftCollection.get(secondSessionId);
  const cancelEdit = getLatestCall(recorder, 'editMessageText');
  assert(cancelledSession.status === 'cancelled', 'cancel should mark draft as cancelled');
  assert(savedBatches.length === 1, 'cancel should not save new transactions');
  assert(cancelEdit.text.includes('Draft transaksi tidak disimpan'), 'cancel should show cancellation message');
  passed += 1;
  console.log('✅ PASS: cancel draft');

  await botModule.processUpdate({
    update_id: 6,
    message: {
      message_id: 103,
      date: 1,
      chat: { id: 5003, type: 'private' },
      from: { id: 9003, is_bot: false, first_name: 'Tester' },
      text: 'hutang 10k, parkir 10k, beli hadiah 100k',
    },
  });

  const thirdSession = Array.from(draftCollection.values())[2];
  assert(thirdSession.items.length === 3, 'mixed three-item input should create 3 draft items');
  assert(thirdSession.items[2].categoryName === 'Belanja', 'uncategorized expense fallback should prefer expense category');
  passed += 1;
  console.log('✅ PASS: mixed three-item input stays in expense categories');

  await botModule.processUpdate({
    update_id: 7,
    message: {
      message_id: 104,
      date: 1,
      chat: { id: 5004, type: 'private' },
      from: { id: 9004, is_bot: false, first_name: 'Tester' },
      text: '/akun',
    },
  });

  const accountMessage = getLatestCall(recorder, 'sendMessage');
  assert(accountMessage.text.includes('⚙️ *Akun Telegram*'), '/akun should show account status');
  assert(accountMessage.options.reply_markup.inline_keyboard.length === 2, '/akun should show switch buttons when multiple accounts exist');
  passed += 1;
  console.log('✅ PASS: /akun shows account switcher');

  await botModule.processUpdate({
    update_id: 8,
    callback_query: {
      id: 'cb-4',
      from: { id: 9004, is_bot: false, first_name: 'Tester' },
      data: 'switch_account:family',
      message: {
        message_id: 204,
        date: 1,
        chat: { id: 5004, type: 'private' },
      },
    },
  });

  const switchEdit = getLatestCall(recorder, 'editMessageText');
  assert(switchEdit.text.includes('📁 *Akun: Keluarga*'), 'switch account should update account header');
  passed += 1;
  console.log('✅ PASS: switch account callback');

  await botModule.processUpdate({
    update_id: 9,
    message: {
      message_id: 105,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9001, is_bot: false, first_name: 'Tester' },
      voice: {
        file_id: 'voice-1',
        duration: 8,
        mime_type: 'audio/ogg',
        file_size: 1200,
      },
    },
  });

  const voicePreview = getLatestCall(recorder, 'sendMessage');
  assert(voicePreview.text.includes('🎤 *Hasil suara:* _makan 25rb, parkir 5rb_'), 'voice preview should include transcript note');
  assert(voicePreview.text.includes('Klik *Simpan Semua* kalau sudah benar.'), 'voice preview should support batch save');
  passed += 1;
  console.log('✅ PASS: voice note preview');

  const draftCountBeforeQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 10,
    message: {
      message_id: 106,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9005, is_bot: false, first_name: 'Tester' },
      text: 'tampilkan 10 trans terakhir',
    },
  });

  const queryResponse = getLatestFinalSendMessage(recorder);
  assert(draftCollection.size === draftCountBeforeQuery, 'recent transaction query should not create a draft session');
  assert(!queryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'recent transaction query should not render transaction preview');
  assert(queryResponse.text.includes('10 transaksi terakhir'), 'recent transaction query should return transaction details response');
  passed += 1;
  console.log('✅ PASS: shorthand recent transaction query stays in query flow');

  const draftCountBeforeTopQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 11,
    message: {
      message_id: 107,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9006, is_bot: false, first_name: 'Tester' },
      text: 'top 10 biggest trans on thins month',
    },
  });

  const topQueryResponse = getLatestFinalSendMessage(recorder);
  assert(draftCollection.size === draftCountBeforeTopQuery, 'english top query should not create a draft session');
  assert(!topQueryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'english top query should not render transaction preview');
  assert(topQueryResponse.text.includes('10 transaksi tertinggi'), 'english top query should return top transaction details response');
  passed += 1;
  console.log('✅ PASS: english top transaction query stays in query flow');

  const draftCountBeforeIndoTopQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 12,
    message: {
      message_id: 108,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9007, is_bot: false, first_name: 'Tester' },
      text: 'top 10 transaksi bulan ini',
    },
  });

  const indoTopQueryResponse = getLatestFinalSendMessage(recorder);
  assert(draftCollection.size === draftCountBeforeIndoTopQuery, 'indonesian top query should not create a draft session');
  assert(!indoTopQueryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'indonesian top query should not render transaction preview');
  assert(indoTopQueryResponse.text.includes('10 transaksi tertinggi'), 'indonesian top query should return top transaction details response');
  passed += 1;
  console.log('✅ PASS: indonesian top transaction query stays in query flow');

  const draftCountBeforeShortIndoTopQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 13,
    message: {
      message_id: 109,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9005, is_bot: false, first_name: 'Tester' },
      text: '10 trans terbesar bln ini',
    },
  });

  const shortIndoTopQueryResponse = getLatestFinalSendMessage(recorder);
  assert(draftCollection.size === draftCountBeforeShortIndoTopQuery, 'indonesian shorthand top query should not create a draft session');
  assert(!shortIndoTopQueryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'indonesian shorthand top query should not render transaction preview');
  assert(shortIndoTopQueryResponse.text.includes('10 transaksi tertinggi'), 'indonesian shorthand top query should return top transaction details response');
  passed += 1;
  console.log('✅ PASS: indonesian shorthand top transaction query stays in query flow');

  const draftCountBeforeTypoIndoTopQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 14,
    message: {
      message_id: 110,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9008, is_bot: false, first_name: 'Tester' },
      text: 'top 10 transaski bulan ini',
    },
  });

  const typoIndoTopQueryResponse = getLatestFinalSendMessage(recorder);
  assert(draftCollection.size === draftCountBeforeTypoIndoTopQuery, 'indonesian typo top query should not create a draft session');
  assert(!typoIndoTopQueryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'indonesian typo top query should not render transaction preview');
  assert(typoIndoTopQueryResponse.text.includes('10 transaksi tertinggi'), 'indonesian typo top query should return top transaction details response');
  passed += 1;
  console.log('✅ PASS: indonesian typo top transaction query stays in query flow');

  const draftCountBeforeExpenseRankingQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 15,
    message: {
      message_id: 111,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9009, is_bot: false, first_name: 'Tester' },
      text: 'top 10 pengeluaran bulan ini',
    },
  });

  const expenseRankingResponse = getLatestFinalSendMessage(recorder);
  const latestExpenseDetailRequest = detailRequests[detailRequests.length - 1];
  assert(draftCollection.size === draftCountBeforeExpenseRankingQuery, 'expense ranking query should not create a draft session');
  assert(!expenseRankingResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'expense ranking query should not render transaction preview');
  assert(expenseRankingResponse.text.includes('10 pengeluaran tertinggi'), 'expense ranking query should use pengeluaran label');
  assert(latestExpenseDetailRequest[7] === 'EXPENSE', 'expense ranking query should request EXPENSE filter');
  passed += 1;
  console.log('✅ PASS: expense ranking query uses expense filter');

  const draftCountBeforeIncomeQuery = draftCollection.size;
  await botModule.processUpdate({
    update_id: 16,
    message: {
      message_id: 112,
      date: 1,
      chat: { id: 5001, type: 'private' },
      from: { id: 9006, is_bot: false, first_name: 'Tester' },
      text: 'tampilkan 10 pemasukan terakhir',
    },
  });

  const incomeQueryResponse = getLatestFinalSendMessage(recorder);
  const latestDetailRequest = detailRequests[detailRequests.length - 1];
  assert(draftCollection.size === draftCountBeforeIncomeQuery, 'income detail query should not create a draft session');
  assert(!incomeQueryResponse.text.includes('Cek Dulu Sebelum Disimpan'), 'income detail query should not render transaction preview');
  assert(incomeQueryResponse.text.includes('10 pemasukan terakhir'), 'income detail query should use pemasukan label');
  assert(incomeQueryResponse.text.includes('Pemasukan: Rp'), 'income detail query should summarize income totals');
  assert(latestDetailRequest[7] === 'INCOME', 'income detail query should request INCOME filter');
  passed += 1;
  console.log('✅ PASS: income detail query uses income filter');

  console.log('\n==================================================');
  console.log(`📊 Results: ${passed} passed, 0 failed`);
  console.log('✅ ALL TESTS PASSED');
}

run().catch((error) => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
