import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Timesheet from '@/pages/Timesheet';

export function ProtectedTimesheet() {
  console.log('ProtectedTimesheet: Starting render');
  const { user, hasAnyRole } = usePermissions();
  console.log('ProtectedTimesheet: User and permissions loaded', { user, hasAnyRole });

  // Only allow users and managers to access timesheet
  if (!hasAnyRole([UserRole.USER, UserRole.MANAGER])) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Administrators and audit users cannot access the timesheet. This is for time entry only.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  console.log('ProtectedTimesheet: Rendering Timesheet component');
  return <Timesheet />;
}