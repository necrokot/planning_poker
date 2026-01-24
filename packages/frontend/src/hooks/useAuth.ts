import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await api.auth.getMe();
        setUser(user);
      } catch {
        setUser(null);
      }
    };

    checkAuth();
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = api.auth.getGoogleAuthUrl();
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: handleLogout,
    loginWithGoogle,
    setLoading,
  };
}
