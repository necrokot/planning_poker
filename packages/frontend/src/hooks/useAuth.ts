import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api } from '../services';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await api.auth.getMe();
        setUser(user);
      } catch {
        setUser(null);
      }
    };

    const checkDevMode = async () => {
      const { available } = await api.auth.getDevStatus();
      setIsDevMode(available);
    };

    checkAuth();
    checkDevMode();
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

  const loginWithDev = async () => {
    try {
      setLoading(true);
      const { user } = await api.auth.devLogin();
      setUser(user);
    } catch (error) {
      console.error('Dev login failed:', error);
      setLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isDevMode,
    logout: handleLogout,
    loginWithGoogle,
    loginWithDev,
    setLoading,
  };
}
