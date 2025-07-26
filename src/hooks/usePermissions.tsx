import { useAuth, UserRole } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  // Exact role matching - no hierarchy
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const canCreateUsers = () => hasRole(UserRole.ADMINISTRATOR);
  const canViewAllReports = () => hasAnyRole([UserRole.AUDIT, UserRole.MANAGER]);
  const canAuditTimeEntries = () => hasRole(UserRole.AUDIT);
  const canManageProjects = () => hasRole(UserRole.MANAGER);
  const canApproveTimeEntries = () => hasAnyRole([UserRole.AUDIT, UserRole.MANAGER]);

  return {
    user,
    hasRole,
    hasAnyRole,
    isRole,
    canCreateUsers,
    canViewAllReports,
    canAuditTimeEntries,
    canManageProjects,
    canApproveTimeEntries,
  };
}