# Edit Profile Page

This document describes the edit profile functionality that has been implemented.

## Overview

The edit profile feature allows authenticated users to update their profile information including personal details, competitive programming handles, and academic information.

## Routes

- `GET /profile/edit` - Display the edit profile form
- `PATCH /profile` - Update the user's profile

## Features

### Form Fields

**Required Fields:**
- Name - User's full name
- Username - Unique username for the platform

**Optional Fields:**
- Gender - Select from Male, Female, or Other
- Phone - Contact phone number
- Codeforces Handle - Competitive programming handle
- AtCoder Handle - Competitive programming handle  
- VJudge Handle - Competitive programming handle
- Department - Academic department
- Student ID - Academic student identifier

**Read-only Fields:**
- Email - Cannot be changed from this form

### Validation

- Name and username are required
- Username must be unique (except for current user)
- Username can only contain letters, numbers, dashes, and underscores
- Phone number limited to 20 characters
- All other fields have appropriate length limits

### UI Features

- Clean, modern design with dark mode support
- Organized sections for different types of information
- Real-time validation feedback
- Loading states during form submission
- Success/error notifications using Sonner toasts

### Security

- Authentication required to access
- Form request validation on server side
- CSRF protection via Inertia.js

## Technical Implementation

### Backend Components

- `ProfileController` - Handles display and update logic
- `UpdateProfileRequest` - Form request for validation
- Authentication middleware protection

### Frontend Components  

- `resources/js/pages/profile/edit.tsx` - React component for the edit form
- Uses Inertia.js for seamless form submission
- Tailwind CSS for styling
- Shadcn/ui components for form elements

### Testing

Comprehensive test suite includes:
- Profile page display
- Profile information updates
- Validation testing (required fields, unique username)
- Authentication requirements
- Edge cases (keeping same username)

## Usage

1. User must be authenticated
2. Navigate to `/profile/edit`
3. Update desired fields
4. Submit form
5. Receive success notification and stay on edit page

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── ProfileController.php
│   └── Requests/
│       └── UpdateProfileRequest.php
resources/
└── js/
    └── pages/
        └── profile/
            └── edit.tsx
tests/
└── Feature/
    └── ProfileUpdateTest.php
routes/
└── web.php (profile routes)
```