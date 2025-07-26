import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { UserDashboard } from '@/components/UserDashboard';

export default function Dashboard() {
  const { isRole } = usePermissions();

  // Role-based dashboard rendering
  if (isRole(UserRole.ADMINISTRATOR)) {
    return <AdminDashboard />;
  }

  if (isRole(UserRole.MANAGER) || isRole(UserRole.AUDIT)) {
    return <ManagerDashboard />;
  }

  return <UserDashboard />;
}