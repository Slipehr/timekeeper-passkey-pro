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

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  submitted: boolean;
  approved: boolean;
}

const projects = [
  'Client A - Tax Preparation',
  'Client B - Audit',
  'Client C - Bookkeeping',
  'Internal - Training',
  'Internal - Admin',
  'Internal - Marketing',
];

export default function Timesheet() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    project: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    // Mock data - in real app, this would fetch from API
    const mockEntries: TimeEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        hours: 8,
        project: 'Client A - Tax Preparation',
        description: 'Annual tax filing preparation and document review',
        submitted: true,
        approved: true,
      },
      {
        id: '2',
        date: '2024-01-16',
        hours: 6.5,
        project: 'Client B - Audit',
        description: 'Financial audit review and compliance check',
        submitted: true,
        approved: false,
      },
      {
        id: '3',
        date: '2024-01-17',
        hours: 7,
        project: 'Internal - Training',
        description: 'Professional development and certification study',
        submitted: false,
        approved: false,
      },
    ];
    setEntries(mockEntries);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.hours || !formData.project || !formData.description) {
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

    if (editingEntry) {
      // Update existing entry
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id 
          ? { ...entry, ...formData, hours }
          : entry
      ));
      toast({
        title: "Entry updated",
        description: "Your time entry has been updated successfully.",
      });
    } else {
      // Create new entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        date: formData.date,
        hours,
        project: formData.project,
        description: formData.description,
        submitted: false,
        approved: false,
      };
      setEntries(prev => [newEntry, ...prev]);
      toast({
        title: "Entry created",
        description: "Your time entry has been saved as a draft.",
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      project: '',
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
      project: entry.project,
      description: entry.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    toast({
      title: "Entry deleted",
      description: "The time entry has been removed.",
    });
  };

  const handleSubmitEntry = (id: string) => {
    setEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, submitted: true } : entry
    ));
    toast({
      title: "Entry submitted",
      description: "Your time entry has been submitted for approval.",
    });
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const submittedHours = entries
    .filter(entry => entry.submitted)
    .reduce((sum, entry) => sum + entry.hours, 0);

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
                    value={formData.project} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
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
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingEntry ? 'Update' : 'Save'}
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
                        <p className="font-medium">{entry.project}</p>
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