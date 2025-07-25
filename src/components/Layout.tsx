import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-subtle">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border shadow-soft">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors duration-200">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div className="hidden sm:block">
                  <span className="text-sm text-muted-foreground">
                    Welcome back, <span className="font-medium text-foreground">{user.name}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-muted-foreground">Online</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}