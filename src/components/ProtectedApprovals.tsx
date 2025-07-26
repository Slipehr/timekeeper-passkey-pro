import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import Approvals from '@/pages/Approvals';

export function ProtectedApprovals() {
  const { user, hasAnyRole } = usePermissions();

  // Only allow audit and manager roles to access approvals
  if (!hasAnyRole([UserRole.AUDIT, UserRole.MANAGER])) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access approvals. Only audit users and managers can access this section.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <Layout><Approvals /></Layout>;
}