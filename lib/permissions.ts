import type { User } from "./types"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// ============================
// LEGACY PERMISSIONS (Users table)
// ============================

// Simplified permission system - all users within a whitelabel have full access
// Only SuperAdmin role is restricted for admin panel access

// Check if user is a SuperAdmin (for admin panel access only)
export function isSuperAdmin(user: User): boolean {
  return user.role === "SuperAdmin"
}

// Check if user is an admin (includes both admin and superadmin roles)
export function isAdmin(user: User): boolean {
  const role = user.role?.toLowerCase()
  return role === "admin" || role === "superadmin"
}

// Resource-level permission checks - only verify whitelabel isolation
export function canAccessResource(user: User, resourceWhitelabelId: string): boolean {
  // Users can only access resources from their own whitelabel
  return user.whitelabelId === resourceWhitelabelId
}

export function canEditResource(user: User, resourceWhitelabelId: string): boolean {
  // All users within the same whitelabel can edit resources
  return canAccessResource(user, resourceWhitelabelId)
}

// ============================
// NEW BACKEND PERMISSIONS (Employees table)
// ============================

export interface AuthenticatedEmployee {
  id: string
  email: string
  name: string
  user_role: 'admin' | 'gestor' | 'colaborador' | 'SuperAdmin'
  whitelabel_id: string
  team_id: string | null
  role: string
  department: string
}

export interface AuthenticatedUserWithRole {
  id: string
  email: string
  name: string
  user_role: 'admin' | 'gestor' | 'colaborador' | 'SuperAdmin'
  whitelabel_id: string
  isFromEmployeeTable: boolean
}

/**
 * Get authenticated employee from Supabase Auth and employees table
 * Returns null employee if not found (not an error - user might be admin in users table only)
 */
export async function getAuthenticatedEmployee(authEmail: string): Promise<{ employee: AuthenticatedEmployee | null; error: string | null }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get employee profile by email
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, email, name, user_role, whitelabel_id, team_id, role, department")
      .eq("email", authEmail)
      .eq("status", "active")
      .single()

    if (employeeError || !employee) {
      // Not an error - user might be admin in users table only
      return { employee: null, error: null }
    }

    return { 
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        user_role: employee.user_role || 'colaborador',
        whitelabel_id: employee.whitelabel_id,
        team_id: employee.team_id,
        role: employee.role,
        department: employee.department
      }, 
      error: null 
    }
  } catch (error) {
    return { employee: null, error: null }
  }
}

/**
 * Get user role with fallback logic:
 * 1. Check both employee and users tables
 * 2. If user has SuperAdmin in either table, return SuperAdmin
 * 3. If user has admin in either table, return admin
 * 4. Otherwise, use employee.user_role or map from users.role
 * 5. Default to colaborador if no role found
 */
export async function getUserRoleWithFallback(authEmail: string, userFromUsersTable?: any): Promise<string> {
  // Get employee role
  const { employee } = await getAuthenticatedEmployee(authEmail)
  const employeeRole = employee?.user_role
  
  // Get users table role
  let usersTableRole: string | null = null
  if (userFromUsersTable?.role) {
    const userRole = userFromUsersTable.role.toLowerCase()
    // Map users table roles to standard roles
    if (userRole === 'admin' || userRole === 'superadmin') {
      usersTableRole = userRole === 'superadmin' ? 'SuperAdmin' : 'admin'
    } else if (userRole === 'manager') {
      usersTableRole = 'gestor'
    }
  }
  
  // Priority: SuperAdmin > admin > gestor > colaborador
  // If either table has SuperAdmin, use it
  if (employeeRole === 'SuperAdmin' || usersTableRole === 'SuperAdmin') {
    return 'SuperAdmin'
  }
  
  // If either table has admin, use it
  if (employeeRole === 'admin' || usersTableRole === 'admin') {
    return 'admin'
  }
  
  // If employee exists, use their role
  if (employeeRole) {
    return employeeRole
  }
  
  // Otherwise use users table role if available
  if (usersTableRole) {
    return usersTableRole
  }
  
  // Default to colaborador if no special role found
  return 'colaborador'
}

/**
 * Check if employee has permission based on user_role
 * @param userRole - Employee's user_role from database
 * @param requiredRoles - Array of roles that have access
 */
export function checkPermission(
  userRole: string, 
  requiredRoles: Array<'admin' | 'gestor' | 'colaborador' | 'SuperAdmin'>
): boolean {
  return requiredRoles.includes(userRole as any)
}

/**
 * Check if employee has access to dashboard settings
 * Only admin and SuperAdmin can access settings
 */
export function hasSettingsAccess(userRole: string): boolean {
  return checkPermission(userRole, ['admin', 'SuperAdmin'])
}

/**
 * Check if employee can view commission settings
 * Admin, gestor, and SuperAdmin can view commissions
 */
export function hasCommissionViewAccess(userRole: string): boolean {
  return checkPermission(userRole, ['admin', 'gestor', 'SuperAdmin'])
}

/**
 * Check if employee can edit commission settings
 * Only admin and SuperAdmin can edit commission settings
 */
export function hasCommissionEditAccess(userRole: string): boolean {
  return checkPermission(userRole, ['admin', 'SuperAdmin'])
}

/**
 * Check if employee has access to teams management
 * Admin, gestor, and SuperAdmin can manage teams
 */
export function hasTeamsAccess(userRole: string): boolean {
  return checkPermission(userRole, ['admin', 'gestor', 'SuperAdmin'])
}

/**
 * Check if employee has access to goals management
 * Admin, gestor, and SuperAdmin can manage goals
 */
export function hasGoalsAccess(userRole: string): boolean {
  return checkPermission(userRole, ['admin', 'gestor', 'SuperAdmin'])
}
