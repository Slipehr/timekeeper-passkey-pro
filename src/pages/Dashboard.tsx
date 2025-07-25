import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { Clock, TrendingUp, Calendar, DollarSign, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  submitted: boolean;
  approved: boolean;
}

export default function Dashboard() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    thisWeekHours: 0,
    pendingEntries: 0,
    approvedHours: 0,
  });

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    const mockEntries: TimeEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        hours: 8,
        project: 'Client A - Tax Preparation',
        description: 'Annual tax filing preparation',
        submitted: true,
        approved: true,
      },
      {
        id: '2',
        date: '2024-01-16',
        hours: 6.5,
        project: 'Client B - Audit',
        description: 'Financial audit review',
        submitted: true,
        approved: false,
      },
      {
        id: '3',
        date: '2024-01-17',
        hours: 7,
        project: 'Internal - Training',
        description: 'Professional development',
        submitted: false,
        approved: false,
      },
    ];

    setTimeEntries(mockEntries);
    
    const totalHours = mockEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const approvedHours = mockEntries
      .filter(entry => entry.approved)
      .reduce((sum, entry) => sum + entry.hours, 0);
    const pendingEntries = mockEntries.filter(entry => entry.submitted && !entry.approved).length;

    setStats({
      totalHours,
      thisWeekHours: totalHours, // Simplified for demo
      pendingEntries,
      approvedHours,
    });
  }, []);

  const weeklyData = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 6.5 },
    { day: 'Wed', hours: 7 },
    { day: 'Thu', hours: 8 },
    { day: 'Fri', hours: 6 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  const projectData = [
    { name: 'Tax Preparation', hours: 24, fill: 'hsl(210, 100%, 50%)' },
    { name: 'Audit', hours: 18, fill: 'hsl(220, 100%, 60%)' },
    { name: 'Training', hours: 8, fill: 'hsl(200, 100%, 40%)' },
    { name: 'Admin', hours: 6, fill: 'hsl(230, 100%, 70%)' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your timesheet overview.
            </p>
          </div>
          <Link to="/timesheet">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeekHours}</div>
              <p className="text-xs text-muted-foreground">
                Current week total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEntries}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedHours}h</div>
              <p className="text-xs text-muted-foreground">
                Ready for billing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours</CardTitle>
              <CardDescription>
                Your time tracking for this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(210, 100%, 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
              <CardDescription>
                Hours breakdown by project type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="hours"
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
            <CardDescription>
              Your latest timesheet submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{entry.project}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.date} • {entry.hours} hours
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}