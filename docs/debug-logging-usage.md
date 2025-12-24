# Debug Logging Usage Guide

## Overview

Phase 5 adds comprehensive debug logging capabilities to track request execution, API calls, and timing information. Debug mode is **opt-in** via the `ENABLE_DEBUG` environment variable.

## Enabling Debug Mode

### Environment Variable
```bash
export ENABLE_DEBUG=true
```

### Command Line Argument
```bash
node build/index.js --env ENABLE_DEBUG=true
```

### CloudFlare Workers (wrangler.toml)
```toml
[vars]
ENABLE_DEBUG = "true"
```

## Debug Output Structure

When debug mode is enabled, tool responses include a `debug` field in metadata:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "clickup_task_get",
    "execution_time_ms": 245,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "retry": {
      "attempted": 1,
      "total_delay_ms": 100,
      "last_error": "Rate limit exceeded"
    },
    "debug": {
      "request_id": "a7b3c9d2",
      "tool_name": "clickup_task_get",
      "timing": {
        "total_ms": 245,
        "api_calls": [
          {
            "method": "GET",
            "path": "/team/{id}/task/{id}",
            "duration": 180,
            "status": 200
          },
          {
            "method": "GET",
            "path": "/team/{id}/task/{id}/comment",
            "duration": 65,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 2,
        "total_api_time_ms": 245,
        "success_count": 2,
        "error_count": 0
      }
    }
  }
}
```

## Console Output

When debug mode is enabled, you'll see detailed console logs:

```
[DEBUG] Debug logging ENABLED
[DEBUG] Request a7b3c9d2 started: clickup_task_get
[DEBUG] a7b3c9d2 API: GET /team/{id}/task/{id} - 180ms (200)
[DEBUG] a7b3c9d2 API: GET /team/{id}/task/{id}/comment - 65ms (200)
[DEBUG] Request a7b3c9d2 completed: 245ms total, 2 API calls (2 success, 0 errors)
```

## Security Considerations

### Path Sanitization
All API paths are automatically sanitized to remove sensitive IDs:
- `/team/123456/task/abc123` → `/team/{id}/task/{id}`
- `/list/901234` → `/list/{id}`

### No Sensitive Data Logged
The debug logger NEVER logs:
- API keys or tokens
- User passwords or credentials
- Request/response bodies
- Personal identifiable information (PII)

### What IS Logged
- Request IDs (random 8-character strings)
- HTTP methods (GET, POST, PUT, DELETE)
- Sanitized API paths
- Execution timings
- HTTP status codes
- Error messages (without sensitive details)

## Performance Impact

### When Debug Mode is DISABLED (default)
- **Zero overhead** - debug checks return immediately
- No performance impact on production deployments

### When Debug Mode is ENABLED
- **Minimal overhead** (~1-2ms per request)
- In-memory tracking only (no disk I/O)
- Automatic cleanup after each request

## Integration with Tool Handlers

Tool handlers automatically call `startDebugRequest()` at the beginning of execution. No changes needed to existing tool handlers unless you want to customize the debug info.

### Example Tool Handler (No Changes Required)
```typescript
export async function handleGetTask(parameters: any) {
  const startTime = Date.now();

  // This line is optional - BaseClickUpService automatically tracks when makeRequest() is called
  // taskService.startDebugRequest('clickup_task_get', userId);

  const task = await taskService.getTask(parameters.task_id);
  const executionTime = Date.now() - startTime;
  const rateLimitInfo = taskService.getRateLimitMetadata();
  const retryInfo = taskService.getRetryTelemetry();
  const debugInfo = taskService.getDebugInfo(); // NEW - only populated if ENABLE_DEBUG=true

  return sponsorService.createResponse({
    id: task.id,
    name: task.name,
    status: task.status
  }, true, {
    tool_name: 'clickup_task_get',
    execution_time_ms: executionTime,
    rate_limit: rateLimitInfo,
    retry: retryInfo,
    debug: debugInfo  // NEW - automatically includes if debug mode enabled
  });
}
```

## Use Cases

### Development
Enable debug mode to understand:
- Which API calls are being made
- How long each API call takes
- Request flow through the system
- Where time is being spent

### Troubleshooting
When investigating issues:
- Track request IDs across logs
- Identify slow API calls
- Detect unexpected API call patterns
- Verify retry behavior

### Performance Optimization
Use debug info to:
- Identify bottlenecks
- Optimize API call sequences
- Reduce redundant API calls
- Improve caching strategies

### Production Debugging
For production issues:
1. Enable debug mode temporarily
2. Reproduce the issue
3. Collect debug info from responses
4. Disable debug mode after investigation

## API Call Timing Analysis

Example debug output showing performance breakdown:

```json
{
  "debug": {
    "timing": {
      "total_ms": 450,
      "api_calls": [
        { "path": "/team/{id}/space", "duration": 120 },
        { "path": "/space/{id}/folder", "duration": 150 },
        { "path": "/folder/{id}/list", "duration": 180 }
      ]
    },
    "api_summary": {
      "total_calls": 3,
      "total_api_time_ms": 450,
      "success_count": 3,
      "error_count": 0
    }
  }
}
```

**Analysis**:
- Total execution: 450ms
- All time spent in API calls (efficient - no overhead)
- Slowest call: `/folder/{id}/list` (180ms) - potential optimization target

## Request ID Tracking

Each request gets a unique 8-character ID:
- Random alphanumeric string (e.g., `a7b3c9d2`)
- Used to correlate console logs with response metadata
- Helps trace requests across system boundaries

## CloudFlare Workers Considerations

### Limitations
- Console logs in Workers may be batched/delayed
- Use `wrangler tail` to view real-time logs
- Debug info always appears in response metadata

### Recommended Approach
1. Test locally first with `npm run dev:worker`
2. View logs with `wrangler tail --format pretty`
3. Verify debug info in response metadata
4. Disable debug mode for production deployments

## Best Practices

### DO
- ✅ Enable debug mode during development
- ✅ Use debug info to optimize performance
- ✅ Share debug output when reporting issues
- ✅ Disable debug mode in production (unless actively debugging)

### DON'T
- ❌ Leave debug mode enabled permanently in production
- ❌ Parse debug output programmatically (use for human analysis only)
- ❌ Rely on debug output format (may change in future versions)
- ❌ Log additional sensitive data in custom tool handlers

## Troubleshooting

### Debug Mode Not Working
1. Verify environment variable is set: `echo $ENABLE_DEBUG`
2. Check console for "Debug logging ENABLED" message
3. Restart server after changing environment variables
4. Verify `config.enableDebug` is `true` in runtime

### No Debug Info in Response
1. Ensure `getDebugInfo()` is called in tool handler
2. Verify debug info is passed to `createResponse()`
3. Check that `startDebugRequest()` was called before API calls
4. Confirm at least one API call was made (debug info only generated if API calls occur)

### Unexpected API Call Patterns
- Review the `api_calls` array in timing breakdown
- Check for redundant calls that could be cached
- Verify retry attempts are not excessive
- Consider optimizing query patterns

## Future Enhancements

Potential future features:
- OpenTelemetry integration for distributed tracing
- Elasticsearch export for centralized logging
- Request correlation across microservices
- Performance regression detection

## Related Documentation

- [BaseClickUpService](../src/services/clickup/base.ts) - Core retry and debug implementation
- [DebugLogger](../src/utils/debug-logger.ts) - Debug logging implementation
- [Configuration](../src/config.ts) - ENABLE_DEBUG environment variable
- [Response Types](../src/types/responses.ts) - Debug metadata structure
- [ELK Integration](./elk-otel-integration-prompt.md) - Advanced observability with home lab

---

**Last Updated**: 2025-01-18
**Phase**: Phase 5 - Add Debug Logging (COMPLETE)
