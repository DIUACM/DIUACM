# Events API Documentation

This document provides comprehensive documentation for the Events API endpoints including listing events, viewing event details, and marking attendance.

## Base URL
```
GET /api/events
```

## Authentication
- **Events Index & Show**: No authentication required (public endpoints)
- **Event Attendance**: Requires authentication via Sanctum token

## Table of Contents
1. [List Events](#list-events)
2. [Show Event](#show-event)
3. [Mark Event Attendance](#mark-event-attendance)
4. [Response Schemas](#response-schemas)
5. [Error Responses](#error-responses)

---

## List Events

Retrieve a paginated list of published events.

### Endpoint
```http
GET /api/events
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search events by title, description, or event link |
| `type` | string | No | Filter by event type (`contest`, `class`, `other`) |
| `participation_scope` | string | No | Filter by participation scope (`open_for_all`, `only_girls`, `junior_programmers`, `selected_persons`) |
| `page` | integer | No | Page number for pagination (default: 1) |

### Example Request
```http
GET /api/events?search=programming&type=contest&page=1
```

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "title": "Programming Contest 2025",
      "starting_at": "2025-09-20T10:00:00.000000Z",
      "ending_at": "2025-09-20T14:00:00.000000Z",
      "participation_scope": "open_for_all",
      "event_type": "contest",
      "attendance_count": 45
    },
    {
      "id": 2,
      "title": "Algorithm Class",
      "starting_at": "2025-09-22T09:00:00.000000Z",
      "ending_at": "2025-09-22T11:00:00.000000Z",
      "participation_scope": "junior_programmers",
      "event_type": "class"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/events?page=1",
    "last": "http://localhost:8000/api/events?page=3",
    "prev": null,
    "next": "http://localhost:8000/api/events?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 10,
    "to": 10,
    "total": 25
  }
}
```

### Response Fields (Index)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique event identifier |
| `title` | string | Event title |
| `starting_at` | string (ISO 8601) | Event start time |
| `ending_at` | string (ISO 8601) | Event end time |
| `participation_scope` | string | Participation scope (raw enum value) |
| `event_type` | string | Event type (raw enum value) |
| `attendance_count` | integer | Number of attendees (only if attendance is open) |

---

## Show Event

Retrieve detailed information about a specific event.

### Endpoint
```http
GET /api/events/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID |

### Example Request
```http
GET /api/events/1
```

### Example Response
```json
{
  "data": {
    "id": 1,
    "title": "Programming Contest 2025",
    "description": "Annual programming contest for all skill levels. Solve algorithmic problems and compete for prizes!",
    "type": "contest",
    "status": "published",
    "starting_at": "2025-09-20T10:00:00.000000Z",
    "ending_at": "2025-09-20T14:00:00.000000Z",
    "participation_scope": "open_for_all",
    "event_link": "https://vjudge.net/contest/123456",
    "open_for_attendance": true,
    "user_stats": [
      {
        "name": "John Doe",
        "username": "johndoe",
        "student_id": "CSE-2021-001",
        "department": "CSE",
        "profile_picture": "https://example.com/photos/1.jpg",
        "solve_count": 5,
        "upsolve_count": 2,
        "participation": true
      }
    ],
    "attendees": [
      {
        "name": "John Doe",
        "username": "johndoe",
        "student_id": "CSE-2021-001",
        "department": "CSE",
        "profile_picture": "https://example.com/photos/1.jpg",
        "attendance_time": "2025-09-20T09:50:00.000000Z"
      }
    ]
  }
}
```

### Response Fields (Show)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique event identifier |
| `title` | string | Event title |
| `description` | string | Detailed event description |
| `type` | string | Event type (raw enum value) |
| `status` | string | Event status (raw enum value) |
| `starting_at` | string (ISO 8601) | Event start time |
| `ending_at` | string (ISO 8601) | Event end time |
| `participation_scope` | string | Participation scope (raw enum value) |
| `event_link` | string | External event link (e.g., VJudge contest) |
| `open_for_attendance` | boolean | Whether attendance tracking is enabled |
| `user_stats` | array | Array of user statistics for the event |
| `attendees` | array | Array of attendees (only if attendance is open) |

### User Stats Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's full name |
| `username` | string | User's username |
| `student_id` | string | Student ID |
| `department` | string | User's department |
| `profile_picture` | string | URL to profile photo |
| `solve_count` | integer | Number of problems solved during contest |
| `upsolve_count` | integer | Number of problems upsolved after contest |
| `participation` | boolean | Whether user participated in the event |

### Attendee Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's full name |
| `username` | string | User's username |
| `student_id` | string | Student ID |
| `department` | string | User's department |
| `profile_picture` | string | URL to profile photo |
| `attendance_time` | string (ISO 8601) | When the user marked attendance |

---

## Mark Event Attendance

Mark attendance for a specific event. Requires authentication.

### Endpoint
```http
POST /api/events/{id}/attend
```

### Authentication
Requires `Authorization: Bearer {token}` header with a valid Sanctum token.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Event ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_password` | string | Yes | Event password provided by organizers |

### Example Request
```http
POST /api/events/1/attend
Authorization: Bearer 1|abc123def456...
Content-Type: application/json

{
  "event_password": "contest2025"
}
```

### Success Response (201)
```json
{
  "message": "Attendance marked successfully.",
  "data": {
    "event_id": 1,
    "user_id": 123,
    "attended_at": "2025-09-20T09:45:00.000000Z"
  }
}
```

### Attendance Window Rules
- Attendance window opens **15 minutes before** the event start time
- Attendance window closes **20 minutes after** the event end time
- Users can only mark attendance once per event
- Event must be published and open for attendance

---

## Response Schemas

### Event Types (Raw Values)
- `contest` - Programming contests and competitions
- `class` - Educational classes and workshops  
- `other` - Other types of events

### Participation Scopes (Raw Values)
- `open_for_all` - Open to all participants
- `only_girls` - Restricted to female participants
- `junior_programmers` - For junior/beginner programmers
- `selected_persons` - Invitation-only events

### Event Status (Raw Values)
- `published` - Event is live and visible to users
- `draft` - Event is in draft mode (not publicly visible)

**Note**: All enum fields now return raw string values instead of human-readable labels for better API consistency and machine processing.

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": {
    "event_password": [
      "Event password is required to mark attendance."
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

#### 403 Forbidden (Event Not Open for Attendance)
```json
{
  "message": "This event is not open for attendance."
}
```

#### 403 Forbidden (Attendance Window Closed)
```json
{
  "message": "Attendance window is currently closed for this event."
}
```

#### 403 Forbidden (Invalid Password)
```json
{
  "message": "Invalid event password."
}
```

#### 404 Not Found
```json
{
  "message": "Event not found."
}
```

#### 409 Conflict (Already Attended)
```json
{
  "message": "You have already marked attendance for this event."
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success (GET requests) |
| 201 | Created (attendance marked) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (access denied) |
| 404 | Not Found (event doesn't exist or not published) |
| 409 | Conflict (duplicate attendance) |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Notes

1. **Pagination**: The index endpoint returns paginated results with 10 items per page by default.

2. **Attendance Window**: The attendance feature has specific timing rules:
   - Opens 15 minutes before event start
   - Closes 20 minutes after event end
   - Only available for events where `open_for_attendance` is true

3. **Event Visibility**: Only published events are accessible through the API. Draft or archived events will return 404.

4. **Search Functionality**: The search parameter performs a case-insensitive search across event title, description, and event link fields.

5. **Data Privacy**: The `event_password` field is never exposed in API responses for security reasons.

6. **User Stats vs Attendees**: 
   - `user_stats` shows performance data for users who participated in the event
   - `attendees` shows users who marked attendance (only visible if attendance is enabled)