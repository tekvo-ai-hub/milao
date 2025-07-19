import React from 'react';
import { History, TrendingUp, LogOut, User, Brain, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  onHistoryClick: () => void;
  onProgressClick: () => void;
  onAiClick: () => void;
  historyOpen: boolean;
  progressOpen: boolean;
  aiOpen: boolean;
}

export function AppSidebar({ onHistoryClick, onProgressClick, onAiClick, historyOpen, progressOpen, aiOpen }: AppSidebarProps) {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const menuItems = [
    {
      title: 'History',
      icon: History,
      onClick: onHistoryClick,
      isActive: historyOpen,
    },
    {
      title: 'Progress',
      icon: TrendingUp,
      onClick: onProgressClick,
      isActive: progressOpen,
    },
  ];

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-60"} ml-auto`} side="right" collapsible="icon">
      <SidebarContent className="bg-card/50 backdrop-blur-md border-r border-[var(--glass-border)]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className={`
                      flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200
                      ${item.isActive 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-[var(--shadow-glow)]' 
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User section at bottom */}
        <div className="mt-auto p-4 border-t border-[var(--glass-border)]">
          {/* User info */}
          <div className={`flex items-center space-x-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="w-4 h-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Preferences button */}
          <Link to="/preferences">
            <SidebarMenuButton
              className={`
                flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200
                hover:bg-accent/50 text-muted-foreground hover:text-foreground mb-2
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="font-medium">Preferences</span>}
            </SidebarMenuButton>
          </Link>

          {/* Sign out button */}
          <SidebarMenuButton
            onClick={signOut}
            className={`
              flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200
              hover:bg-destructive/10 hover:text-destructive text-muted-foreground
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Sign Out</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}