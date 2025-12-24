# Tool Usage Analytics System

**Date**: 2025-11-14
**Purpose**: Monitor tool usage patterns to optimize UX and reduce context window bloat

---

## Objectives

1. **Track Tool Frequency**: Which tools are used most/least
2. **Identify Tool Sequences**: Which tools are used together (patterns/workflows)
3. **Measure Performance**: Success rates, error patterns, execution times
4. **Optimize Context**: Determine which tools to include in FREE_TIER_TOOLS vs premium
5. **Reduce Bloat**: Identify tools that can be disabled by default

---

## Analytics Data Model

### 1. Tool Usage Event

```typescript
interface ToolUsageEvent {
  // Identity
  session_id: string;           // User session ID (from JWT or UUID)
  user_tier: 'free' | 'premium'; // User subscription tier
  timestamp: number;             // Unix timestamp

  // Tool Info
  tool_name: string;             // e.g., "create_task"
  tool_category: string;         // e.g., "task", "list", "project"

  // Execution Metrics
  execution_time_ms: number;
  success: boolean;
  error_code?: string;
  error_message?: string;

  // API Metrics
  api_calls_made: number;
  api_time_ms: number;
  rate_limit_hit: boolean;
  retry_count: number;

  // Context
  parameters_hash: string;       // Hash of params (for pattern detection)
  previous_tool?: string;        // Tool called before this one
  next_tool?: string;           // Tool called after (filled retroactively)
  sequence_position: number;     // Position in call sequence

  // Resource Usage
  context_window_tokens?: number; // If available from MCP client
}
```

### 2. Tool Sequence Pattern

```typescript
interface ToolSequencePattern {
  pattern_id: string;            // Hash of tool sequence
  tools: string[];               // e.g., ["get_workspace_hierarchy", "create_task", "add_tag_to_task"]
  frequency: number;             // How many times this sequence occurs
  avg_success_rate: number;      // % of sequences that complete successfully
  avg_duration_ms: number;
  first_seen: number;
  last_seen: number;
  user_tier_distribution: {
    free: number;
    premium: number;
  };
}
```

### 3. Tool Statistics Aggregates

```typescript
interface ToolStatistics {
  tool_name: string;

  // Usage Frequency
  total_calls: number;
  unique_users: number;
  calls_per_day: number;

  // Performance
  avg_execution_time_ms: number;
  p50_execution_time_ms: number;
  p95_execution_time_ms: number;
  p99_execution_time_ms: number;

  // Reliability
  success_rate: number;          // % successful
  error_rate: number;            // % failed
  retry_rate: number;            // % that needed retries

  // Common Patterns
  commonly_follows: string[];    // Tools often called before this
  commonly_precedes: string[];   // Tools often called after this
  standalone_usage_rate: number; // % used without other tools

  // User Segmentation
  free_tier_usage_pct: number;
  premium_tier_usage_pct: number;

  // Context Impact
  avg_context_tokens: number;    // If available

  // Time Series
  usage_trend: 'increasing' | 'decreasing' | 'stable';
}
```

---

## Storage Architecture

### Option 1: CloudFlare D1 (Recommended for Workers)

```sql
-- Tool usage events table
CREATE TABLE tool_usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_tier TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  tool_category TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  error_message TEXT,
  api_calls_made INTEGER,
  api_time_ms INTEGER,
  rate_limit_hit BOOLEAN,
  retry_count INTEGER,
  parameters_hash TEXT,
  previous_tool TEXT,
  next_tool TEXT,
  sequence_position INTEGER,
  context_window_tokens INTEGER
);

CREATE INDEX idx_tool_name ON tool_usage_events(tool_name);
CREATE INDEX idx_timestamp ON tool_usage_events(timestamp);
CREATE INDEX idx_session_id ON tool_usage_events(session_id);
CREATE INDEX idx_tool_category ON tool_usage_events(tool_category);

-- Tool sequence patterns table
CREATE TABLE tool_sequences (
  pattern_id TEXT PRIMARY KEY,
  tools TEXT NOT NULL,  -- JSON array
  frequency INTEGER NOT NULL,
  avg_success_rate REAL,
  avg_duration_ms REAL,
  first_seen INTEGER,
  last_seen INTEGER,
  free_tier_count INTEGER,
  premium_tier_count INTEGER
);

CREATE INDEX idx_frequency ON tool_sequences(frequency DESC);

-- Tool statistics aggregates (updated daily)
CREATE TABLE tool_statistics (
  tool_name TEXT PRIMARY KEY,
  stats_date TEXT NOT NULL,
  total_calls INTEGER,
  unique_users INTEGER,
  avg_execution_time_ms REAL,
  p50_execution_time_ms REAL,
  p95_execution_time_ms REAL,
  p99_execution_time_ms REAL,
  success_rate REAL,
  error_rate REAL,
  commonly_follows TEXT,  -- JSON array
  commonly_precedes TEXT, -- JSON array
  free_tier_usage_pct REAL,
  premium_tier_usage_pct REAL,
  usage_trend TEXT,
  updated_at INTEGER
);

CREATE INDEX idx_stats_date ON tool_statistics(stats_date);
```

### Option 2: CloudFlare R2 (For Raw Data Archive)

Store raw events in R2 for long-term retention:
```
s3://clickup-mcp-analytics/
  ├── events/
  │   ├── 2025/11/14/
  │   │   ├── tool_usage_00.jsonl
  │   │   ├── tool_usage_01.jsonl
  │   │   └── ...
  ├── aggregates/
  │   ├── daily/
  │   │   ├── 2025-11-14-tool-stats.json
  │   └── weekly/
  │       ├── 2025-W46-tool-stats.json
```

---

## Implementation Plan

### Phase 1: Event Capture (Minimal Impact)

Add to `src/server.ts` CallTool handler:

```typescript
// Track session state for sequence detection
const sessionToolCalls = new Map<string, Array<{ tool: string; timestamp: number }>>();

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: params } = req.params;
  const startTime = Date.now();

  // Get or create session ID (from JWT or generate UUID)
  const sessionId = extractSessionId(req) || generateUUID();

  // Get previous tool for sequence tracking
  const sessionHistory = sessionToolCalls.get(sessionId) || [];
  const previousTool = sessionHistory.length > 0
    ? sessionHistory[sessionHistory.length - 1].tool
    : null;

  try {
    // Execute tool (existing logic)
    const result = await handleToolExecution(name, params);

    // Record successful event
    await analytics.recordToolUsage({
      session_id: sessionId,
      tool_name: name,
      execution_time_ms: Date.now() - startTime,
      success: true,
      previous_tool: previousTool,
      sequence_position: sessionHistory.length,
      // ... other metrics
    });

    // Update session history
    sessionHistory.push({ tool: name, timestamp: Date.now() });
    sessionToolCalls.set(sessionId, sessionHistory);

    return result;
  } catch (error) {
    // Record failed event
    await analytics.recordToolUsage({
      session_id: sessionId,
      tool_name: name,
      execution_time_ms: Date.now() - startTime,
      success: false,
      error_code: error.code,
      error_message: error.message,
      previous_tool: previousTool,
      // ...
    });

    throw error;
  }
});
```

### Phase 2: Analytics Service

```typescript
// src/services/analytics-service.ts
export class AnalyticsService {
  private db: D1Database; // CloudFlare D1
  private r2: R2Bucket;   // CloudFlare R2

  async recordToolUsage(event: ToolUsageEvent): Promise<void> {
    // Write to D1 for real-time queries
    await this.db.prepare(`
      INSERT INTO tool_usage_events (
        session_id, user_tier, timestamp, tool_name, tool_category,
        execution_time_ms, success, error_code, previous_tool, sequence_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.session_id, event.user_tier, event.timestamp, event.tool_name,
      event.tool_category, event.execution_time_ms, event.success,
      event.error_code, event.previous_tool, event.sequence_position
    ).run();

    // Also write to R2 for archival (batched)
    await this.appendToR2Log(event);
  }

  async detectSequencePattern(sessionId: string): Promise<void> {
    // Query recent tool calls in this session
    const calls = await this.db.prepare(`
      SELECT tool_name FROM tool_usage_events
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `).bind(sessionId).all();

    if (calls.results.length >= 2) {
      const tools = calls.results.map(r => r.tool_name);
      const patternId = hashToolSequence(tools);

      // Update or create sequence pattern
      await this.db.prepare(`
        INSERT INTO tool_sequences (pattern_id, tools, frequency, last_seen)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(pattern_id) DO UPDATE SET
          frequency = frequency + 1,
          last_seen = excluded.last_seen
      `).bind(patternId, JSON.stringify(tools), Date.now()).run();
    }
  }

  async getToolStatistics(toolName: string): Promise<ToolStatistics> {
    // Query aggregated stats
    const stats = await this.db.prepare(`
      SELECT * FROM tool_statistics
      WHERE tool_name = ?
      ORDER BY stats_date DESC
      LIMIT 1
    `).bind(toolName).first();

    return stats;
  }

  async getMostCommonSequences(limit: number = 10): Promise<ToolSequencePattern[]> {
    const sequences = await this.db.prepare(`
      SELECT * FROM tool_sequences
      ORDER BY frequency DESC
      LIMIT ?
    `).bind(limit).all();

    return sequences.results;
  }
}
```

### Phase 3: Daily Aggregation (Cron Worker)

```typescript
// CloudFlare Worker Cron: runs daily
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const analytics = new AnalyticsService(env.DB, env.R2);

    // Aggregate yesterday's data
    const yesterday = getYesterdayDate();

    // Calculate tool statistics
    for (const toolName of ALL_TOOL_NAMES) {
      const stats = await analytics.calculateDailyStats(toolName, yesterday);
      await analytics.saveToolStatistics(toolName, yesterday, stats);
    }

    // Clean up old events from D1 (keep last 30 days)
    await analytics.archiveOldEvents(30);
  }
};
```

### Phase 4: Analytics Dashboard

Create MCP resource for analytics:

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "analytics://tool-usage",
        name: "Tool Usage Statistics",
        description: "Analytics dashboard for tool usage patterns",
        mimeType: "application/json"
      },
      {
        uri: "analytics://sequences",
        name: "Common Tool Sequences",
        description: "Most common tool usage patterns",
        mimeType: "application/json"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const uri = req.params.uri;

  if (uri === "analytics://tool-usage") {
    const stats = await analytics.getAllToolStatistics();
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(stats, null, 2)
      }]
    };
  }

  if (uri === "analytics://sequences") {
    const sequences = await analytics.getMostCommonSequences(20);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(sequences, null, 2)
      }]
    };
  }
});
```

---

## Analysis Use Cases

### 1. Identify Unused Tools

```sql
-- Tools with < 1% usage rate
SELECT tool_name, total_calls, free_tier_usage_pct
FROM tool_statistics
WHERE stats_date = (SELECT MAX(stats_date) FROM tool_statistics)
  AND total_calls < (SELECT SUM(total_calls) * 0.01 FROM tool_statistics)
ORDER BY total_calls ASC;
```

**Action**: Disable by default or move to premium tier

### 2. Optimize FREE_TIER_TOOLS

```sql
-- Most used tools by free tier users
SELECT tool_name, total_calls, free_tier_usage_pct
FROM tool_statistics
WHERE free_tier_usage_pct > 80
ORDER BY total_calls DESC
LIMIT 10;
```

**Action**: Ensure these are in FREE_TIER_TOOLS

### 3. Detect Common Workflows

```sql
-- Top 10 most common tool sequences
SELECT tools, frequency, avg_success_rate
FROM tool_sequences
ORDER BY frequency DESC
LIMIT 10;
```

**Action**:
- Create workflow templates
- Optimize tool descriptions for common patterns
- Consider creating composite tools for frequent sequences

### 4. Performance Bottlenecks

```sql
-- Slowest tools
SELECT tool_name, p95_execution_time_ms, avg_execution_time_ms, total_calls
FROM tool_statistics
WHERE total_calls > 100
ORDER BY p95_execution_time_ms DESC
LIMIT 10;
```

**Action**: Optimize slow tools or add caching

### 5. Error Hot Spots

```sql
-- Tools with highest error rates
SELECT tool_name, error_rate, total_calls, success_rate
FROM tool_statistics
WHERE error_rate > 0.05  -- > 5% errors
ORDER BY error_rate DESC;
```

**Action**: Improve error handling, update documentation

---

## Privacy Considerations

1. **No PII Storage**: Never store task names, descriptions, or user-identifiable data
2. **Parameter Hashing**: Hash parameters instead of storing raw values
3. **Aggregate Early**: Aggregate to statistics quickly, delete raw events after 30 days
4. **Opt-Out**: Allow users to disable analytics via environment variable

```typescript
// Environment variable to disable analytics
ENABLE_ANALYTICS=false
```

---

## Metrics to Display

### Admin Dashboard (Internal)

1. **Tool Popularity Ranking** (by calls/day)
2. **Tool Sequence Heatmap** (visualize common flows)
3. **Error Rate Trends** (chart over time)
4. **Performance Degradation Alerts** (p95 > threshold)
5. **Usage by Tier** (free vs premium distribution)

### Public Metrics (For Users)

1. **Your Most Used Tools** (personalized to session)
2. **Suggested Next Tool** (based on sequence patterns)
3. **Tool Performance Benchmark** (compare your usage to average)

---

## Implementation Timeline

- **Week 1**: Implement Phase 1 (event capture in server.ts)
- **Week 2**: Implement Phase 2 (AnalyticsService + D1 storage)
- **Week 3**: Implement Phase 3 (daily aggregation cron)
- **Week 4**: Implement Phase 4 (analytics dashboard resource)
- **Week 5**: Analysis and optimization based on initial data

---

## Success Metrics

After 30 days of analytics:

1. ✅ Identify 5+ tools with <0.1% usage (candidates for removal from default)
2. ✅ Identify top 10 tool sequences (workflow optimization opportunities)
3. ✅ Reduce context window bloat by 20% (disable rarely-used tools by default)
4. ✅ Improve average tool success rate by 10% (fix high-error tools)
5. ✅ Optimize FREE_TIER_TOOLS based on actual usage data

---

**Next Steps**: Approve plan, then implement Phase 1 (event capture).
