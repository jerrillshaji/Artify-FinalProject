import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  const [profile, setProfile] = useState(null);

  const refreshProfile = useCallback(async (userId = user?.id) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      throw error;
    }

    let enrichedProfile = data || null;

    if (data?.role === 'artist') {
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('stage_name, portfolio_images')
        .eq('id', userId)
        .maybeSingle();

      if (artistError) {
        console.error('Error loading artist profile details:', artistError);
      } else if (artistData) {
        enrichedProfile = { ...data, ...artistData };
      }
    } else if (data?.role === 'manager') {
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('company_name')
        .eq('id', userId)
        .maybeSingle();

      if (managerError) {
        console.error('Error loading manager profile details:', managerError);
      } else if (managerData) {
        enrichedProfile = { ...data, ...managerData };
      }
    }

    setProfile(enrichedProfile);
    return enrichedProfile;
  }, [user?.id]);

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

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    refreshProfile(user.id).catch(() => {
      setProfile(null);
    });
  }, [refreshProfile, user?.id]);

  const normalizeUsername = (value, fallbackId = '') => {
    const cleaned = (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (cleaned.length >= 3) return cleaned;
    return `user_${fallbackId.slice(0, 8) || 'new'}`;
  };

  const resolveUniqueUsername = async (baseUsername, userId) => {
    let attempt = 0;
    let candidate = baseUsername;

    while (attempt < 25) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', candidate)
        .maybeSingle();

      if (!data || data.id === userId) {
        return candidate;
      }

      attempt += 1;
      candidate = `${baseUsername}_${attempt}`;
    }

    return `${baseUsername}_${Date.now().toString().slice(-5)}`;
  };

  const bootstrapUserProfile = async (createdUser, metadata = {}) => {
    if (!createdUser?.id) return;

    const userRole = ['artist', 'manager'].includes(metadata?.role)
      ? metadata.role
      : (createdUser.user_metadata?.role || 'artist');

    const fullName = metadata?.full_name
      || createdUser.user_metadata?.full_name
      || createdUser.email?.split('@')[0]
      || 'New User';

    const baseUsername = normalizeUsername(
      metadata?.username || createdUser.user_metadata?.username || createdUser.email?.split('@')[0],
      createdUser.id
    );

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', createdUser.id)
      .maybeSingle();

    const username = existingProfile?.username || await resolveUniqueUsername(baseUsername, createdUser.id);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: createdUser.id,
        email: createdUser.email,
        full_name: fullName,
        role: userRole,
        username,
      }, { onConflict: 'id' });

    if (profileError) {
      throw profileError;
    }

    if (userRole === 'artist') {
      const { error: artistError } = await supabase
        .from('artists')
        .upsert({
          id: createdUser.id,
          stage_name: fullName,
        }, { onConflict: 'id' });

      if (artistError) throw artistError;
    } else {
      const { error: managerError } = await supabase
        .from('managers')
        .upsert({
          id: createdUser.id,
          company_name: fullName,
        }, { onConflict: 'id' });

      if (managerError) throw managerError;
    }
  };

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
        if (error.message?.includes('Error sending confirmation email')) {
          throw new Error('Confirmation email could not be sent. Configure SMTP in Supabase Dashboard (Project Settings → Auth → SMTP Settings), verify sender domain/email, and keep Confirm email enabled in Authentication → Providers → Email.');
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

      if (data.session) {
        try {
          await bootstrapUserProfile(data.user, metadata);
        } catch (bootstrapError) {
          console.error('Profile bootstrap error:', bootstrapError);
          throw new Error('Account created but profile setup failed. Please retry signup or login again.');
        }
      }
      
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
    profile,
    loading,
    refreshProfile,
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
