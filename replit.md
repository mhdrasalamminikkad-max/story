# StoryNest - Magical Bedtime Stories Website

A child-friendly storytelling platform with parent controls, fullscreen child mode, and text-to-speech narration.

## Project Overview

StoryNest is a fully responsive web application built with React, Express, and Firebase that helps parents find bedtime stories and children build reading habits safely online.

## Tech Stack

- **Frontend**: React + Vite, TailwindCSS, Framer Motion, Shadcn UI
- **Backend**: Express.js, Firebase Authentication, Firestore
- **Features**: Web Speech API (Read Aloud), Fullscreen API (Child Mode)
- **Fonts**: Fredoka One (headings), Poppins (body text)

## Architecture

### Frontend Structure
- `client/src/pages/` - All page components (Home, Auth, Setup, Dashboard, ChildMode)
- `client/src/components/` - Reusable components (AnimatedBackground, StoryCard, PINDialog, ThemeToggle)
- `client/src/contexts/` - React contexts (ThemeContext for Day/Night mode)
- `client/src/lib/` - Firebase client setup and API utilities

### Backend Structure
- `server/routes.ts` - API endpoints for stories, bookmarks, settings, PIN verification
- `server/firebase-admin.ts` - Firebase Admin SDK initialization
- `server/middleware/auth.ts` - JWT authentication middleware
- `server/utils/crypto.ts` - PIN hashing and verification utilities
- `shared/schema.ts` - Shared TypeScript schemas and Zod validators

## Data Models

### Story
- id, userId, title, content, imageUrl, summary, createdAt, status, rejectionReason
- User-created bedtime stories with images
- Status workflow: draft → pending_review → published (or back to draft with rejection reason)
- Only published stories appear on public feed

### Parent Settings
- userId, pinHash (hashed with PBKDF2), readingTimeLimit, fullscreenLockEnabled, theme
- Security: PINs are hashed before storage

### Bookmark
- id, userId, storyId, createdAt
- Parent bookmarks for favorite stories

## User Journey

1. **Home Page** → Animated hero with floating stars and clouds
2. **Google Sign In** → Firebase Authentication
3. **Child Lock Setup** → 4-digit PIN, reading time limit, fullscreen toggle
4. **Parent Dashboard** → Add/view/bookmark stories, enter child mode
5. **Child Mode** → Fullscreen reading with text-to-speech, PIN-protected exit

## Key Features

- **Day/Night Mode**: Sunrise palette (cream, pink, sky blue) vs bedtime palette (deep blue, lavender)
- **Dreamy Animations**: Floating clouds, twinkling stars (Framer Motion)
- **Read Aloud**: Web Speech API for story narration
- **Child Lock**: Fullscreen mode with PIN-protected exit
- **Responsive Design**: Mobile-first with rounded-3xl cards and playful UI
- **Secret Admin Access**: Type "786786" and press Enter from anywhere to access admin panel
- **Story Review Workflow**: Parents submit stories for admin approval before publication

## Firebase Setup

### Required Environment Variables
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID
- `VITE_FIREBASE_API_KEY` - Your Firebase API key

### Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add a Web app (</>)
4. Enable Authentication → Google sign-in method
5. Add authorized domains (Dev URL + deployment URL)
6. Copy credentials from "SDK setup and configuration"

## Security

- Parent PINs are hashed using PBKDF2 with 10,000 iterations
- Firebase ID tokens used for API authentication
- Firestore security rules should restrict access by userId

## Recent Changes

- Implemented story submission and review workflow (draft → pending_review → published)
- Added dual-tab Parent Dashboard (Published Stories / Your Stories)
- Created Admin Panel Story Review tab with approve/reject functionality
- Added rejection reason tracking and resubmission cycle
- Implemented secret admin code (786786 + Enter) for quick admin access
- Fixed cache invalidation for real-time status updates
- Added status guards to prevent unauthorized status changes
- Fixed schema alignment (added userId, createdAt to Story)
- Implemented PIN hashing for security
- Added proper Zod validation for all endpoints

## Development

```bash
npm run dev  # Starts both Express server (5000) and Vite dev server
```

## Notes

- Firebase Admin SDK initializes with projectId from environment
- For production, add service account credentials
- All API routes require authentication except /api/stories/preview
