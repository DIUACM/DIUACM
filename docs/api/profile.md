# Profile API Documentation

This document describes the authenticated endpoints for fetching the authenticated profile, updating a user's profile, and uploading a profile picture.

## Authentication
- All endpoints require Sanctum authentication.
- Include a valid bearer token: `Authorization: Bearer <token>`.

## Endpoints

### Get Profile

- Method: GET
- URL: `/api/profile`
- Auth: Required (Sanctum)

Example Response
```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "gender": "female",
    "phone": "+8801XXXXXXXXX",
    "codeforces_handle": null,
    "atcoder_handle": null,
    "vjudge_handle": null,
    "department": "CSE",
    "student_id": null,
    "max_cf_rating": 1650,
    "profile_picture": "https://.../path/to/original.jpg"
  }
}
```

### Update Profile

- Method: PUT
- URL: `/api/profile`
- Auth: Required (Sanctum)

Fields you can update (partial updates supported). The `email` and
`max_cf_rating` fields are prohibited and will return a validation error if
present.

Request Body (JSON):
- `name`: string, min 3, max 255
- `username`: string, min 3, max 255, unique (ignores your current user)
- `gender`: one of `male`, `female`, `other`
- `phone`: string, max 50, nullable
- `codeforces_handle`: string, max 255, nullable
- `atcoder_handle`: string, max 255, nullable
- `vjudge_handle`: string, max 255, nullable
- `department`: string, max 255, nullable
- `student_id`: string, max 255, nullable
- `email`: prohibited
- `max_cf_rating`: prohibited
  

Example Request
```
PUT /api/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Doe",
  "username": "janedoe",
  "gender": "female",
  "phone": "+8801XXXXXXXXX",
  "department": "CSE"
}
```

Example Response
```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "gender": "female",
    "phone": "+8801XXXXXXXXX",
    "codeforces_handle": null,
    "atcoder_handle": null,
    "vjudge_handle": null,
    "department": "CSE",
    "student_id": null,
    "max_cf_rating": 1650,
    "profile_picture": "https://.../path/to/original.jpg"
  }
}
```

Validation Errors
```json
{
  "message": "Validation failed",
  "errors": {
    "username": ["The username has already been taken."]
  }
}
```

Another Example (prohibited field)
```json
{
  "message": "Validation failed",
  "errors": {
    "email": [
      "The email field is prohibited."
    ]
  }
}
```

Multiple Errors Example (min length)
```json
{
  "message": "Validation failed",
  "errors": {
    "name": [
      "The name field must be at least 3 characters."
    ],
    "username": [
      "The username field must be at least 3 characters."
    ]
  }
}
```

Notes
- Partial updates: only include fields you want to change. Unspecified fields
  remain unchanged.
- The `email` and `max_cf_rating` fields are prohibited on this endpoint and
  will produce a 422 validation error if sent.

---

### Upload Profile Picture

- Method: POST
- URL: `/api/profile/picture`
- Auth: Required (Sanctum)
- Content-Type: `multipart/form-data`

Form Fields
- `profile_picture`: required file, image (jpg, jpeg, png, webp), max 5 MB

Example cURL
```
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "profile_picture=@/full/path/to/avatar.jpg" \
  http://localhost:8000/api/profile/picture
```

Example Response
```json
{
  "message": "Profile picture uploaded successfully.",
  "data": {
    "url": "https://.../media/original.jpg"
  }
}
```

Validation Errors
```json
{
  "message": "Validation failed",
  "errors": {
    "profile_picture": [
      "The profile picture field is required."
    ]
  }
}
```

---

## HTTP Status Codes
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity (validation failed)
- 500: Internal Server Error
