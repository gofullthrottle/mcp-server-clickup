# API Reference Updates

## Epic: API Reference for Remote MCP Endpoints

Document remote MCP endpoints, authentication headers, error codes, rate limiting, and transport options.

**Estimated Duration**: 4h | **Phase**: 2 | **Priority**: high | **Complexity**: Standard

## Wave Context
Wave 3 (Feature Documentation) - Parallel Stream 5
Can run in parallel with: Phase 2.1, 2.2, 2.3, 2.4

## Tasks
- [ ] Create docs/API_REFERENCE.md (10m)
- [ ] Document /mcp endpoint (60m) - POST method, request/response format
- [ ] Document authentication headers (40m) - Bearer JWT token, examples
- [ ] Document error response codes (50m) - 400, 401, 403, 429, 500 with examples
- [ ] Document rate limiting headers (30m) - X-RateLimit-* headers, behavior
- [ ] Document WebSocket/SSE transport (40m) - Connection setup, message format
- [ ] Add request/response examples (50m) - tools/list, tools/call examples

## Acceptance Criteria
- [ ] Remote MCP endpoints fully documented
- [ ] Authentication requirements clear
- [ ] All error codes explained
- [ ] Rate limiting behavior documented
- [ ] Transport options explained

## Dependencies
- Depends on: Phase 1.1 (CLAUDE.md)
- Parallel with: Phase 2.1, 2.2, 2.3, 2.4

## Resources
- [src/worker.ts](src/worker.ts)
- [src/mcp-worker-server.ts](src/mcp-worker-server.ts)
