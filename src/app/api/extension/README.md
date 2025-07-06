# Extension API Documentation

This directory contains all API endpoints specifically designed for the FocusFlow browser extension.

## API Endpoints

### 1. Configuration API - `/api/extension/config`
**Purpose**: Provides configuration data needed by the extension

#### GET Request
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
```json
{
  "supabaseUrl": "https://...",
  "supabaseAnonKey": "...",
  "accessToken": "...",
  "userId": "...",
  "userEmail": "..."
}
```

### 2. Tasks API - `/api/extension/tasks`
**Purpose**: Manages tasks from the extension side

#### GET Request
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Returns active tasks for the authenticated user
```json
{
  "tasks": [
    {
      "id": "...",
      "title": "...",
      "status": "active",
      "user_id": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

#### POST Request
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "taskId": "task-uuid",
  "status": "completed",
  "metadata": { "optional": "data" }
}
```
- **Response**:
```json
{
  "message": "Task updated successfully",
  "taskId": "...",
  "status": "completed"
}
```

### 3. Monitor API - `/api/extension/monitor`
**Purpose**: Records and retrieves user activity data

#### POST Request (Record Activity)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "domain": "example.com",
  "activityType": "page_visit",
  "timestamp": "2025-07-04T12:00:00Z",
  "duration": 30000,
  "taskId": "task-uuid",
  "isDistraction": false
}
```

#### GET Request (Retrieve Activities)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `limit`: Number of records to return (default: 50)
  - `taskId`: Filter by specific task ID
- **Response**:
```json
{
  "activities": [
    {
      "id": "...",
      "user_id": "...",
      "url": "...",
      "title": "...",
      "domain": "...",
      "activity_type": "...",
      "timestamp": "...",
      "duration": 30000,
      "task_id": "...",
      "is_distraction": false,
      "created_at": "..."
    }
  ]
}
```

### 4. Health Check API - `/api/extension/health`
**Purpose**: Verifies system connectivity and authentication status

#### GET Request
- **Headers**: `Authorization: Bearer <token>` (optional)
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-04T12:00:00Z",
  "services": {
    "database": "ok",
    "auth": "ok"
  },
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

## Database Tables Required

### `tasks` table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_activities` table
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  url TEXT NOT NULL,
  title TEXT,
  domain TEXT,
  activity_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 0,
  task_id UUID REFERENCES tasks(id),
  is_distraction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Real-time Events

The APIs broadcast the following real-time events:

1. **task_status_changed**: When a task status is updated
2. **distraction_detected**: When a distraction is detected during task execution

## Authentication

All endpoints (except health check) require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

The token should be obtained through the main application's authentication flow and passed to the extension.

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `401`: Unauthorized (invalid or missing token)
- `400`: Bad Request (missing required fields)
- `500`: Internal Server Error
- `200`: Success

## Usage in Extension

1. **Initial Setup**: Call `/api/extension/config` to get configuration
2. **Monitor Activity**: POST to `/api/extension/monitor` to record user activities
3. **Task Management**: GET from `/api/extension/tasks` to fetch active tasks, POST to update task status
4. **Health Monitoring**: Periodically call `/api/extension/health` to verify connectivity
