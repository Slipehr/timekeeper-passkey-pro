import { useAuth, UserRole } from './useAuth';

const ROLE_HIERARCHY = {
  [UserRole.USER]: 1,
  [UserRole.AUDIT]: 2,
  [UserRole.MANAGER]: 3,
  [UserRole.ADMINISTRATOR]: 4,
};

export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some(role => hasRole(role));
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const canCreateUsers = () => hasRole(UserRole.ADMINISTRATOR);
  const canViewAllReports = () => hasAnyRole([UserRole.AUDIT, UserRole.MANAGER, UserRole.ADMINISTRATOR]);
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