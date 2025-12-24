# Tool Documentation: `get_task_comments`

**Category**: Comment Management

**Description**: Retrieves all comments associated with a task, including threaded replies, reactions, and comment metadata. Supports pagination for tasks with many comments.

**Use Cases**:
- Review discussion history on a task
- Extract feedback and decisions from comments
- Audit trail for task communication
- Export comment threads for documentation

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to get comments from (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to get comments from. WARNING: May match multiple tasks if not scoped",
    "example": "Implement user authentication"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list containing the task (used with taskName for disambiguation)",
    "example": "Sprint Backlog"
  },
  "start": {
    "type": "number",
    "required": false,
    "description": "Pagination start position (default: 0)",
    "example": 0
  },
  "start_id": {
    "type": "string",
    "required": false,
    "description": "Comment ID to start pagination from",
    "example": "comment_123456"
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name | `"Implement authentication"` |
| listName | string | No | List name (for disambiguation) | `"Sprint Backlog"` |
| start | number | No | Pagination start (default: 0) | `0` |
| start_id | string | No | Start from specific comment ID | `"comment_123456"` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_123456",
        "comment_text": "This looks great! Let's merge it.",
        "user": {
          "id": 12345678,
          "username": "John Doe",
          "email": "john@example.com"
        },
        "date": "1705575000000",
        "resolved": false,
        "thread_count": 2,
        "reactions": [
          {
            "reaction": "👍",
            "count": 3
          }
        ]
      },
      {
        "id": "comment_789012",
        "comment_text": "Can we add tests for edge cases?",
        "user": {
          "id": 87654321,
          "username": "Jane Smith",
          "email": "jane@example.com"
        },
        "date": "1705575600000",
        "resolved": true,
        "thread_count": 0,
        "reactions": []
      }
    ],
    "count": 2
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "get_task_comments",
    "execution_time_ms": 120,
    "rate_limit": {
      "remaining": 99,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response with Debug**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_123456",
        "comment_text": "This looks great! Let's merge it.",
        "user": {
          "id": 12345678,
          "username": "John Doe"
        },
        "date": "1705575000000",
        "resolved": false,
        "thread_count": 2
      }
    ],
    "count": 1
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "get_task_comments",
    "execution_time_ms": 120,
    "rate_limit": {
      "remaining": 99,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "i9j0k1l2",
      "tool_name": "get_task_comments",
      "timing": {
        "total_ms": 120,
        "api_calls": [
          {
            "method": "GET",
            "path": "/task/{id}/comment",
            "duration": 120,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 1,
        "total_api_time_ms": 120,
        "success_count": 1,
        "error_count": 0
      }
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data.comments | array | Array of comment objects |
| data.count | number | Number of comments returned |
| data.comments[].id | string | Comment ID |
| data.comments[].comment_text | string | Comment content (markdown supported) |
| data.comments[].user | object | User who created comment |
| data.comments[].date | string | Unix timestamp (milliseconds) |
| data.comments[].resolved | boolean | Whether comment thread is resolved |
| data.comments[].thread_count | number | Number of threaded replies |
| data.comments[].reactions | array | Emoji reactions with counts |
| metadata.execution_time_ms | number | Query execution time |
| metadata.rate_limit | object | Current rate limit status |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION (Missing Task Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either taskId or taskName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a taskId or taskName to identify the task."
  }
}
```

**2. NOT_FOUND (Task Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Implement authentication' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task name is correct. Use get_workspace_tasks to search for the task."
  }
}
```

**3. NOT_FOUND (No Comments)**
```json
{
  "success": true,
  "data": {
    "comments": [],
    "count": 0
  },
  "metadata": {
    "tool_name": "get_task_comments",
    "message": "Task has no comments"
  }
}
```

**4. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to view comments on this task",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to view comments on this task."
  }
}
```

**5. RATE_LIMIT**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "type": "RATE_LIMIT",
    "retry_after": 30,
    "suggested_action": "Wait 30 seconds before retrying."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters |
| NOT_FOUND | 404 | No | Task does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: 1-2 call(s) per execution (1 if taskId provided, 2 if taskName requires lookup)
- **Estimated Impact**: ~1-2% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit

**Recommendations**:
- Use `taskId` instead of `taskName` to reduce API calls
- Use pagination for tasks with many comments (50+ comments)
- Cache comments when appropriate
- Combine with task retrieval when possible

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up task by name (only if taskName provided) |
| GET | `/task/{task_id}/comment` | Retrieve task comments |

**Required Permissions**:
- **Task Access**: API key must have read access to the task
- **Comment Read**: Permission to view comments on tasks

**API Documentation**:
- [ClickUp API Reference - Get Task Comments](https://clickup.com/api/clickupreference/operation/GetTaskComments)

---

### Examples

#### Example 1: Get All Comments by Task ID
```javascript
// Input
{
  "taskId": "86fpd7vgc"
}

// Output
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_123456",
        "comment_text": "This looks great! Let's merge it.",
        "user": {"id": 12345678, "username": "John Doe"},
        "date": "1705575000000",
        "resolved": false,
        "thread_count": 2,
        "reactions": [{"reaction": "👍", "count": 3}]
      },
      {
        "id": "comment_789012",
        "comment_text": "Can we add tests for edge cases?",
        "user": {"id": 87654321, "username": "Jane Smith"},
        "date": "1705575600000",
        "resolved": true,
        "thread_count": 0
      }
    ],
    "count": 2
  }
}
```

#### Example 2: Get Comments by Custom Task ID
```javascript
// Input
{
  "taskId": "DEV-1234"
}

// Output
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_456789",
        "comment_text": "Reviewed and approved ✓",
        "user": {"username": "Tech Lead"},
        "date": "1705576200000",
        "resolved": false
      }
    ],
    "count": 1
  }
}
```

#### Example 3: Get Comments with Pagination
```javascript
// Input (First page)
{
  "taskId": "86fpd7vgc",
  "start": 0
}

// Output
{
  "success": true,
  "data": {
    "comments": [
      /* First 25 comments (default page size) */
    ],
    "count": 25
  }
}

// Input (Second page)
{
  "taskId": "86fpd7vgc",
  "start": 25
}
```

#### Example 4: Get Comments by Task Name
```javascript
// Input
{
  "taskName": "Implement authentication",
  "listName": "Sprint Backlog"
}

// Output
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_111222",
        "comment_text": "Started working on OAuth integration",
        "user": {"username": "Developer"},
        "date": "1705577000000"
      }
    ],
    "count": 1
  }
}
```

#### Example 5: Task with No Comments
```javascript
// Input
{
  "taskId": "abc123xyz"
}

// Output
{
  "success": true,
  "data": {
    "comments": [],
    "count": 0
  },
  "metadata": {
    "tool_name": "get_task_comments",
    "message": "Task has no comments"
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client
from datetime import datetime

client = Client()

# Get all comments for a task
response = client.call_tool(
    "get_task_comments",
    {"taskId": "86fpd7vgc"}
)

if response["success"]:
    comments = response["data"]["comments"]
    count = response["data"]["count"]

    print(f"Found {count} comments:")
    for comment in comments:
        user = comment["user"]["username"]
        text = comment["comment_text"]
        date = datetime.fromtimestamp(int(comment["date"]) / 1000)
        resolved = "✓ Resolved" if comment["resolved"] else ""
        threads = f" ({comment['thread_count']} replies)" if comment["thread_count"] > 0 else ""

        print(f"\n{date.strftime('%Y-%m-%d %H:%M')} - {user}{resolved}")
        print(f"  {text}{threads}")

        # Show reactions if any
        if comment.get("reactions"):
            reactions = " ".join([f"{r['reaction']}x{r['count']}" for r in comment["reactions"]])
            print(f"  Reactions: {reactions}")

    # Check execution time
    exec_time = response["metadata"]["execution_time_ms"]
    print(f"\nQuery took {exec_time}ms")
else:
    print(f"Error: {response['error']['message']}")

# Get comments with pagination
def get_all_comments(task_id):
    all_comments = []
    start = 0
    page_size = 25

    while True:
        response = client.call_tool("get_task_comments", {
            "taskId": task_id,
            "start": start
        })

        if not response["success"]:
            break

        comments = response["data"]["comments"]
        if not comments:
            break

        all_comments.extend(comments)
        start += page_size

        # Stop if we got fewer than page size (last page)
        if len(comments) < page_size:
            break

    return all_comments
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Get comments for a task
const getComments = async (taskId: string) => {
  const response = await client.callTool('get_task_comments', { taskId });

  if (response.success) {
    const comments = response.data.comments;
    console.log(`Found ${response.data.count} comments`);

    comments.forEach(comment => {
      const date = new Date(parseInt(comment.date));
      const resolved = comment.resolved ? ' ✓' : '';
      console.log(`\n[${date.toLocaleString()}] ${comment.user.username}${resolved}`);
      console.log(`  ${comment.comment_text}`);

      if (comment.thread_count > 0) {
        console.log(`  (${comment.thread_count} replies)`);
      }
    });

    return comments;
  } else {
    console.error(`Failed: ${response.error.message}`);
    return [];
  }
};

// Get all comments with pagination
const getAllComments = async (taskId: string): Promise<any[]> => {
  let allComments: any[] = [];
  let start = 0;
  const pageSize = 25;

  while (true) {
    const response = await client.callTool('get_task_comments', {
      taskId,
      start
    });

    if (!response.success || response.data.comments.length === 0) {
      break;
    }

    const comments = response.data.comments;
    allComments = allComments.concat(comments);

    // Last page?
    if (comments.length < pageSize) {
      break;
    }

    start += pageSize;
  }

  return allComments;
};

// Filter resolved vs unresolved comments
const getUnresolvedComments = async (taskId: string) => {
  const response = await client.callTool('get_task_comments', { taskId });

  if (response.success) {
    return response.data.comments.filter(c => !c.resolved);
  }
  return [];
};

await getComments('86fpd7vgc');
await getAllComments('DEV-1234');
await getUnresolvedComments('86fpd7vgc');
```

---

### Related Tools

- **create_task_comment**: Add a new comment to a task
- **get_task**: Retrieve task details with comment count
- **update_task**: Update task based on comment feedback
- **get_workspace_tasks**: Search tasks to find tasks with comments

---

### Best Practices

**DO:**
- ✅ Use `taskId` for fastest and most reliable retrieval
- ✅ Use pagination for tasks with 50+ comments
- ✅ Check `thread_count` to identify discussion threads
- ✅ Filter by `resolved` status to find open discussions
- ✅ Cache comments when appropriate

**DON'T:**
- ❌ Retrieve comments without pagination on high-activity tasks
- ❌ Use taskName without listName scoping
- ❌ Ignore resolved status when looking for actionable feedback
- ❌ Poll for new comments frequently (use webhooks instead)

---

### Performance Tips

**Optimization Strategies**:
1. **Use Task ID**: Avoid lookup by name
2. **Pagination**: Use `start` parameter for tasks with many comments
3. **Caching**: Cache comment data when appropriate
4. **Batch Requests**: If getting comments for multiple tasks, space out requests

**Typical Response Times**:
- Small tasks (< 10 comments): ~80-120ms
- Medium tasks (10-50 comments): ~120-180ms
- Large tasks (50+ comments): ~180-300ms per page

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added pagination and custom ID detection |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
