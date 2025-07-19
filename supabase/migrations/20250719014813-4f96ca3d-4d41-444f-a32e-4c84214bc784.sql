-- Create function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count BIGINT,
  recording_count BIGINT,
  total_recording_duration BIGINT,
  recording_enabled BOOLEAN,
  account_status TEXT,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    up.display_name,
    p.created_at,
    NULL::TIMESTAMP WITH TIME ZONE as last_login,
    COALESCE(login_stats.count, 0) as login_count,
    COALESCE(recording_stats.count, 0) as recording_count,
    COALESCE(recording_stats.total_duration, 0) as total_recording_duration,
    COALESCE(us.recording_enabled, true) as recording_enabled,
    COALESCE(us.account_status, 'active') as account_status,
    us.notes
  FROM profiles p
  LEFT JOIN user_preferences up ON up.user_id = p.id
  LEFT JOIN user_settings us ON us.user_id = p.id
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) as count
    FROM user_activity_logs 
    WHERE activity_type = 'login'
    GROUP BY user_id
  ) login_stats ON login_stats.user_id = p.id
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) as count,
      SUM(duration) as total_duration
    FROM speech_recordings
    GROUP BY user_id
  ) recording_stats ON recording_stats.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users_today BIGINT,
  total_recordings BIGINT,
  total_recording_duration BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(DISTINCT user_id) 
     FROM user_activity_logs 
     WHERE activity_type = 'login' 
     AND created_at >= CURRENT_DATE) as active_users_today,
    (SELECT COUNT(*) FROM speech_recordings) as total_recordings,
    (SELECT COALESCE(SUM(duration), 0) FROM speech_recordings) as total_recording_duration;
END;
$$;