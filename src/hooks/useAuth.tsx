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
    console.log('🔍 useAuth: Starting initialization...');
        
    // Add timeout protection
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ useAuth: Initialization timed out after 5 seconds - forcing completion');
      setLoading(false);
    }, 5000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔍 useAuth: Auth state change:', event, session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    // Get current session immediately
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
        console.error('❌ useAuth: Session error:', error);
          setSession(null);
          setUser(null);
        } else {
        console.log('🔍 useAuth: Current session result:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email 
        });
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      clearTimeout(timeoutId);
    }).catch(error => {
      console.error('❌ useAuth: Exception during session check:', error);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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