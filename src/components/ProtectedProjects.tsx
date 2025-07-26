import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import Projects from '@/pages/Projects';

export function ProtectedProjects() {
  const { user, hasAnyRole } = usePermissions();

  // Only allow managers and administrators to access projects
  if (!hasAnyRole([UserRole.MANAGER, UserRole.ADMINISTRATOR])) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage projects. Only managers and administrators can access this section.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <Layout><Projects /></Layout>;
}