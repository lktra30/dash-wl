# Admin Dashboard Implementation

## Overview
This document describes the implementation of the SuperAdmin dashboard for managing whitelabels in the system.

## Created Files

### 1. `/app/admin/page.tsx`
The main admin dashboard page with the following features:
- View all whitelabels in a table format
- Edit existing whitelabels
- Create new whitelabels
- Authorization check (only SuperAdmin can access)
- Uses shadcn components for UI (Table, Dialog, Card, Button, etc.)

**Fields managed:**
- Name
- Domain
- Brand Color (with color picker)
- Business Model (MRR/TCV)
- Meta Ads Account ID
- Team Competition toggle

### 2. `/app/api/auth/check-superadmin/route.ts`
API endpoint to verify if the current user has SuperAdmin role.

**Route:** `GET /api/auth/check-superadmin`

**Response:**
```json
{
  "isSuperAdmin": true/false
}
```

### 3. `/app/api/admin/whitelabels/route.ts`
API endpoints for listing and creating whitelabels.

**Routes:**
- `GET /api/admin/whitelabels` - List all whitelabels
- `POST /api/admin/whitelabels` - Create new whitelabel

### 4. `/app/api/admin/whitelabels/[id]/route.ts`
API endpoints for updating and deleting specific whitelabels.

**Routes:**
- `PUT /api/admin/whitelabels/[id]` - Update whitelabel
- `DELETE /api/admin/whitelabels/[id]` - Delete whitelabel

## Database Changes

### Migration: `add_superadmin_role_to_employees`
Updated the `employees` table to support the `SuperAdmin` role:
```sql
ALTER TABLE employees
DROP CONSTRAINT IF EXISTS employees_user_role_check;

ALTER TABLE employees
ADD CONSTRAINT employees_user_role_check 
CHECK (user_role = ANY (ARRAY['admin'::text, 'gestor'::text, 'colaborador'::text, 'SuperAdmin'::text]));
```

### Migration: `add_superadmin_to_users_role`
Updated the `users` table to support the `SuperAdmin` role:
```sql
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'sales'::text, 'SuperAdmin'::text]));
```

## SuperAdmin User Created

**Important:** The SuperAdmin user is stored in the `public.users` table, NOT in `employees`. 
All authenticated users (`auth.users`) must have a corresponding record in `public.users` with the same UUID.

**Email:** arthuurfcarvalho@gmail.com  
**Password:** Senha1704#  
**Auth User ID:** 3298cfd1-ab00-4436-ab1a-37b999aa82f3  
**Whitelabel ID:** 70452663-7f7f-43e9-9fa4-ed999b1805ff  
**Whitelabel Name:** SuperAdmin Dashboard  
**Role:** SuperAdmin (in `users.role` column)

## Access Control

### Middleware Update
Updated `middleware.ts` to require authentication for `/admin` routes in addition to `/dashboard` routes.
Unauthenticated users are automatically redirected to the login page (`/`).

### Authorization Flow
1. User must be authenticated via Supabase Auth (`auth.users`)
2. User must have a corresponding record in `public.users` with the same UUID
3. User's `public.users.role` must be `'SuperAdmin'`
4. All API routes check SuperAdmin status before allowing operations
5. Frontend checks authorization and redirects to dashboard if unauthorized

### Important Architecture Notes

**User Tables Structure:**

- **auth.users** (Supabase Auth)
  - Contains authentication credentials
  - Managed by Supabase Auth system
  - Every authenticated user must be here

- **public.users** (Application Users)
  - Contains user profile and business data
  - **REQUIRED:** Every `auth.users` record must have a matching `public.users` record with the same UUID
  - Used for authorization checks (via `role` column)
  - Linked to whitelabels
  - SuperAdmin users are identified here

- **public.employees** (Employee Management)
  - Optional table for employee-specific data
  - NOT all users need to be employees
  - Separate from authentication/authorization flow
  - Has its own `user_role` field (different from `users.role`)

## Security Features

- Server-side authentication checks on all admin API routes
- Client-side authorization check before rendering admin dashboard
- Automatic redirect if user is not SuperAdmin
- Automatic redirect to login for unauthenticated users
- Toast notifications for unauthorized access attempts

## How to Access

1. Navigate to `/admin` in the browser
2. Login with SuperAdmin credentials:
   - Email: arthuurfcarvalho@gmail.com
   - Password: Senha1704#
3. You'll see the admin dashboard with all whitelabels listed

## Features

### View Whitelabels
- Table view with all whitelabel information
- Visual representation of brand colors
- Status badges for business model and team competition

### Edit Whitelabel
- Click the pencil icon on any whitelabel row
- Edit dialog opens with current values
- Color picker for brand color selection
- Dropdown for business model selection
- Save changes or cancel

### Create Whitelabel
- Click "Novo Whitelabel" button
- Fill in required fields (Name is mandatory)
- Optional fields: domain, meta ads account ID
- Set brand color and business model
- Toggle team competition feature

## UI Components Used

All components from shadcn/ui:
- `Table` - Display whitelabels
- `Dialog` - Edit/Create forms
- `Card` - Page layout
- `Button` - Actions
- `Input` - Form fields
- `Label` - Form labels
- `Select` - Dropdowns
- `Badge` - Status indicators
- `Skeleton` - Loading states
- `Sonner` - Toast notifications

## Notes

- This is a private admin-only feature
- Only the SuperAdmin user has access
- No public registration or access is allowed
- All operations are logged and auditable through Supabase
