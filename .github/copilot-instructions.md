# Copilot Instructions for Shopify Dashboard

## 🚨 CRITICAL RULES - READ FIRST

### 1. **ALWAYS ANALYZE BEFORE CREATING**
- ✅ Check existing files and structure FIRST
- ✅ Plan and ask before creating new files
- ✅ Avoid duplicates at all costs
- ❌ Never create files without checking existing ones

### 2. **PROJECT STRUCTURE**

#### Backend Structure:
```
backend/src/
├── controllers/
│   ├── authController.js     (auth only: register, login, logout, refresh, change password)
│   ├── userController.js     (user profile: avatar, profile, stats, deactivate)
│   └── notificationController.js (notifications: CRUD, preferences)
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── notificationRoutes.js
├── models/
├── middleware/
├── utils/
├── services/
└── config/
    └── database.js (SINGLE database connection file)
```

#### Frontend Structure:
```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── components/
│   └── user/
│       ├── api/
│       ├── hooks/
│       └── components/
├── stores/ (GLOBAL stores only)
├── lib/
│   └── api.js (USE THIS for HTTP requests)
└── components/ (shared components)
```

### 3. **CONTROLLER RESPONSIBILITIES**

#### AuthController (authController.js):
- ✅ registerUser, loginUser, logoutUser
- ✅ refreshAccessToken, changeCurrentPassword
- ❌ NO profile updates, avatar handling, preferences

#### UserController (userController.js):
- ✅ getUserProfile, updateUserProfile
- ✅ uploadAvatar, deleteAvatar
- ✅ getUserStats, deactivateAccount
- ✅ updateNotificationPreferences (user-specific)
- ❌ NO auth-related functions

#### NotificationController (notificationController.js):
- ✅ getUserNotifications, markAsRead, deleteNotification
- ✅ createNotification, createSystemNotification
- ✅ getNotificationPreferences, updateNotificationPreferences (system-wide)
- ❌ NO user profile preferences

### 4. **IMPORT ALIASES**
Always use these import paths:
```javascript
// Controllers
import { User } from '@/models/User.js';
import { ApiError } from '@/utils/ApiError.js';
import { ApiResponse } from '@/utils/ApiResponse.js';
import asyncHandler from '@/utils/AsyncHandle.js';

// Frontend
import { api } from '@/lib/api.js';
import useAuthStore from '@/stores/authStore.js';
```

### 5. **AVOID THESE MISTAKES**
- ❌ Creating duplicate database connection files
- ❌ Adding auth functions to userController
- ❌ Adding user profile functions to authController
- ❌ Creating duplicate API files (use lib/api.js)
- ❌ Creating stores inside features (stores are global)
- ❌ Using Redis when not needed (use express-rate-limit)

### 6. **FILE UPLOAD HANDLING**
- 🎯 Use ONE function for avatar upload (handles existing image replacement)
- 🎯 Multer auto-creates temp folders
- 🎯 Always delete old Cloudinary image before uploading new one

### 7. **NOTIFICATION PREFERENCES**
- User preferences (email, push, SMS) → userController
- System notification settings → notificationController
- Keep them separate and simple

### 8. **BEFORE MAKING CHANGES**
1. Read existing files
2. Understand current structure
3. Plan the changes
4. Ask if unsure about file responsibility
5. Never duplicate functionality

## 📝 CURRENT STATE NOTES
- Backend: Auth, User, Notification controllers separated
- Frontend: Feature-based structure with global stores
- Database: Single connection file (database.js)
- No Redis dependency (using express-rate-limit)
- Avatar upload with Cloudinary integration
- JWT-based authentication with cookies

## 🔄 UPDATE THIS FILE
Update this file as the project evolves to maintain consistency and avoid confusion.
