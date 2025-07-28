import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, TrendingUp, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalHours: number;
  pendingEntries: number;
  approvedEntries: number;
  draftEntries: number;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved';
  project: any; // Could be ID string or object
  projectName?: string; // Added for mapped entries
}

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    pendingEntries: 0,
    approvedEntries: 0,
    draftEntries: 0,
  });
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiRequest, handleApiError } = useApi();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch user's timesheet entries and projects
      const [timeEntries, projects] = await Promise.all([
        apiRequest('/timesheets/entries/'),
        apiRequest('/projects/')
      ]);
      
      // Filter entries for current user
      const userEntries = timeEntries.filter((entry: any) => entry.user_id === user?.id);

      // Calculate stats
      const pending = userEntries.filter((entry: any) => entry.status === 'submitted');
      const approved = userEntries.filter((entry: any) => entry.status === 'approved');
      const drafts = userEntries.filter((entry: any) => entry.status === 'draft');
      const totalHours = approved.reduce((sum: number, entry: any) => sum + entry.hours, 0);

      setStats({
        totalHours,
        pendingEntries: pending.length,
        approvedEntries: approved.length,
        draftEntries: drafts.length,
      });

      // Map project IDs to names for recent entries and show recent 5 entries
      const mappedEntries = userEntries.slice(0, 5).map((entry: any) => {
        // Handle project field - could be ID string or full object
        let projectName = 'Unknown Project';
        if (typeof entry.project === 'object' && entry.project?.name) {
          projectName = entry.project.name;
        } else if (typeof entry.project === 'string') {
          const project = projects.find((p: any) => p.id === entry.project);
          projectName = project ? project.name : entry.project;
        }
        
        return {
          ...entry,
          projectName
        };
      });
      
      setRecentEntries(mappedEntries);
    } catch (error: any) {
      handleApiError(error, 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Entries</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedEntries}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftEntries}</div>
            <p className="text-xs text-muted-foreground">Not submitted</p>
          </CardContent>
        </Card>
      </div>

      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
            <CardDescription>
              Your latest 5 time entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
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