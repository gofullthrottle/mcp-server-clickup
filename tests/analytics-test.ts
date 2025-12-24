/**
 * Simple test for analytics service
 */
import { AnalyticsService, ToolUsageEvent } from '../src/services/analytics-service.js';

async function testAnalytics() {
  console.log('🧪 Testing Analytics Service\n');

  const analytics = new AnalyticsService(true);

  // Simulate tool usage sequence
  const sessionId = 'test-session-123';
  const events: ToolUsageEvent[] = [
    {
      session_id: sessionId,
      timestamp: Date.now(),
      tool_name: 'get_workspace_hierarchy',
      tool_category: 'workspace',
      execution_time_ms: 150,
      success: true,
      sequence_position: 0
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 1000,
      tool_name: 'create_task',
      tool_category: 'task',
      execution_time_ms: 250,
      success: true,
      previous_tool: 'get_workspace_hierarchy',
      sequence_position: 1
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 2000,
      tool_name: 'add_tag_to_task',
      tool_category: 'tag',
      execution_time_ms: 100,
      success: true,
      previous_tool: 'create_task',
      sequence_position: 2
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 3000,
      tool_name: 'create_task',
      tool_category: 'task',
      execution_time_ms: 300,
      success: false,
      error_code: 'ValidationError',
      error_message: 'Missing required field: list_id',
      previous_tool: 'add_tag_to_task',
      sequence_position: 3
    }
  ];

  // Record all events
  console.log('📝 Recording tool usage events...');
  for (const event of events) {
    await analytics.recordToolUsage(event);
    console.log(`  ✓ Recorded: ${event.tool_name} (${event.success ? 'success' : 'failed'})`);
  }

  console.log('\n📊 Analytics Summary:');
  const summary = analytics.getSummary();
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n📈 Tool Statistics:');
  const stats = analytics.getAllToolStatistics();
  stats.forEach(stat => {
    console.log(`\n  ${stat.tool_name}:`);
    console.log(`    Total calls: ${stat.total_calls}`);
    console.log(`    Success rate: ${stat.success_count}/${stat.total_calls}`);
    console.log(`    Avg time: ${stat.avg_execution_time_ms}ms`);
    if (stat.commonly_follows.length > 0) {
      console.log(`    Often follows: ${stat.commonly_follows.join(', ')}`);
    }
    if (stat.commonly_precedes.length > 0) {
      console.log(`    Often precedes: ${stat.commonly_precedes.join(', ')}`);
    }
  });

  console.log('\n🔗 Tool Sequences:');
  const sequences = analytics.getMostCommonSequences(5);
  sequences.forEach(seq => {
    console.log(`\n  Pattern: ${seq.tools.join(' → ')}`);
    console.log(`    Frequency: ${seq.frequency}`);
  });

  console.log('\n✅ Analytics test completed successfully!\n');
}

// Run test
testAnalytics().catch(console.error);
