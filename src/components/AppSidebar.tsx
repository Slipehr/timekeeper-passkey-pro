import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Calculator,
  ChevronRight,
  Home,
  Building
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, color: 'text-primary', roles: [UserRole.USER, UserRole.AUDIT, UserRole.MANAGER, UserRole.ADMINISTRATOR] },
  { name: 'Timesheet', href: '/timesheet', icon: Clock, color: 'text-emerald', roles: [UserRole.USER, UserRole.MANAGER] },
  { name: 'Projects', href: '/projects', icon: Building, color: 'text-amber', roles: [UserRole.MANAGER, UserRole.ADMINISTRATOR] },
  { name: 'Approvals', href: '/approvals', icon: FileText, color: 'text-blue', roles: [UserRole.MANAGER] },
  { name: 'Reports', href: '/reports', icon: FileText, color: 'text-violet', roles: [UserRole.AUDIT, UserRole.MANAGER, UserRole.ADMINISTRATOR] },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { hasAnyRole } = usePermissions();

  return (
    <Sidebar 
      className="border-r border-border bg-card shadow-soft"
      collapsible="icon"
    >
      <SidebarContent className="py-6">
        {/* Logo Section */}
        <div className="px-6 mb-8">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-3 group"
          >
            <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant group-hover:shadow-glow transition-all duration-300">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">TimeTracker</span>
                <span className="text-xs text-muted-foreground">Professional</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation
                .filter(item => hasAnyRole(item.roles))
                .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        "relative h-12 px-4 rounded-xl transition-all duration-300",
                        isActive 
                          ? "bg-gradient-primary text-primary-foreground shadow-elegant" 
                          : "hover:bg-accent/50 hover:shadow-soft text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link to={item.href} className="flex items-center">
                        <Icon className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          isActive ? "text-primary-foreground" : item.color
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 font-medium">{item.name}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-4 w-4 text-primary-foreground/80" />
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats (when expanded) */}
        {!isCollapsed && (
          <div className="mt-8 px-6">
            <div className="bg-gradient-accent rounded-lg p-4 shadow-card">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">This Week</span>
              </div>
              <div className="text-2xl font-bold text-foreground">32.5h</div>
              <div className="text-xs text-muted-foreground">+12% from last week</div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}