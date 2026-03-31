const { normalizeInviteCode, generateInviteCode, buildSharedMemberPayload } = require('./lib/services/collaborationService');

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

console.log('🧪 COLLABORATION TEST SUITE');
console.log('='.repeat(50));
console.log();

test('normalizeInviteCode strips spaces and symbols', () => {
  const code = normalizeInviteCode(' ab-12 cd ');
  if (code !== 'AB12CD') {
    throw new Error(`Expected AB12CD, got ${code}`);
  }
});

test('generateInviteCode creates 8-char code', () => {
  const code = generateInviteCode();
  if (!/^[A-Z2-9]{8}$/.test(code)) {
    throw new Error(`Unexpected code format: ${code}`);
  }
});

test('buildSharedMemberPayload keeps owner metadata', () => {
  const payload = buildSharedMemberPayload({
    userId: 'user-1',
    role: 'OWNER',
    now: '2026-03-29T00:00:00.000Z',
    email: 'owner@example.com',
    displayName: 'Owner User',
  });

  if (payload.role !== 'OWNER') throw new Error('Role mismatch');
  if (payload.userId !== 'user-1') throw new Error('User mismatch');
  if (payload.email !== 'owner@example.com') throw new Error('Email mismatch');
  if (payload.displayName !== 'Owner User') throw new Error('Display name mismatch');
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
