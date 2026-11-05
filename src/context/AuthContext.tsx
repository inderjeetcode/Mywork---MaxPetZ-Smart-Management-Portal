import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  clinic_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  // Development demo session toggle if needed
  startDemoSession: (role?: 'admin' | 'manager' | 'staff') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'maxpetz_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Supabase profiles table
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProfile({
          id: data.id,
          email: data.email || email,
          full_name: data.full_name || email.split('@')[0],
          role: data.role || 'admin',
          clinic_id: data.clinic_id,
        });
      } else {
        // Fallback profile if table is not yet migrated
        setProfile({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'admin',
        });
      }
    } catch {
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'admin',
      });
    }
  };

  useEffect(() => {
    // 1. Check for real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email || 'user@maxpetz.com');
      } else {
        // Check for local demo session
        const savedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch {
            localStorage.removeItem(DEMO_USER_KEY);
          }
        }
      }
      setLoading(false);
    });

    // 2. Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.removeItem(DEMO_USER_KEY);
        await fetchProfile(session.user.id, session.user.email || 'user@maxpetz.com');
      } else {
        const savedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            setUser(parsed.user);
            setProfile(parsed.profile);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      const needsEmailConfirmation = !data.session;
      return { error: null, needsEmailConfirmation };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Signup failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Password reset failed') };
    }
  };

  const startDemoSession = (role: 'admin' | 'manager' | 'staff' = 'admin') => {
    const fakeId = '00000000-0000-0000-0000-000000000001';
    const fakeEmail = 'admin@maxpetz.com';
    const fakeUser: Partial<User> = {
      id: fakeId,
      email: fakeEmail,
      app_metadata: {},
      user_metadata: { full_name: 'MaxPetZ Executive' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const fakeProfile: UserProfile = {
      id: fakeId,
      email: fakeEmail,
      full_name: 'MaxPetZ Executive',
      role,
      clinic_id: null,
    };

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ user: fakeUser, profile: fakeProfile }));
    setUser(fakeUser as User);
    setProfile(fakeProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        startDemoSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
