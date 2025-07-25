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
  const { user, login, loginWithPasskey, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

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
        </Card>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Demo credentials: any email + any password
          </p>
        </div>
      </div>
    </div>
  );
}