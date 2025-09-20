# Auth API Documentation

This document describes the endpoints for authenticating with the API using Laravel Sanctum. Users can log in with either email or username. Logout revokes only the current access token.

## Endpoints

### Login

- Method: POST
- URL: `/api/auth/login`
- Auth: Not required
- Body: `application/json`

Request Body
- `identifier`: string, required — email or username
- `password`: string, required
- `device_name`: string, optional (defaults to `api`)

Example Request
```
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "jane@example.com",
  "password": "secret",
  "device_name": "ios-app"
}
```

Example Response
```json
{
  "token": "1|Z...",
  "token_type": "Bearer",
  "user": {
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
    "identifier": ["The provided credentials are incorrect."]
  }
}
```

Notes
- If the account email is unverified, an error is returned requiring email verification.

---

### Logout

- Method: POST
- URL: `/api/auth/logout`
- Auth: Required (Sanctum)

Behavior
- Revokes the current access token only. Other tokens remain valid.

Example cURL
```
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/auth/logout
```

Example Response
```json
{ "message": "Logged out successfully." }
```

## HTTP Status Codes
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 422: Unprocessable Entity (validation failed)
- 500: Internal Server Error
