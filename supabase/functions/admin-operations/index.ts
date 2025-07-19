
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_id, email } = await req.json();
    console.log('Admin operation request:', { action, email });

    if (action === 'make_first_admin') {
      // Check if there are any admin users
      const { data: existingAdmins, error: adminCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin');

      if (adminCheckError) {
        console.error('Error checking for existing admins:', adminCheckError);
        throw new Error(`Error checking for existing admins: ${adminCheckError.message}`);
      }

      if (existingAdmins && existingAdmins.length > 0) {
        console.log('Admin already exists, blocking request');
        return new Response(
          JSON.stringify({ 
            error: 'Admin user already exists. Cannot create multiple admins through this method.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // First try to find user in auth.users table using admin client
      console.log('Looking for user with email:', email);
      
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        throw new Error(`Error fetching users: ${authError.message}`);
      }

      const authUser = authUsers.users.find(user => user.email === email);
      
      if (!authUser) {
        console.log('User not found in auth.users');
        return new Response(
          JSON.stringify({ error: 'User not found with that email address. Make sure the user has signed up first.' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Found user:', authUser.id);

      // Make the user an admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          role: 'admin'
        });

      if (roleError) {
        console.error('Error creating admin role:', roleError);
        throw new Error(`Error creating admin role: ${roleError.message}`);
      }

      console.log('Admin role created successfully');

      // Log the admin creation
      try {
        await supabase.rpc('log_user_activity', {
          p_user_id: authUser.id,
          p_activity_type: 'admin_role_granted',
          p_activity_data: { granted_by: 'system', timestamp: new Date().toISOString() }
        });
        console.log('Activity logged');
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the whole operation for logging issues
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${email} has been granted admin privileges` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'get_admin_stats') {
      // Get comprehensive admin statistics
      const { data: userStats, error: userStatsError } = await supabase
        .rpc('get_user_stats');

      const { data: dashboardStats, error: dashboardStatsError } = await supabase
        .rpc('get_dashboard_stats');

      if (userStatsError || dashboardStatsError) {
        throw new Error('Failed to fetch admin statistics');
      }

      return new Response(
        JSON.stringify({ 
          userStats: userStats || [],
          dashboardStats: dashboardStats?.[0] || {}
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action specified' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Admin function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
