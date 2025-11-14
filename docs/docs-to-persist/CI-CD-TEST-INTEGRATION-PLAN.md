# CI/CD Test Integration Plan

## Document Purpose

This plan provides complete instructions for integrating the integration test suite into CI/CD pipelines, ensuring automated testing for every code change and deployment.

**Date:** 2025-11-01
**Audience:** DevOps Engineers, Platform Team, Repository Administrators
**Estimated Setup Time:** 2-4 hours

---

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Secrets Configuration](#secrets-configuration)
4. [Branch Protection Rules](#branch-protection-rules)
5. [Test Environments](#test-environments)
6. [Workflow Triggers](#workflow-triggers)
7. [Notification Configuration](#notification-configuration)
8. [Performance Monitoring](#performance-monitoring)
9. [Troubleshooting CI Issues](#troubleshooting-ci-issues)

---

## 1. Overview

### 1.1 Goals

- **Automated Testing:** Run integration tests on every PR and commit
- **Early Detection:** Catch bugs before they reach production
- **Quality Gates:** Prevent merging of failing tests
- **Performance Tracking:** Monitor test execution time trends
- **Coverage Reporting:** Track code coverage over time

### 1.2 CI/CD Strategy

**Test Execution Points:**
- ✅ **Pull Request:** Run full test suite before merge
- ✅ **Push to Main:** Run tests on main branch
- ✅ **Daily Schedule:** Run tests daily to catch external API changes
- ✅ **Manual Trigger:** Allow on-demand test execution

**Environments:**
- **Development:** Feature branches
- **Staging:** Pre-production testing
- **Production:** Post-deployment smoke tests

---

## 2. GitHub Actions Setup

### 2.1 Complete Workflow Configuration

Create `.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  # Trigger on PR to main/develop
  pull_request:
    branches:
      - main
      - develop
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - 'LICENSE'

  # Trigger on push to main/develop
  push:
    branches:
      - main
      - develop
    paths-ignore:
      - 'docs/**'
      - '**.md'

  # Daily at 2 AM UTC
  schedule:
    - cron: '0 2 * * *'

  # Manual trigger
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Test suite to run'
        required: false
        default: 'all'
        type: choice
        options:
          - all
          - core
          - advanced
          - smoke

jobs:
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    # Environment for secrets
    environment: testing

    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20]

    steps:
      # 1. Checkout code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Setup Node.js
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      # 3. Install dependencies
      - name: Install dependencies
        run: npm ci

      # 4. Build project
      - name: Build project
        run: npm run build

      # 5. Run linting
      - name: Run linting
        run: npm run lint
        continue-on-error: true

      # 6. Determine which tests to run
      - name: Determine test suite
        id: test-suite
        run: |
          if [ "${{ github.event.inputs.test_suite }}" == "core" ]; then
            echo "tests=tests/integration/task-lifecycle.test.ts tests/integration/dependencies.test.ts tests/integration/subtasks.test.ts tests/integration/custom-fields.test.ts tests/integration/comments.test.ts tests/integration/bulk-operations.test.ts tests/integration/error-handling.test.ts tests/integration/authentication.test.ts tests/integration/tier-enforcement.test.ts" >> $GITHUB_OUTPUT
          elif [ "${{ github.event.inputs.test_suite }}" == "advanced" ]; then
            echo "tests=tests/integration/workflows.test.ts tests/integration/concurrency.test.ts tests/integration/data-integrity.test.ts" >> $GITHUB_OUTPUT
          elif [ "${{ github.event.inputs.test_suite }}" == "smoke" ]; then
            echo "tests=tests/integration/task-lifecycle.test.ts tests/integration/authentication.test.ts" >> $GITHUB_OUTPUT
          else
            echo "tests=tests/integration" >> $GITHUB_OUTPUT
          fi

      # 7. Run integration tests
      - name: Run integration tests
        env:
          CLICKUP_API_KEY: ${{ secrets.CLICKUP_API_KEY }}
          CLICKUP_TEAM_ID: ${{ secrets.CLICKUP_TEAM_ID }}
          CLICKUP_TEST_SPACE_ID: ${{ secrets.CLICKUP_TEST_SPACE_ID }}
          INTEGRATION_TEST_TIMEOUT: 60000
          CLEANUP_TEST_RESOURCES: true
          LOG_LEVEL: info
        run: |
          npm test ${{ steps.test-suite.outputs.tests }} -- --reporter=verbose --testTimeout=60000

      # 8. Generate coverage report
      - name: Generate coverage report
        if: always()
        run: npm run test:coverage ${{ steps.test-suite.outputs.tests }}

      # 9. Upload coverage to Codecov
      - name: Upload coverage to Codecov
        if: always()
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: integration-tests-node-${{ matrix.node-version }}
          name: Integration Tests (Node ${{ matrix.node-version }})
          fail_ci_if_error: false

      # 10. Upload test results
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-node-${{ matrix.node-version }}
          path: |
            coverage/
            test-results*.json
            test-results*.log
          retention-days: 30

      # 11. Comment on PR with results
      - name: Comment PR with test results
        if: github.event_name == 'pull_request' && always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            let comment = '## Integration Test Results\n\n';
            comment += `**Node Version:** ${{ matrix.node-version }}\n`;
            comment += `**Status:** ${{ job.status }}\n\n`;

            // Add test summary if available
            if (fs.existsSync('coverage/coverage-summary.json')) {
              const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
              const total = coverage.total;
              comment += '### Coverage\n';
              comment += `- **Statements:** ${total.statements.pct}%\n`;
              comment += `- **Branches:** ${total.branches.pct}%\n`;
              comment += `- **Functions:** ${total.functions.pct}%\n`;
              comment += `- **Lines:** ${total.lines.pct}%\n\n`;
            }

            comment += `[View full results](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

  # Job: Performance Tracking
  performance-tracking:
    name: Performance Tracking
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download test results
        uses: actions/download-artifact@v4
        with:
          name: test-results-node-18

      - name: Track performance metrics
        run: |
          # Extract timing metrics and store in performance database
          # This is a placeholder - implement based on your monitoring solution
          echo "Performance tracking would happen here"

  # Job: Notify on Failure
  notify-failure:
    name: Notify Failure
    runs-on: ubuntu-latest
    needs: integration-tests
    if: failure()

    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Integration tests failed on ${{ github.ref }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Integration Tests Failed*\n\nBranch: `${{ github.ref }}`\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}\n\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Results>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2.2 Smoke Test Workflow (Fast Feedback)

Create `.github/workflows/smoke-tests.yml` for quick validation:

```yaml
name: Smoke Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  smoke-tests:
    name: Smoke Tests (Quick)
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run smoke tests
        env:
          CLICKUP_API_KEY: ${{ secrets.CLICKUP_API_KEY }}
          CLICKUP_TEAM_ID: ${{ secrets.CLICKUP_TEAM_ID }}
          CLICKUP_TEST_SPACE_ID: ${{ secrets.CLICKUP_TEST_SPACE_ID }}
        run: |
          npm test tests/integration/task-lifecycle.test.ts tests/integration/authentication.test.ts -- --testTimeout=30000
```

---

## 3. Secrets Configuration

### 3.1 Required Secrets

Configure in GitHub Repository Settings → Secrets and Variables → Actions:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `CLICKUP_API_KEY` | ClickUp Personal API Token | `pk_1234567890abcdef...` |
| `CLICKUP_TEAM_ID` | ClickUp Team/Workspace ID | `12345678` |
| `CLICKUP_TEST_SPACE_ID` | Dedicated test Space ID | `98765432` |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `CODECOV_TOKEN` | Codecov upload token (optional) | `abc123...` |

### 3.2 Environment Configuration

Create GitHub Environment named "testing":

1. Go to Repository Settings → Environments
2. Click "New environment"
3. Name: `testing`
4. Add protection rules:
   - ✅ Required reviewers (optional)
   - ✅ Wait timer: 0 minutes
   - ✅ Deployment branches: `main`, `develop`

5. Add environment secrets (same as above)

### 3.3 Rotating Secrets

**Best Practice:** Rotate API keys every 90 days

```bash
# Generate new ClickUp API token
# 1. Go to ClickUp Settings → Apps
# 2. Generate new token
# 3. Update GitHub secret
# 4. Delete old token

# Update secret via GitHub CLI
gh secret set CLICKUP_API_KEY --body "new_token_value"
```

---

## 4. Branch Protection Rules

### 4.1 Main Branch Protection

Configure in Repository Settings → Branches → Add rule for `main`:

**Required Settings:**
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from Code Owners

- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks that are required:
    - `Integration Tests (18)`
    - `Integration Tests (20)`
    - `Smoke Tests (Quick)`

- ✅ Require conversation resolution before merging
- ✅ Require signed commits (recommended)
- ✅ Include administrators (recommended)

**Optional Settings:**
- ⚠️ Require deployments to succeed before merging (for deployment workflows)
- ⚠️ Lock branch (prevents all pushes except from workflows)

### 4.2 Develop Branch Protection

Configure similar rules for `develop` with relaxed requirements:

- ✅ Require pull request (no approval required)
- ✅ Require status checks:
  - `Smoke Tests (Quick)` only
- ✅ Allow force pushes (for rebasing)

---

## 5. Test Environments

### 5.1 Dedicated Test Spaces

**Recommendation:** Use separate ClickUp spaces for different CI environments

| Environment | Space Name | Purpose |
|-------------|-----------|---------|
| CI/CD | `CI-Integration-Tests-2025` | Automated test runs |
| Development | `Dev-Integration-Tests-2025` | Local development testing |
| Staging | `Staging-Tests-2025` | Pre-production validation |

**Setup Process:**

1. Create dedicated ClickUp spaces
2. Generate separate API tokens for each environment
3. Configure as GitHub environment secrets
4. Update workflows to use environment-specific secrets

### 5.2 Test Data Isolation

**Best Practice:** Each test run uses unique resource names

```typescript
// Automatic via uniqueTestName()
const taskName = uniqueTestName('CI Test'); // "CI Test-1730455832-a3x9z"
```

**Cleanup Strategy:**
- ✅ Automatic cleanup after each test suite run
- ✅ Daily cleanup job for leaked resources
- ✅ Manual cleanup script for emergencies

```yaml
# Add to workflows/integration-tests.yml
  cleanup:
    name: Cleanup Test Resources
    runs-on: ubuntu-latest
    if: always()
    needs: integration-tests

    steps:
      - name: Cleanup leaked test resources
        env:
          CLICKUP_API_KEY: ${{ secrets.CLICKUP_API_KEY }}
          CLICKUP_TEST_SPACE_ID: ${{ secrets.CLICKUP_TEST_SPACE_ID }}
        run: |
          # Delete all tasks older than 24 hours with "Test" in name
          node scripts/cleanup-test-resources.js
```

---

## 6. Workflow Triggers

### 6.1 Pull Request Triggers

**When:** Any PR to `main` or `develop`

**What Runs:**
1. Smoke tests (2-3 minutes)
2. Full integration tests if smoke tests pass (45 minutes)
3. Coverage report generation
4. PR comment with results

**Skip Conditions:**
- Documentation-only changes (`docs/**`, `*.md`)
- License or README updates

### 6.2 Push Triggers

**When:** Push to `main` or `develop`

**What Runs:**
1. Full integration test suite
2. Performance tracking
3. Coverage reporting to Codecov
4. Slack notification if failure

### 6.3 Scheduled Triggers

**When:** Daily at 2 AM UTC

**What Runs:**
1. Full integration test suite
2. Extended timeout (60 seconds per test)
3. Performance baseline update
4. Detailed report generation

**Purpose:** Catch external API changes (ClickUp API updates)

### 6.4 Manual Triggers

**When:** Via GitHub Actions UI

**Options:**
- `all` - Run all tests (default)
- `core` - Run core test suite only (9 files)
- `advanced` - Run advanced tests only (3 files)
- `smoke` - Run smoke tests only (2 files)

**Use Cases:**
- On-demand testing before releases
- Debugging flaky tests
- Performance benchmarking

---

## 7. Notification Configuration

### 7.1 Slack Integration

Configure Slack webhook for test notifications:

**Setup:**
1. Create Slack incoming webhook
2. Add as GitHub secret: `SLACK_WEBHOOK_URL`
3. Workflow sends notifications automatically

**Notification Triggers:**
- ✅ Integration tests fail on `main` branch
- ✅ Daily test summary
- ✅ Performance degradation detected
- ⚠️ Flaky tests detected (3+ failures in a row)

**Message Format:**
```json
{
  "text": "Integration Tests Failed",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Integration Tests Failed*\n\nBranch: `main`\nCommit: abc123\nAuthor: @developer\n\n<link|View Results>"
      }
    }
  ]
}
```

### 7.2 Email Notifications

GitHub automatically sends emails for:
- Workflow failures (to commit author)
- Required check failures (to PR author)

**Configuration:** Repository Settings → Notifications

### 7.3 GitHub Status API

Workflows automatically update commit status:
- ✅ Green checkmark: All tests passed
- ❌ Red X: Tests failed
- 🟡 Yellow dot: Tests running
- ⚪ Gray dot: Tests pending

---

## 8. Performance Monitoring

### 8.1 Test Execution Time Tracking

Track test execution time trends over time:

**Metrics to Track:**
- Total execution time
- Per-file execution time
- Per-test execution time
- API response times

**Implementation:**

```yaml
# Add to workflow
- name: Extract performance metrics
  run: |
    # Parse test output for timing
    node scripts/extract-performance-metrics.js > metrics.json

- name: Upload metrics to monitoring service
  run: |
    curl -X POST https://monitoring.example.com/metrics \
      -H "Authorization: Bearer ${{ secrets.MONITORING_TOKEN }}" \
      -d @metrics.json
```

### 8.2 Performance Regression Detection

Alert if tests are significantly slower:

**Thresholds:**
- ⚠️ Warning: 20% slower than baseline
- 🚨 Critical: 50% slower than baseline

**Baseline:**
- Update weekly with median execution time
- Store in repository: `benchmarks/baseline.json`

### 8.3 Coverage Tracking

Monitor code coverage trends:

**Tools:**
- Codecov (recommended)
- Coveralls
- SonarQube

**Configuration:**
```yaml
- name: Upload to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage-final.json
    flags: integration-tests
    fail_ci_if_error: false
```

---

## 9. Troubleshooting CI Issues

### 9.1 Common CI Failures

#### Issue 1: Rate Limiting

**Symptom:**
```
Error: ClickUp API rate limit exceeded (429)
```

**Cause:** Too many parallel test runs

**Solution:**
```yaml
# Limit concurrency
concurrency:
  group: integration-tests-${{ github.ref }}
  cancel-in-progress: true
```

#### Issue 2: Timeout Errors

**Symptom:**
```
Error: Test timeout after 10000ms
```

**Cause:** Network latency or slow API responses

**Solution:**
```yaml
# Increase timeout
run: npm test -- --testTimeout=60000
```

#### Issue 3: Authentication Failures

**Symptom:**
```
Error: Authentication failed (401)
```

**Cause:** Invalid or expired API token

**Solution:**
```bash
# Verify secret is set correctly
gh secret list

# Update secret
gh secret set CLICKUP_API_KEY --body "new_token"
```

#### Issue 4: Flaky Tests

**Symptom:** Tests pass sometimes, fail other times

**Cause:** Race conditions or timing issues

**Solution:**
```yaml
# Retry failed tests
- name: Run tests with retry
  run: npm test -- --retry=3
```

### 9.2 Debug Failed Workflow Runs

**Steps:**

1. **View Logs:**
   - Go to Actions → Failed workflow
   - Expand failed step
   - Review error messages

2. **Download Artifacts:**
   - Scroll to bottom of workflow run
   - Download test results artifacts
   - Review coverage reports

3. **Re-run with Debug Logging:**
   ```yaml
   # Enable debug logging
   env:
     LOG_LEVEL: debug
     NODE_ENV: development
   ```

4. **Run Locally:**
   ```bash
   # Simulate CI environment
   export CLICKUP_API_KEY=xxx
   export CLICKUP_TEAM_ID=xxx
   export CLICKUP_TEST_SPACE_ID=xxx
   npm test tests/integration
   ```

### 9.3 Emergency Procedures

**If All Tests Fail:**

1. Check ClickUp API status: https://status.clickup.com
2. Verify secrets are configured correctly
3. Check for ClickUp API changes
4. Temporarily disable required checks (last resort)

**If Tests Are Blocking Critical Deploy:**

```yaml
# Override protection temporarily
gh api repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks \
  -X PATCH \
  -f contexts[]=''  # Remove required checks
```

---

## 10. Rollout Plan

### Phase 1: Setup (Week 1)

- [ ] Create GitHub Actions workflows
- [ ] Configure secrets and environments
- [ ] Set up Slack notifications
- [ ] Document procedures

### Phase 2: Testing (Week 2)

- [ ] Run workflows manually
- [ ] Verify notifications work
- [ ] Test branch protection rules
- [ ] Fix any issues

### Phase 3: Enable Required Checks (Week 3)

- [ ] Enable smoke tests as required
- [ ] Monitor for false positives
- [ ] Gradually add full integration tests
- [ ] Train team on workflow

### Phase 4: Full Automation (Week 4)

- [ ] All tests required on main
- [ ] Daily scheduled runs active
- [ ] Performance monitoring enabled
- [ ] Retrospective and improvements

---

## Appendix

### A. Complete Workflow File Reference

See full workflow files at:
- `.github/workflows/integration-tests.yml`
- `.github/workflows/smoke-tests.yml`
- `.github/workflows/daily-tests.yml`

### B. GitHub CLI Commands

```bash
# List workflows
gh workflow list

# Run workflow manually
gh workflow run integration-tests.yml

# View workflow runs
gh run list --workflow=integration-tests.yml

# View logs
gh run view --log

# Download artifacts
gh run download <run-id>

# Manage secrets
gh secret list
gh secret set SECRET_NAME
gh secret remove SECRET_NAME
```

### C. Useful Links

- GitHub Actions Documentation: https://docs.github.com/en/actions
- Codecov Documentation: https://docs.codecov.com
- Vitest CI Integration: https://vitest.dev/guide/ci
- ClickUp API Status: https://status.clickup.com

---

**Document Metadata:**
- **Created:** 2025-11-01
- **Version:** 1.0.0
- **Estimated Setup Time:** 2-4 hours
- **Maintenance:** Review quarterly
- **Owner:** DevOps Team
