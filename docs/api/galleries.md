# Galleries API Documentation

This document provides comprehensive documentation for the Galleries API endpoints including listing galleries and viewing gallery details with images.

## Base URL
```
GET /api/galleries
```

## Authentication
- **Galleries Index & Show**: No authentication required (public endpoints)

## Table of Contents
1. [List Galleries](#list-galleries)
2. [Show Gallery](#show-gallery)
3. [Response Schemas](#response-schemas)
4. [Error Responses](#error-responses)

---

## List Galleries

Retrieve a paginated list of published galleries with cover images.

### Endpoint
```http
GET /api/galleries
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |

### Example Request
```http
GET /api/galleries?page=1
```

### Example Response
```json
{
  "data": [
    {
      "title": "ICPC Regional Contest 2024",
      "slug": "icpc-regional-contest-2024-12345-1726787200",
      "cover_image": "https://example.com/storage/gallery_images/1/cover.jpg",
      "media_count": 15
    },
    {
      "title": "DIU Programming Marathon",
      "slug": "diu-programming-marathon-67890-1726787260",
      "cover_image": "https://example.com/storage/gallery_images/2/cover.jpg",
      "media_count": 8
    },
    {
      "title": "ACM Training Session",
      "slug": "acm-training-session-11111-1726787320",
      "cover_image": "https://example.com/images/fallback-gallery-image.jpeg",
      "media_count": 0
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/galleries?page=1",
    "last": "http://localhost:8000/api/galleries?page=8",
    "prev": null,
    "next": "http://localhost:8000/api/galleries?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 8,
    "per_page": 10,
    "to": 10,
    "total": 80
  }
}
```

### Response Fields (Index)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Gallery title |
| `slug` | string | Unique URL-friendly identifier |
| `cover_image` | string | URL to cover image (first image or fallback) |
| `media_count` | integer | Total number of images in the gallery |

---

## Show Gallery

Retrieve detailed information about a specific gallery including all images.

### Endpoint
```http
GET /api/galleries/{slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Gallery's unique slug identifier |

### Example Request
```http
GET /api/galleries/icpc-regional-contest-2024-12345-1726787200
```

### Example Response
```json
{
  "data": {
    "title": "ICPC Regional Contest 2024",
    "slug": "icpc-regional-contest-2024-12345-1726787200",
    "description": "A comprehensive collection of moments captured during our latest programming contest featuring teams from various universities competing in algorithmic problem solving.",
    "media": [
      {
        "url": "https://example.com/storage/gallery_images/1/contest-opening.jpg"
      },
      {
        "url": "https://example.com/storage/gallery_images/1/teams-coding.jpg"
      },
      {
        "url": "https://example.com/storage/gallery_images/1/problem-solving.jpg"
      },
      {
        "url": "https://example.com/storage/gallery_images/1/award-ceremony.jpg"
      },
      {
        "url": "https://example.com/storage/gallery_images/1/team-celebrations.jpg"
      }
    ]
  }
}
```

### Response Fields (Show)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Gallery title |
| `slug` | string | Unique URL-friendly identifier |
| `description` | string\|null | Detailed gallery description |
| `media` | array | Array of all gallery images |

### Media Object

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Full URL to the image file |

---

## Response Schemas

### Gallery Status
Only published galleries are accessible through the API:
- `published` - Gallery is visible to the public
- `draft` - Gallery is hidden from public API (returns 404)

### Image Management
- **Collection**: Uses Spatie Media Library with `gallery_images` collection
- **Ordering**: Images are ordered by `order_column` for consistent display
- **Fallback**: Automatic fallback to default image when no images are uploaded
- **Conversions**: Supports image conversions and optimizations

### Slug Generation
- **Format**: `{title-slug}-{random-number}-{timestamp}`
- **Example**: `icpc-regional-contest-2024-12345-1726787200`
- **Uniqueness**: Guaranteed unique through timestamp and random number

### Common Gallery Types
Based on the application's contest and educational focus:
- Contest photo galleries (ICPC, IUPC, etc.)
- Training session documentation
- Workshop and seminar coverage
- Award ceremonies and celebrations
- Student project showcases
- Campus programming events

---

## Error Responses

### Common Error Codes

#### 404 Not Found (Gallery doesn't exist or is draft)
```json
{
  "message": "No query results for model [App\\Models\\Gallery] gallery-slug"
}
```

#### 404 Not Found (Gallery exists but not published)
```json
{
  "message": "No query results for model [App\\Models\\Gallery] gallery-slug"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success (GET requests) |
| 404 | Not Found (gallery doesn't exist or not published) |
| 422 | Unprocessable Entity (validation failed) |
| 500 | Internal Server Error |

---

## Notes

1. **Visibility Control**: Only galleries with status `published` are accessible through the API. Draft galleries return 404 errors.

2. **Pagination**: The index endpoint returns paginated results with 10 items per page by default.

3. **Route Model Binding**: The show endpoint uses slug-based route model binding for SEO-friendly URLs.

4. **Image Handling**: 
   - Uses Spatie Media Library for robust file management
   - Automatic fallback to default image when galleries have no images
   - Images are ordered consistently using `order_column`
   - Supports image conversions and optimizations

5. **Cover Image Logic**: 
   - Index endpoint shows only the first image as cover
   - Cover image falls back to default when no images exist
   - Show endpoint includes all gallery images

6. **Content Management**: 
   - Galleries support rich text descriptions
   - Titles are required and must be unique
   - Slugs are automatically generated with timestamp uniqueness

7. **Performance**: 
   - Index endpoint efficiently loads only cover images (limit 1)
   - Show endpoint loads all images for complete gallery display
   - Optimized queries with proper eager loading

8. **URL Structure**: 
   - Consistent with Laravel media library conventions
   - Images served from configured storage disk
   - Proper fallback URLs for missing images

9. **Educational Context**: 
   - Designed for university programming contest documentation
   - Supports both contest galleries and general educational content
   - Integration with contest management system through relationships