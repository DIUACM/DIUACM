# Trackers API Documentation

This document provides comprehensive documentation for the Trackers API endpoints including listing trackers and viewing detailed tracker information with rank lists.

## Base URL
```
GET /api/trackers
```

## Authentication
All tracker endpoints are public and do not require authentication.

## Table of Contents
1. [List Trackers](#list-trackers)
2. [Show Tracker](#show-tracker)
3. [Response Schemas](#response-schemas)
4. [Error Responses](#error-responses)

---

## List Trackers

Retrieve a paginated list of published trackers.

### Endpoint
```http
GET /api/trackers
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |

### Example Request
```http
GET /api/trackers?page=1
```

### Example Response
```json
{
  "data": [
    {
      "title": "Programming Contest Tracker",
      "slug": "programming-contest-tracker",
      "description": "Track performance across programming contests and competitions"
    },
    {
      "title": "Algorithm Class Tracker",
      "slug": "algorithm-class-tracker", 
      "description": "Monitor progress in algorithm classes and workshops"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/trackers?page=1",
    "last": "http://localhost:8000/api/trackers?page=2",
    "prev": null,
    "next": "http://localhost:8000/api/trackers?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 2,
    "per_page": 10,
    "to": 10,
    "total": 15
  }
}
```

### Response Fields (Index)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Tracker title |
| `slug` | string | URL-friendly tracker identifier |
| `description` | string | Brief tracker description |

---

## Show Tracker

Retrieve detailed information about a specific tracker including rank lists, events, and user statistics.

### Endpoint
```http
GET /api/trackers/{slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Tracker slug identifier |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | Select specific rank list by keyword. If not provided, the first available rank list is used |

### Example Request
```http
GET /api/trackers/programming-contest-tracker?keyword=spring2025
```

### Example Response
```json
{
  "data": {
    "title": "Programming Contest Tracker",
    "slug": "programming-contest-tracker",
    "description": "Track performance across programming contests and competitions",
    "rank_lists": [
      {
        "keyword": "spring2025"
      },
      {
        "keyword": "fall2024"
      }
    ],
    "selected_rank_list": {
      "keyword": "spring2025",
      "consider_strict_attendance": true,
      "events": [
        {
          "id": 1,
          "title": "Weekly Contest #1",
          "starting_at": "2025-09-15T10:00:00.000000Z",
          "strict_attendance": true
        },
        {
          "id": 2,
          "title": "Algorithm Challenge",
          "starting_at": "2025-09-08T14:00:00.000000Z",
          "strict_attendance": false
        }
      ],
      "users": [
        {
          "name": "John Doe",
          "username": "johndoe",
          "student_id": "CSE-2021-001",
          "department": "CSE",
          "profile_picture": "https://example.com/photos/1.jpg",
          "score": 85.5,
          "event_stats": {
            "1": {
              "event_id": 1,
              "solve_count": 5,
              "upsolve_count": 2,
              "participation": true
            },
            "2": {
              "event_id": 2,
              "solve_count": 3,
              "upsolve_count": 4,
              "participation": true
            }
          }
        },
        {
          "name": "Jane Smith",
          "username": "janesmith",
          "student_id": "CSE-2021-002",
          "department": "CSE",
          "profile_picture": "https://example.com/photos/2.jpg",
          "score": 72.0,
          "event_stats": {
            "1": null,
            "2": {
              "event_id": 2,
              "solve_count": 6,
              "upsolve_count": 1,
              "participation": true
            }
          }
        }
      ]
    }
  }
}
```

### Response Fields (Show)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Tracker title |
| `slug` | string | URL-friendly tracker identifier |
| `description` | string | Detailed tracker description |
| `rank_lists` | array | Array of available rank lists for this tracker |
| `selected_rank_list` | object | The currently selected rank list with full details |

### Rank List Object (Summary)

| Field | Type | Description |
|-------|------|-------------|
| `keyword` | string | Rank list keyword identifier |

### Selected Rank List Object

| Field | Type | Description |
|-------|------|-------------|
| `keyword` | string | Rank list keyword identifier |
| `consider_strict_attendance` | boolean | Whether strict attendance rules are applied |
| `events` | array | Array of events associated with this rank list |
| `users` | array | Array of users with their performance statistics |

### Event Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Event ID |
| `title` | string | Event title |
| `starting_at` | string (ISO 8601) | Event start time |
| `strict_attendance` | boolean | Whether strict attendance is required (only shown if `consider_strict_attendance` is true) |

### User Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's full name |
| `username` | string | User's username |
| `student_id` | string | Student ID |
| `department` | string | User's department |
| `profile_picture` | string | URL to profile photo |
| `score` | number | User's calculated total score for this rank list |
| `event_stats` | object | Performance statistics for each event |

### Event Stats Object

The `event_stats` object contains event IDs as keys and statistics objects as values:

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | integer | Event ID |
| `solve_count` | integer | Number of problems solved during the event |
| `upsolve_count` | integer | Number of problems solved after the event |
| `participation` | boolean | Whether the user participated in the event |

**Note**: If a user has no statistics for an event, the value will be `null`.

---

## Response Schemas

### Tracker Status (Raw Values)
- `published` - Tracker is live and visible to users
- `draft` - Tracker is in draft mode (not publicly visible)

### Strict Attendance Rules

When `consider_strict_attendance` is `true` and an event has `strict_attendance` set to `true`:

1. If a user didn't mark attendance for the event but has solve statistics, their `solve_count` is moved to `upsolve_count`
2. The `solve_count` is reset to 0
3. The `participation` status is set to `false`

This ensures that only users who physically attended strict attendance events get credit for solving problems during the event.

### User Ranking

Users in the `selected_rank_list.users` array are automatically sorted by their `score` field in descending order (highest score first). The score is calculated based on the user's performance across all events in the rank list, taking into account factors like solve counts, upsolve counts, event weights, and attendance rules.

---

## Error Responses

### Common Error Codes

#### 404 Not Found (Tracker Not Found)
```json
{
  "message": "No query results for model [App\\Models\\Tracker] programming-contest-tracker"
}
```

#### 404 Not Found (Tracker Not Published)
```json
{
  "message": "Not Found"
}
```

#### 404 Not Found (No Rank Lists Available)
```json
{
  "message": "Not Found"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Not Found (tracker doesn't exist, not published, or no rank lists available) |
| 500 | Internal Server Error |

---

## Notes

1. **Pagination**: The index endpoint returns paginated results with 10 items per page by default.

2. **Tracker Visibility**: Only published trackers are accessible through the API. Draft trackers will return 404.

3. **Rank List Selection**: 
   - If a `keyword` query parameter is provided, the system tries to find a matching rank list
   - If no keyword is provided or no matching rank list is found, the first available rank list is used
   - If no rank lists exist for the tracker, a 404 error is returned

4. **Event Ordering**: Events within a rank list are ordered by `starting_at` in descending order (newest first).

5. **User Ordering**: Users are automatically sorted by their `score` field in descending order (highest performers first).

6. **Event Statistics**: 
   - Statistics are only shown for events that are published and associated with the selected rank list
   - A `null` value in `event_stats` indicates the user has no recorded statistics for that event
   - The `event_stats` object uses event IDs as keys for easy lookup

7. **Strict Attendance**: When enabled, this feature ensures fair competition by distinguishing between problems solved during the event (with physical attendance) and problems solved afterward (upsolving).

8. **Performance Considerations**: The API efficiently loads only necessary data and uses eager loading to prevent N+1 query problems.

9. **Route Model Binding**: Trackers are identified by their `slug` field rather than numeric IDs for more user-friendly URLs.