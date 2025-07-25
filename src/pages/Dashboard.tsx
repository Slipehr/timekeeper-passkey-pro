import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Clock, TrendingUp, Calendar, DollarSign, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
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
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any[]>([]);
  const { user } = useAuth();
  const { getAuthHeaders, handleApiError } = useApi();

  const fetchDashboardData = async () => {
    try {
      const [entriesResponse, statsResponse, chartsResponse] = await Promise.all([
        fetch('http://192.168.11.3:8200/timesheet/entries', {
          headers: getAuthHeaders(),
        }),
        fetch('http://192.168.11.3:8200/dashboard/stats', {
          headers: getAuthHeaders(),
        }),
        fetch('http://192.168.11.3:8200/dashboard/charts', {
          headers: getAuthHeaders(),
        }),
      ]);

      if (entriesResponse.ok) {
        const entries = await entriesResponse.json();
        setTimeEntries(entries.slice(0, 5)); // Show only recent 5 entries
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        setWeeklyData(chartsData.weeklyData || []);
        setProjectData(chartsData.projectData || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      handleApiError(error, 'Failed to load dashboard data');
      // Use fallback mock data
      setTimeEntries([]);
      setStats({
        totalHours: 0,
        thisWeekHours: 0,
        pendingEntries: 0,
        approvedHours: 0,
      });
      setWeeklyData([
        { day: 'Mon', hours: 0 },
        { day: 'Tue', hours: 0 },
        { day: 'Wed', hours: 0 },
        { day: 'Thu', hours: 0 },
        { day: 'Fri', hours: 0 },
        { day: 'Sat', hours: 0 },
        { day: 'Sun', hours: 0 },
      ]);
      setProjectData([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">Track your time and boost productivity</p>
          </div>
          <Link to="/timesheet">
            <Button className="btn-gradient text-lg px-6 py-3 shadow-glow hover:scale-105 transition-all duration-300">
              <Plus className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover shadow-card border-0 bg-gradient-to-br from-card to-secondary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalHours}h</div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-card border-0 bg-gradient-to-br from-card to-emerald/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <div className="p-2 bg-emerald/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.thisWeekHours}h</div>
              <p className="text-sm text-emerald">Current week total</p>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-card border-0 bg-gradient-to-br from-card to-amber/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <div className="p-2 bg-amber/10 rounded-lg">
                <Calendar className="h-5 w-5 text-amber" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.pendingEntries}</div>
              <p className="text-sm text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-card border-0 bg-gradient-to-br from-card to-violet/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Hours</CardTitle>
              <div className="p-2 bg-violet/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-violet" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.approvedHours}h</div>
              <p className="text-sm text-muted-foreground">Ready for billing</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-hover shadow-elegant border-0">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-emerald/5 rounded-t-lg">
              <CardTitle className="text-xl text-foreground">Weekly Hours</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your time tracking for this week
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-hover shadow-elegant border-0">
            <CardHeader className="bg-gradient-to-r from-violet/5 to-amber/5 rounded-t-lg">
              <CardTitle className="text-xl text-foreground">Project Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">
                Hours breakdown by project type
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    paddingAngle={5}
                    dataKey="hours"
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="card-hover shadow-elegant border-0">
          <CardHeader className="bg-gradient-to-r from-emerald/5 to-primary/5 rounded-t-lg">
            <CardTitle className="text-xl text-foreground">Recent Time Entries</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your latest timesheet submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-secondary/20 border border-border/50 rounded-xl hover:shadow-soft transition-all duration-300"
                >
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">{entry.project}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {entry.date} • {entry.hours} hours
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {entry.approved && (
                      <Badge className="status-approved shadow-soft">Approved</Badge>
                    )}
                    {entry.submitted && !entry.approved && (
                      <Badge className="status-pending shadow-soft">Pending</Badge>
                    )}
                    {!entry.submitted && (
                      <Badge className="status-draft shadow-soft">Draft</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}