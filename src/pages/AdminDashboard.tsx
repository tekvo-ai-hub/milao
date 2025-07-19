import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Activity, Settings, Shield, Clock, Mic, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AdminSetup from '@/components/AdminSetup';

interface UserStats {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
  last_login?: string;
  login_count: number;
  recording_count: number;
  total_recording_duration: number;
  recording_enabled: boolean;
  account_status: string;
  notes?: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data?: any;
  created_at: string;
  user_email?: string;
}

interface DashboardStats {
  total_users: number;
  active_users_today: number;
  total_recordings: number;
  total_recording_duration: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_users: 0,
    active_users_today: 0,
    total_recordings: 0,
    total_recording_duration: 0
  });
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [userNotes, setUserNotes] = useState('');

  useEffect(() => {
    if (!adminLoading) {
      if (isAdmin) {
        loadAdminData();
      } else {
        setLoading(false);
      }
    }
  }, [isAdmin, adminLoading]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadActivityLogs(),
        loadDashboardStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_stats');
      
      if (error) {
        console.error('Error loading user stats:', error);
        // Fallback query 
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            created_at
          `);
        
        if (profilesError) throw profilesError;
        
        const userStats: UserStats[] = profiles?.map(profile => ({
          id: profile.id,
          email: profile.email || '',
          display_name: profile.full_name,
          created_at: profile.created_at,
          login_count: 0,
          recording_count: 0,
          total_recording_duration: 0,
          recording_enabled: true,
          account_status: 'active',
          notes: undefined
        })) || [];
        
        setUsers(userStats);
        return;
      }
      
      // Transform the data to match UserStats interface
      const userStats: UserStats[] = data?.map((row: any) => ({
        id: row.id,
        email: row.email || '',
        display_name: row.display_name,
        created_at: row.created_at,
        last_login: row.last_login,
        login_count: Number(row.login_count),
        recording_count: Number(row.recording_count),
        total_recording_duration: Number(row.total_recording_duration),
        recording_enabled: row.recording_enabled,
        account_status: row.account_status,
        notes: row.notes
      })) || [];
      
      setUsers(userStats);
    } catch (error) {
      console.error('Error in loadUserStats:', error);
      setUsers([]);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          activity_type,
          activity_data,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user emails separately
      const userIds = [...new Set(data?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      const logs: ActivityLog[] = data?.map(log => ({
        ...log,
        user_email: emailMap.get(log.user_id) || 'Unknown'
      })) || [];

      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setActivityLogs([]);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_dashboard_stats');
      
      if (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback manual calculation
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        const { count: recordingCount } = await supabase
          .from('speech_recordings')
          .select('*', { count: 'exact', head: true });
        
        setDashboardStats({
          total_users: userCount || 0,
          active_users_today: 0,
          total_recordings: recordingCount || 0,
          total_recording_duration: 0
        });
        return;
      }
      
      // Transform the data to match DashboardStats interface
      const stats = data?.[0] || {
        total_users: 0,
        active_users_today: 0,
        total_recordings: 0,
        total_recording_duration: 0
      };
      
      setDashboardStats({
        total_users: Number(stats.total_users),
        active_users_today: Number(stats.active_users_today),
        total_recordings: Number(stats.total_recordings),
        total_recording_duration: Number(stats.total_recording_duration)
      });
    } catch (error) {
      console.error('Error in loadDashboardStats:', error);
      setDashboardStats({
        total_users: 0,
        active_users_today: 0,
        total_recordings: 0,
        total_recording_duration: 0
      });
    }
  };

  const toggleUserRecording = async (userId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          recording_enabled: enabled,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, recording_enabled: enabled } : u
      ));

      toast({
        title: "Success",
        description: `Recording ${enabled ? 'enabled' : 'disabled'} for user`,
      });
    } catch (error) {
      console.error('Error updating user recording status:', error);
      toast({
        title: "Error",
        description: "Failed to update user recording status",
        variant: "destructive",
      });
    }
  };

  const updateUserNotes = async (userId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          notes: notes,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, notes } : u
      ));

      toast({
        title: "Success",
        description: "User notes updated successfully",
      });
    } catch (error) {
      console.error('Error updating user notes:', error);
      toast({
        title: "Error",
        description: "Failed to update user notes",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Shield className="w-4 h-4" />;
      case 'recording_created': return <Mic className="w-4 h-4" />;
      case 'preferences_updated': return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges.</p>
          <div className="flex flex-col gap-4 items-center">
            <AdminSetup />
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <div className="border-b border-[var(--glass-border)] bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users and monitor system activity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_users}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.active_users_today}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_recordings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(dashboardStats.total_recording_duration)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and recording access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Recordings</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Recording Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userStat) => (
                      <TableRow key={userStat.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {userStat.display_name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {userStat.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(userStat.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{userStat.recording_count}</TableCell>
                        <TableCell>
                          {formatDuration(userStat.total_recording_duration)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={userStat.recording_enabled}
                            onCheckedChange={(checked) =>
                              toggleUserRecording(userStat.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              userStat.account_status === 'active'
                                ? 'default'
                                : userStat.account_status === 'suspended'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {userStat.account_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(userStat);
                                  setUserNotes(userStat.notes || '');
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  View and manage user information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Basic Info</h4>
                                    <p><strong>Email:</strong> {selectedUser.email}</p>
                                    <p><strong>Display Name:</strong> {selectedUser.display_name || 'Not set'}</p>
                                    <p><strong>Joined:</strong> {format(new Date(selectedUser.created_at), 'PPP')}</p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Activity Stats</h4>
                                    <p><strong>Login Count:</strong> {selectedUser.login_count}</p>
                                    <p><strong>Recordings:</strong> {selectedUser.recording_count}</p>
                                    <p><strong>Total Duration:</strong> {formatDuration(selectedUser.total_recording_duration)}</p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Admin Notes</h4>
                                    <Textarea
                                      value={userNotes}
                                      onChange={(e) => setUserNotes(e.target.value)}
                                      placeholder="Add notes about this user..."
                                      className="min-h-[100px]"
                                    />
                                    <Button
                                      onClick={() => updateUserNotes(selectedUser.id, userNotes)}
                                      className="mt-2"
                                    >
                                      Update Notes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  Recent user activities and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActivityIcon(log.activity_type)}
                            <span className="capitalize">
                              {log.activity_type.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{log.user_email}</TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {log.activity_data && (
                            <pre className="text-xs">
                              {JSON.stringify(log.activity_data, null, 2)}
                            </pre>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;