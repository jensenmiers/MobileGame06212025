"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type SupabaseClient, type Session, type User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { syncUserProfile } from '@/lib/tournament-service';

// Create a client-side Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the shape of the context value
interface AuthContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: string | null; // Add role to context
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>; // RESTORED - Discord login enabled
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null); // Add role state

  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup the subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // Fetch the user's role from the profiles table whenever the session changes
  useEffect(() => {
    const fetchRole = async () => {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (error) {
            console.error('Error fetching user role:', error);
            setRole(null);
          } else {
            setRole(profile?.role || null);
          }
        } catch (err) {
          console.error('Unexpected error fetching user role:', err);
          setRole(null);
        }
      } else {
        setRole(null);
      }
    };
    fetchRole();
  }, [session]);

  const signInWithGoogle = async () => {
    try {
      // Explicitly set the redirect URL for development
      const redirectUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/auth/callback' 
        : `${window.location.origin}/auth/callback`;
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
      
      // Note: Profile sync will happen after redirect when user accesses features requiring it
      
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      throw error;
    }
  };

  // DISCORD LOGIN FUNCTION - RESTORED
  const signInWithDiscord = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        console.error('Discord sign-in error:', error);
        throw error;
      }
      
      // Note: Profile sync will happen after redirect when user accesses features requiring it
      
    } catch (error) {
      console.error('Failed to sign in with Discord:', error);
      throw error;
    }
  };

  // Add signOut function
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    supabase,
    session,
    user: session?.user ?? null, // Derive user from session
    loading,
    role, // Provide role in context
    signInWithGoogle,
    signInWithDiscord, // RESTORED - Discord login enabled
    signOut,
  };

  // The consuming components will handle the loading state
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
