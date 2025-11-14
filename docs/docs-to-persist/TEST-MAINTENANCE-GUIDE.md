# Integration Test Maintenance Guide

## Document Purpose

This guide provides comprehensive instructions for maintaining, updating, and extending the integration test suite over time. It ensures the test suite remains valuable, accurate, and efficient as the ClickUp MCP Server evolves.

**Date:** 2025-11-01
**Audience:** Developers, QA Engineers, Test Maintainers
**Update Frequency:** Review quarterly, update as needed

---

## Table of Contents

1. [Test Maintenance Philosophy](#test-maintenance-philosophy)
2. [Regular Maintenance Tasks](#regular-maintenance-tasks)
3. [Adding New Tests](#adding-new-tests)
4. [Updating Existing Tests](#updating-existing-tests)
5. [Test Refactoring](#test-refactoring)
6. [Handling Flaky Tests](#handling-flaky-tests)
7. [Test Performance Optimization](#test-performance-optimization)
8. [Deprecation and Removal](#deprecation-and-removal)
9. [Version Management](#version-management)
10. [Continuous Improvement](#continuous-improvement)

---

## 1. Test Maintenance Philosophy

### 1.1 Core Principles

**Tests Are Living Documentation**
- Tests document how the MCP server actually works
- They should be readable and understandable
- Clear test names and comments are essential

**Test Quality Matters**
- One good test is better than three mediocre tests
- Flaky tests erode confidence
- Slow tests hurt developer productivity

**Tests Should Evolve**
- Update tests when features change
- Remove tests for deprecated features
- Add tests for new features immediately

**Coverage Is a Guide, Not a Goal**
- 100% coverage doesn't mean bug-free
- Focus on testing important behaviors
- Edge cases matter more than line coverage

### 1.2 Test Health Metrics

Track these metrics to maintain test quality:

| Metric | Target | Action if Below |
|--------|--------|----------------|
| Pass Rate | >95% | Investigate failures immediately |
| Flaky Test Rate | <5% | Fix or quarantine flaky tests |
| Execution Time | <60s total | Optimize slow tests |
| Coverage | >80% | Add tests for uncovered code |
| Maintenance Burden | <2hr/week | Refactor or consolidate tests |

---

## 2. Regular Maintenance Tasks

### 2.1 Daily Tasks (Automated)

**✅ CI/CD Monitoring:**
- Review failed test runs in GitHub Actions
- Check for new flaky tests (failures in passing tests)
- Monitor test execution time trends

**✅ Issue Triage:**
- Address test failures reported by CI
- Create tickets for consistent failures
- Assign to appropriate team members

**Automation:**
```yaml
# GitHub Actions alert on failure
- name: Create issue for failed test
  if: failure()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `Integration test failure: ${context.workflow}`,
        body: `Workflow run: ${context.runId}\nCommit: ${context.sha}`,
        labels: ['test-failure', 'needs-triage']
      });
```

### 2.2 Weekly Tasks (Manual)

**🔄 Test Suite Review (15 minutes):**

1. **Run Full Test Suite:**
   ```bash
   npm test tests/integration -- --reporter=verbose
   ```

2. **Review Test Results:**
   - Check for warnings or deprecations
   - Identify slow tests (>5s individual)
   - Note any unusual patterns

3. **Review Coverage:**
   ```bash
   npm run test:coverage tests/integration
   open coverage/index.html
   ```

4. **Check Test Data:**
   - Verify test space is clean
   - Delete old test resources manually if needed
   - Confirm no quota issues

**📊 Performance Tracking (10 minutes):**

1. **Extract Timing Metrics:**
   ```bash
   npm test tests/integration -- --reporter=json > test-results.json
   node scripts/analyze-performance.js test-results.json
   ```

2. **Compare to Baseline:**
   - Check for >20% degradation
   - Investigate any significant slowdowns
   - Update baseline if intentional changes

3. **Update Dashboard:**
   - Record execution times
   - Update trend charts
   - Note any anomalies

### 2.3 Monthly Tasks (Manual)

**🔍 Deep Test Analysis (1 hour):**

1. **Flaky Test Audit:**
   ```bash
   # Run each test file 10 times
   for i in {1..10}; do
     npm test tests/integration/task-lifecycle.test.ts
   done
   ```

   - Identify tests with inconsistent results
   - Document flaky tests in tracking spreadsheet
   - Prioritize fixes based on impact

2. **Coverage Gap Analysis:**
   ```bash
   npm run test:coverage tests/integration
   ```

   - Identify uncovered code paths
   - Determine if coverage gaps are acceptable
   - Create tickets for missing test cases

3. **Test Code Review:**
   - Review test code for quality
   - Identify duplicated test logic
   - Look for outdated patterns

**📝 Documentation Update (30 minutes):**

1. **Update Test Execution Guide:**
   - Verify setup instructions still accurate
   - Update troubleshooting section with new issues
   - Add any new patterns discovered

2. **Update Best Practices:**
   - Document new testing patterns
   - Add learnings from bug investigations
   - Remove obsolete guidance

3. **Update Maintenance Guide (this document):**
   - Add new maintenance procedures
   - Update metrics and targets
   - Refine processes based on experience

### 2.4 Quarterly Tasks (Manual)

**🎯 Strategic Test Review (2-4 hours):**

1. **Test Suite Architecture Review:**
   - Evaluate test organization
   - Identify refactoring opportunities
   - Plan major improvements

2. **Dependency Updates:**
   ```bash
   npm outdated
   npm update
   npm audit fix
   npm test tests/integration  # Verify still works
   ```

3. **Performance Baseline Reset:**
   - Run fresh performance benchmarks
   - Update baseline metrics
   - Set new targets

4. **Test Infrastructure Review:**
   - Evaluate MCP test client wrapper
   - Review helper function effectiveness
   - Consider tooling improvements

---

## 3. Adding New Tests

### 3.1 When to Add Tests

**✅ Always add tests for:**
- New MCP tools/features
- Bug fixes (regression tests)
- New error conditions
- Performance-critical paths
- Security-sensitive operations

**⚠️ Consider adding tests for:**
- Edge cases in existing features
- Complex workflows discovered in use
- Integration with new ClickUp features
- Alternative error paths

**❌ Don't add tests for:**
- Implementation details (test behavior, not code)
- Trivial getters/setters
- Third-party library behavior
- Already well-covered paths

### 3.2 Test Creation Process

**Step 1: Determine Test Location**

```
tests/integration/
├── Core tests (9 files)     - For fundamental operations
├── Advanced tests (3 files) - For complex scenarios
└── [new-feature].test.ts    - Create new file if needed
```

**Decision Matrix:**
- **Existing tool enhancement?** → Update existing test file
- **New tool?** → Add to relevant existing file or create new
- **Complex workflow?** → Add to `workflows.test.ts`
- **Performance concern?** → Add to `bulk-operations.test.ts`
- **Data integrity concern?** → Add to `data-integrity.test.ts`

**Step 2: Write Test Following Patterns**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from './utils/mcp-test-client';
import { createTask, uniqueTestName, delay } from './utils/utils';
import { ResourceTracker } from './utils/resource-tracker';

describe('[Feature Name]', () => {
  let client: MCPTestClient;
  let listId: string;
  const resourceTracker = ResourceTracker.getInstance();

  beforeAll(async () => {
    client = new MCPTestClient();
    await client.connect();

    // Setup test environment
    const testEnv = await getTestEnvironment();
    listId = testEnv.listId;
  });

  afterAll(async () => {
    await cleanupTestResources();
    await client.disconnect();
  });

  describe('[Sub-feature]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const testData = {
        name: uniqueTestName('Feature Test'),
        // ... other properties
      };

      // Act
      const result = await client.callTool('tool_name', testData);

      // Assert
      expect(result.isError).toBe(false);
      const data = client.parseJsonResult(result);
      expect(data.id).toBeDefined();

      // Track for cleanup
      resourceTracker.track('task', data.id);

      console.log(`✅ Feature test passed: ${data.id}`);
    });

    it('should handle error cases', async () => {
      // Arrange - invalid data
      const invalidData = {
        name: '', // Empty name
      };

      // Act
      const result = await client.callTool('tool_name', invalidData);

      // Assert
      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/invalid|required/);

      console.log(`✅ Error handling validated`);
    });
  });
});
```

**Step 3: Test the Test**

```bash
# Run new test in isolation
npm test tests/integration/new-feature.test.ts

# Run multiple times to check for flakiness
for i in {1..10}; do npm test tests/integration/new-feature.test.ts; done

# Run full suite to ensure no interference
npm test tests/integration
```

**Step 4: Document and Review**

```typescript
/**
 * Integration tests for [Feature Name]
 *
 * Tests cover:
 * - Basic CRUD operations
 * - Error handling
 * - Edge cases
 * - Performance benchmarks
 *
 * Dependencies:
 * - Requires test list with [requirements]
 * - May create up to N resources per test
 *
 * Known limitations:
 * - [Any limitations]
 */
```

### 3.3 Test Naming Conventions

**File Names:**
- Kebab-case: `feature-name.test.ts`
- Descriptive: `task-lifecycle.test.ts` (not `tasks.test.ts`)
- Grouped by domain: `user-management.test.ts`

**Test Suite Names:**
- Top-level: Noun (entity/feature name)
  - `describe('Task Lifecycle', ...)`
- Sub-level: Verb phrase (behavior)
  - `describe('Task Creation', ...)`

**Test Case Names:**
- Start with "should"
- Describe expected behavior
- Include relevant context

```typescript
// ✅ GOOD
it('should create task with all fields', ...)
it('should fail when status is invalid', ...)
it('should update task priority immediately', ...)

// ❌ BAD
it('creates task', ...)              // Missing "should"
it('test task creation', ...)        // Vague
it('works', ...)                     // Not descriptive
```

---

## 4. Updating Existing Tests

### 4.1 When to Update Tests

**Required Updates:**
- ✅ Tool signature changes (parameters added/removed)
- ✅ API behavior changes (status values, validation rules)
- ✅ Test is failing due to server changes
- ✅ ClickUp API deprecations

**Optional Updates:**
- ⚠️ Improving test clarity
- ⚠️ Reducing test execution time
- ⚠️ Consolidating similar tests

### 4.2 Update Process

**Step 1: Understand Current Test**

```bash
# Run existing test
npm test tests/integration/feature.test.ts

# Read test code carefully
# Understand what's being validated
# Note any dependencies
```

**Step 2: Identify Required Changes**

```typescript
// Example: Tool parameter changed
// OLD:
await client.callTool('clickup_task_create', {
  list_id: listId,
  name: 'Task'
});

// NEW (added status parameter):
await client.callTool('clickup_task_create', {
  list_id: listId,
  name: 'Task',
  status: 'to do'  // New parameter
});
```

**Step 3: Update Test Code**

```typescript
// Update with clear commit message
// git commit -m "test: update task creation test for new status parameter"
```

**Step 4: Verify Update**

```bash
# Test updated file
npm test tests/integration/feature.test.ts

# Run full suite (ensure no side effects)
npm test tests/integration
```

**Step 5: Update Documentation**

```typescript
/**
 * Updated: 2025-11-01
 * Changes: Added status parameter validation
 * Reason: ClickUp API now requires explicit status
 */
```

### 4.3 Handling Breaking Changes

**When server changes break many tests:**

1. **Assess Impact:**
   ```bash
   npm test tests/integration 2>&1 | grep FAIL
   # Count failures
   ```

2. **Create Migration Plan:**
   - List affected tests
   - Determine fix strategy
   - Estimate effort

3. **Batch Updates:**
   - Fix similar issues together
   - One commit per logical change
   - Test incrementally

4. **Document Migration:**
   ```markdown
   ## v2.0 Test Migration

   **Breaking Changes:**
   - Status parameter now required
   - Priority range changed to 1-4
   - Custom fields require Business plan

   **Updated Tests:**
   - task-lifecycle.test.ts (5 tests)
   - bulk-operations.test.ts (3 tests)
   - workflows.test.ts (8 tests)
   ```

---

## 5. Test Refactoring

### 5.1 When to Refactor Tests

**Refactor when you notice:**
- 🔄 Duplicated test code (copy-paste between tests)
- 🔄 Tests are hard to understand
- 🔄 Setup/teardown is complex and repetitive
- 🔄 Tests are slow due to inefficiencies

**Don't refactor if:**
- ✋ Tests are passing and clear
- ✋ No duplication or complexity issues
- ✋ Refactoring would reduce clarity

### 5.2 Common Refactoring Patterns

**Pattern 1: Extract Helper Function**

```typescript
// BEFORE: Duplication
it('test 1', async () => {
  const task = await client.callTool('clickup_task_create', {
    list_id: listId,
    name: uniqueTestName('Task 1'),
  });
  expect(task.isError).toBe(false);
  const data = client.parseJsonResult(task);
  resourceTracker.track('task', data.id);
  return data;
});

// AFTER: Helper function
async function createTestTask(name: string) {
  const result = await client.callTool('clickup_task_create', {
    list_id: listId,
    name: uniqueTestName(name),
  });
  expect(result.isError).toBe(false);
  const data = client.parseJsonResult(result);
  resourceTracker.track('task', data.id);
  return data;
}

it('test 1', async () => {
  const task = await createTestTask('Task 1');
  // Now test actual behavior
});
```

**Pattern 2: Consolidate Similar Tests**

```typescript
// BEFORE: Many similar tests
it('should create task with priority 1', ...);
it('should create task with priority 2', ...);
it('should create task with priority 3', ...);
it('should create task with priority 4', ...);

// AFTER: Parameterized test
[1, 2, 3, 4].forEach(priority => {
  it(`should create task with priority ${priority}`, async () => {
    const task = await createTestTask('Task', { priority });
    expect(task.priority).toBe(priority);
  });
});
```

**Pattern 3: Extract Test Data Builders**

```typescript
// BEFORE: Repetitive data setup
const task1 = { name: uniqueTestName('T1'), status: 'open', priority: 1 };
const task2 = { name: uniqueTestName('T2'), status: 'open', priority: 1 };

// AFTER: Builder pattern
class TaskBuilder {
  private data: any = { status: 'open', priority: 1 };

  withName(name: string) {
    this.data.name = uniqueTestName(name);
    return this;
  }

  withPriority(priority: number) {
    this.data.priority = priority;
    return this;
  }

  build() {
    return { ...this.data };
  }
}

const task1 = new TaskBuilder().withName('T1').build();
const task2 = new TaskBuilder().withName('T2').withPriority(2).build();
```

### 5.3 Refactoring Process

**Step 1: Identify Refactoring Opportunity**
- Run tests, note duplication
- Read test code, identify patterns
- Consider if refactoring improves clarity

**Step 2: Create Refactoring Plan**
- What will be extracted/changed?
- Will tests still be clear?
- Is there a simpler approach?

**Step 3: Refactor Incrementally**
```bash
# Refactor one test file at a time
1. Refactor code
2. Run tests → must still pass
3. Commit
4. Repeat
```

**Step 4: Verify No Regressions**
```bash
# Run full suite multiple times
for i in {1..5}; do npm test tests/integration; done
```

---

## 6. Handling Flaky Tests

### 6.1 Identifying Flaky Tests

**Signs of Flakiness:**
- 🚩 Test fails occasionally (not consistently)
- 🚩 Test fails in CI but passes locally
- 🚩 Test passes when run alone, fails in suite
- 🚩 Test results depend on execution order

**Tracking Flaky Tests:**

```typescript
// Add @flaky annotation
/**
 * @flaky
 * Issue: #123
 * Failure rate: ~5%
 * Last seen: 2025-11-01
 */
it.skip('flaky test name', async () => {
  // Test code
});
```

### 6.2 Common Causes and Fixes

**Cause 1: Race Conditions**

```typescript
// ❌ FLAKY
const task = await createTask({ name: 'Test' });
const found = await searchTask('Test'); // May not find immediately

// ✅ FIXED
const task = await createTask({ name: 'Test' });
await delay(1000); // Wait for indexing
const found = await searchTask('Test');
```

**Cause 2: Insufficient Cleanup**

```typescript
// ❌ FLAKY
it('test 1', async () => {
  const task = await createTask({ name: 'Common Name' });
  // No cleanup
});

it('test 2', async () => {
  const tasks = await searchTask('Common Name');
  expect(tasks).toHaveLength(1); // Fails if test 1 ran first
});

// ✅ FIXED
afterEach(async () => {
  await cleanupTestResources(); // Clean up after each test
});
```

**Cause 3: Timing Assumptions**

```typescript
// ❌ FLAKY
await updateTask(taskId, { status: 'in progress' });
const task = await getTask(taskId); // May not reflect update yet

// ✅ FIXED
await updateTask(taskId, { status: 'in progress' });
await delay(100); // Allow API to process
const task = await getTask(taskId);
```

**Cause 4: External Dependencies**

```typescript
// ❌ FLAKY (network-dependent)
const response = await fetch('https://external-api.com/data');

// ✅ FIXED (mock external calls in unit tests)
// For integration tests, accept occasional failures
// or use retry logic
```

### 6.3 Flaky Test Workflow

1. **Detect:** CI reports intermittent failure
2. **Reproduce:** Run test 20-50 times locally
   ```bash
   for i in {1..50}; do npm test tests/integration/flaky.test.ts; done
   ```
3. **Diagnose:** Identify root cause (race, timing, cleanup)
4. **Fix:** Apply appropriate fix pattern
5. **Verify:** Run 50+ times to confirm stability
6. **Close:** Remove @flaky annotation, close issue

### 6.4 Quarantine Process

**If fix is not immediate:**

1. **Quarantine Test:**
   ```typescript
   // Temporarily skip
   it.skip('[FLAKY] test name', async () => {
     // Test code
   });
   ```

2. **Create Issue:**
   - Title: `[FLAKY TEST] test name`
   - Label: `test-flaky`
   - Description: Failure pattern, reproduction steps

3. **Schedule Fix:**
   - Priority based on failure rate and impact
   - Assign to appropriate team member
   - Set target fix date

4. **Monitor:**
   - Track flaky test count
   - Aim for <5% flaky test rate
   - Address before adding new tests

---

## 7. Test Performance Optimization

### 7.1 Performance Targets

| Test Category | Target (Individual) | Target (Suite) |
|--------------|---------------------|----------------|
| Smoke tests | <2s | <5s |
| Core tests | <5s | <30s |
| Advanced tests | <10s | <20s |
| Full suite | N/A | <60s |

### 7.2 Optimization Techniques

**Technique 1: Parallel Test Execution**

```typescript
// Use Promise.all for independent operations
const [task1, task2, task3] = await Promise.all([
  createTask({ name: 'Task 1' }),
  createTask({ name: 'Task 2' }),
  createTask({ name: 'Task 3' }),
]);
// 3x faster than sequential creation
```

**Technique 2: Reduce Unnecessary Delays**

```typescript
// ❌ SLOW
await delay(2000); // Always wait 2 seconds

// ✅ FAST
await delay(100); // Minimum delay
// Only increase if test actually fails
```

**Technique 3: Batch Operations**

```typescript
// ❌ SLOW
for (const item of items) {
  await processItem(item); // Sequential
}

// ✅ FAST
const batches = chunk(items, 5);
for (const batch of batches) {
  await Promise.all(batch.map(processItem)); // Parallel batches
  await delay(100);
}
```

**Technique 4: Minimize API Calls**

```typescript
// ❌ SLOW
const task = await getTask(taskId);
const name = task.name;
const status = task.status;
const priority = task.priority;
// Multiple getTask calls

// ✅ FAST
const task = await getTask(taskId);
const { name, status, priority } = task; // One call
```

**Technique 5: Use Test Doubles for Unit Tests**

```typescript
// Integration tests: Real API calls (slow)
// Unit tests: Mock API calls (fast)

// Move slow tests to integration suite only
// Keep fast mocked tests in unit suite
```

### 7.3 Performance Regression Detection

**Establish Baseline:**

```bash
# Run tests 10 times, average execution time
for i in {1..10}; do npm test tests/integration; done | \
  grep "Duration" | \
  awk '{sum+=$2; count++} END {print sum/count}'
```

**Monitor Trends:**

```yaml
# GitHub Actions: Track performance
- name: Track test performance
  run: |
    DURATION=$(npm test tests/integration 2>&1 | grep Duration | awk '{print $2}')
    echo "duration=$DURATION" >> performance.log

    # Alert if >20% slower than baseline
    BASELINE=45000
    if [ $DURATION -gt $((BASELINE * 12 / 10)) ]; then
      echo "::warning::Test suite is 20% slower than baseline"
    fi
```

---

## 8. Deprecation and Removal

### 8.1 When to Remove Tests

**Remove tests for:**
- ✅ Features that have been removed from the server
- ✅ Deprecated APIs no longer supported
- ✅ Tests replaced by better tests
- ✅ Redundant tests (testing same thing multiple ways)

**Don't remove tests for:**
- ⚠️ Temporarily failing tests (fix instead)
- ⚠️ Slow tests (optimize instead)
- ⚠️ "Old" but still valid tests

### 8.2 Deprecation Process

**Step 1: Mark as Deprecated (1 version before removal)**

```typescript
/**
 * @deprecated This test will be removed in v2.0.0
 * Reason: Feature removed from server
 * Replacement: See tests/integration/new-feature.test.ts
 */
it.skip('deprecated test', async () => {
  // Test code remains for reference
});
```

**Step 2: Notify Team**

```markdown
# CHANGELOG.md

## [Unreleased]
### Deprecated
- `old-feature.test.ts` - Feature removed, tests will be deleted in v2.0.0

## [2.0.0]
### Removed
- `old-feature.test.ts` - Feature no longer supported
```

**Step 3: Remove (next version)**

```bash
# Delete test file
git rm tests/integration/old-feature.test.ts
git commit -m "test: remove deprecated old-feature tests (no longer supported)"
```

---

## 9. Version Management

### 9.1 Versioning Strategy

**Test Suite Version Matches MCP Server Version:**
- Test suite v1.0.0 validates MCP Server v1.0.0
- Breaking changes in server → increment major version of tests
- New features in server → increment minor version of tests

**Version Compatibility Matrix:**

| Server Version | Test Suite Version | Compatible |
|----------------|-------------------|------------|
| 1.0.x | 1.0.x | ✅ Yes |
| 1.1.x | 1.0.x | ⚠️ Partial |
| 2.0.x | 1.x.x | ❌ No |

### 9.2 Branching Strategy

**Test Suite Branches:**
- `main` - Tests for latest stable release
- `develop` - Tests for development features
- `v1.x` - Tests for v1.x maintenance releases

**Workflow:**
1. Develop new features in `develop` branch
2. Update tests alongside server changes
3. Merge to `main` when releasing
4. Create maintenance branches as needed

---

## 10. Continuous Improvement

### 10.1 Retrospectives

**Monthly Test Retrospective (30 minutes):**

**Questions to Answer:**
1. What test issues did we encounter this month?
2. Which tests provided the most value?
3. Which tests caused the most friction?
4. What can we improve?

**Action Items:**
- Document learnings
- Update this guide
- Create tickets for improvements
- Celebrate wins

### 10.2 Metrics Dashboard

**Track Over Time:**

```yaml
metrics:
  test_count: 112
  pass_rate: 98.5%
  flaky_rate: 2.0%
  avg_duration: 45s
  coverage: 85%
  issues_found: 15
  false_positives: 1
```

**Visualize Trends:**
- Test execution time (should stay flat or decrease)
- Pass rate (should stay >95%)
- Flaky test count (should trend to zero)
- Coverage (should stay >80%)

### 10.3 Knowledge Sharing

**Share Test Knowledge:**
- Document interesting bugs found by tests
- Share test patterns in team meetings
- Write blog posts about testing approach
- Create testing workshops for new team members

**Learning Resources:**
- Testing best practices documentation
- Test pattern library
- Common pitfall reference
- Video tutorials for complex scenarios

---

## Appendix

### A. Test Maintenance Checklist

**Daily:**
- [ ] Review CI test results
- [ ] Address test failures

**Weekly:**
- [ ] Run full test suite locally
- [ ] Review performance metrics
- [ ] Clean up test space

**Monthly:**
- [ ] Flaky test audit
- [ ] Coverage review
- [ ] Documentation updates

**Quarterly:**
- [ ] Architecture review
- [ ] Dependency updates
- [ ] Performance baseline reset
- [ ] Team retrospective

### B. Useful Commands

```bash
# Run specific test file
npm test tests/integration/feature.test.ts

# Run tests matching pattern
npm test -- -t "should create"

# Run with coverage
npm run test:coverage tests/integration

# Run N times (flakiness check)
for i in {1..10}; do npm test tests/integration/feature.test.ts; done

# Debug test
npm test tests/integration/feature.test.ts -- --reporter=verbose

# Update snapshots (if using)
npm test -- -u
```

### C. Test Quality Checklist

Before committing new/updated tests:

- [ ] Tests pass consistently (run 5+ times)
- [ ] Tests have clear names
- [ ] Tests use AAA pattern (Arrange-Act-Assert)
- [ ] Resources are tracked and cleaned up
- [ ] Performance is acceptable (<5s per test)
- [ ] Documentation is updated
- [ ] No hardcoded values
- [ ] Error cases are tested

---

**Document Metadata:**
- **Created:** 2025-11-01
- **Version:** 1.0.0
- **Review Frequency:** Quarterly
- **Owner:** Test Engineering Team
- **Next Review:** 2025-02-01
