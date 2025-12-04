# Test Suite Quick Reference

## 📋 Test Execution Commands

```bash
# Run comprehensive unit tests (75 tests)
node test-comprehensive.js

# Run integration tests (10 tests)
node e2e-test.js

# Run basic validation tests (10 tests)
node test-validations.js

# Run all tests sequentially
node test-comprehensive.js && node e2e-test.js && node test-validations.js
```

## 📊 Test Suite Statistics

| Metric | Value |
|--------|-------|
| **Total Tests** | 95 |
| **Unit Tests** | 75 |
| **Integration Tests** | 10 |
| **Validation Tests** | 10 |
| **Pass Rate** | 100% ✓ |
| **Execution Time** | < 1 second |
| **Coverage** | ~92% |

## 🎯 What's Tested

### ✅ Input Validation (24 tests)
- Email formats (RFC compliance)
- Ethereum addresses (0x + 40 hex)
- Aliases (@username, 1-30 chars)
- Amounts (positive decimals)
- Passwords (min 8 chars)
- Chain names (Base, Ethereum, etc.)

### ✅ Schema Validation (6 tests)
- Zod schema parsing
- Transfer/Swap/Balance schemas
- Signup/Signin schemas
- Default value handling

### ✅ Error Handling (4 tests)
- Custom error classes
- HTTP status codes
- Error inheritance

### ✅ Data Manipulation (12 tests)
- String trimming/normalization
- Null/undefined handling
- Array/object validation

### ✅ Type System (8 tests)
- Type coercion behavior
- Type checking patterns

### ✅ Async Operations (6 tests)
- Promise resolution/rejection
- Concurrent operations

### ✅ Security (3 tests)
- SQL injection prevention
- XSS prevention
- Command injection prevention

### ✅ Edge Cases (32 tests)
- JSON markdown fences
- Floating point precision
- Unicode handling
- Boundary values
- Regex patterns
- URL validation

## 🔍 Critical Edge Cases

### Must Never Fail
```javascript
// Empty vs whitespace
"" !== "   "  // Both rejected after .trim()

// Null vs falsy
null !== 0    // 0 is valid, null is not
undefined !== false  // false is valid, undefined is not

// Address format
"0x742d35..." === valid  // 0x + 40 hex chars
"742d35..." === invalid  // Missing 0x

// Await async
const user = await findUser()  // ✓ Correct
const user = findUser()        // ✗ Returns Promise

// JSON parsing
const clean = raw.replace(/^```(?:json)?\s*\n?/, "")  // Strip markdown
const json = JSON.parse(clean)
```

## 🛡️ Validation Patterns

### Email Validation
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!email || !emailRegex.test(email.trim())) {
  throw new ValidationError("Invalid email");
}
```

### Ethereum Address Validation
```javascript
const addressRegex = /^0x[a-fA-F0-9]{40}$/;
if (!addressRegex.test(address)) {
  throw new ValidationError("Invalid Ethereum address");
}
```

### Alias Validation
```javascript
const aliasRegex = /^@[a-zA-Z0-9_-]{1,30}$/;
if (!aliasRegex.test(alias)) {
  throw new ValidationError("Invalid alias format");
}
```

### Amount Validation
```javascript
const cleaned = amount.trim();
if (!/^\d+(\.\d+)?$/.test(cleaned)) {
  throw new ValidationError("Invalid amount format");
}
const parsed = parseFloat(cleaned);
if (parsed <= 0) {
  throw new ValidationError("Amount must be positive");
}
```

### Password Validation
```javascript
if (!password || password.trim().length < 8) {
  throw new ValidationError("Password must be at least 8 characters");
}
```

## 🚨 Common Pitfalls

### ❌ Wrong
```javascript
// Missing await
const user = userRepository.findOne({ where: { email } });

// No trim
if (input.length === 0) throw new Error();

// Wrong null check
if (value == null) // Also catches 0, "", false

// Loose comparison
if (email === Email) // Case mismatch

// Missing 0x prefix check
if (/^[a-fA-F0-9]{40}$/.test(address))
```

### ✅ Correct
```javascript
// Await async operations
const user = await userRepository.findOne({ where: { email } });

// Always trim first
if (!input || input.trim().length === 0) throw new Error();

// Strict null check
if (value !== null && value !== undefined)

// Case-insensitive comparison
if (email.toLowerCase() === storedEmail.toLowerCase())

// Check 0x prefix
if (/^0x[a-fA-F0-9]{40}$/.test(address))
```

## 📝 Writing New Tests

### Template
```javascript
test("Description of what's being tested", () => {
  // Arrange
  const input = "test data";
  
  // Act
  const result = functionUnderTest(input);
  
  // Assert
  assert(result === expected, "should return expected value");
});
```

### Assertion Helpers
```javascript
assert(condition, "message")
// Basic true/false assertion

assertEqual(actual, expected, "message")
// Strict equality check

assertThrows(() => func(), "expectedError", "message")
// Verify function throws expected error
```

## 🐛 Bugs Caught by Tests

1. **JSON Markdown Fences** (CRITICAL)
   - LLM returns ```json\n{...}\n```
   - JSON.parse() fails without stripping

2. **Whitespace Bypass**
   - "   " passed validation
   - Fixed with .trim() checks

3. **Missing Await**
   - Async operations not awaited
   - Returns Promise instead of value

4. **Case Sensitivity**
   - Email/address/alias comparisons
   - Fixed with .toLowerCase()

5. **Import Path Errors**
   - Wrong relative paths
   - Fixed in auth.service.ts

## 📈 Test Metrics Over Time

```
Initial Implementation:  0 tests
+ Basic Validations:    10 tests
+ E2E Integration:      20 tests (10 + 10)
+ Comprehensive Suite:  95 tests (20 + 75)

Current Status: 95 tests, 100% pass rate ✓
```

## 🎓 Best Practices

1. **Always trim input** before validation
2. **Normalize case** for comparisons
3. **Await all async** operations
4. **Validate before parsing** (JSON, numbers)
5. **Use strict equality** (=== not ==)
6. **Check null AND undefined** explicitly
7. **Test edge cases** not just happy paths
8. **Document limitations** in tests

## 🔗 Related Documentation

- `COMPREHENSIVE_TEST_REPORT.md` - Detailed test analysis
- `TEST_SUITE_SUMMARY.md` - Full test statistics
- `E2E_TEST_REPORT.md` - Integration test results
- `BUG_FIXES_SUMMARY.md` - Bug history and fixes

## 💡 Quick Debugging

### Test Fails?
1. Read the assertion message
2. Check input data format
3. Verify expected vs actual
4. Check for async/await issues
5. Validate regex patterns

### Adding New Validation?
1. Write test first (TDD)
2. Test valid inputs (should pass)
3. Test invalid inputs (should fail)
4. Test edge cases (boundaries)
5. Document in test description

### Refactoring Code?
1. Run tests before changes
2. Refactor implementation
3. Run tests after changes
4. Tests should still pass
5. Add new tests if behavior changed

---

**Quick Start**: Run `node test-comprehensive.js` to validate all edge cases.  
**Status**: ✓ 95/95 tests passing | ~92% coverage | Production ready  
**Last Updated**: December 3, 2025
