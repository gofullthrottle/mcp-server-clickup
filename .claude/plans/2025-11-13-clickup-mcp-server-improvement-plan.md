# ClickUp MCP Server - Comprehensive Improvement Plan

## Step 0: Document This Plan

- Save this plan to `.claude/plans/2025-11-13-clickup-mcp-server-improvement-plan.md`
- Use current date (2025-11-13)
- Write plan path to `.claude/.last_plan_path` for todo→plan linking (project-scoped)
- Include complete plan text with all 6 phases and implementation steps

---

## Root Cause Analysis

Research identified that **7 space management tools** (9.7% of all 72 tools) return raw JavaScript objects instead of MCP protocol-formatted responses. Working tools use `sponsorService.createResponse()` wrapper, but space tools bypass it entirely.

**Broken pattern** (`src/tools/space.ts`):
```typescript
return { id: space.id, name: space.name, message: "..." };
```

**Working pattern** (`src/tools/list.ts`):
```typescript
return sponsorService.createResponse({ id: list.id, name: list.name }, true);
```

---

## Phase 1 (CRITICAL): Fix Silent Failures - 2 hours

**Objective**: Make all 7 space tools return proper MCP responses

**Tasks**:
1. Modify `src/tools/space.ts` (lines 275-390)
2. Wrap all space tool returns with `sponsorService.createResponse(data, true)`
3. Test each tool: create, list, get, update, delete, archive, toggle_feature

**Affected tools**:
- clickup_space_create
- clickup_space_list
- clickup_space_get
- clickup_space_update
- clickup_space_delete
- clickup_space_archive
- clickup_space_toggle_feature

**Success criteria**: All space tools return `{content: [{type: "text", text: "..."}]}` format

---

## Phase 2 (HIGH): Standardize Response Schema - 3 hours

**Objective**: Create consistent response structures across all 72 tools

**Tasks**:
1. Create `src/types/responses.ts` with TypeScript interfaces
2. Define `ToolSuccessResponse<T>` and `ToolErrorResponse` types
3. Apply to all tool handlers systematically

**Schema**:
```typescript
interface ToolSuccessResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    tool_name: string;
    execution_time_ms?: number;
  };
}

interface ToolErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    type: 'RATE_LIMIT' | 'AUTH' | 'NOT_FOUND' | 'VALIDATION' | 'API_ERROR';
    retry_after?: number;
    suggested_action?: string;
  };
}
```

**Success criteria**: All 72 tools use standardized response types

---

## Phase 3 (HIGH): Improve Error Handling - 3 hours

**Objective**: Provide actionable error messages with retry guidance

**Tasks**:
1. Create `src/utils/response-builder.ts` utility
2. Add error type enums and mapping
3. Extract `Retry-After` headers from ClickUp API responses
4. Update `BaseClickUpService` error handling
5. Include suggested actions for common errors

**Error improvements**:
- Rate limits → Include retry delay and current usage
- Authentication → Suggest token refresh or OAuth re-auth
- Not found → Suggest using search tools to find correct IDs
- Validation → List specific fields with issues

**Success criteria**: Error responses include type, retry info, and suggested actions

---

## Phase 4 (MEDIUM): Add Automatic Retry - 4 hours

**Objective**: Automatically retry transient failures with exponential backoff

**Tasks**:
1. Implement retry logic in `BaseClickUpService`
2. Add exponential backoff (100ms, 200ms, 400ms, 800ms)
3. Respect `Retry-After` headers from ClickUp API
4. Configure max retries (default: 3)
5. Add retry telemetry to responses

**Retry configuration**:
```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelay: 100;  // milliseconds
  maxDelay: 5000;
  retryableErrors: ['RATE_LIMIT', 'NETWORK', 'TIMEOUT'];
}
```

**Success criteria**: Rate limit errors automatically retry without user intervention

---

## Phase 5 (MEDIUM): Add Debug Logging - 2 hours

**Objective**: Enable verbose logging for troubleshooting

**Tasks**:
1. Create `ENABLE_DEBUG` environment variable
2. Add `DebugLogger` utility in `src/utils/debug-logger.ts`
3. Include debug info in responses when enabled (request ID, timing, API calls)
4. Log tool execution flow without exposing sensitive data

**Debug response additions**:
```typescript
{
  success: true,
  data: { ... },
  debug?: {
    request_id: string;
    execution_time_ms: number;
    api_calls: number;
    rate_limit_remaining: number;
  }
}
```

**Success criteria**: `ENABLE_DEBUG=true` provides detailed execution insights

---

## Phase 6 (MEDIUM): Update Documentation - 6 hours

**Objective**: Improve tool descriptions with examples and error scenarios

**Tasks**:
1. Enhance all 72 `@tool` decorator descriptions
2. Add "Returns" section with example JSON
3. Document possible error types and meanings
4. List rate limits and API dependencies
5. Update README.md with troubleshooting guide

**Documentation improvements**:
- Before: "Create a new space in ClickUp"
- After: "Create a new space in ClickUp workspace. Returns space object with ID and settings. Rate limit: 100/min. Errors: AUTH (token expired), VALIDATION (invalid name), RATE_LIMIT (retry after N seconds)"

**Success criteria**: Every tool has comprehensive description with return values and errors

---

## Implementation Order & Dependencies

1. **Phase 1 first** (CRITICAL) - Unblocks all space tools immediately
2. **Phase 2 next** (HIGH) - Provides foundation for Phase 3
3. **Phase 3 after Phase 2** (HIGH) - Uses standardized response types
4. **Phase 4, 5, 6 in parallel** (MEDIUM) - No cross-dependencies

**Total estimated time**: 20 hours across 6 phases

---

## Testing Strategy

**For each phase**:
1. Unit tests for new utilities (response-builder, debug-logger, retry logic)
2. Integration tests with actual ClickUp API (use test workspace)
3. Manual testing via MCP Inspector
4. Regression testing: Ensure existing tools still work

**Test coverage targets**:
- Phase 1: 100% (7 space tools must all work)
- Phase 2-3: 90% (standardization and error handling)
- Phase 4-6: 80% (retry, debug, docs)

---

## Rollback Strategy

**Git workflow**:
- Feature branch per phase: `fix/phase-1-silent-failures`, `feat/phase-2-response-schema`, etc.
- Small, atomic commits within each phase
- Tag releases: `v1.1.0-phase1`, `v1.1.0-phase2`, etc.

**Rollback triggers**:
- New failures in previously working tools
- Performance regression (>500ms increase in p95 latency)
- User complaints about breaking changes

---

## Success Metrics

**Phase 1**:
- ✅ All 7 space tools return visible output in Claude Code
- ✅ Zero silent failures across all 72 tools

**Phases 2-3**:
- ✅ Consistent response schema across 100% of tools
- ✅ Error messages include actionable guidance

**Phases 4-6**:
- ✅ 90% reduction in user-facing rate limit errors
- ✅ Debug mode enabled for all troubleshooting sessions
- ✅ Tool documentation scores 8+/10 in user feedback

---

## Post-Implementation

**Monitoring**:
- Track tool success/failure rates
- Monitor retry effectiveness
- Collect user feedback on error messages

**Iteration**:
- Add more error types as discovered
- Refine retry backoff based on real usage
- Expand debug logging based on support tickets

---

## Final Step: Document Solution Summary

- Save solution summary to `.claude/plans/2025-11-13-clickup-mcp-server-improvement-plan-solution-summary.md`
- Use same base filename as the plan with `-solution-summary` suffix
- Include comprehensive summary of what was accomplished
- Document deviations from plan, challenges encountered, and lessons learned

---

**Ready to execute Phase 1 immediately upon approval.**
