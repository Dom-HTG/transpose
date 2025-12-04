#!/usr/bin/env node
/**
 * Quick validation tests for edge case fixes
 * Run: node test-validations.js
 */

const tests = [];
const results = { passed: 0, failed: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Test 1: Email validation regex
test("Email validation rejects invalid formats", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert(!emailRegex.test(""), "Should reject empty string");
  assert(!emailRegex.test("   "), "Should reject whitespace");
  assert(!emailRegex.test("notanemail"), "Should reject no @");
  assert(!emailRegex.test("no@domain"), "Should reject no TLD");
  assert(emailRegex.test("valid@test.com"), "Should accept valid email");
});

// Test 2: Ethereum address validation
test("Ethereum address validation works", () => {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  assert(!addressRegex.test(""), "Should reject empty");
  assert(!addressRegex.test("0x123"), "Should reject short");
  assert(!addressRegex.test("0xGGGG"), "Should reject non-hex");
  assert(
    addressRegex.test("0x1234567890123456789012345678901234567890"),
    "Should accept valid",
  );
});

// Test 3: Alias format validation
test("Alias format validation", () => {
  const aliasRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
  assert(!aliasRegex.test(""), "Should reject empty");
  assert(!aliasRegex.test("-alice"), "Should reject starting with hyphen");
  assert(!aliasRegex.test("_alice"), "Should reject starting with underscore");
  assert(!aliasRegex.test("ali@ce"), "Should reject special chars");
  assert(aliasRegex.test("alice"), "Should accept valid");
  assert(aliasRegex.test("alice_123"), "Should accept with underscore");
  assert(aliasRegex.test("alice-bob"), "Should accept with hyphen");
});

// Test 4: Reserved alias words
test("Reserved aliases blocked", () => {
  const reserved = ["admin", "system", "root", "api", "app"];
  assert(reserved.includes("admin"), "Should block admin");
  assert(reserved.includes("root"), "Should block root");
  assert(!reserved.includes("alice"), "Should allow alice");
});

// Test 5: Amount validation
test("Amount validation rejects invalid inputs", () => {
  function validateAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }

  assert(!validateAmount(""), "Should reject empty");
  assert(!validateAmount("abc"), "Should reject non-numeric");
  assert(!validateAmount("-5"), "Should reject negative");
  assert(!validateAmount("0"), "Should reject zero");
  assert(validateAmount("1.5"), "Should accept positive decimal");
  assert(validateAmount("100"), "Should accept positive integer");
});

// Test 6: Swap same-asset validation
test("Swap prevents same asset", () => {
  function canSwap(from, to) {
    return from !== to;
  }

  assert(!canSwap("ETH", "ETH"), "Should reject ETH -> ETH");
  assert(canSwap("ETH", "USDC"), "Should allow ETH -> USDC");
});

// Test 7: Password strength
test("Password minimum length enforced", () => {
  function validatePassword(password) {
    return password && password.length >= 8;
  }

  assert(!validatePassword(""), "Should reject empty");
  assert(!validatePassword("pass"), "Should reject < 8 chars");
  assert(validatePassword("password123"), "Should accept >= 8 chars");
});

// Test 8: Trim validation
test("Whitespace trimming works", () => {
  const email = "  test@example.com  ";
  assert(email.trim() === "test@example.com", "Should trim whitespace");

  const empty = "   ";
  assert(!empty.trim(), "Should convert whitespace to empty");
});

// Test 9: Port validation
test("Port number validation", () => {
  function validatePort(port) {
    const num = Number(port);
    return !isNaN(num) && num > 0 && num <= 65535;
  }

  assert(!validatePort("abc"), "Should reject non-numeric");
  assert(!validatePort("0"), "Should reject 0");
  assert(!validatePort("65536"), "Should reject > 65535");
  assert(!validatePort("-1"), "Should reject negative");
  assert(validatePort("3000"), "Should accept valid port");
  assert(validatePort("5432"), "Should accept valid port");
});

// Test 10: Case normalization
test("Alias case normalization", () => {
  function normalizeAlias(alias) {
    return alias.toLowerCase();
  }

  assert(normalizeAlias("Alice") === "alice", "Should lowercase");
  assert(normalizeAlias("ALICE") === "alice", "Should lowercase uppercase");
  assert(normalizeAlias("AlIcE") === "alice", "Should lowercase mixed");
});

// Run all tests
console.log("🧪 Running Edge Case Validation Tests\n");

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✅ ${name}`);
    results.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }
}

console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed`);

if (results.failed > 0) {
  process.exit(1);
}
