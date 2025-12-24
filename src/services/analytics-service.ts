/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * Analytics service for tracking tool usage patterns
 * Phase 1: In-memory event capture
 */

export interface ToolUsageEvent {
  // Identity
  session_id: string;
  timestamp: number;

  // Tool Info
  tool_name: string;
  tool_category: string;

  // Execution Metrics
  execution_time_ms: number;
  success: boolean;
  error_code?: string;
  error_message?: string;

  // API Metrics (from BaseClickUpService)
  api_calls_made?: number;
  api_time_ms?: number;
  rate_limit_hit?: boolean;
  retry_count?: number;

  // Context
  previous_tool?: string;
  sequence_position: number;
}

export interface ToolSequencePattern {
  pattern_id: string;
  tools: string[];
  frequency: number;
  last_seen: number;
}

export interface ToolStatistics {
  tool_name: string;
  total_calls: number;
  success_count: number;
  error_count: number;
  avg_execution_time_ms: number;
  commonly_follows: string[];
  commonly_precedes: string[];
}

/**
 * Session tracking for tool sequence detection
 */
interface SessionHistory {
  tool: string;
  timestamp: number;
}

/**
 * Analytics Service - Phase 1 (In-Memory)
 *
 * This is a lightweight implementation for capturing tool usage events.
 * Phase 2 will add CloudFlare D1/R2 persistence.
 */
export class AnalyticsService {
  private enabled: boolean;
  private events: ToolUsageEvent[] = [];
  private sessionHistory = new Map<string, SessionHistory[]>();
  private sequences = new Map<string, ToolSequencePattern>();
  private maxEventsInMemory = 1000; // Prevent memory bloat

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Record a tool usage event
   */
  async recordToolUsage(event: ToolUsageEvent): Promise<void> {
    if (!this.enabled) return;

    try {
      // Store event (with circular buffer to prevent memory issues)
      this.events.push(event);
      if (this.events.length > this.maxEventsInMemory) {
        this.events.shift(); // Remove oldest
      }

      // Update session history
      const history = this.sessionHistory.get(event.session_id) || [];
      history.push({
        tool: event.tool_name,
        timestamp: event.timestamp
      });
      this.sessionHistory.set(event.session_id, history);

      // Detect sequence patterns (only if we have 2+ tools in sequence)
      if (history.length >= 2) {
        await this.updateSequencePattern(event.session_id, history);
      }
    } catch (error) {
      // Analytics should never break the main flow
      console.error('Analytics error:', error);
    }
  }

  /**
   * Update sequence pattern tracking
   */
  private async updateSequencePattern(sessionId: string, history: SessionHistory[]): Promise<void> {
    // Get last 2-5 tools as a pattern
    const recentTools = history.slice(-5).map(h => h.tool);
    const patternId = this.hashSequence(recentTools);

    const existing = this.sequences.get(patternId);
    if (existing) {
      existing.frequency++;
      existing.last_seen = Date.now();
    } else {
      this.sequences.set(patternId, {
        pattern_id: patternId,
        tools: recentTools,
        frequency: 1,
        last_seen: Date.now()
      });
    }
  }

  /**
   * Hash a tool sequence for pattern detection
   */
  private hashSequence(tools: string[]): string {
    return tools.join('→');
  }

  /**
   * Get statistics for a specific tool
   */
  getToolStatistics(toolName: string): ToolStatistics {
    const toolEvents = this.events.filter(e => e.tool_name === toolName);

    if (toolEvents.length === 0) {
      return {
        tool_name: toolName,
        total_calls: 0,
        success_count: 0,
        error_count: 0,
        avg_execution_time_ms: 0,
        commonly_follows: [],
        commonly_precedes: []
      };
    }

    const successCount = toolEvents.filter(e => e.success).length;
    const avgTime = toolEvents.reduce((sum, e) => sum + e.execution_time_ms, 0) / toolEvents.length;

    // Find commonly preceding/following tools
    const precedingTools = new Map<string, number>();
    const followingTools = new Map<string, number>();

    toolEvents.forEach(event => {
      if (event.previous_tool) {
        precedingTools.set(event.previous_tool, (precedingTools.get(event.previous_tool) || 0) + 1);
      }

      // Find tool that came after this one
      const nextEvent = this.events.find(e =>
        e.session_id === event.session_id &&
        e.timestamp > event.timestamp &&
        e.sequence_position === event.sequence_position + 1
      );
      if (nextEvent) {
        followingTools.set(nextEvent.tool_name, (followingTools.get(nextEvent.tool_name) || 0) + 1);
      }
    });

    return {
      tool_name: toolName,
      total_calls: toolEvents.length,
      success_count: successCount,
      error_count: toolEvents.length - successCount,
      avg_execution_time_ms: Math.round(avgTime),
      commonly_follows: this.topN(precedingTools, 3),
      commonly_precedes: this.topN(followingTools, 3)
    };
  }

  /**
   * Get most common tool sequences
   */
  getMostCommonSequences(limit: number = 10): ToolSequencePattern[] {
    return Array.from(this.sequences.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get all tool statistics
   */
  getAllToolStatistics(): ToolStatistics[] {
    const toolNames = new Set(this.events.map(e => e.tool_name));
    return Array.from(toolNames).map(name => this.getToolStatistics(name))
      .sort((a, b) => b.total_calls - a.total_calls);
  }

  /**
   * Get summary analytics
   */
  getSummary() {
    const totalCalls = this.events.length;
    const uniqueTools = new Set(this.events.map(e => e.tool_name)).size;
    const successRate = this.events.filter(e => e.success).length / totalCalls;
    const avgExecutionTime = this.events.reduce((sum, e) => sum + e.execution_time_ms, 0) / totalCalls;

    return {
      total_calls: totalCalls,
      unique_tools_used: uniqueTools,
      success_rate: Math.round(successRate * 100) / 100,
      avg_execution_time_ms: Math.round(avgExecutionTime),
      total_sequences: this.sequences.size,
      active_sessions: this.sessionHistory.size
    };
  }

  /**
   * Helper: Get top N items from a map
   */
  private topN(map: Map<string, number>, n: number): string[] {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);
  }

  /**
   * Clear old sessions (garbage collection)
   */
  clearOldSessions(maxAgeMs: number = 3600000): void {
    const cutoff = Date.now() - maxAgeMs;
    const entries = Array.from(this.sessionHistory.entries());
    for (const [sessionId, history] of entries) {
      const lastActivity = history[history.length - 1]?.timestamp || 0;
      if (lastActivity < cutoff) {
        this.sessionHistory.delete(sessionId);
      }
    }
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

/**
 * Get or create analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    const enabled = process.env.ENABLE_ANALYTICS !== 'false'; // Enabled by default
    analyticsService = new AnalyticsService(enabled);
  }
  return analyticsService;
}
