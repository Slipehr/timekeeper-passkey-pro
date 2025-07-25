import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface RoleBasedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
  showError?: boolean;
}

export function RoleBasedRoute({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallbackPath = "/dashboard",
  showError = false 
}: RoleBasedRouteProps) {
  const { hasRole, hasAnyRole, user } = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = requiredRole 
    ? hasRole(requiredRole)
    : requiredRoles 
      ? hasAnyRole(requiredRoles)
      : true;

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Access denied. You don't have the required permissions to view this page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}