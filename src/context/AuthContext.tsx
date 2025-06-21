"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncUserProfile } from '@/lib/tournament-service';

// Define the shape of the context value
interface AuthContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      // Sync profile for any existing session
      if (session?.user) {
        try {
          console.log('🔄 Initial session found, syncing profile...');
          await syncUserProfile(session.user.id);
        } catch (error) {
          console.error('Profile sync failed for initial session:', error);
        }
      }
    });

    // Listen for changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setLoading(false);
      
      // Sync user profile whenever we have a valid session
      // This covers SIGNED_IN, TOKEN_REFRESHED, and any other auth events
      if (session?.user) {
        try {
          console.log(`🔄 Auth event: ${_event}, syncing profile for user:`, session.user.id);
          await syncUserProfile(session.user.id);
        } catch (error) {
          console.error(`Profile sync failed on ${_event}:`, error);
        }
      }
    });

    // Cleanup the subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
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
    signInWithGoogle,
    signInWithDiscord,
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
