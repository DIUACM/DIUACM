# Change Password Feature

This document describes the change password functionality that has been implemented.

## Overview

The change password feature allows authenticated users to securely update their account password by providing their current password and entering a new password with confirmation.

## Routes

- `GET /profile/change-password` - Display the change password form
- `PATCH /profile/change-password` - Update the user's password

## Features

### Form Fields

**Required Fields:**
- Current Password - User's existing password for verification
- New Password - The new password (must meet strength requirements)
- Confirm New Password - Confirmation of the new password

### Validation

- Current password must be correct
- New password must be confirmed (match)
- Password strength requirements (minimum 8 characters)
- All fields are required

### Security Features

- Current password verification prevents unauthorized changes
- Password is hashed using Laravel's default hashing (bcrypt)
- Form request validation on server side
- Authentication required to access

### UI Features

- Clean, centered design consistent with other pages
- Password visibility toggle for all password fields
- Real-time validation feedback
- Loading states during form submission
- Success/error notifications using Sonner toasts
- Link back to edit profile page

## Technical Implementation

### Backend Components

- `ChangePasswordRequest` - Form request with custom validation rules
- `ProfileController@showChangePasswordForm` - Displays the change password form
- `ProfileController@changePassword` - Handles password updates
- Authentication middleware protection

### Frontend Components  

- `resources/js/pages/profile/change-password.tsx` - React component for the change password form
- Uses Inertia.js for seamless form submission
- PasswordInput component with show/hide toggle
- Tailwind CSS for styling
- Consistent design with the application theme

### Form Request Validation

The `ChangePasswordRequest` includes:
- Custom validation rule for current password verification
- Password confirmation matching
- Laravel's default password rules
- Custom error messages

### Testing

Comprehensive test suite includes:
- Change password page display
- Successful password changes
- Current password validation
- Password confirmation validation
- Required field validation
- Password strength validation
- Authentication requirements

## Integration with Profile Page

- Added "Change Password" button on the edit profile page
- Consistent navigation between profile management features
- Maintains user context and session

## Usage Flow

1. User navigates to edit profile page
2. Clicks "Change Password" button
3. Fills out the change password form:
   - Enters current password
   - Enters new password
   - Confirms new password
4. Submits form
5. Receives success notification
6. Form is reset for security
7. Can navigate back to edit profile

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── ProfileController.php (updated)
│   └── Requests/
│       └── ChangePasswordRequest.php
resources/
└── js/
    └── pages/
        └── profile/
            ├── edit.tsx (updated with change password link)
            └── change-password.tsx
tests/
└── Feature/
    └── ChangePasswordTest.php
routes/
└── web.php (password change routes)
```

## Security Considerations

- Current password verification prevents unauthorized access
- Password hashing using Laravel's secure defaults
- Form validation prevents common attack vectors
- Authentication middleware ensures only logged-in users can change passwords
- No password is stored in plain text
- Form reset after successful change prevents accidental resubmission