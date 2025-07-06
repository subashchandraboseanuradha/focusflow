# Extension API Migration Guide

## Overview

The extension APIs have been reorganized into a more structured and maintainable format. This guide helps you migrate from the old endpoints to the new ones.

## API Endpoint Changes

### Old Structure → New Structure

| Old Endpoint | New Endpoint | Purpose |
|-------------|-------------|---------|
| `/api/extension-config` (GET) | `/api/extension/config` (GET) | Get extension configuration |
| `/api/extension-config` (POST) | `/api/extension/tasks` (POST) | Update task status |
| N/A | `/api/extension/tasks` (GET) | Get active tasks |
| N/A | `/api/extension/monitor` (POST) | Record user activity |
| N/A | `/api/extension/monitor` (GET) | Get activity history |
| N/A | `/api/extension/health` (GET) | Health check |

## Breaking Changes

### 1. Configuration Response
**Old Response:**
```json
{
  "supabaseUrl": "...",
  "supabaseAnonKey": "...",
  "accessToken": "..."
}
```

**New Response:**
```json
{
  "supabaseUrl": "...",
  "supabaseAnonKey": "...",
  "accessToken": "...",
  "userId": "...",
  "userEmail": "..."
}
```

### 2. Task Update Response
**Old Response:**
```json
{
  "message": "Task updated and broadcasted successfully"
}
```

**New Response:**
```json
{
  "message": "Task updated successfully",
  "taskId": "...",
  "status": "..."
}
```

## Extension Code Updates

### 1. Update Configuration Fetch
```javascript
// OLD
fetch('/api/extension-config', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// NEW
fetch('/api/extension/config', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### 2. Update Task Status Updates
```javascript
// OLD
fetch('/api/extension-config', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ taskId, status })
})

// NEW
fetch('/api/extension/tasks', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ taskId, status, metadata })
})
```

### 3. New Features Available

#### Get Active Tasks
```javascript
fetch('/api/extension/tasks', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => response.json())
.then(data => {
  console.log('Active tasks:', data.tasks);
});
```

#### Record User Activity
```javascript
fetch('/api/extension/monitor', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    activityType: 'page_visit',
    timestamp: new Date().toISOString(),
    duration: 30000,
    taskId: currentTaskId,
    isDistraction: false
  })
})
```

#### Health Check
```javascript
fetch('/api/extension/health', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => response.json())
.then(data => {
  console.log('System status:', data.status);
  console.log('Services:', data.services);
});
```

## Backward Compatibility

The old `/api/extension-config` endpoint will continue to work but will:
1. Forward requests to the new endpoints
2. Add a deprecation header: `X-Deprecated: true`
3. Eventually be removed in a future version

## Migration Timeline

1. **Phase 1** (Current): New endpoints available, old endpoints redirect
2. **Phase 2** (Next release): Deprecation warnings in old endpoints
3. **Phase 3** (Future release): Old endpoints removed

## Benefits of New Structure

1. **Better Organization**: Each endpoint has a specific purpose
2. **Enhanced Functionality**: New monitoring and health check capabilities
3. **Improved Error Handling**: Consistent error responses across all endpoints
4. **Real-time Features**: Better support for real-time updates and distraction alerts
5. **Scalability**: Easier to add new extension features

## Testing

Test your extension with both old and new endpoints during the migration:

```javascript
// Test health check
async function testHealth() {
  try {
    const response = await fetch('/api/extension/health');
    const data = await response.json();
    console.log('Health check:', data);
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

// Test configuration
async function testConfig(token) {
  try {
    const response = await fetch('/api/extension/config', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('Config:', data);
  } catch (error) {
    console.error('Config failed:', error);
  }
}
```

## Support

If you encounter issues during migration, check:
1. Console logs for deprecation warnings
2. Network tab for API response status codes
3. Response headers for deprecation notices
