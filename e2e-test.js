#!/usr/bin/env node
/**
 * End-to-End Integration Tests
 * Tests the full application stack without requiring valid API keys
 */

const http = require('http');

const BASE_URL = 'http://localhost:2039';
const results = { passed: 0, failed: 0, tests: [] };

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  console.log('🧪 Running End-to-End Integration Tests\n');

  // Test 1: Health Check
  await test("Health endpoint returns 200", async () => {
    const res = await makeRequest('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.status === 'healthy', 'Health status not healthy');
    assert(Array.isArray(res.data.availableTools), 'availableTools not an array');
    assert(res.data.availableTools.length === 8, `Expected 8 tools, got ${res.data.availableTools.length}`);
  });

  // Test 2: Queue Metrics
  await test("Queue metrics endpoint works", async () => {
    const res = await makeRequest('GET', '/metrics/queues');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Response not successful');
    assert(res.data.metrics.wallet !== undefined, 'Wallet queue metrics missing');
    assert(res.data.metrics.transaction !== undefined, 'Transaction queue metrics missing');
    assert(res.data.metrics.swap !== undefined, 'Swap queue metrics missing');
    assert(res.data.metrics.notification !== undefined, 'Notification queue metrics missing');
  });

  // Test 3: Chat endpoint validation (empty query)
  await test("Chat endpoint rejects empty query", async () => {
    const res = await makeRequest('POST', '/chat', { query: '   ', userId: 'test' });
    assert(res.status === 400 || res.status === 401 || res.status === 500, 
      `Expected error status, got ${res.status}`);
    assert(res.data.success === false, 'Should return success: false');
  });

  // Test 4: Chat endpoint validation (missing query)
  await test("Chat endpoint rejects missing query", async () => {
    const res = await makeRequest('POST', '/chat', { userId: 'test' });
    assert(res.status === 400 || res.status === 500, `Expected error status, got ${res.status}`);
    assert(res.data.success === false, 'Should return success: false');
  });

  // Test 5: Invalid HTTP method on health
  await test("Health endpoint rejects POST", async () => {
    const res = await makeRequest('POST', '/health', {});
    assert(res.status === 404 || res.status === 405, `Expected 404/405, got ${res.status}`);
  });

  // Test 6: Invalid endpoint returns 404
  await test("Invalid endpoint returns 404", async () => {
    const res = await makeRequest('GET', '/nonexistent');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // Test 7: Health check has timestamp
  await test("Health check includes timestamp", async () => {
    const res = await makeRequest('GET', '/health');
    assert(res.data.timestamp !== undefined, 'Timestamp missing');
    const timestamp = new Date(res.data.timestamp);
    assert(!isNaN(timestamp.getTime()), 'Invalid timestamp format');
  });

  // Test 8: Queue metrics have correct structure
  await test("Queue metrics have correct structure", async () => {
    const res = await makeRequest('GET', '/metrics/queues');
    const wallet = res.data.metrics.wallet;
    assert(typeof wallet.waiting === 'number', 'waiting not a number');
    assert(typeof wallet.active === 'number', 'active not a number');
    assert(typeof wallet.completed === 'number', 'completed not a number');
    assert(typeof wallet.failed === 'number', 'failed not a number');
    assert(typeof wallet.delayed === 'number', 'delayed not a number');
  });

  // Test 9: Chat endpoint accepts JSON
  await test("Chat endpoint accepts valid JSON", async () => {
    const res = await makeRequest('POST', '/chat', { 
      query: 'test query that will fail at LLM level',
      userId: 'test-user-123'
    });
    // Should fail at LLM level (401) not at JSON parsing level (400)
    assert(res.status !== 400, 'Should not return 400 (bad request)');
  });

  // Test 10: Server handles malformed JSON
  await test("Server handles malformed JSON gracefully", async () => {
    try {
      const url = new URL('/chat', BASE_URL);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            assert(res.statusCode === 400 || res.statusCode === 500, 
              `Expected error status for malformed JSON, got ${res.statusCode}`);
            resolve();
          });
        });
        req.on('error', reject);
        req.write('{invalid json}'); // Send malformed JSON
        req.end();
      });
    } catch (e) {
      // Some error is expected
      assert(true, 'Handled malformed JSON');
    }
  });

  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All integration tests passed!');
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
