import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  BarChart3,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { usePermissions } from '@/hooks/usePermissions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  submitted: boolean;
  approved: boolean;
  user: string;
}

interface ReportFilters {
  startDate: Date | undefined;
  endDate: Date | undefined;
  project: string;
  user: string;
  status: string;
}

const statusOptions = [
  'All Statuses',
  'Draft',
  'Submitted', 
  'Approved',
];

export default function Reports() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<string[]>(['All Projects']);
  const [users, setUsers] = useState<string[]>(['All Users']);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    project: 'All Projects',
    user: 'All Users',
    status: 'All Statuses',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { getAuthHeaders, handleApiError } = useApi();
  const { canViewAllReports } = usePermissions();

  const fetchReportsData = async () => {
    try {
      const [entriesResponse, projectsResponse, usersResponse] = await Promise.all([
        fetch('http://192.168.11.3:8200/timesheets/entries', {
          headers: getAuthHeaders(),
        }),
        fetch('http://192.168.11.3:8200/projects', {
          headers: getAuthHeaders(),
        }),
        fetch('http://192.168.11.3:8200/users', {
          headers: getAuthHeaders(),
        }),
      ]);

      if (entriesResponse.ok && projectsResponse.ok) {
        const [entriesData, projectsData] = await Promise.all([
          entriesResponse.json(),
          projectsResponse.json()
        ]);
        
        console.log('Reports raw entries:', entriesData);
        
        // Map the API response and convert project IDs to names
        const mappedEntries = entriesData.map((entry: any) => {
          // Handle project field - could be ID string or full object
          let projectName = 'Unknown Project';
          if (typeof entry.project === 'object' && entry.project?.name) {
            projectName = entry.project.name;
          } else if (typeof entry.project === 'string') {
            const project = projectsData.find((p: any) => p.id === entry.project);
            projectName = project ? project.name : entry.project;
          } else if (entry.project_id) {
            const project = projectsData.find((p: any) => p.id === entry.project_id);
            projectName = project ? project.name : entry.project_id;
          }
          
          return {
            id: entry.id,
            date: entry.date,
            hours: entry.hours,
            project: projectName,
            description: entry.description,
            submitted: entry.status === "submitted" || entry.status === "approved",
            approved: entry.status === "approved",
            user: entry.user || 'Unknown User',
          };
        });
        
        setEntries(mappedEntries);
        setFilteredEntries(mappedEntries);
        
        // Set project names for filter dropdown
        setProjects(['All Projects', ...projectsData.map((p: any) => p.name)]);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(['All Users', ...usersData.map((u: any) => u.name)]);
      }
    } catch (error: any) {
      console.error('Failed to fetch reports data:', error);
      handleApiError(error, 'Failed to load reports data');
      // Use fallback data
      setEntries([]);
      setFilteredEntries([]);
      setProjects([
        'All Projects',
        'Client A - Tax Preparation',
        'Client B - Audit',
        'Client C - Bookkeeping',
        'Internal - Training',
        'Internal - Admin',
        'Internal - Marketing',
      ]);
      setUsers([
        'All Users',
        'John Doe',
        'Jane Smith',
        'Michael Johnson',
        'Sarah Williams',
      ]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  useEffect(() => {
    // Apply filters
    let filtered = entries;

    if (filters.startDate) {
      filtered = filtered.filter(entry => new Date(entry.date) >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(entry => new Date(entry.date) <= filters.endDate!);
    }

    if (filters.project !== 'All Projects') {
      filtered = filtered.filter(entry => entry.project === filters.project);
    }

    if (filters.user !== 'All Users') {
      filtered = filtered.filter(entry => entry.user === filters.user);
    }

    if (filters.status !== 'All Statuses') {
      filtered = filtered.filter(entry => {
        if (filters.status === 'Draft') return !entry.submitted;
        if (filters.status === 'Submitted') return entry.submitted && !entry.approved;
        if (filters.status === 'Approved') return entry.approved;
        return true;
      });
    }

    setFilteredEntries(filtered);
  }, [entries, filters]);

  const handleQuickFilter = (type: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (type) {
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
    }

    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Description', 'Hours', 'Status'];
    const csvData = filteredEntries.map(entry => [
      entry.date,
      entry.user,
      entry.project,
      entry.description,
      entry.hours.toString(),
      entry.approved ? 'Approved' : entry.submitted ? 'Submitted' : 'Draft',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Your timesheet report has been downloaded.",
    });
  };

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = filteredEntries
    .filter(entry => entry.approved)
    .reduce((sum, entry) => sum + entry.hours, 0);
  const pendingHours = filteredEntries
    .filter(entry => entry.submitted && !entry.approved)
    .reduce((sum, entry) => sum + entry.hours, 0);

  // Chart data
  const projectData = projects
    .filter(p => p !== 'All Projects')
    .map(project => ({
      name: project.split(' - ')[1] || project,
      hours: filteredEntries
        .filter(entry => entry.project === project)
        .reduce((sum, entry) => sum + entry.hours, 0),
    }))
    .filter(item => item.hours > 0);

  const dailyData = filteredEntries
    .reduce((acc, entry) => {
      const date = entry.date;
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.hours += entry.hours;
      } else {
        acc.push({ date, hours: entry.hours });
      }
      return acc;
    }, [] as { date: string; hours: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Analyze timesheet data and generate reports
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter your timesheet data to generate custom reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('week')}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('month')}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter('quarter')}
              >
                This Quarter
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(filters.startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(filters.endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={filters.project}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {canViewAllReports && (
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select
                    value={filters.user}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, user: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours}</div>
              <p className="text-xs text-muted-foreground">
                Filtered period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedHours}</div>
              <p className="text-xs text-muted-foreground">
                Ready for billing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Hours</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingHours}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredEntries.length}</div>
              <p className="text-xs text-muted-foreground">
                Time entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hours by Project</CardTitle>
              <CardDescription>
                Time distribution across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(210, 100%, 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Hours Trend</CardTitle>
              <CardDescription>
                Hours logged over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(210, 100%, 50%)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Report</CardTitle>
            <CardDescription>
              Complete list of filtered time entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No entries found</p>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium">{entry.project}</p>
                        <Badge variant="outline">{entry.user}</Badge>
                        <div>
                          {entry.approved && (
                            <Badge variant="default">Approved</Badge>
                          )}
                          {entry.submitted && !entry.approved && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {!entry.submitted && (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} • {entry.hours} hours
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}