# Blog Posts API Documentation

This document provides comprehensive documentation for the Blog Posts API endpoints including listing blog posts and viewing detailed blog post content.

## Base URL
```
GET /api/blog-posts
```

## Authentication
All blog post endpoints are public and do not require authentication.

## Table of Contents
1. [List Blog Posts](#list-blog-posts)
2. [Show Blog Post](#show-blog-post)
3. [Response Schemas](#response-schemas)
4. [Error Responses](#error-responses)

---

## List Blog Posts

Retrieve a paginated list of published blog posts ordered by publication date (newest first).

### Endpoint
```http
GET /api/blog-posts
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |

### Example Request
```http
GET /api/blog-posts?page=1
```

### Example Response
```json
{
  "data": [
    {
      "title": "Getting Started with Competitive Programming",
      "slug": "getting-started-with-competitive-programming",
      "published_at": "2025-09-15T10:30:00.000000Z",
      "author": "John Doe",
      "featured_image": "https://example.com/storage/blog/featured-images/1.jpg"
    },
    {
      "title": "Advanced Data Structures for Contest Programming",
      "slug": "advanced-data-structures-for-contest-programming",
      "published_at": "2025-09-12T14:45:00.000000Z",
      "author": "Jane Smith",
      "featured_image": "https://example.com/images/fallback-gallery-image.jpeg"
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/blog-posts?page=1",
    "last": "http://localhost:8000/api/blog-posts?page=3",
    "prev": null,
    "next": "http://localhost:8000/api/blog-posts?page=2"
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
| `title` | string | Blog post title |
| `slug` | string | URL-friendly blog post identifier |
| `published_at` | string (ISO 8601) | When the blog post was published |
| `author` | string | Author's full name |
| `featured_image` | string | URL to the featured image (fallback image if none uploaded) |

---

## Show Blog Post

Retrieve detailed information about a specific blog post including full content.

### Endpoint
```http
GET /api/blog-posts/{slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Blog post slug identifier |

### Example Request
```http
GET /api/blog-posts/getting-started-with-competitive-programming
```

### Example Response
```json
{
  "data": {
    "title": "Getting Started with Competitive Programming",
    "slug": "getting-started-with-competitive-programming",
    "content": "<h2>Introduction</h2><p>Competitive programming is an exciting field that combines algorithmic thinking with coding skills...</p><p><strong>Key concepts to master:</strong></p><ul><li><p>Data structures (arrays, trees, graphs)</p></li><li><p>Algorithms (sorting, searching, dynamic programming)</p></li></ul>",
    "published_at": "2025-09-15T10:30:00.000000Z",
    "is_featured": true,
    "author": "John Doe",
    "featured_image": "https://example.com/storage/blog/featured-images/1.jpg"
  }
}
```

### Response Fields (Show)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Blog post title |
| `slug` | string | URL-friendly blog post identifier |
| `content` | string | Rich HTML content |
| `published_at` | string (ISO 8601) | When the blog post was published |
| `is_featured` | boolean | Whether this blog post is marked as featured |
| `author` | string | Author's full name |
| `featured_image` | string | URL to the featured image (fallback image if none uploaded) |

---

## Response Schemas

### Blog Post Status (Raw Values)
- `published` - Blog post is live and visible to users
- `draft` - Blog post is in draft mode (not publicly visible)

### Content Structure

The `content` field contains rich HTML content that includes formatted text, headings, lists, links, and other HTML elements. This HTML content is generated from the rich text editor and provides semantic markup for easy rendering in web applications.

#### Common HTML Elements
- **`<p>`** - Paragraphs
- **`<h1>` to `<h6>`** - Headings
- **`<ul>`, `<ol>`, `<li>`** - Lists
- **`<blockquote>`** - Quote blocks
- **`<pre>`, `<code>`** - Code blocks and inline code
- **`<img>`** - Images
- **`<a>`** - Links
- **`<strong>`, `<em>`** - Bold and italic text

### Featured Images

- If a blog post has a custom featured image uploaded, the full URL to that image is returned
- If no custom image is uploaded, a fallback image URL is returned: `https://example.com/images/fallback-gallery-image.jpeg`
- Featured images are automatically optimized and have thumbnail conversions available

### Publication Rules

A blog post is considered "published" and accessible via the API only if:
1. Status is set to `published`
2. `published_at` date is not null
3. `published_at` date is in the past (not scheduled for future)

---

## Error Responses

### Common Error Codes

#### 404 Not Found (Blog Post Not Found)
```json
{
  "message": "No query results for model [App\\Models\\BlogPost] getting-started-guide"
}
```

#### 404 Not Found (Blog Post Not Published)
```json
{
  "message": "Not Found"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 404 | Not Found (blog post doesn't exist or not published) |
| 500 | Internal Server Error |

---

## Notes

1. **Pagination**: The index endpoint returns paginated results with 10 items per page by default.

2. **Blog Post Visibility**: Only published blog posts are accessible through the API. Draft or scheduled posts will return 404.

3. **Ordering**: Blog posts are ordered by `published_at` in descending order (newest first).

4. **Rich Content**: The content field uses HTML format, which provides structured, semantic content that can be easily rendered in various front-end frameworks and browsers.

5. **Media Handling**: 
   - Featured images are served through Laravel's media library
   - Images have automatic fallbacks if no custom image is uploaded
   - Thumbnail conversions are available for performance optimization

6. **Author Information**: Only the author's name is exposed in the API response for privacy reasons.

7. **Route Model Binding**: Blog posts are identified by their `slug` field rather than numeric IDs for SEO-friendly URLs.

8. **Featured Posts**: The `is_featured` field can be used to highlight important or promoted blog posts in the UI.

9. **Content Attachments**: The rich content editor supports file attachments, which are stored in the `content-file-attachments` media collection and are accessible via public URLs.

10. **Performance**: The API uses eager loading to efficiently fetch author information and featured images, preventing N+1 query problems.