# Contests API Documentation

This document provides comprehensive documentation for the Contests API endpoints including listing contests and viewing contest details with teams and participants.

## Base URL
```
GET /api/contests
```

## Authentication
- **Contests Index & Show**: No authentication required (public endpoints)

## Table of Contents
1. [List Contests](#list-contests)
2. [Show Contest](#show-contest)
3. [Response Schemas](#response-schemas)
4. [Error Responses](#error-responses)

---

## List Contests

Retrieve a paginated list of contests ordered by date (most recent first).

### Endpoint
```http
GET /api/contests
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |

### Example Request
```http
GET /api/contests?page=1
```

### Example Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "ICPC Regional Contest September 2025 #1234",
      "contest_type": "icpc_regional",
      "location": "DIU Auditorium",
      "date": "2025-09-20T10:00:00.000000Z",
      "best_rank": 1
    },
    {
      "id": 2,
      "name": "IUPC Programming Contest August 2025 #5678",
      "contest_type": "iupc",
      "location": "Computer Lab 1",
      "date": "2025-08-15T09:00:00.000000Z",
      "best_rank": 2
    },
    {
      "id": 3,
      "name": "DIU Training Contest July 2025 #9012",
      "contest_type": "other",
      "location": "Online",
      "date": "2025-07-10T14:00:00.000000Z",
      "best_rank": null
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/contests?page=1",
    "last": "http://localhost:8000/api/contests?page=10",
    "prev": null,
    "next": "http://localhost:8000/api/contests?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 10,
    "to": 10,
    "total": 100
  }
}
```

### Response Fields (Index)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique contest identifier |
| `name` | string | Contest name |
| `contest_type` | string | Contest type (raw enum value) |
| `location` | string\|null | Contest location (physical or "Online") |
| `date` | string (ISO 8601)\|null | Contest date and time |
| `best_rank` | integer\|null | Best (minimum) rank achieved by any team in this contest |

---

## Show Contest

Retrieve detailed information about a specific contest including teams, participants, and associated gallery.

### Endpoint
```http
GET /api/contests/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Contest ID |

### Example Request
```http
GET /api/contests/1
```

### Example Response
```json
{
  "data": {
    "id": 1,
    "name": "ICPC Regional Contest September 2025 #1234",
    "contest_type": "icpc_regional",
    "location": "DIU Auditorium",
    "date": "2025-09-20T10:00:00.000000Z",
    "description": "Annual ICPC Regional Programming Contest featuring teams from leading universities across the region. Participants will solve algorithmic problems in a competitive environment.",
    "standings_url": "https://vjudge.net/contest/123456/rank",
    "gallery": {
      "title": "ICPC Regional Contest 2025 Gallery",
      "slug": "icpc-regional-contest-2025-gallery-12345-1726787200",
      "cover_image": "https://example.com/storage/gallery_images/5/contest-highlights.jpg"
    },
    "teams": [
      {
        "id": 1,
        "name": "Code Warriors",
        "rank": 1,
        "solve_count": 8,
        "members": [
          {
            "name": "John Doe",
            "username": "johndoe",
            "student_id": "CSE-2021-001",
            "department": "CSE",
            "profile_picture": "https://example.com/storage/profile_pictures/1.jpg"
          },
          {
            "name": "Jane Smith",
            "username": "janesmith",
            "student_id": "CSE-2021-002",
            "department": "CSE",
            "profile_picture": "https://example.com/storage/profile_pictures/2.jpg"
          },
          {
            "name": "Bob Wilson",
            "username": "bobwilson",
            "student_id": "CSE-2021-003",
            "department": "CSE",
            "profile_picture": "https://example.com/storage/profile_pictures/3.jpg"
          }
        ]
      },
      {
        "id": 2,
        "name": "Binary Beasts",
        "rank": 2,
        "solve_count": 7,
        "members": [
          {
            "name": "Alice Brown",
            "username": "alicebrown",
            "student_id": "CSE-2021-004",
            "department": "CSE",
            "profile_picture": "https://example.com/storage/profile_pictures/4.jpg"
          },
          {
            "name": "Charlie Davis",
            "username": "charliedavis",
            "student_id": "CSE-2021-005",
            "department": "CSE",
            "profile_picture": "https://example.com/storage/profile_pictures/5.jpg"
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
| `id` | integer | Unique contest identifier |
| `name` | string | Contest name |
| `contest_type` | string | Contest type (raw enum value) |
| `location` | string\|null | Contest location |
| `date` | string (ISO 8601)\|null | Contest date and time |
| `description` | string\|null | Detailed contest description |
| `standings_url` | string\|null | URL to external contest standings |
| `gallery` | object\|null | Associated gallery information |
| `teams` | array | Array of participating teams with members |

### Gallery Object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Gallery title |
| `slug` | string | Gallery slug for URL routing |
| `cover_image` | string | URL to gallery cover image |

### Team Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Team ID |
| `name` | string | Team name |
| `rank` | integer\|null | Team's final rank in the contest |
| `solve_count` | integer\|null | Number of problems solved by the team |
| `members` | array | Array of team members |

### Team Member Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Member's full name |
| `username` | string | Member's username |
| `student_id` | string\|null | Member's student ID |
| `department` | string\|null | Member's academic department |
| `profile_picture` | string | URL to member's profile picture |

---

## Response Schemas

### Contest Types
The system supports the following contest types as raw enum values:

| Raw Value | Label | Description |
|-----------|-------|-------------|
| `icpc_regional` | ICPC Regional | International Collegiate Programming Contest Regional |
| `icpc_asia_west` | ICPC Asia West | ICPC Asia West Continental Contest |
| `iupc` | IUPC | Inter University Programming Contest |
| `other` | Other | General programming contests and training events |

**Note**: The API returns raw enum values (e.g., `"icpc_regional"`) for better consistency and machine processing.

### Contest Locations
Common locations used in the system:
- **Physical Venues**: 
  - `DIU Auditorium`
  - `Computer Lab 1`, `Computer Lab 2`
  - `Main Campus`, `Green Road Campus`, `Satarkul Campus`
- **Virtual**: 
  - `Online`
  - `Hybrid` (combination of physical and online)

### Date Handling
- **Format**: ISO 8601 datetime strings with timezone
- **Nullable**: Contests may not have scheduled dates yet
- **Ordering**: Contests are ordered by date descending (most recent first)

### Team Structure
- **Team Size**: Typically 1-3 members for programming contests
- **Ranking**: Based on problems solved and time penalties
- **Members**: Each team can have multiple participants with full profile information

---

## Error Responses

### Common Error Codes

#### 404 Not Found (Contest doesn't exist)
```json
{
  "message": "No query results for model [App\\Models\\Contest] 999"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success (GET requests) |
| 404 | Not Found (contest doesn't exist) |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Notes

1. **Pagination**: The index endpoint returns paginated results with 10 items per page by default.

2. **Ordering**: Contests are ordered by date in descending order, showing the most recent contests first.

3. **Route Model Binding**: The show endpoint uses standard integer ID-based route model binding.

4. **Team Management**: 
   - Teams are managed separately and associated with contests
   - Each team can have multiple members (typically 1-3 for programming contests)
   - Team rankings and solve counts are tracked for contest results

5. **Gallery Integration**: 
   - Contests can be linked to photo galleries for event documentation
   - Gallery information is included in the contest details
   - Provides seamless navigation between contests and their visual documentation

6. **Contest Types**: 
   - System categorizes contests by type for better organization
   - Supports major contest formats (ICPC Regional, IUPC, etc.)
   - Flexible "Other" category for custom contest types

7. **External Integration**: 
   - `standings_url` field links to external contest platforms (e.g., VJudge, Codeforces)
   - Allows integration with existing contest management systems
   - Provides access to detailed contest standings and results

8. **Performance Optimization**: 
   - Index endpoint loads minimal data for efficient listing
   - Show endpoint uses eager loading for teams and members
   - Optimized queries to reduce N+1 query problems

9. **Educational Context**: 
   - Designed for university-level programming contests
   - Supports both individual and team-based competitions
   - Integrates with student management system through user profiles

10. **Data Consistency**: 
    - Unique contest names prevent duplicates
    - Proper foreign key relationships maintain data integrity
    - Nullable fields accommodate various contest configurations

11. **Historical Data**: 
    - System maintains complete contest history
    - Team performance tracking across multiple contests
    - Supports long-term analytics and reporting