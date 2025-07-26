import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved';
  project: {
    id: string;
    name: string;
  };
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function Approvals() {
  const [pendingEntries, setPendingEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiRequest, handleApiError } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  // Access control is handled by RoleBasedRoute wrapper

  const fetchPendingEntries = async () => {
    try {
      setIsLoading(true);
      const timeEntries = await apiRequest('http://192.168.11.3:8200/timesheets/entries');
      const pending = timeEntries.filter((entry: any) => entry.status === 'submitted');
      setPendingEntries(pending);
    } catch (error: any) {
      handleApiError(error, 'Failed to fetch pending entries');
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

      fetchPendingEntries();
    } catch (error: any) {
      handleApiError(error, 'Failed to approve entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Time Entries</CardTitle>
          <CardDescription>
            Time entries awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.user.first_name} {entry.user.last_name}
                    </TableCell>
                    <TableCell>{entry.project.name}</TableCell>
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
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => approveEntry(entry.id)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}