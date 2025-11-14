# Integration Test Execution Guide

## Document Purpose

This guide explains how to run the integration test suite for the ClickUp MCP Server, interpret results, and troubleshoot common issues.

**Prerequisites:**
- ClickUp account with API access
- Node.js 18+ installed
- npm dependencies installed (`npm install`)
- TypeScript compiled (`npm run build`)

**Date:** 2025-11-01
**Test Suite Version:** 1.0.0
**Total Test Files:** 12 (9 core + 3 advanced)
**Estimated Test Coverage:** 100+ test cases

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Running Tests](#running-tests)
3. [Test Execution Workflow](#test-execution-workflow)
4. [Expected Results](#expected-results)
5. [Interpreting Results](#interpreting-results)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)
8. [Maintenance](#maintenance)

---

## 1. Environment Setup

### Step 1: Create Test Workspace

**IMPORTANT:** Integration tests create/modify/delete real ClickUp resources. Always use a dedicated test workspace.

1. Log in to ClickUp
2. Create a new Space: **"MCP-Integration-Tests-2025"**
3. Create a Folder: **"Test Resources"**
4. Create a List: **"Test Tasks"**
5. Note the Space ID (from URL: `https://app.clickup.com/{team_id}/v/s/{space_id}`)

### Step 2: Get API Credentials

1. Go to ClickUp Settings → Apps
2. Generate API Token (Personal Token)
3. Copy your Team ID (from workspace URL)

### Step 3: Configure Environment Variables

Create `.env` file in project root:

```bash
# Required for Integration Tests
CLICKUP_API_KEY=pk_YOUR_PERSONAL_TOKEN
CLICKUP_TEAM_ID=your_team_id
CLICKUP_TEST_SPACE_ID=your_test_space_id

# Optional - Control Test Behavior
INTEGRATION_TEST_TIMEOUT=30000
CLEANUP_TEST_RESOURCES=true
LOG_LEVEL=info

# Optional - Enable Specific Test Suites
RUN_LIFECYCLE_TESTS=true
RUN_DEPENDENCY_TESTS=true
RUN_SUBTASK_TESTS=true
RUN_CUSTOM_FIELD_TESTS=true
RUN_COMMENT_TESTS=true
RUN_BULK_TESTS=true
RUN_ERROR_TESTS=true
RUN_AUTH_TESTS=true
RUN_TIER_TESTS=true
RUN_WORKFLOW_TESTS=true
RUN_CONCURRENCY_TESTS=true
RUN_DATA_INTEGRITY_TESTS=true
```

### Step 4: Verify Environment

```bash
# Check environment variables are loaded
npm run build
node -e "require('dotenv').config(); console.log('API Key:', process.env.CLICKUP_API_KEY ? '✓ Set' : '✗ Missing');"

# Quick connectivity test
curl -H "Authorization: ${CLICKUP_API_KEY}" \
  "https://api.clickup.com/api/v2/team" | jq
```

---

## 2. Running Tests

### Run All Integration Tests

```bash
# Run all tests with default timeout
npm test tests/integration

# Run with extended timeout (for slow networks)
npm test tests/integration -- --testTimeout=60000

# Run with coverage
npm run test:coverage tests/integration
```

### Run Specific Test File

```bash
# Run single test file
npm test tests/integration/task-lifecycle.test.ts

# Run with watch mode (useful for development)
npm test tests/integration/task-lifecycle.test.ts -- --watch

# Run with verbose output
npm test tests/integration/task-lifecycle.test.ts -- --reporter=verbose
```

### Run Specific Test Suite

```bash
# Run specific describe block by name
npm test tests/integration/task-lifecycle.test.ts -- -t "Task Creation"

# Run specific test case
npm test tests/integration/task-lifecycle.test.ts -- -t "should create task with all fields"
```

### Run Tests by Category

```bash
# Core functionality tests (9 files)
npm test tests/integration/task-lifecycle.test.ts \
           tests/integration/dependencies.test.ts \
           tests/integration/subtasks.test.ts \
           tests/integration/custom-fields.test.ts \
           tests/integration/comments.test.ts \
           tests/integration/bulk-operations.test.ts \
           tests/integration/error-handling.test.ts \
           tests/integration/authentication.test.ts \
           tests/integration/tier-enforcement.test.ts

# Advanced scenario tests (3 files)
npm test tests/integration/workflows.test.ts \
           tests/integration/concurrency.test.ts \
           tests/integration/data-integrity.test.ts
```

---

## 3. Test Execution Workflow

### Recommended Test Execution Order

**Phase 1: Core Functionality (30 minutes)**
```bash
# 1. Authentication & Setup
npm test tests/integration/authentication.test.ts

# 2. Basic CRUD Operations
npm test tests/integration/task-lifecycle.test.ts

# 3. Relationships
npm test tests/integration/dependencies.test.ts
npm test tests/integration/subtasks.test.ts

# 4. Metadata
npm test tests/integration/custom-fields.test.ts
npm test tests/integration/comments.test.ts

# 5. Error Handling
npm test tests/integration/error-handling.test.ts
npm test tests/integration/tier-enforcement.test.ts

# 6. Performance
npm test tests/integration/bulk-operations.test.ts
```

**Phase 2: Advanced Scenarios (15 minutes)**
```bash
# 1. Complex Workflows
npm test tests/integration/workflows.test.ts

# 2. Concurrent Operations
npm test tests/integration/concurrency.test.ts

# 3. Data Integrity
npm test tests/integration/data-integrity.test.ts
```

**Phase 3: Full Suite (45 minutes)**
```bash
# Run everything
npm test tests/integration
```

### Pre-Flight Checklist

Before running tests, verify:

- [ ] Environment variables configured (`.env` file exists)
- [ ] Test space created in ClickUp
- [ ] API key has full permissions
- [ ] No other tests running (avoid rate limiting)
- [ ] Clean test space (no leftover test data)
- [ ] Stable internet connection
- [ ] ClickUp API status: https://status.clickup.com

---

## 4. Expected Results

### Success Criteria

**All tests should pass** on a properly configured environment. Expected results:

```bash
Test Files  12 passed (12)
     Tests  100+ passed (100+)
  Start at  HH:MM:SS
  Duration  45s (approx)
```

### Test Statistics (Estimated)

| Test File | Test Cases | Duration | Pass Rate |
|-----------|-----------|----------|-----------|
| task-lifecycle.test.ts | 15 | ~5s | 100% |
| dependencies.test.ts | 12 | ~4s | 100% |
| subtasks.test.ts | 10 | ~3s | 100% |
| custom-fields.test.ts | 8 | ~3s | 100% |
| comments.test.ts | 8 | ~3s | 100% |
| bulk-operations.test.ts | 8 | ~5s | 100% |
| error-handling.test.ts | 10 | ~3s | 100% |
| authentication.test.ts | 5 | ~2s | 100% |
| tier-enforcement.test.ts | 6 | ~2s | 100% |
| workflows.test.ts | 10 | ~5s | 100% |
| concurrency.test.ts | 10 | ~5s | 100% |
| data-integrity.test.ts | 10 | ~5s | 100% |
| **TOTAL** | **112** | **~45s** | **100%** |

### Performance Benchmarks

Tests include performance logging. Expected benchmarks:

**Single Task Operations:**
- Task creation: 200-400ms
- Task retrieval: 100-200ms
- Task update: 200-300ms
- Task deletion: 150-250ms

**Bulk Operations:**
- 10 tasks creation: ~2s (200ms avg)
- 50 tasks creation: ~10s (200ms avg)

**Search Operations:**
- Simple search: 300-500ms
- Search with filters: 500-800ms

**Workflow Operations:**
- Complete lifecycle: ~1.5s
- Diamond dependency: ~3s
- Multi-agent workflow: ~5s

---

## 5. Interpreting Results

### Pass/Fail Indicators

**✅ PASS:** Test executed successfully
```bash
✓ tests/integration/task-lifecycle.test.ts > Task Creation > should create task
```

**❌ FAIL:** Test failed with assertion error
```bash
✗ tests/integration/task-lifecycle.test.ts > Task Creation > should create task
  AssertionError: expected 'open' to be 'to do'
```

**⚠️ SKIP:** Test skipped (usually due to environment flag)
```bash
⚠ tests/integration/tier-enforcement.test.ts > Premium Features > skipped
```

### Common Pass Patterns

**Successful Test Output:**
```bash
✓ Task lifecycle test passed
✓ Resource created: task_123abc
✓ Resource verified: matches expected data
✓ Cleanup completed: task_123abc deleted
✅ Test isolated: no side effects
```

**Performance Output:**
```bash
✓ Created 50 concurrent tasks in 9842ms (197ms avg)
✓ Performance within acceptable range: <200ms avg
```

### Common Fail Patterns

#### Pattern 1: Rate Limiting
```bash
❌ Error: ClickUp API rate limit exceeded (429)
   Retry-After: 60 seconds
```

**Cause:** Too many requests too quickly
**Fix:** Increase delays between tests or reduce concurrency

#### Pattern 2: Invalid Credentials
```bash
❌ Error: Authentication failed (401)
   Invalid or expired API token
```

**Cause:** API key missing/invalid
**Fix:** Verify `CLICKUP_API_KEY` environment variable

#### Pattern 3: Resource Not Found
```bash
❌ Error: Task not found (404)
   Task ID: task_123abc
```

**Cause:** Resource deleted between operations or test cleanup failed
**Fix:** Check for race conditions or cleanup errors

#### Pattern 4: Validation Error
```bash
❌ Error: Invalid status 'to do' for list
   Valid statuses: [open, in progress, closed]
```

**Cause:** Status value doesn't match list configuration
**Fix:** Expected behavior - test should handle this

### Coverage Report

Generate coverage report:

```bash
npm run test:coverage tests/integration

# Open HTML report
open coverage/index.html
```

**Expected Coverage:**

| Metric | Target | Typical |
|--------|--------|---------|
| Statements | >80% | ~85% |
| Branches | >70% | ~75% |
| Functions | >80% | ~85% |
| Lines | >80% | ~85% |

**What's NOT Covered:**
- Worker-specific code (CloudFlare Workers runtime)
- OAuth flow (requires browser interaction)
- Webhook handlers (requires external triggers)
- Edge case error paths (intentionally not tested)

---

## 6. Troubleshooting

### Issue 1: Tests Hang/Timeout

**Symptom:**
```bash
✗ Test timeout after 10000ms
   tests/integration/task-lifecycle.test.ts > Task Creation
```

**Common Causes:**
1. Network connectivity issues
2. ClickUp API slow response
3. Deadlock in test code
4. Resource not cleaned up (waiting for deletion)

**Solutions:**
```bash
# 1. Increase timeout
npm test -- --testTimeout=30000

# 2. Check network
curl https://api.clickup.com/api/v2/team

# 3. Check for hung resources
# Log in to ClickUp and manually delete test tasks

# 4. Run single test to isolate
npm test tests/integration/task-lifecycle.test.ts -- -t "specific test"
```

### Issue 2: Flaky Tests (Intermittent Failures)

**Symptom:** Test passes sometimes, fails other times

**Common Causes:**
1. Race conditions in concurrent tests
2. Eventual consistency delays
3. Rate limiting
4. Network issues

**Solutions:**
```bash
# 1. Run test multiple times
for i in {1..10}; do npm test tests/integration/task-lifecycle.test.ts; done

# 2. Increase delays in test
# Edit test file, increase delay() values

# 3. Run tests sequentially (no concurrency)
npm test -- --maxConcurrency=1

# 4. Check ClickUp API status
curl https://status.clickup.com
```

### Issue 3: Cleanup Failures

**Symptom:**
```bash
⚠️ Warning: Failed to delete task task_123abc
   Error: Task not found
```

**Causes:**
1. Task already deleted
2. Permission issue
3. Task in different space

**Solutions:**
```bash
# 1. Manual cleanup
# Log in to ClickUp, delete test space resources manually

# 2. Reset test environment
# Delete and recreate test space

# 3. Check API key permissions
curl -H "Authorization: ${CLICKUP_API_KEY}" \
  "https://api.clickup.com/api/v2/user" | jq
```

### Issue 4: Custom Field Tests Fail

**Symptom:**
```bash
❌ Error: Custom field not found
   Field ID: field_123abc
```

**Causes:**
1. Custom fields not set up in test space
2. Field type mismatch
3. Free tier limitations (custom fields require Business+ plan)

**Solutions:**
```bash
# 1. Skip custom field tests if on free tier
RUN_CUSTOM_FIELD_TESTS=false npm test

# 2. Manually create custom fields in test list
# Go to ClickUp → List Settings → Custom Fields → Add Field

# 3. Use paid ClickUp account for testing
```

### Issue 5: Search Tests Fail

**Symptom:**
```bash
❌ Error: Expected task in search results
   Task created but not found
```

**Cause:** Search index eventual consistency (1-2 second delay)

**Solution:** This is expected behavior and documented in the test. The test should include appropriate delays.

```typescript
// Test should look like this:
const task = await createTask({ name: 'Test' });
await delay(1000); // Wait for search index
const results = await searchTasks('Test');
expect(results).toContainEqual(expect.objectContaining({ id: task.id }));
```

---

## 7. CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily at midnight

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Run integration tests
        env:
          CLICKUP_API_KEY: ${{ secrets.CLICKUP_API_KEY }}
          CLICKUP_TEAM_ID: ${{ secrets.CLICKUP_TEAM_ID }}
          CLICKUP_TEST_SPACE_ID: ${{ secrets.CLICKUP_TEST_SPACE_ID }}
          INTEGRATION_TEST_TIMEOUT: 60000
        run: npm test tests/integration -- --reporter=verbose

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            test-results.log

      - name: Upload coverage
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: integration-tests
```

### Secrets Configuration

Add to GitHub repository secrets:

1. `CLICKUP_API_KEY` - ClickUp Personal API Token
2. `CLICKUP_TEAM_ID` - Your team/workspace ID
3. `CLICKUP_TEST_SPACE_ID` - Dedicated test space ID

### Branch Protection Rules

Recommended settings:

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include "Integration Tests" in required checks
- ✅ Require review from code owners

---

## 8. Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks

1. **Run Full Test Suite**
   ```bash
   npm test tests/integration
   ```

2. **Review Test Results**
   - Check for new flaky tests
   - Review performance metrics
   - Identify slow tests

3. **Clean Up Test Data**
   ```bash
   # Delete old test spaces in ClickUp UI
   # Keep only current "MCP-Integration-Tests-2025" space
   ```

#### Monthly Tasks

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Review Test Coverage**
   ```bash
   npm run test:coverage tests/integration
   open coverage/index.html
   ```

3. **Update Test Data**
   - Review and update expected response schemas
   - Update test fixtures if ClickUp API changes
   - Add tests for new features

#### Quarterly Tasks

1. **Performance Baseline Review**
   - Compare current performance metrics with baseline
   - Identify performance regressions
   - Update performance benchmarks if ClickUp API improves

2. **Test Suite Refactoring**
   - Consolidate duplicate test code
   - Update helper functions
   - Improve test isolation

3. **Documentation Updates**
   - Update this guide with new learnings
   - Document new test patterns
   - Add troubleshooting for new issues

### Adding New Tests

When adding new tests, follow these guidelines:

1. **Use Existing Patterns**
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from 'vitest';
   import { MCPTestClient } from './utils/mcp-test-client';
   import { createTask, uniqueTestName, delay } from './utils/utils';
   ```

2. **Follow Naming Conventions**
   ```typescript
   const testName = uniqueTestName('Feature Name');
   ```

3. **Track Resources**
   ```typescript
   const task = await createTask(client, listId, { name: testName });
   resourceTracker.track('task', task.id);
   ```

4. **Add Cleanup**
   ```typescript
   afterAll(async () => {
     await cleanupTestResources();
     await client.disconnect();
   });
   ```

5. **Document Expected Behavior**
   ```typescript
   // Test validates that task creation succeeds with all fields
   // Expected: 200ms response time, task ID returned
   it('should create task with all fields', async () => {
     // ...
   });
   ```

### Monitoring Test Health

Track these metrics over time:

| Metric | Target | Action if Outside Target |
|--------|--------|-------------------------|
| Pass Rate | >95% | Investigate failures immediately |
| Average Duration | <60s | Optimize slow tests |
| Flaky Test Rate | <5% | Fix or quarantine flaky tests |
| Coverage | >80% | Add tests for uncovered code |

### Deprecation Policy

When removing tests:

1. Mark test as deprecated with comment
2. Update documentation
3. Remove after 1 version cycle
4. Notify team of removal

```typescript
// @deprecated This test will be removed in v2.0.0
// Reason: Feature no longer supported
// Replacement: See tests/integration/new-feature.test.ts
it.skip('old feature test', async () => {
  // ...
});
```

---

## Quick Reference

### Essential Commands

```bash
# Run all tests
npm test tests/integration

# Run specific test file
npm test tests/integration/task-lifecycle.test.ts

# Run with coverage
npm run test:coverage tests/integration

# Run specific test case
npm test -- -t "should create task"

# Run in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --reporter=verbose
```

### Environment Variables

```bash
CLICKUP_API_KEY=pk_xxx           # Required
CLICKUP_TEAM_ID=xxx               # Required
CLICKUP_TEST_SPACE_ID=xxx         # Required
INTEGRATION_TEST_TIMEOUT=30000    # Optional
CLEANUP_TEST_RESOURCES=true       # Optional
LOG_LEVEL=info                    # Optional
```

### Useful Links

- ClickUp API Documentation: https://clickup.com/api
- ClickUp API Status: https://status.clickup.com
- Vitest Documentation: https://vitest.dev
- MCP SDK Documentation: https://github.com/modelcontextprotocol/typescript-sdk

---

## Appendix A: Test File Reference

### Core Test Files (9 files)

1. **task-lifecycle.test.ts** - Task CRUD operations, status updates, priority changes
2. **dependencies.test.ts** - Task dependencies, blocking relationships, circular detection
3. **subtasks.test.ts** - Subtask creation, hierarchy validation, parent-child relationships
4. **custom-fields.test.ts** - Custom field types, value setting, validation
5. **comments.test.ts** - Comment creation, updates, threading
6. **bulk-operations.test.ts** - Batch creation, parallel operations, performance
7. **error-handling.test.ts** - Invalid inputs, API errors, edge cases
8. **authentication.test.ts** - API key validation, permission checking
9. **tier-enforcement.test.ts** - Free vs paid tier features, rate limiting

### Advanced Test Files (3 files)

10. **workflows.test.ts** - Multi-step workflows, state machines, complex scenarios
11. **concurrency.test.ts** - Race conditions, parallel updates, deadlock prevention
12. **data-integrity.test.ts** - Consistency validation, rollback scenarios, referential integrity

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-01
**Maintainer:** ClickUp MCP Server Team
**Contact:** GitHub Issues (https://github.com/taazkareem/clickup-mcp-server/issues)
