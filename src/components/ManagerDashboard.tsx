import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, TrendingUp, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { getBaseUrl } from "../utils/getBaseUrl";

interface DashboardStats {
  totalHours: number;
  projectsActive: number;
  pendingEntries: number;
  completedEntries: number;
}

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved';
  project: any; // Could be ID string or object
  projectName?: string; // Added for mapped entries
  userName?: string; // Added for mapped entries
}

export function ManagerDashboard() {
  const { canApproveTimeEntries } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    projectsActive: 0,
    pendingEntries: 0,
    completedEntries: 0,
  });
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiRequest, handleApiError } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch timesheet entries, projects, and users
      const [timeEntries, projects, users] = await Promise.all([
        apiRequest(`${getBaseUrl()}/timesheets/entries`),
        apiRequest(`${getBaseUrl()}/projects`),
        apiRequest(`${getBaseUrl()}/auth/users`)
      ]);

      // Calculate stats
      const pending = timeEntries.filter((entry: any) => entry.status === 'submitted');
      const approved = timeEntries.filter((entry: any) => entry.status === 'approved');
      const activeProjects = projects.filter((project: any) => project.status === 'active');
      const totalHours = approved.reduce((sum: number, entry: any) => sum + entry.hours, 0);

      setStats({
        totalHours,
        projectsActive: activeProjects.length,
        pendingEntries: pending.length,
        completedEntries: approved.length,
      });

      // Map project IDs to names and user IDs to names, show latest 10 pending entries
      const mappedPending = pending.slice(0, 10).map((entry: any) => {
        // Handle project field - could be ID string or full object
        let projectName = 'Unknown Project';
        if (typeof entry.project === 'object' && entry.project?.name) {
          projectName = entry.project.name;
        } else if (typeof entry.project === 'string') {
          const project = projects.find((p: any) => p.id === entry.project);
          projectName = project ? project.name : entry.project;
        }
        
        // Map user ID to user name
        let userName = 'Unknown User';
        if (entry.user_id) {
          const user = users.find((u: any) => u.id === entry.user_id);
          if (user) {
            userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
          }
        }
        
        return {
          ...entry,
          projectName,
          userName
        };
      });
      
      setPendingEntries(mappedPending);
    } catch (error: any) {
      handleApiError(error, 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const approveEntry = async (entryId: string) => {
    try {
      await apiRequest(`http://192.168.11.3:8200/timesheets/${entryId}/approve`, {
        method: 'PUT',
      });

      toast({
        title: "Success",
        description: "Time entry approved successfully",
      });

      // Refresh data
      fetchDashboardData();
    } catch (error: any) {
      handleApiError(error, 'Failed to approve entry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <Button onClick={() => window.location.href = '/approvals'}>
          View All Approvals
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">Approved hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsActive}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedEntries}</div>
            <p className="text-xs text-muted-foreground">Approved entries</p>
          </CardContent>
        </Card>
      </div>

      {pendingEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Latest 10 time entries awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.userName || 'Unknown User'}
                    </TableCell>
                     <TableCell>
                       {entry.projectName || 'Unknown Project'}
                     </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{entry.hours}h</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      {entry.status === 'submitted' && canApproveTimeEntries() && (
                        <Button
                          size="sm"
                          onClick={() => approveEntry(entry.id)}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}