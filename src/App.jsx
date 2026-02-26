import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SupabaseProvider } from './context/SupabaseContext';
import LoadingScreen from './components/ui/LoadingScreen';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './views/LandingPage';
import Login from './views/Login';
import Register from './views/Register';
import AuthCallback from './views/AuthCallback';

function AppContent() {
  const { user, signOut, loading } = useAuth();

  // Determine role from user metadata or default
  const role = user?.user_metadata?.role || 'artist';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Unauthenticated routes
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Protected routes (require login) - redirect directly to feed
  return <MainLayout user={user} role={role} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}
