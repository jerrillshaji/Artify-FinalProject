import { useSupabase } from '../context/SupabaseContext';

export function useAuth() {
  const { user, session, loading, signIn, signUp, signOut } = useSupabase();

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };
}
