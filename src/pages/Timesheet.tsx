import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Save, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  submitted: boolean;
  approved: boolean;
}


export default function Timesheet() {
  console.log('Timesheet: Component starting to render');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Array<{id: string, name: string, status?: string}>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    project_id: '',
    description: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { getAuthHeaders, handleApiError } = useApi();

  const fetchEntries = async () => {
    try {
      const response = await fetch('http://192.168.11.3:8200/timesheets/', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Map the API response to match our interface with new status field
        const mappedEntries = data.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          hours: entry.hours,
          project: entry.project_id || entry.project,
          description: entry.description,
          submitted: entry.status === "submitted" || entry.status === "approved",
          approved: entry.status === "approved",
        }));
        
        console.log('Mapped entries with submitted status:', mappedEntries.map(e => ({
          id: e.id,
          submitted: e.submitted,
          approved: e.approved
        })));
        
        setEntries(mappedEntries);
      }
    } catch (error: any) {
      console.error('Failed to fetch entries:', error);
      handleApiError(error, 'Failed to load timesheet entries');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://192.168.11.3:8200/projects', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response for projects:', data);
        
        // Transform and validate project data to prevent React rendering errors
        const validatedProjects = Array.isArray(data) ? data
          .filter((project: any) => project.status === 'active')
          .map(project => {
            // Only keep the properties we need and ensure they're simple values
            const validatedProject = {
              id: String(project.id || ''),
              name: String(project.name || 'Unnamed Project'),
              status: String(project.status || 'active')
            };
            console.log('Transformed project:', validatedProject);
            return validatedProject;
          })
          .filter(project => project.id && project.name) : [];
        
        console.log('Final validated projects:', validatedProjects);
        setProjects(validatedProjects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      // Set empty array as fallback to prevent rendering errors
      setProjects([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchProjects();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.hours || !formData.project_id || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours (0-24).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const entryData = {
        date: formData.date,
        hours,
        project_id: formData.project_id,
        description: formData.description,
      };

      if (editingEntry) {
        // Update existing entry
        const response = await fetch(`http://192.168.11.3:8200/timesheets/${editingEntry.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          await fetchEntries();
          toast({
            title: "Entry updated",
            description: "Your time entry has been updated successfully.",
          });
        } else {
          throw new Error('Failed to update entry');
        }
      } else {
        // Create new entry
        const response = await fetch('http://192.168.11.3:8200/timesheets', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(entryData),
        });

        if (response.ok) {
          await fetchEntries();
          toast({
            title: "Entry created",
            description: "Your time entry has been saved as a draft.",
          });
        } else {
          throw new Error('Failed to create entry');
        }
      }

      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save time entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      project_id: '',
      description: '',
    });
    setEditingEntry(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      hours: entry.hours.toString(),
      project_id: entry.project, // entry.project is the project ID from API
      description: entry.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://192.168.11.3:8200/timesheets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await fetchEntries();
        toast({
          title: "Entry deleted",
          description: "The time entry has been removed.",
        });
      } else {
        throw new Error('Failed to delete entry');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitEntry = async (id: string) => {
    try {
      // Find the entry to get its complete data
      const entry = entries.find(e => e.id === id);
      if (!entry) {
        throw new Error('Entry not found');
      }

      console.log('Before submission - Entry state:', entry);
      
      const payload = {
        date: entry.date,
        hours: entry.hours,
        project_id: entry.project,
        description: entry.description,
        status: "submitted"
      };

      console.log('Submitting with payload:', payload);

      const response = await fetch(`http://192.168.11.3:8200/timesheets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('Submit response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Submit response data:', responseData);
        console.log('Response shows submitted as:', responseData.submitted);
        
        console.log('Calling fetchEntries() to refresh...');
        await fetchEntries();
        
        toast({
          title: "Entry submitted",
          description: "Your time entry has been submitted for approval.",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit failed:', response.status, errorData);
        throw new Error('Failed to submit entry');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      handleApiError(error, 'Failed to submit entry');
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const submittedHours = entries
    .filter(entry => entry.submitted)
    .reduce((sum, entry) => sum + entry.hours, 0);

  // Helper function to get project name from ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : projectId;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Timesheet</h1>
            <p className="text-muted-foreground">
              Track your time and manage entries
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEntry(null)}>
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
                </DialogTitle>
                <DialogDescription>
                  Enter the details for your time entry.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="8.0"
                    value={formData.hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select 
                    value={formData.project_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                     <SelectContent>
                       {projects.map((project) => {
                         console.log('Mapping project:', project);
                         return (
                           <SelectItem key={project.id} value={project.id}>
                             {project.name}
                           </SelectItem>
                         );
                       })}
                     </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work performed..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours}</div>
              <p className="text-xs text-muted-foreground">
                All time entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submittedHours}</div>
              <p className="text-xs text-muted-foreground">
                Hours pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(entry => !entry.submitted).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Unsaved entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries List */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              Manage your recorded time entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No time entries yet</p>
                  <p className="text-muted-foreground">
                    Create your first time entry to get started.
                  </p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-3">
                        <p className="font-medium">{getProjectName(entry.project)}</p>
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
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} • {entry.hours} hours
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!entry.submitted && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitEntry(entry.id)}
                          >
                            Submit
                          </Button>
                        </>
                      )}
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