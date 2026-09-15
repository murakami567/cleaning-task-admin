export const ADMIN_PORTAL_ROLES = [
  "master_admin",
  "admin",
  "leader",
  "sub_admin",
  "operation",
  "payroll_admin",
  "prep_viewer",
] as const;

export const PAYROLL_ROLES = [
  "master_admin",
  "admin",
  "leader",
  "sub_admin",
  "payroll_admin",
] as const;

export function isMasterAdmin(role?: string | null) {
  return role === "master_admin";
}

export function hasAdminRole(role?: string | null) {
  return role === "master_admin" || role === "admin";
}

export function canAccessAdminPortal(role?: string | null) {
  return !!role && (ADMIN_PORTAL_ROLES as readonly string[]).includes(role);
}

export function canAccessPayroll(role?: string | null) {
  return !!role && (PAYROLL_ROLES as readonly string[]).includes(role);
}
