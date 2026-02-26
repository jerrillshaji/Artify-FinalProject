import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseContext = createContext();

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for hash in URL (email confirmation, magic link, etc.)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken) {
        // Clear the hash from URL
        window.history.replaceState({}, document.title, '/');
        
        // Set the session from the hash
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(() => {
          // Session will be picked up by onAuthStateChange
        });
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle specific auth events
      if (event === 'SIGNED_IN' && session) {
        // User signed in - redirect to feed
        if (!session.user.email_confirmed_at && !session.user.confirmed_at) {
          // Email not confirmed yet
          console.log('Email not confirmed yet');
        } else {
          // Email confirmed or password login - redirect handled in components
          console.log('User signed in successfully');
        }
      }
      
      if (event === 'USER_UPDATED' && session) {
        // Email confirmation completed
        console.log('Email confirmed, user updated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          // Redirect after email confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        // Supabase error - email sending issues will be in error.message
        console.error('Sign up error:', error);
        if (error.message?.includes('Database error saving new user')) {
          throw new Error('Database trigger failed while creating your profile. Run the latest supabase-schema.sql in Supabase SQL Editor and ensure the handle_new_user() trigger exists.');
        }
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to create account');
      }
      
      if (!data.user) {
        throw new Error('User creation failed');
      }
      
      const emailConfirmed = Boolean(data.user.email_confirmed_at || data.user.confirmed_at);
      const emailSent = !emailConfirmed;
      
      console.log('Sign up successful:', {
        userId: data.user.id,
        email: data.user.email,
        emailSent,
        emailConfirmed,
      });
      
      return { data, error: null, emailSent, emailConfirmed };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to sign in');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const resendConfirmation = async (email) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error('Resend error:', error);
        throw new Error(error.message || 'Failed to resend confirmation email');
      }
      
      // Log successful resend
      console.log('Confirmation email resent to:', email);
      
      return { data, error: null, emailSent: true };
    } catch (error) {
      console.error('Resend error:', error);
      throw error;
    }
  };

  const signInWithProvider = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const updateUser = async (attributes) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) throw error;
    return data;
  };

  const value = {
    supabase,
    session,
    user,
    loading,
    signUp,
    signIn,
    resendConfirmation,
    signInWithProvider,
    signOut,
    resetPassword,
    updateUser,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
