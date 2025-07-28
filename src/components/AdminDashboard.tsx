import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, UserCheck, Shield, UserCog } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/hooks/useAuth';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  newUsersQuarter: number;
  newUsersYear: number;
  roleDistribution: {
    [key in UserRole]: number;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    newUsersQuarter: 0,
    newUsersYear: 0,
    roleDistribution: {
      [UserRole.USER]: 0,
      [UserRole.AUDIT]: 0,
      [UserRole.MANAGER]: 0,
      [UserRole.ADMINISTRATOR]: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { apiRequest, handleApiError } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/auth/users/');
      
      // Calculate stats from users data
      const users = response;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

      // Calculate role distribution
      const roleDistribution = {
        [UserRole.USER]: users.filter((user: any) => user.role === UserRole.USER).length,
        [UserRole.AUDIT]: users.filter((user: any) => user.role === UserRole.AUDIT).length,
        [UserRole.MANAGER]: users.filter((user: any) => user.role === UserRole.MANAGER).length,
        [UserRole.ADMINISTRATOR]: users.filter((user: any) => user.role === UserRole.ADMINISTRATOR).length,
      };

      const userStats = {
        totalUsers: users.length,
        activeUsers: users.filter((user: any) => user.last_login_at).length,
        inactiveUsers: users.filter((user: any) => !user.last_login_at).length,
        newUsersToday: users.filter((user: any) => new Date(user.registered_at) >= today).length,
        newUsersWeek: users.filter((user: any) => new Date(user.registered_at) >= weekAgo).length,
        newUsersMonth: users.filter((user: any) => new Date(user.registered_at) >= monthAgo).length,
        newUsersQuarter: users.filter((user: any) => new Date(user.registered_at) >= quarterAgo).length,
        newUsersYear: users.filter((user: any) => new Date(user.registered_at) >= yearAgo).length,
        roleDistribution,
      };

      setStats(userStats);
    } catch (error: any) {
      handleApiError(error, 'Failed to fetch admin statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Users who have logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">Never logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">Registered today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>New Users This Week</CardTitle>
                <CardDescription>Users registered in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.newUsersWeek}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Role Distribution</CardTitle>
                <CardDescription>Total users by role in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Users</span>
                  <span className="font-semibold">{stats.roleDistribution[UserRole.USER]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Audit</span>
                  <span className="font-semibold">{stats.roleDistribution[UserRole.AUDIT]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Managers</span>
                  <span className="font-semibold">{stats.roleDistribution[UserRole.MANAGER]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Administrators</span>
                  <span className="font-semibold">{stats.roleDistribution[UserRole.ADMINISTRATOR]}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Users This Month</CardTitle>
              <CardDescription>Users registered in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.newUsersMonth}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Users This Quarter</CardTitle>
              <CardDescription>Users registered in the last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.newUsersQuarter}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Users This Year</CardTitle>
              <CardDescription>Users registered in the last 365 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.newUsersYear}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Roles Distribution</CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Users', value: stats.roleDistribution[UserRole.USER], fill: '#8884d8' },
                    { name: 'Audit', value: stats.roleDistribution[UserRole.AUDIT], fill: '#82ca9d' },
                    { name: 'Managers', value: stats.roleDistribution[UserRole.MANAGER], fill: '#ffc658' },
                    { name: 'Administrators', value: stats.roleDistribution[UserRole.ADMINISTRATOR], fill: '#ff7c7c' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#8884d8" />
                  <Cell fill="#82ca9d" />
                  <Cell fill="#ffc658" />
                  <Cell fill="#ff7c7c" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Statistics</CardTitle>
            <CardDescription>Number of users per role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { role: 'Users', count: stats.roleDistribution[UserRole.USER], icon: '👤' },
                  { role: 'Audit', count: stats.roleDistribution[UserRole.AUDIT], icon: '🔍' },
                  { role: 'Managers', count: stats.roleDistribution[UserRole.MANAGER], icon: '👔' },
                  { role: 'Admins', count: stats.roleDistribution[UserRole.ADMINISTRATOR], icon: '🛡️' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleDistribution[UserRole.USER]}</div>
            <p className="text-xs text-muted-foreground">Standard user access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleDistribution[UserRole.AUDIT]}</div>
            <p className="text-xs text-muted-foreground">Can review and audit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleDistribution[UserRole.MANAGER]}</div>
            <p className="text-xs text-muted-foreground">Management access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.roleDistribution[UserRole.ADMINISTRATOR]}</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}