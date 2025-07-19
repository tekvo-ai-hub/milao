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

    if (action === 'make_first_admin') {
      // Check if there are any admin users
      const { data: existingAdmins, error: adminCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin');

      if (adminCheckError) {
        throw new Error(`Error checking for existing admins: ${adminCheckError.message}`);
      }

      if (existingAdmins && existingAdmins.length > 0) {
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

      // Find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Error finding user profile: ${profileError.message}`);
      }

      if (!profiles) {
        return new Response(
          JSON.stringify({ error: 'User not found with that email address' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Make the user an admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profiles.id,
          role: 'admin'
        });

      if (roleError) {
        throw new Error(`Error creating admin role: ${roleError.message}`);
      }

      // Log the admin creation
      await supabase.rpc('log_user_activity', {
        p_user_id: profiles.id,
        p_activity_type: 'admin_role_granted',
        p_activity_data: { granted_by: 'system', timestamp: new Date().toISOString() }
      });

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