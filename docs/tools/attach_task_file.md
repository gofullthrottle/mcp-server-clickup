# attach_task_file

**Category**: Task Management - File Attachments

Attaches a file to a ClickUp task with automatic method selection based on file source and size. Supports base64-encoded data, web URLs, local file paths, and automatic chunked uploads for large files (>10MB).

---

## Use Cases

### 1. **Upload Small Files from Base64 Data**
Attach images, documents, or other files up to 10MB directly using base64-encoded content. Perfect for files generated in memory or received from APIs.

### 2. **Attach Files from Web URLs**
Reference publicly accessible files or files behind authentication. The tool downloads the file and attaches it to the task, with optional authorization headers for private resources.

### 3. **Upload Local Files**
Attach files from your local filesystem using absolute file paths. Automatically handles file reading and supports both small and large files with automatic chunking.

### 4. **Handle Large File Uploads**
Files larger than 10MB are automatically chunked into 5MB segments and uploaded progressively with session management and progress tracking.

---

## Input Parameters

```json
{
  "taskId": "86fpd7vgc",
  "file_name": "report.pdf",
  "file_data": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL..."
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Conditional* | ID of the task (9 chars or custom like "DEV-1234"). **Preferred method**. |
| `taskName` | string | Conditional* | Name of task to attach file to. Searches across lists unless `listName` provided. |
| `listName` | string | Optional | Name of list containing the task. Improves performance and reduces ambiguity when using `taskName`. |
| `file_name` | string | Conditional** | Name of file including extension (e.g., "report.pdf"). **Required when using `file_data`**. Optional with `file_url` (auto-detected from URL/path). |
| `file_data` | string | Conditional*** | Base64-encoded file content **without data URL prefix** (e.g., no "data:image/png;base64,"). Files ≤10MB upload directly; >10MB trigger automatic chunking. |
| `file_url` | string | Conditional*** | **DUAL PURPOSE**: Either a web URL (`http://`/`https://`) to download from, OR an absolute local file path (`/` or drive letter like `C:\`). DO NOT use relative paths. |
| `auth_header` | string | Optional | Authorization header for web URLs (e.g., "Bearer token123"). Ignored for local file paths. |
| `chunk_index` | number | Advanced | For manual chunked uploads: 0-based index of this chunk. Usually not needed (automatic chunking). |
| `chunk_session` | string | Advanced | For manual chunked uploads: Session identifier from previous chunk. Usually not needed (automatic chunking). |
| `chunk_total` | number | Advanced | For manual chunked uploads: Total number of chunks expected. Usually not needed (automatic chunking). |
| `chunk_is_last` | boolean | Advanced | For manual chunked uploads: Whether this is the final chunk. Usually not needed (automatic chunking). |

\* **Task Identification**: Must provide either `taskId` (preferred) OR `taskName` (optionally with `listName`).
\*\* **File Name**: Required when using `file_data`. Optional when using `file_url` (extracted from URL/path if not provided).
\*\*\* **File Source**: Must provide exactly one of: `file_data`, `file_url`, or `chunk_session` (for continuation).

---

## Success Response

### Small File Upload (≤10MB)

```json
{
  "success": true,
  "message": "File \"report.pdf\" successfully attached to task 86fpd7vgc",
  "attachment": {
    "id": "att_123456789",
    "date": "1735948800000",
    "title": "report.pdf",
    "type": 1,
    "source": 2,
    "version": "1",
    "extension": "pdf",
    "thumbnail_small": null,
    "thumbnail_medium": null,
    "thumbnail_large": null,
    "is_folder": null,
    "mimetype": "application/pdf",
    "hidden": false,
    "parent_id": "86fpd7vgc",
    "size": 524288,
    "total_comments": 0,
    "resolved_comments": 0,
    "user": {
      "id": 12345678,
      "username": "john.smith",
      "email": "john@example.com",
      "color": "#7b68ee",
      "initials": "JS",
      "profilePicture": null
    },
    "deleted": false,
    "orientation": null,
    "url": "https://attachments.clickup.com/..."
  }
}
```

### Large File Upload (>10MB) - Chunking Initiated

```json
{
  "success": true,
  "message": "Large file detected. Chunked upload initialized for \"large-video.mp4\" (52428800 bytes)",
  "chunk_session": "chunk_session_1735948800000_abc123xyz",
  "chunks_total": 11,
  "chunk_uploaded": 1,
  "attachment": null,
  "details": {
    "taskId": "86fpd7vgc",
    "fileName": "large-video.mp4",
    "fileSize": 52428800,
    "chunkCount": 11,
    "progress": 9
  }
}
```

### Chunk Upload Progress

```json
{
  "success": true,
  "message": "Chunk 5/11 received",
  "chunk_session": "chunk_session_1735948800000_abc123xyz",
  "chunks_remaining": 6,
  "details": {
    "taskId": "86fpd7vgc",
    "fileName": "large-video.mp4",
    "chunksReceived": 5,
    "progress": 45
  }
}
```

### Final Chunk - Upload Complete

```json
{
  "success": true,
  "message": "File \"large-video.mp4\" successfully attached to task 86fpd7vgc",
  "attachment": {
    "id": "att_987654321",
    "date": "1735949000000",
    "title": "large-video.mp4",
    "type": 1,
    "source": 2,
    "version": "1",
    "extension": "mp4",
    "thumbnail_small": null,
    "thumbnail_medium": null,
    "thumbnail_large": null,
    "is_folder": null,
    "mimetype": "video/mp4",
    "hidden": false,
    "parent_id": "86fpd7vgc",
    "size": 52428800,
    "total_comments": 0,
    "resolved_comments": 0,
    "user": {
      "id": 12345678,
      "username": "john.smith",
      "email": "john@example.com",
      "color": "#7b68ee",
      "initials": "JS",
      "profilePicture": null
    },
    "deleted": false,
    "orientation": null,
    "url": "https://attachments.clickup.com/..."
  }
}
```

### With Debug Logging Enabled

When `ENABLE_DEBUG` environment variable is set, additional diagnostic information is included:

```json
{
  "success": true,
  "message": "File \"report.pdf\" successfully attached to task 86fpd7vgc",
  "attachment": { "...": "..." },
  "debug": {
    "request_id": "req_1735948800123_abc123",
    "timestamp": "2025-01-03T18:00:00.123Z",
    "execution_time_ms": 850,
    "method": "direct_upload",
    "file_size_bytes": 524288,
    "api_calls": [
      {
        "endpoint": "POST /task/86fpd7vgc/attachment",
        "duration_ms": 780,
        "status": 200
      }
    ]
  }
}
```

---

## Error Responses

### 1. VALIDATION - Missing Parameters

**Scenario**: Neither file source provided

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Either file_data, file_url, or session_id must be provided",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Missing file name with base64 data

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "file_name is required when using file_data",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Invalid file_url format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid file_url format: \"./relative/path/file.pdf\". The file_url parameter must be either an absolute file path (starting with / or drive letter) or a web URL (starting with http:// or https://)",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Invalid task identification

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Must provide either taskId or taskName",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 2. NOT_FOUND - Task or File Not Found

**Scenario**: Task doesn't exist

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Task not found",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Local file doesn't exist

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Failed to upload local file: Local file not found: /path/to/missing/file.pdf. Make sure the file exists and the path is absolute.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Upload session expired

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Upload session not found or expired",
    "timestamp": "2025-01-03T18:00:00.123Z",
    "details": "Chunked upload sessions expire after 24 hours of inactivity"
  }
}
```

### 3. AUTH - Permission Denied

**Scenario**: No permission to attach files to task

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to attach files to this task",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Local file permission denied

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "Failed to upload local file: Permission denied accessing: /restricted/file.pdf. Check file permissions.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 4. RATE_LIMIT - Too Many Requests

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 3000,
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 5. FILE_SIZE - File Too Large

**Scenario**: File exceeds ClickUp's maximum size limit

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "File size exceeds maximum allowed size (100MB)",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 6. API_ERROR - ClickUp API Issues

**Scenario**: ClickUp API error during upload

```json
{
  "success": false,
  "error": {
    "type": "API_ERROR",
    "message": "Failed to upload file: ClickUp API returned error: Internal server error",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Network error downloading from URL

```json
{
  "success": false,
  "error": {
    "type": "API_ERROR",
    "message": "Failed to upload file from URL: Network error: ENOTFOUND cdn.example.com",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1-2% per execution (small files), ~10-20% for large files (chunked uploads)

- **Free Forever Plan**: 100 requests/minute
- **Single small file upload**: 1-2 requests (task lookup + attachment upload)
- **Large file upload**: 1 request per chunk (5MB chunks) + task lookup
- **URL upload**: 1 request (ClickUp downloads file server-side) + task lookup

**Example**: Uploading a 50MB file consumes approximately 11 requests (1 task lookup + 10 chunks = 11 requests = ~11% of rate limit).

**Best Practices**:
- Use `taskId` instead of `taskName` to save 1 request per operation
- Prefer URL uploads when possible (ClickUp downloads server-side, only 1-2 requests)
- For multiple file uploads, implement delays between requests
- Monitor rate limit headers and implement exponential backoff

---

## API Dependencies

### ClickUp API Endpoints Used

1. **Task Lookup** (when using taskName):
   - `GET /team/{teamId}/task` (search by name)
   - Required for: Converting task name to task ID

2. **File Attachment Upload**:
   - `POST /task/{taskId}/attachment` (multipart/form-data)
   - Required for: All upload methods

### Required Permissions

- **Read Tasks**: Required to look up task by name
- **Attach Files**: Required to upload files to tasks

---

## Integration Examples

### Python Example - Upload Base64 File

```python
import base64
from mcp_client import MCPClient

async def attach_base64_file(task_id: str, file_path: str):
    """Attach a local file by reading and encoding to base64"""
    # Read file and encode to base64
    with open(file_path, 'rb') as f:
        file_data = base64.b64encode(f.read()).decode('utf-8')

    file_name = file_path.split('/')[-1]  # Extract filename

    # Attach to task
    client = MCPClient()
    response = await client.call_tool('attach_task_file', {
        'taskId': task_id,
        'file_name': file_name,
        'file_data': file_data
    })

    if response['success']:
        attachment = response['attachment']
        print(f"✓ Uploaded: {attachment['title']} ({attachment['size']} bytes)")
        print(f"  URL: {attachment['url']}")
        return attachment
    else:
        print(f"✗ Error: {response['error']['message']}")
        raise Exception(response['error']['message'])

# Usage
await attach_base64_file('86fpd7vgc', '/path/to/report.pdf')
```

### Python Example - Upload from URL

```python
from mcp_client import MCPClient

async def attach_file_from_url(
    task_id: str,
    file_url: str,
    auth_token: str | None = None
):
    """Attach a file from a public or authenticated URL"""
    client = MCPClient()

    params = {
        'taskId': task_id,
        'file_url': file_url
    }

    # Add auth header if provided
    if auth_token:
        params['auth_header'] = f'Bearer {auth_token}'

    response = await client.call_tool('attach_task_file', params)

    if response['success']:
        attachment = response['attachment']
        print(f"✓ Downloaded and attached: {attachment['title']}")
        print(f"  From: {file_url}")
        print(f"  Size: {attachment['size']} bytes")
        return attachment
    else:
        print(f"✗ Error: {response['error']['message']}")
        raise Exception(response['error']['message'])

# Usage - Public URL
await attach_file_from_url(
    '86fpd7vgc',
    'https://example.com/files/document.pdf'
)

# Usage - Authenticated URL
await attach_file_from_url(
    '86fpd7vgc',
    'https://api.example.com/files/secret-report.pdf',
    auth_token='secret_token_123'
)
```

### Python Example - Upload Local File

```python
from mcp_client import MCPClient

async def attach_local_file(task_id: str, file_path: str):
    """Attach a file from local filesystem using absolute path"""
    import os

    # Ensure absolute path
    absolute_path = os.path.abspath(file_path)

    # Verify file exists before attempting
    if not os.path.exists(absolute_path):
        raise FileNotFoundError(f"File not found: {absolute_path}")

    # Get file size for logging
    file_size = os.path.getsize(absolute_path)
    print(f"Uploading: {absolute_path} ({file_size} bytes)")

    client = MCPClient()
    response = await client.call_tool('attach_task_file', {
        'taskId': task_id,
        'file_url': absolute_path  # Note: file_url parameter for local paths
    })

    if response['success']:
        # Check if chunked upload was initiated
        if 'chunk_session' in response:
            print(f"✓ Large file upload started:")
            print(f"  Progress: {response['details']['progress']}%")
            print(f"  Chunks: {response['chunk_uploaded']}/{response['chunks_total']}")
            return response  # Return session info for tracking
        else:
            # Direct upload completed
            attachment = response['attachment']
            print(f"✓ Uploaded: {attachment['title']} ({attachment['size']} bytes)")
            return attachment
    else:
        print(f"✗ Error: {response['error']['message']}")
        raise Exception(response['error']['message'])

# Usage
await attach_local_file('86fpd7vgc', '/Users/john/Documents/report.pdf')

# Windows path example
await attach_local_file('86fpd7vgc', 'C:\\Users\\John\\Documents\\report.pdf')
```

### TypeScript Example - Upload Base64 File

```typescript
import { MCPClient } from 'mcp-client';
import * as fs from 'fs';

async function attachBase64File(taskId: string, filePath: string) {
  // Read file and encode to base64
  const fileBuffer = fs.readFileSync(filePath);
  const fileData = fileBuffer.toString('base64');
  const fileName = filePath.split('/').pop() || 'file';

  const client = new MCPClient();
  const response = await client.callTool('attach_task_file', {
    taskId,
    file_name: fileName,
    file_data: fileData
  });

  if (response.success) {
    const { attachment } = response;
    console.log(`✓ Uploaded: ${attachment.title} (${attachment.size} bytes)`);
    console.log(`  URL: ${attachment.url}`);
    return attachment;
  } else {
    console.error(`✗ Error: ${response.error.message}`);
    throw new Error(response.error.message);
  }
}

// Usage
await attachBase64File('86fpd7vgc', '/path/to/report.pdf');
```

### TypeScript Example - Attach Multiple Files

```typescript
import { MCPClient } from 'mcp-client';

interface FileToAttach {
  source: 'url' | 'local' | 'base64';
  path: string;
  fileName?: string;
  authHeader?: string;
}

async function attachMultipleFiles(
  taskId: string,
  files: FileToAttach[],
  delayMs: number = 200
) {
  const client = new MCPClient();
  const results = [];

  for (const file of files) {
    try {
      let params: any = { taskId };

      if (file.source === 'url') {
        params.file_url = file.path;
        if (file.authHeader) params.auth_header = file.authHeader;
        if (file.fileName) params.file_name = file.fileName;
      } else if (file.source === 'local') {
        params.file_url = file.path;
        if (file.fileName) params.file_name = file.fileName;
      } else if (file.source === 'base64') {
        params.file_data = file.path; // Assume already base64 encoded
        params.file_name = file.fileName || 'file';
      }

      const response = await client.callTool('attach_task_file', params);

      if (response.success) {
        if (response.attachment) {
          console.log(`✓ Attached: ${response.attachment.title}`);
          results.push({ success: true, file, attachment: response.attachment });
        } else {
          // Chunked upload started
          console.log(`✓ Started chunked upload: ${response.message}`);
          results.push({ success: true, file, session: response.chunk_session });
        }
      } else {
        console.error(`✗ Failed: ${file.path} - ${response.error.message}`);
        results.push({ success: false, file, error: response.error.message });
      }

      // Delay between uploads to respect rate limits
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`✗ Exception: ${file.path} - ${error.message}`);
      results.push({ success: false, file, error: error.message });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nSummary: ${succeeded} succeeded, ${failed} failed`);
  return results;
}

// Usage
await attachMultipleFiles('86fpd7vgc', [
  { source: 'url', path: 'https://example.com/report.pdf' },
  { source: 'local', path: '/Users/john/Documents/screenshot.png' },
  { source: 'url', path: 'https://api.example.com/private.pdf', authHeader: 'Bearer token123' }
], 200); // 200ms delay between uploads
```

---

## Related Tools

- **`get_task`** - Verify task exists and has file attachment permissions before uploading
- **`create_task`** - Create task first, then attach files in separate operation
- **`update_task`** - Update task with file references in custom fields after attachment
- **`get_task_comments`** - Reference attachments in task comments after upload

---

## Best Practices

### DO:
- ✅ **Use taskId when possible** - Saves 1 API request per operation
- ✅ **Verify file exists before uploading** - Check local files with `os.path.exists()` / `fs.existsSync()`
- ✅ **Use absolute paths for local files** - Never use relative paths (e.g., `./file.pdf`)
- ✅ **Prefer URL uploads for external files** - ClickUp downloads server-side, only 1-2 requests
- ✅ **Let automatic chunking handle large files** - Files >10MB automatically chunk (no manual intervention)
- ✅ **Implement delays between multiple uploads** - 200ms+ delay to respect rate limits
- ✅ **Check file size before upload** - Warn users if file exceeds reasonable limits
- ✅ **Use descriptive file names** - Include file extensions for proper MIME type detection
- ✅ **Log successful uploads** - Track attachment IDs and URLs for reference
- ✅ **Handle errors gracefully** - Check file existence, permissions, and network connectivity

### DON'T:
- ❌ **Don't use relative paths** - Always use absolute paths for local files
- ❌ **Don't include data URL prefix in base64** - Strip `data:image/png;base64,` prefix
- ❌ **Don't upload large files as base64 unnecessarily** - Use local paths or URLs instead
- ❌ **Don't forget file extensions** - Include extensions in file_name for proper MIME detection
- ❌ **Don't ignore chunking responses** - Track session tokens for large file progress
- ❌ **Don't batch upload without delays** - Implement rate limit-friendly delays
- ❌ **Don't upload without verification** - Check task exists and you have permissions first
- ❌ **Don't expose auth tokens in logs** - Sanitize sensitive headers before logging
- ❌ **Don't assume uploads succeed** - Always check response.success and handle errors
- ❌ **Don't retry failed uploads immediately** - Implement exponential backoff for retries

---

## Performance Tips

### 1. Choose the Right Upload Method

```python
# ❌ BAD: Reading large file into memory as base64
with open('large-video.mp4', 'rb') as f:
    file_data = base64.b64encode(f.read()).decode('utf-8')
response = await client.call_tool('attach_task_file', {
    'taskId': task_id,
    'file_data': file_data,  # Heavy memory usage
    'file_name': 'large-video.mp4'
})

# ✅ GOOD: Use local path for large files
response = await client.call_tool('attach_task_file', {
    'taskId': task_id,
    'file_url': '/path/to/large-video.mp4'  # File read in chunks automatically
})
```

### 2. Batch Operations with Rate Limit Awareness

```typescript
// ✅ GOOD: Upload files with delays
async function uploadFilesWithRateLimit(taskId: string, files: string[]) {
  const DELAY_MS = 200; // 200ms delay = max 5 uploads/second
  const results = [];

  for (const filePath of files) {
    const response = await client.callTool('attach_task_file', {
      taskId,
      file_url: filePath
    });
    results.push(response);

    // Delay between uploads
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  return results;
}
```

### 3. Pre-verify Files to Avoid Wasted API Calls

```python
# ✅ GOOD: Verify file exists before attempting upload
import os

def verify_and_upload(task_id: str, file_path: str):
    # Check file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # Check file is readable
    if not os.access(file_path, os.R_OK):
        raise PermissionError(f"Cannot read file: {file_path}")

    # Check file size (warn if > 50MB)
    file_size = os.path.getsize(file_path)
    if file_size > 50 * 1024 * 1024:
        print(f"⚠️  Warning: Large file ({file_size} bytes) - upload may take time")

    # Now upload
    return await client.call_tool('attach_task_file', {
        'taskId': task_id,
        'file_url': file_path
    })
```

### 4. Parallel Uploads to Different Tasks

```typescript
// ✅ GOOD: Upload to different tasks in parallel (not same task)
async function uploadToMultipleTasks(files: Array<{taskId: string, filePath: string}>) {
  const promises = files.map(async ({ taskId, filePath }) => {
    return client.callTool('attach_task_file', {
      taskId,
      file_url: filePath
    });
  });

  // All uploads happen in parallel
  const results = await Promise.all(promises);
  return results;
}

// Usage: Upload same report to 5 different tasks simultaneously
await uploadToMultipleTasks([
  { taskId: 'task1', filePath: '/path/to/report.pdf' },
  { taskId: 'task2', filePath: '/path/to/report.pdf' },
  { taskId: 'task3', filePath: '/path/to/report.pdf' },
  { taskId: 'task4', filePath: '/path/to/report.pdf' },
  { taskId: 'task5', filePath: '/path/to/report.pdf' }
]);
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic chunked uploads for files >10MB
- ✨ **New**: Dual-purpose file_url parameter (web URLs + local file paths)
- ✨ **New**: Session management for chunked upload progress tracking
- ✨ **New**: Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
- ✨ **New**: Debug logging with request IDs and execution time tracking
- 🔧 **Changed**: file_url now accepts both web URLs and absolute local file paths
- 🔧 **Changed**: Improved error messages with actionable guidance
- 🔧 **Changed**: Better file size validation and warnings

### Version 1.0.0
- ✨ **New**: Initial implementation with base64 and URL upload support
- ✨ **New**: Task identification via taskId or taskName + listName
- ✨ **New**: Optional auth_header for authenticated URL downloads
- ✨ **New**: Automatic file name extraction from URLs
- ✨ **New**: Comprehensive error handling for all failure modes

### Version 0.9.0
- ✨ **New**: Beta release with basic file attachment functionality
- ✨ **New**: Support for base64-encoded file data
- ✨ **New**: Manual chunked upload support for advanced use cases

### Version 0.8.0
- 🎉 **Initial**: Alpha release with minimal attachment support
- 🎉 **Initial**: Basic ClickUp API integration for file uploads
