import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any stale session data first
    const clearStaleSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error getting session, clear localStorage
        if (error || !session) {
          localStorage.removeItem('sb-hflfnvemuqilsvanyyqc-auth-token');
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        localStorage.removeItem('sb-hflfnvemuqilsvanyyqc-auth-token');
        setSession(null);
        setUser(null);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, clearing session');
          localStorage.removeItem('sb-hflfnvemuqilsvanyyqc-auth-token');
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Log user login activity
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await supabase.rpc('log_user_activity', {
              p_user_id: session.user.id,
              p_activity_type: 'login',
              p_activity_data: { event, timestamp: new Date().toISOString() }
            });
          } catch (error) {
            console.error('Failed to log login activity:', error);
          }
        }
        
        setLoading(false);
      }
    );

    // Clear stale session data and THEN check for existing session
    clearStaleSession().then(() => {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session error:', error);
          localStorage.removeItem('sb-hflfnvemuqilsvanyyqc-auth-token');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};