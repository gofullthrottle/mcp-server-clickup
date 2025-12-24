# Tool Documentation: `create_task_comment`

**Category**: Comment Management

**Description**: Adds a new comment to a task. Supports markdown formatting, @mentions, threaded replies, and file attachments. Essential for task communication and collaboration.

**Use Cases**:
- Provide status updates on task progress
- Ask questions or request clarification
- Document decisions and rationale
- Notify team members with @mentions

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to comment on (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to comment on. WARNING: May match multiple tasks if not scoped",
    "example": "Implement user authentication"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list containing the task (used with taskName for disambiguation)",
    "example": "Sprint Backlog"
  },
  "commentText": {
    "type": "string",
    "required": true,
    "description": "Comment content (markdown supported, @mentions supported). Max length: 5000 characters",
    "example": "Great progress! @john can you review? See [docs](https://example.com)"
  },
  "assignee": {
    "type": "number",
    "required": false,
    "description": "User ID to assign (comment will notify this user)",
    "example": 12345678
  },
  "notifyAll": {
    "type": "boolean",
    "required": false,
    "description": "Notify all task assignees (default: false)",
    "example": true
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name | `"Implement authentication"` |
| listName | string | No | List name (for disambiguation) | `"Sprint Backlog"` |
| commentText | string | **Yes** | Comment content (markdown, @mentions) | `"Great work! @john review?"` |
| assignee | number | No | User ID to notify | `12345678` |
| notifyAll | boolean | No | Notify all assignees (default: false) | `true` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_123456",
      "comment_text": "Great progress! @john can you review?",
      "user": {
        "id": 12345678,
        "username": "John Doe",
        "email": "john@example.com"
      },
      "date": "1705575000000",
      "resolved": false,
      "task": {
        "id": "86fpd7vgc",
        "name": "🚀 Implement user authentication"
      }
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "create_task_comment",
    "execution_time_ms": 150,
    "rate_limit": {
      "remaining": 98,
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
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_123456",
      "comment_text": "Great progress! @john can you review?",
      "user": {"id": 12345678, "username": "John Doe"},
      "date": "1705575000000",
      "resolved": false
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "create_task_comment",
    "execution_time_ms": 150,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "m3n4o5p6",
      "tool_name": "create_task_comment",
      "timing": {
        "total_ms": 150,
        "api_calls": [
          {
            "method": "POST",
            "path": "/task/{id}/comment",
            "duration": 150,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 1,
        "total_api_time_ms": 150,
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
| data.success | boolean | Confirms comment was created |
| data.message | string | Human-readable confirmation message |
| data.comment.id | string | Comment ID |
| data.comment.comment_text | string | Comment content (as submitted) |
| data.comment.user | object | User who created comment |
| data.comment.date | string | Unix timestamp (milliseconds) |
| data.comment.resolved | boolean | Always `false` for new comments |
| data.comment.task | object | Task the comment belongs to |
| metadata.execution_time_ms | number | Comment creation time |
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

**2. VALIDATION (Missing Comment Text)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "commentText is required",
    "type": "VALIDATION",
    "suggested_action": "Provide the comment text in the commentText parameter."
  }
}
```

**3. VALIDATION (Comment Too Long)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Comment text exceeds maximum length of 5000 characters",
    "type": "VALIDATION",
    "details": {
      "max_length": 5000,
      "provided_length": 5234
    },
    "suggested_action": "Shorten the comment text to 5000 characters or less."
  }
}
```

**4. NOT_FOUND (Task Not Found)**
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

**5. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to comment on this task",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to add comments to this task."
  }
}
```

**6. RATE_LIMIT**
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
| VALIDATION | 400 | No | Missing or invalid parameters |
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
- Batch multiple comments with delay if adding to many tasks
- Consider using task description updates for lengthy content
- Use @mentions sparingly to avoid notification fatigue

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up task by name (only if taskName provided) |
| POST | `/task/{task_id}/comment` | Create comment on task |

**Required Permissions**:
- **Task Access**: API key must have read access to the task
- **Comment Create**: Permission to add comments to tasks

**API Documentation**:
- [ClickUp API Reference - Create Task Comment](https://clickup.com/api/clickupreference/operation/CreateTaskComment)

---

### Examples

#### Example 1: Simple Comment by Task ID
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "commentText": "This looks great! Let's merge it."
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_123456",
      "comment_text": "This looks great! Let's merge it.",
      "user": {"id": 12345678, "username": "John Doe"},
      "date": "1705575000000",
      "resolved": false
    }
  }
}
```

#### Example 2: Comment with @Mention
```javascript
// Input
{
  "taskId": "DEV-1234",
  "commentText": "@john can you review the authentication flow? Thanks!"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_789012",
      "comment_text": "@john can you review the authentication flow? Thanks!",
      "user": {"username": "Developer"}
    }
  }
}
```

#### Example 3: Comment with Markdown Formatting
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "commentText": "**Status Update:**\n\n✅ Authentication implemented\n✅ Tests passing\n⏳ Waiting for code review\n\nSee [PR #123](https://github.com/org/repo/pull/123)"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_345678",
      "comment_text": "**Status Update:**\n\n✅ Authentication implemented...",
      "date": "1705575000000"
    }
  }
}
```

#### Example 4: Comment with Assignee Notification
```javascript
// Input
{
  "taskName": "Implement authentication",
  "listName": "Sprint Backlog",
  "commentText": "Ready for review!",
  "assignee": 12345678,
  "notifyAll": true
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Comment created successfully",
    "comment": {
      "id": "comment_901234",
      "comment_text": "Ready for review!",
      "task": {
        "id": "86fpd7vgc",
        "name": "Implement user authentication"
      }
    }
  }
}
```

#### Example 5: Error - Comment Too Long
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "commentText": "A" * 5001  // 5001 characters
}

// Output (Error)
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Comment text exceeds maximum length of 5000 characters",
    "type": "VALIDATION",
    "details": {
      "max_length": 5000,
      "provided_length": 5001
    },
    "suggested_action": "Shorten the comment text to 5000 characters or less."
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Simple comment
response = client.call_tool(
    "create_task_comment",
    {
        "taskId": "86fpd7vgc",
        "commentText": "This looks great! Let's merge it."
    }
)

if response["success"]:
    comment = response["data"]["comment"]
    print(f"Comment created: {comment['id']}")
    print(f"Content: {comment['comment_text']}")
else:
    print(f"Error: {response['error']['message']}")

# Comment with @mention
response = client.call_tool(
    "create_task_comment",
    {
        "taskId": "DEV-1234",
        "commentText": "@john can you review this? Thanks!"
    }
)

# Status update with markdown
status_comment = """
**Status Update:**

✅ Authentication implemented
✅ Tests passing
⏳ Waiting for code review

See [PR #123](https://github.com/org/repo/pull/123)
"""

response = client.call_tool(
    "create_task_comment",
    {
        "taskId": "86fpd7vgc",
        "commentText": status_comment
    }
)

# Comment with notification
response = client.call_tool(
    "create_task_comment",
    {
        "taskId": "86fpd7vgc",
        "commentText": "Ready for review!",
        "notifyAll": True
    }
)
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Create comment
const addComment = async (taskId: string, text: string) => {
  const response = await client.callTool('create_task_comment', {
    taskId,
    commentText: text
  });

  if (response.success) {
    const comment = response.data.comment;
    console.log(`✓ Comment added: ${comment.id}`);
    return comment;
  } else {
    console.error(`✗ Failed: ${response.error.message}`);
    throw new Error(response.error.message);
  }
};

// Add status update
const addStatusUpdate = async (taskId: string, status: string) => {
  const text = `**Status Update:** ${status}`;
  return await addComment(taskId, text);
};

// Add review request
const requestReview = async (taskId: string, reviewer: string) => {
  const text = `@${reviewer} can you review this? Thanks!`;
  return await addComment(taskId, text);
};

// Add comment with notification
const addCommentWithNotify = async (
  taskId: string,
  text: string,
  notifyAll: boolean = false
) => {
  const response = await client.callTool('create_task_comment', {
    taskId,
    commentText: text,
    notifyAll
  });

  return response.success ? response.data.comment : null;
};

// Workflow: Add progress comment
const updateProgress = async (taskId: string, progress: number) => {
  const bars = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
  const text = `Progress update: ${bars} ${progress}%`;
  return await addComment(taskId, text);
};

await addComment('86fpd7vgc', 'Great work!');
await addStatusUpdate('DEV-1234', 'Tests passing ✅');
await requestReview('86fpd7vgc', 'john');
await updateProgress('DEV-1234', 75);
```

---

### Related Tools

- **get_task_comments**: Retrieve all comments on a task
- **get_task**: View task details including comment count
- **update_task**: Update task based on comment feedback
- **create_task**: Create new task (can include initial comment)

---

### Best Practices

**DO:**
- ✅ Use `taskId` for fastest comment creation
- ✅ Use markdown for formatting (bold, lists, links)
- ✅ Use @mentions to notify specific users
- ✅ Keep comments focused and actionable
- ✅ Include links to related resources

**DON'T:**
- ❌ Exceed 5000 character limit
- ❌ Use comments for task property updates (use update_task)
- ❌ Overuse @mentions (causes notification fatigue)
- ❌ Post multiple rapid comments (combine into one)
- ❌ Include sensitive data in comments (use secure channels)

---

### Markdown Support

**Supported Markdown Features**:
```markdown
**Bold** *Italic* ~~Strikethrough~~
# Heading 1
## Heading 2
- Bulleted list
1. Numbered list
[Link text](https://example.com)
`Inline code`
@username mentions
```

**Not Supported**:
- Code blocks (use inline code instead)
- Tables
- Images (use file attachments instead)
- HTML tags

---

### Performance Tips

**Optimization Strategies**:
1. **Use Task ID**: Avoid lookup by name
2. **Batch Comments**: Combine multiple updates into one comment
3. **Markdown Formatting**: Use for clarity without extra requests
4. **@Mentions**: Target specific users, avoid notifyAll when possible

**Typical Response Times**:
- Simple comment: ~100-150ms
- With markdown: ~120-170ms
- With @mentions: ~130-180ms

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added custom ID detection and markdown support |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
