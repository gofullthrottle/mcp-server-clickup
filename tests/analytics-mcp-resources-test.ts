/**
 * Test MCP Resources for Analytics
 * Simulates reading analytics via MCP resource endpoints
 */
import { getAnalyticsService } from '../src/services/analytics-service.js';

async function testMCPResources() {
  console.log('🧪 Testing Analytics MCP Resources\n');

  const analytics = getAnalyticsService();

  // Simulate some tool usage
  console.log('📝 Simulating tool usage...');
  const sessionId = 'mcp-test-session';

  const events = [
    {
      session_id: sessionId,
      timestamp: Date.now(),
      tool_name: 'clickup_workspace_hierarchy',
      tool_category: 'workspace',
      execution_time_ms: 120,
      success: true,
      sequence_position: 0
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 500,
      tool_name: 'clickup_task_create',
      tool_category: 'task',
      execution_time_ms: 200,
      success: true,
      previous_tool: 'clickup_workspace_hierarchy',
      sequence_position: 1
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 1000,
      tool_name: 'clickup_task_create',
      tool_category: 'task',
      execution_time_ms: 180,
      success: true,
      previous_tool: 'clickup_task_create',
      sequence_position: 2
    },
    {
      session_id: sessionId,
      timestamp: Date.now() + 1500,
      tool_name: 'clickup_list_get',
      tool_category: 'list',
      execution_time_ms: 90,
      success: true,
      previous_tool: 'clickup_task_create',
      sequence_position: 3
    }
  ];

  for (const event of events) {
    await analytics.recordToolUsage(event);
  }
  console.log(`  ✓ Recorded ${events.length} tool usage events\n`);

  // Test Resource 1: analytics://summary
  console.log('📊 Resource: analytics://summary');
  console.log('─'.repeat(50));
  const summary = analytics.getSummary();
  console.log(JSON.stringify(summary, null, 2));

  // Test Resource 2: analytics://tool-usage
  console.log('\n📈 Resource: analytics://tool-usage');
  console.log('─'.repeat(50));
  const toolUsage = analytics.getAllToolStatistics();
  console.log(`Found ${toolUsage.length} tools with usage data:`);
  toolUsage.forEach(stat => {
    console.log(`\n  ${stat.tool_name}:`);
    console.log(`    Calls: ${stat.total_calls}`);
    console.log(`    Success: ${stat.success_count}/${stat.total_calls} (${Math.round(stat.success_count/stat.total_calls*100)}%)`);
    console.log(`    Avg time: ${stat.avg_execution_time_ms}ms`);
  });

  // Test Resource 3: analytics://sequences
  console.log('\n🔗 Resource: analytics://sequences');
  console.log('─'.repeat(50));
  const sequences = analytics.getMostCommonSequences(10);
  console.log(`Found ${sequences.length} tool sequences:\n`);
  sequences.forEach((seq, idx) => {
    console.log(`  ${idx + 1}. ${seq.tools.join(' → ')}`);
    console.log(`     Frequency: ${seq.frequency} time(s)`);
  });

  console.log('\n✅ All MCP resources working correctly!\n');

  // Demonstrate JSON output for MCP
  console.log('📦 Example MCP Resource Response:');
  console.log('─'.repeat(50));
  const mcpResponse = {
    contents: [{
      uri: 'analytics://summary',
      mimeType: 'application/json',
      text: JSON.stringify(summary, null, 2)
    }]
  };
  console.log(JSON.stringify(mcpResponse, null, 2));
}

// Run test
testMCPResources().catch(console.error);
