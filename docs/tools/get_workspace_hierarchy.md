# get_workspace_hierarchy

## Overview

Retrieves the complete hierarchical structure of your ClickUp workspace, including all spaces, folders, and lists. This is the foundational tool for understanding workspace organization and is used by many other tools for ID resolution.

**Category**: Workspace Management - Hierarchy Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Workspace Discovery**: Get complete view of workspace structure
2. **Navigation**: Understand organization hierarchy for planning
3. **ID Resolution**: Find IDs for spaces, folders, and lists by name
4. **Audit**: Document current workspace organization
5. **Integration Planning**: Map workspace structure to external systems

---

## Input Parameters

This tool takes **no parameters**. It always returns the complete workspace hierarchy for the authenticated team.

---

## Success Response

```json
{
  "spaces": [
    {
      "id": "90123456",
      "name": "Engineering",
      "folders": [
        {
          "id": "801234567",
          "name": "Q1 2024",
          "lists": [
            {
              "id": "901234567",
              "name": "Sprint 1"
            }
          ]
        }
      ],
      "lists": [
        {
          "id": "901234568",
          "name": "Backlog"
        }
      ]
    }
  ]
}
```

**Response Fields**:
- `spaces` (array): All spaces in the workspace
  - `id` (string): Space ID
  - `name` (string): Space name
  - `folders` (array): Folders within the space
    - `id` (string): Folder ID
    - `name` (string): Folder name
    - `lists` (array): Lists within the folder
  - `lists` (array): Lists directly in the space (not in folders)

---

## Error Responses

### Authentication Error
```json
{
  "error": "Authentication failed: Invalid API key"
}
```

### Rate Limit Error
```json
{
  "error": "Rate limit exceeded. Please try again in 60 seconds."
}
```

---

## Integration Examples

### Python Example
```python
# Get complete workspace hierarchy
result = await mcp_server.call_tool(
    "get_workspace_hierarchy",
    {}
)

print(f"Found {len(result['spaces'])} space(s)")

# Navigate hierarchy
for space in result['spaces']:
    print(f"\nSpace: {space['name']}")

    # Direct lists
    for list_item in space.get('lists', []):
        print(f"  List: {list_item['name']}")

    # Folders and their lists
    for folder in space.get('folders', []):
        print(f"  Folder: {folder['name']}")
        for list_item in folder.get('lists', []):
            print(f"    List: {list_item['name']}")
```

### TypeScript Example
```typescript
// Get workspace hierarchy
const hierarchy = await mcpServer.callTool(
  "get_workspace_hierarchy",
  {}
);

// Find a space by name
function findSpace(hierarchy: any, spaceName: string) {
  return hierarchy.spaces.find(
    (s: any) => s.name.toLowerCase() === spaceName.toLowerCase()
  );
}

// Find a list by name across entire workspace
function findListAnywhere(hierarchy: any, listName: string) {
  for (const space of hierarchy.spaces) {
    // Check direct lists
    const directList = space.lists?.find(
      (l: any) => l.name.toLowerCase() === listName.toLowerCase()
    );
    if (directList) return directList;

    // Check folder lists
    for (const folder of space.folders || []) {
      const folderList = folder.lists?.find(
        (l: any) => l.name.toLowerCase() === listName.toLowerCase()
      );
      if (folderList) return folderList;
    }
  }
  return null;
}

const engineeringSpace = findSpace(hierarchy, "Engineering");
console.log(`Engineering space ID: ${engineeringSpace?.id}`);
```

---

## Notes

- **No Parameters**: This tool always returns the complete hierarchy
- **Caching Recommended**: Hierarchy changes infrequently - cache results
- **Name Resolution**: Use this for converting names to IDs in other tools
- **Performance**: Fast (typically < 500ms)
- **Structure**: Spaces → Folders → Lists (3-level hierarchy)

---

## Best Practices

1. **Cache Results**: Store hierarchy locally to minimize API calls
2. **Refresh Periodically**: Update cached hierarchy every 5-10 minutes
3. **Case-Insensitive Matching**: Always use `.toLowerCase()` for name matching
4. **Handle Missing Folders**: Some spaces have lists directly without folders
5. **Validate IDs**: After finding by name, verify the ID exists

---

## Related Tools

- **create_folder**: Create folders in spaces
- **create_list**: Create lists in spaces
- **create_list_in_folder**: Create lists in folders
- **clickup_space_list**: Get detailed space information

---

## Performance Considerations

- **Execution Time**: ~300-500ms depending on workspace size
- **Rate Limit Cost**: 1 request (~1% of rate limit)
- **Response Size**: Varies by workspace (typically 1-10KB)
- **Optimization**: Cache results and refresh periodically

---

## Common Pitfalls

1. **NOT CACHING**: Making repeated calls instead of caching results
2. **CASE SENSITIVITY**: Not handling case-insensitive name matching
3. **ASSUMING FOLDERS**: Not checking if lists are directly in space
4. **STALE CACHE**: Using old cached data without refresh strategy
5. **SLOW ITERATION**: Not indexing hierarchy for fast lookups

---

## Example Workflow: Smart ID Resolution

```python
import time
from typing import Optional, Dict, Any

class WorkspaceNavigator:
    """Cached workspace hierarchy with smart ID resolution."""

    def __init__(self, mcp_server):
        self.mcp_server = mcp_server
        self.hierarchy: Optional[Dict[str, Any]] = None
        self.last_refresh = 0
        self.cache_ttl = 300  # 5 minutes

    async def get_hierarchy(self, force_refresh: bool = False):
        """Get hierarchy with automatic cache refresh."""
        now = time.time()

        if force_refresh or self.hierarchy is None or (now - self.last_refresh) > self.cache_ttl:
            self.hierarchy = await self.mcp_server.call_tool(
                "get_workspace_hierarchy",
                {}
            )
            self.last_refresh = now
            print(f"✅ Hierarchy cached ({len(self.hierarchy['spaces'])} spaces)")

        return self.hierarchy

    async def find_space_id(self, space_name: str) -> Optional[str]:
        """Find space ID by name (case-insensitive)."""
        hierarchy = await self.get_hierarchy()

        for space in hierarchy['spaces']:
            if space['name'].lower() == space_name.lower():
                return space['id']

        return None

    async def find_list_id(
        self,
        list_name: str,
        space_name: Optional[str] = None,
        folder_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Find list ID by name with optional space/folder context.

        Args:
            list_name: Name of the list
            space_name: Optional space name to narrow search
            folder_name: Optional folder name to narrow search

        Returns:
            List ID if found, None otherwise
        """
        hierarchy = await self.get_hierarchy()

        for space in hierarchy['spaces']:
            # Skip if space filter provided and doesn't match
            if space_name and space['name'].lower() != space_name.lower():
                continue

            # Check direct lists
            for list_item in space.get('lists', []):
                if list_item['name'].lower() == list_name.lower():
                    if folder_name is None:  # Only match if no folder filter
                        return list_item['id']

            # Check folder lists
            for folder in space.get('folders', []):
                # Skip if folder filter provided and doesn't match
                if folder_name and folder['name'].lower() != folder_name.lower():
                    continue

                for list_item in folder.get('lists', []):
                    if list_item['name'].lower() == list_name.lower():
                        return list_item['id']

        return None

    async def print_structure(self):
        """Print hierarchical view of workspace."""
        hierarchy = await self.get_hierarchy()

        for space in hierarchy['spaces']:
            print(f"\n📁 {space['name']} (ID: {space['id']})")

            # Direct lists
            for list_item in space.get('lists', []):
                print(f"  📋 {list_item['name']} (ID: {list_item['id']})")

            # Folders
            for folder in space.get('folders', []):
                print(f"  📂 {folder['name']} (ID: {folder['id']})")
                for list_item in folder.get('lists', []):
                    print(f"    📋 {list_item['name']} (ID: {list_item['id']})")

# Usage
navigator = WorkspaceNavigator(mcp_server)

# Print full structure
await navigator.print_structure()

# Find IDs
space_id = await navigator.find_space_id("Engineering")
print(f"Engineering space: {space_id}")

# Find list with context
list_id = await navigator.find_list_id(
    "Sprint 1",
    space_name="Engineering",
    folder_name="Q1 2024"
)
print(f"Sprint 1 list: {list_id}")

# Force refresh cache
await navigator.get_hierarchy(force_refresh=True)
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [create_list.md](create_list.md), [create_folder.md](create_folder.md)
