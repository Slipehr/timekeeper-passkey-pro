import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Fingerprint, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { user, login, loginWithPasskey, bootstrapAdmin, isLoading, isProduction, isBootstrapped, connectionError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      toast({
        title: "Login successful",
        description: "Welcome to TimeTracker!",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      await loginWithPasskey();
      toast({
        title: "Passkey authentication successful",
        description: "Welcome to TimeTracker!",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Passkey authentication failed",
        description: "Please try again or use email/password login.",
        variant: "destructive",
      });
    }
  };

  const handleBootstrapAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bootstrapAdmin(adminData);
      toast({
        title: "Admin created successfully",
        description: "You can now log in with your admin credentials.",
      });
    } catch (error) {
      toast({
        title: "Admin creation failed",
        description: "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TimeTracker</h1>
          <p className="text-white/80">Professional timesheet management</p>
        </div>

        <Card className="shadow-elegant">
          {isBootstrapped === false ? (
            <>
              <CardHeader>
                <CardTitle>Setup Administrator</CardTitle>
                <CardDescription>
                  Create the first administrator account to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBootstrapAdmin} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="Enter first name"
                        value={adminData.first_name}
                        onChange={(e) => setAdminData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        type="text"
                        placeholder="Enter last name"
                        value={adminData.last_name}
                        onChange={(e) => setAdminData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin_email"
                        type="email"
                        placeholder="Enter admin email"
                        className="pl-10"
                        value={adminData.email}
                        onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin_password"
                        type="password"
                        placeholder="Enter admin password"
                        className="pl-10"
                        value={adminData.password}
                        onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="Enter phone number"
                      value={adminData.phone_number}
                      onChange={(e) => setAdminData(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Admin...' : 'Create Administrator'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Access your timesheet dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="passkey">Passkey</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={credentials.email}
                            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            value={credentials.password}
                            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in with Email'}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="passkey" className="space-y-4">
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <Fingerprint className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use your fingerprint, face, or security key to sign in securely.
                      </p>
                      <Button 
                        onClick={handlePasskeyLogin} 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Authenticating...' : 'Sign in with Passkey'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>

        <div className="text-center mt-6 space-y-2">
          {connectionError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-100 text-sm font-medium">
                Connection Issue
              </p>
              <p className="text-red-100/80 text-xs mt-1">
                Unable to connect to server. Please check your connection.
              </p>
            </div>
          )}
          
          {/* Environment Indicator */}
          {isProduction !== null && !connectionError && (
            <div className={`border rounded-lg p-3 mb-4 ${
              isProduction 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-yellow-500/20 border-yellow-500/30'
            }`}>
              <p className={`text-sm font-medium ${
                isProduction ? 'text-green-100' : 'text-yellow-100'
              }`}>
                {isProduction ? 'Production Mode' : 'Development Mode'}
              </p>
              <p className={`text-xs mt-1 ${
                isProduction ? 'text-green-100/80' : 'text-yellow-100/80'
              }`}>
                {isProduction 
                  ? 'Secure authentication required' 
                  : 'Any email can be used for login'
                }
              </p>
            </div>
          )}
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} dahlberg.ninja. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}