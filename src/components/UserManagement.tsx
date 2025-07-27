import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Upload, Edit, Trash2, Download, Search, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/hooks/useAuth';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: UserRole;
  registered_at: string;
  last_login_at?: string;
}

interface UserFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  password: string;
}

const CSV_TEMPLATE = `email,first_name,last_name,phone_number,role`;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    role: '',
    registered: '',
    lastLogin: '',
  });
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: UserRole.USER,
    password: '',
  });

  const { apiRequest, handleApiError } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('http://192.168.11.3:8200/auth/users');
      setUsers(response);
      setFilteredUsers(response);
    } catch (error: any) {
      handleApiError(error, 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on current filters
  useEffect(() => {
    let filtered = users;

    if (filters.name) {
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.email) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.role) {
      filtered = filtered.filter(user => 
        user.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }

    if (filters.registered) {
      filtered = filtered.filter(user => 
        new Date(user.registered_at).toLocaleDateString().includes(filters.registered)
      );
    }

    if (filters.lastLogin) {
      filtered = filtered.filter(user => {
        const lastLogin = user.last_login_at 
          ? new Date(user.last_login_at).toLocaleDateString()
          : 'Never';
        return lastLogin.toLowerCase().includes(filters.lastLogin.toLowerCase());
      });
    }

    setFilteredUsers(filtered);
  }, [users, filters]);

  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      role: '',
      registered: '',
      lastLogin: '',
    });
  };

  const createUser = async () => {
    try {
      // Normalize email to lowercase before sending to backend
      const normalizedFormData = {
        ...formData,
        email: formData.email.toLowerCase(),
      };

      const response = await apiRequest('http://192.168.11.3:8200/auth/create-user', {
        method: 'POST',
        body: JSON.stringify(normalizedFormData),
      });

      const successMessage = response.generated_password 
        ? `User created successfully. Generated password: ${response.generated_password}`
        : "User created successfully";

      toast({
        title: "Success",
        description: successMessage,
        duration: response.generated_password ? 10000 : 5000, // Show longer for generated passwords
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      handleApiError(error, 'Failed to create user');
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    // Check for duplicate email (case-insensitive), excluding current user
    const emailExists = users.some(user => 
      user.id !== editingUser.id && 
      user.email.toLowerCase() === formData.email.toLowerCase()
    );
    
    if (emailExists) {
      toast({
        title: "Error",
        description: "A user with this email already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      // Normalize email to lowercase before sending to backend
      const normalizedFormData = {
        ...formData,
        email: formData.email.toLowerCase(),
      };

      await apiRequest(`http://192.168.11.3:8200/auth/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(normalizedFormData),
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      handleApiError(error, 'Failed to update user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiRequest(`http://192.168.11.3:8200/auth/${userId}`, {
        method: 'DELETE',
      });

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error: any) {
      handleApiError(error, 'Failed to delete user');
    }
  };

  const bulkUploadUsers = async () => {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'users.csv');

      const response = await fetch('http://192.168.11.3:8200/auth/users/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw { status: response.status, detail: result.detail };
      }

      toast({
        title: "Bulk Upload Complete",
        description: `Successfully added ${result.successfully_added} users. ${result.failed} failed.`,
      });

      setIsBulkUploadOpen(false);
      setCsvContent('');
      fetchUsers();
    } catch (error: any) {
      handleApiError(error, 'Bulk upload failed');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      role: user.role,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: UserRole.USER,
      password: '',
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return 'destructive';
      case UserRole.MANAGER:
        return 'default';
      case UserRole.AUDIT:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage system users and their roles</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Users</DialogTitle>
                  <DialogDescription>
                    Upload multiple users via CSV file
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Download the CSV template with required format
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csvContent">CSV Content</Label>
                    <Textarea
                      id="csvContent"
                      placeholder="Paste CSV content here or use the template format..."
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={bulkUploadUsers} disabled={!csvContent.trim()}>
                      Upload Users
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>User</SelectItem>
                        <SelectItem value={UserRole.AUDIT}>Audit</SelectItem>
                        <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createUser}>Create User</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name">First Name</Label>
                      <Input
                        id="edit_first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name">Last Name</Label>
                      <Input
                        id="edit_last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone_number">Phone Number</Label>
                    <Input
                      id="edit_phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>User</SelectItem>
                        <SelectItem value={UserRole.AUDIT}>Audit</SelectItem>
                        <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_password">New Password (optional)</Label>
                    <Input
                      id="edit_password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateUser}>Update User</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filter Users</h3>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-name"
                  placeholder="Filter by name..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-email">Email</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-email"
                  placeholder="Filter by email..."
                  value={filters.email}
                  onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-role">Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                  <SelectItem value={UserRole.AUDIT}>Audit</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.ADMINISTRATOR}>Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-registered">Registered Date</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-registered"
                  placeholder="Filter by date..."
                  value={filters.registered}
                  onChange={(e) => setFilters({ ...filters, registered: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-lastLogin">Last Login</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-lastLogin"
                  placeholder="Filter by login..."
                  value={filters.lastLogin}
                  onChange={(e) => setFilters({ ...filters, lastLogin: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          {(filters.name || filters.email || filters.role || filters.registered || filters.lastLogin) && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          )}
        </div>

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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.registered_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}