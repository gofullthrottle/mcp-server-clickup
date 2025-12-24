# clickup_space_toggle_feature

## Overview

Enables or disables a specific feature in a space.

**Category**: Space Management - Feature Configuration

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | ID of the space |
| `feature` | string (enum) | **Yes** | Feature to toggle |
| `enabled` | boolean | **Yes** | Enable or disable the feature |

### Available Features

- `due_dates` - Due date tracking
- `time_tracking` - Time tracking on tasks
- `tags` - Task tagging
- `time_estimates` - Task time estimates
- `checklists` - Task checklists
- `custom_fields` - Custom fields on tasks
- `remap_dependencies` - Remap task dependencies
- `dependency_warning` - Dependency warnings
- `portfolios` - Portfolio management

---

## Success Response

```json
{
  "id": "90123456",
  "name": "Engineering",
  "feature": "time_tracking",
  "enabled": true,
  "message": "Feature \"time_tracking\" enabled in space \"Engineering\""
}
```

---

## Integration Examples

### Python Example
```python
# Enable time tracking
result = await mcp_server.call_tool(
    "clickup_space_toggle_feature",
    {
        "space_id": "90123456",
        "feature": "time_tracking",
        "enabled": True
    }
)

print(f"✅ {result['message']}")

# Disable portfolios
result = await mcp_server.call_tool(
    "clickup_space_toggle_feature",
    {
        "space_id": "90123456",
        "feature": "portfolios",
        "enabled": False
    }
)
```

### TypeScript Example (Batch Feature Configuration)
```typescript
// Enable multiple features at once
const features = [
  "time_tracking",
  "custom_fields",
  "tags",
  "checklists"
];

for (const feature of features) {
  await mcpServer.callTool(
    "clickup_space_toggle_feature",
    {
      space_id: "90123456",
      feature,
      enabled: true
    }
  );
  console.log(`✅ Enabled ${feature}`);
}
```

---

## Best Practices

1. **CHECK PLAN LIMITS**: Some features require paid plans
2. **BATCH OPERATIONS**: Toggle multiple features sequentially
3. **VERIFY STATUS**: Use `clickup_space_get` to verify feature status
4. **TEAM COMMUNICATION**: Notify team when disabling features

---

## Related Tools

- **clickup_space_get**: Get current feature status
- **clickup_space_update**: Update multiple features at once

---

**Last Updated**: 2025-10-30
