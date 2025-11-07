# Next.js Migration Guide

## Overview

This document outlines the migration from the Vite + React + Express stack to Next.js 14 with App Router.

## What Changed

### Frontend
- **From:** Vite + React SPA with Wouter routing
- **To:** Next.js 14 App Router with file-based routing
- **Location:** `app/` directory (formerly `client/src/`)

### Backend
- **From:** Express.js server with REST API routes
- **To:** Next.js API Routes (Route Handlers)
- **Location:** `app/api/` directory (formerly `server/routes.ts`)

### Authentication
- **From:** Passport.js with Express session middleware
- **To:** Next.js middleware with cookie-based sessions
- **Location:** `app/api/auth/` and `middleware.ts`

## Directory Structure

```
/workspace/
├── app/                        # Next.js App Router (NEW)
│   ├── api/                    # API routes (formerly server/routes.ts)
│   │   ├── auth/              # Authentication endpoints
│   │   ├── fields/            # Field management
│   │   ├── stats/             # User statistics
│   │   ├── updates/           # Activity feed
│   │   ├── weather/           # Weather data
│   │   └── lib/               # Shared API utilities
│   ├── components/            # React components (from client/src/components)
│   │   └── ui/                # Radix UI components
│   ├── hooks/                 # React hooks (from client/src/hooks)
│   ├── lib/                   # Utilities (from client/src/lib)
│   ├── pages/                 # Page components (from client/src/pages)
│   ├── utils/                 # Utility functions
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── providers.tsx          # Client-side providers
│   └── globals.css            # Global styles
├── server/                    # Backend utilities (kept for reuse)
│   ├── db.ts                  # Database connection
│   ├── storage.ts             # Data access layer
│   └── services/              # Business logic services
├── shared/                    # Shared types and schemas
│   └── schema.ts              # Drizzle ORM schemas
├── middleware.ts              # Next.js middleware (NEW)
├── next.config.js             # Next.js configuration (NEW)
├── package.nextjs.json        # Next.js dependencies (NEW)
└── tsconfig.nextjs.json       # TypeScript config for Next.js (NEW)
```

## Key Files

### Configuration Files

1. **next.config.js** - Next.js configuration
2. **tsconfig.nextjs.json** - TypeScript configuration for Next.js
3. **package.nextjs.json** - Package dependencies for Next.js
4. **tailwind.config.nextjs.js** - Tailwind CSS configuration
5. **middleware.ts** - Global middleware for requests

### Core Application Files

1. **app/layout.tsx** - Root layout with metadata and providers
2. **app/providers.tsx** - Client-side providers (React Query, PWA)
3. **app/page.tsx** - Home page (Landing or Dashboard based on auth)

### API Routes

All API routes are now in `app/api/`:

- **Authentication:** `app/api/auth/[...auth]/route.ts`
  - GET `/api/auth/login` - Initiate OAuth login
  - GET `/api/auth/callback` - OAuth callback
  - GET `/api/auth/logout` - Logout
  - GET `/api/auth/user` - Get current user
  - PUT `/api/auth/user` - Update user profile

- **Fields:** `app/api/fields/`
  - GET `/api/fields` - List user's fields
  - POST `/api/fields` - Create new field
  - GET `/api/fields/[id]` - Get single field
  - PUT `/api/fields/[id]` - Update field
  - DELETE `/api/fields/[id]` - Delete field
  - GET `/api/fields/all-nearby` - Get all nearby fields with access control

- **Other Routes:**
  - GET `/api/stats` - User statistics
  - GET `/api/updates` - Recent activity feed
  - GET `/api/weather/[lat]/[lon]` - Weather data

## Migration Steps

### 1. Install Dependencies

```bash
# Backup old package.json
mv package.json package.old.json

# Use Next.js package.json
mv package.nextjs.json package.json

# Install dependencies
npm install
```

### 2. Update TypeScript Configuration

```bash
# Backup old tsconfig
mv tsconfig.json tsconfig.old.json

# Use Next.js tsconfig
mv tsconfig.nextjs.json tsconfig.json
```

### 3. Update Tailwind Configuration

```bash
# Backup old tailwind config
mv tailwind.config.ts tailwind.config.old.ts

# Use Next.js tailwind config
mv tailwind.config.nextjs.js tailwind.config.js
```

### 4. Environment Variables

No changes needed! Next.js uses the same `.env` file format. Your existing environment variables will work.

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` by default.

### 6. Build for Production

```bash
npm run build
npm start
```

## Authentication Changes

### Session Management

**Before (Express):**
```javascript
app.use(session({
  store: new PostgresStore(),
  secret: process.env.SESSION_SECRET,
}));
```

**After (Next.js):**
Sessions are now managed via HTTP-only cookies with base64-encoded session data. The authentication flow:

1. User visits `/api/auth/login`
2. Redirected to OAuth provider (Replit Auth)
3. OAuth callback at `/api/auth/callback`
4. Session cookie set: `fieldshare.sid`
5. Protected routes check cookie in API routes

### Protecting API Routes

**Before (Express):**
```javascript
app.get('/api/fields', isAuthenticated, async (req, res) => {
  const userId = req.user.claims.sub;
  // ...
});
```

**After (Next.js):**
```typescript
import { getUserFromRequest } from '../lib/auth';

export async function GET(request: NextRequest) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const userId = authResult.userId;
  // ...
}
```

## Routing Changes

### Client-Side Routing

**Before (Wouter):**
```tsx
import { Route, Switch } from 'wouter';

<Switch>
  <Route path="/" component={Dashboard} />
  <Route path="/fields" component={Fields} />
</Switch>
```

**After (Next.js):**
```tsx
// File-based routing
// app/page.tsx - Home (/)
// app/fields/page.tsx - Fields (/fields)
// app/profile/page.tsx - Profile (/profile)

// Use Next.js Link component
import Link from 'next/link';

<Link href="/fields">Fields</Link>
```

### Navigation

**Before:**
```tsx
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
setLocation('/dashboard');
```

**After:**
```tsx
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

## API Client Changes

### Fetch Calls

The API client in `lib/queryClient.ts` works the same! No changes needed. React Query hooks remain unchanged:

```tsx
// Still works!
const { data: fields } = useQuery({
  queryKey: ['/api/fields'],
  queryFn: async () => {
    const response = await fetch('/api/fields');
    return response.json();
  }
});
```

## Database & Services

**No changes!** All database code remains the same:
- Drizzle ORM configuration
- Database queries in `server/storage.ts`
- Service layer (`server/services/`)

## Deployment

### Replit Deployment

Next.js apps work on Replit! Update your `.replit` file:

```toml
run = "npm run dev"
[deployment]
run = ["sh", "-c", "npm run build && npm start"]
```

### Environment Variables

Same as before! Set in Replit Secrets or `.env`:
- `DATABASE_URL`
- `REPL_ID`
- `ISSUER_URL`
- `REPLIT_DOMAINS`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- etc.

## What Still Needs Implementation

The migration creates the core structure. Some routes from the original Express app need to be ported:

### API Routes to Port

1. **Admin Routes** (`/api/admin/*`)
   - User management
   - Email conflict resolution
   - Admin test endpoints

2. **Payment Routes**
   - Stripe subscription management
   - PayPal integration

3. **Integration Routes**
   - John Deere API
   - Leaf Agriculture API
   - Climate FieldView

4. **CSB (Crop Sequence Boundaries)**
   - `/api/csb/boundaries`
   - `/api/csb/stats`
   - `/api/csb/claimed`

5. **Field Access & Permissions**
   - Request access to fields
   - Approve/deny requests
   - Service provider access

6. **Field Updates & Activity**
   - Adjacent fields needing permission
   - Pending access requests

### Implementation Template

To port remaining routes, follow this pattern:

```typescript
// app/api/[route]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../lib/auth';
import { storage } from '@/server/storage';

export async function GET(request: NextRequest) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    // Your logic here
    const data = await storage.someMethod(authResult.userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Error message' },
      { status: 500 }
    );
  }
}
```

## Benefits of Next.js

1. **Performance:** Automatic code splitting, image optimization, static generation
2. **SEO:** Server-side rendering support
3. **Developer Experience:** File-based routing, built-in TypeScript support
4. **Deployment:** Optimized builds with `output: 'standalone'`
5. **Unified Codebase:** Frontend and backend in one framework
6. **Modern React:** Full support for React Server Components and Server Actions

## Troubleshooting

### Import Errors

Update imports to use Next.js paths:
```tsx
// Before
import Component from '@/components/Component';

// After (in app directory)
import Component from '@/components/Component';
// Path aliases work the same!
```

### Session Issues

Check that the session cookie is being set:
```typescript
// In browser DevTools > Application > Cookies
// Look for: fieldshare.sid
```

### Database Connection

Database connection works the same. Check:
```bash
npm run db:push  # Push schema changes
```

## Support

For issues or questions about this migration, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

## Rollback

If you need to rollback to the Vite/Express version:

```bash
mv package.json package.nextjs.json
mv package.old.json package.json
npm install
npm run dev  # Starts Express server
```
