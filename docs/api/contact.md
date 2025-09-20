# Contact API Documentation

Submit contact messages to the DIU ACM backend.

## Base URL
```
POST /api/contact
```

## Authentication
- Public endpoint — no authentication required

## Table of Contents
1. [Create Contact Message](#create-contact-message)
2. [Request Schema](#request-schema)
3. [Responses](#responses)
4. [Error Responses](#error-responses)

---

## Create Contact Message

Create a new contact inquiry. This stores the message for later review.

### Endpoint
```http
POST /api/contact
```

### Request Body (JSON)
| Field | Type | Required | Rules |
|------|------|----------|-------|
| `name` | string | Yes | max:150 |
| `email` | string | Yes | email, max:255 |
| `message` | string | Yes | max:5000 |

### Example Request
```http
POST /api/contact
Content-Type: application/json

{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "I would love to speak at your next event."
}
```

### Example Response (201)
```json
{
  "message": "Your message has been received.",
  "data": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "created_at": "2025-09-19T12:34:56.000000Z"
  }
}
```

---

## Request Schema
- `name`: User's full name.
- `email`: Email address to contact back.
- `message`: The content of the inquiry or message.

Note: The stored `message` content is not returned in the API response for privacy and payload minimization.

---

## Responses

### Success
- Status: `201 Created`
- Body: Contains confirmation `message` and `data` with minimal details (`id`, `name`, `email`, `created_at`).

---

## Error Responses

### 422 Unprocessable Entity (Validation Failed)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["Please provide your name."],
    "email": ["Please provide a valid email address."],
    "message": ["Please provide a message."]
  }
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

---

## Notes
1. Rate limiting is not enabled by default; consider enabling if this endpoint will be publicly accessible to mitigate spam.
2. This endpoint only stores messages; no email notifications are sent by default.
3. For consistent URLs in examples, replace host with your environment's base URL.
