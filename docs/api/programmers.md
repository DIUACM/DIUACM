# Programmers API Documentation

This document provides comprehensive documentation for the Programmers API endpoints including listing programmers and viewing a programmer profile with contests and tracker performance.

## Base URL
```
GET /api/programmers
```

## Authentication
- Programmers Index & Show: No authentication required (public endpoints)

## Table of Contents
1. [List Programmers](#list-programmers)
2. [Show Programmer](#show-programmer)
3. [Response Schemas](#response-schemas)
4. [Error Responses](#error-responses)

---

## List Programmers

Retrieve a paginated list of programmers ordered by highest Codeforces rating.

### Endpoint
```http
GET /api/programmers
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search by name, username, student ID, department, or CF/AtCoder/VJudge handles |
| `page` | integer | No | Page number for pagination (default: 1) |

### Ordering
- Primary: `max_cf_rating` descending
- Secondary: `name` ascending

### Pagination
- Page size: 15 per page

### Example Request
```http
GET /api/programmers?search=alice&page=1
```

### Example Response
```json
{
  "data": [
    {
      "name": "Alice Brown",
      "username": "alicebrown",
      "student_id": "CSE-2021-004",
      "department": "CSE",
      "profile_picture": "http://localhost:8000/storage/profile_pictures/4.jpg",
      "max_cf_rating": 1820
    },
    {
      "name": "John Doe",
      "username": "johndoe",
      "student_id": "CSE-2021-001",
      "department": "CSE",
      "profile_picture": "http://localhost:8000/storage/profile_pictures/1.jpg",
      "max_cf_rating": 1650
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/programmers?page=1",
    "last": "http://localhost:8000/api/programmers?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/programmers?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 72
  }
}
```

### Response Fields (Index)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Programmer's full name |
| `username` | string | Unique username (also used as route key) |
| `student_id` | string\|null | Student ID |
| `department` | string\|null | Academic department |
| `profile_picture` | string | URL to profile photo |
| `max_cf_rating` | integer\|null | Highest Codeforces rating |

---

## Show Programmer

Retrieve full profile details for a programmer, including contest history and tracker performance.

### Endpoint
```http
GET /api/programmers/{username}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Programmer username (route model binding uses username) |

### Example Request
```http
GET /api/programmers/johndoe
```

### Example Response
```json
{
  "data": {
    "name": "John Doe",
    "username": "johndoe",
    "student_id": "CSE-2021-001",
    "department": "CSE",
    "profile_picture": "http://localhost:8000/storage/profile_pictures/1.jpg",
    "max_cf_rating": 1650,
    "codeforces_handle": "john_cf",
    "atcoder_handle": "john_atc",
    "vjudge_handle": "john_vj",
    "contests": [
      {
        "id": 12,
        "name": "IUPC Programming Contest 2025",
        "date": "2025-08-15T09:00:00.000000Z",
        "team_name": "Binary Beasts",
        "rank": 2,
        "solve_count": 7,
        "members": [
          {
            "name": "John Doe",
            "username": "johndoe",
            "student_id": "CSE-2021-001",
            "department": "CSE",
            "profile_picture": "http://localhost:8000/storage/profile_pictures/1.jpg"
          },
          {
            "name": "Alice Brown",
            "username": "alicebrown",
            "student_id": "CSE-2021-004",
            "department": "CSE",
            "profile_picture": "http://localhost:8000/storage/profile_pictures/4.jpg"
          }
        ]
      }
    ],
    "tracker_performance": [
      {
        "title": "Algorithm Training Tracker",
        "slug": "algorithm-training",
        "ranklists": [
          {
            "keyword": "dp",
            "total_users": 50,
            "events_count": 10,
            "user_score": 120,
            "user_position": 5
          },
          {
            "keyword": "graphs",
            "total_users": 45,
            "events_count": 8,
            "user_score": 90,
            "user_position": 9
          }
        ]
      }
    ]
  }
}
```

### Response Fields (Show)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Programmer's full name |
| `username` | string | Unique username |
| `student_id` | string\|null | Student ID |
| `department` | string\|null | Academic department |
| `profile_picture` | string | URL to profile photo |
| `max_cf_rating` | integer\|null | Highest Codeforces rating |
| `codeforces_handle` | string\|null | Codeforces handle |
| `atcoder_handle` | string\|null | AtCoder handle |
| `vjudge_handle` | string\|null | VJudge handle |
| `contests` | array | List of contests the programmer participated in |
| `tracker_performance` | array | Aggregated performance data grouped by tracker |

### Contest Entry

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Contest ID |
| `name` | string | Contest name |
| `date` | string (ISO 8601) | Contest date and time |
| `team_name` | string | Team name used in the contest |
| `rank` | integer\|null | Team's final rank in the contest |
| `solve_count` | integer\|null | Number of problems solved by the team |
| `members` | array | Team members (User schema) |

### Tracker Performance Entry

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Tracker title |
| `slug` | string | Tracker slug for URLs |
| `ranklists` | array | Array of ranklist performance entries |

#### Ranklist Performance

| Field | Type | Description |
|-------|------|-------------|
| `keyword` | string | Ranklist keyword/name |
| `total_users` | integer | Total users competing on this ranklist |
| `events_count` | integer | Number of events contributing to this ranklist |
| `user_score` | integer | Current user's score on this ranklist |
| `user_position` | integer | 1-based position among all users (lower is better) |

---

## Error Responses

### 404 Not Found (Programmer doesn't exist)
```json
{
  "message": "No query results for model [App\\Models\\User] johndoe-not-found"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success (GET requests) |
| 404 | Not Found (programmer doesn't exist) |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Notes

1. Route Model Binding: Programmer profiles resolve by `username` (e.g., `/api/programmers/johndoe`).
2. Media: `profile_picture` returns an absolute URL (falls back to a default image when missing).
3. Pagination: The index endpoint returns paginated results with 15 items per page by default.
4. Ordering: Index results are ordered by `max_cf_rating` (desc), then `name` (asc).
5. Search: The `search` parameter matches name, username, student ID, department, and CF/AtCoder/VJudge handles.
