import type { User } from "./types"

// Permission system for whitelabel CRM
export enum Permission {
  // Contact permissions
  VIEW_CONTACTS = "view_contacts",
  CREATE_CONTACTS = "create_contacts",
  EDIT_CONTACTS = "edit_contacts",
  DELETE_CONTACTS = "delete_contacts",

  // Deal permissions
  VIEW_DEALS = "view_deals",
  CREATE_DEALS = "create_deals",
  EDIT_DEALS = "edit_deals",
  DELETE_DEALS = "delete_deals",

  // Activity permissions
  VIEW_ACTIVITIES = "view_activities",
  CREATE_ACTIVITIES = "create_activities",
  EDIT_ACTIVITIES = "edit_activities",
  DELETE_ACTIVITIES = "delete_activities",

  // Admin permissions
  MANAGE_USERS = "manage_users",
  MANAGE_WHITELABEL = "manage_whitelabel",
  VIEW_ANALYTICS = "view_analytics",
}

// Role-based permissions
const rolePermissions: Record<string, Permission[]> = {
  admin: [
    // All contact permissions
    Permission.VIEW_CONTACTS,
    Permission.CREATE_CONTACTS,
    Permission.EDIT_CONTACTS,
    Permission.DELETE_CONTACTS,

    // All deal permissions
    Permission.VIEW_DEALS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,
    Permission.DELETE_DEALS,

    // All activity permissions
    Permission.VIEW_ACTIVITIES,
    Permission.CREATE_ACTIVITIES,
    Permission.EDIT_ACTIVITIES,
    Permission.DELETE_ACTIVITIES,

    // Admin permissions
    Permission.MANAGE_USERS,
    Permission.MANAGE_WHITELABEL,
    Permission.VIEW_ANALYTICS,
  ],
  user: [
    // Contact permissions
    Permission.VIEW_CONTACTS,
    Permission.CREATE_CONTACTS,
    Permission.EDIT_CONTACTS,

    // Deal permissions
    Permission.VIEW_DEALS,
    Permission.CREATE_DEALS,
    Permission.EDIT_DEALS,

    // Activity permissions
    Permission.VIEW_ACTIVITIES,
    Permission.CREATE_ACTIVITIES,
    Permission.EDIT_ACTIVITIES,
  ],
}

export function hasPermission(user: User, permission: Permission): boolean {
  const userPermissions = rolePermissions[user.role] || []
  return userPermissions.includes(permission)
}

export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission))
}

// Resource-level permission checks
export function canAccessResource(user: User, resourceWhitelabelId: string): boolean {
  // Users can only access resources from their own whitelabel
  return user.whitelabelId === resourceWhitelabelId
}

export function canEditResource(user: User, resourceWhitelabelId: string, resourceUserId?: string): boolean {
  // Must be from same whitelabel
  if (!canAccessResource(user, resourceWhitelabelId)) {
    return false
  }

  // Admins can edit any resource in their whitelabel
  if (user.role === "admin") {
    return true
  }

  // Users can only edit their own resources
  return resourceUserId === user.id
}
