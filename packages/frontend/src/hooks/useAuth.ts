import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { api, socketService } from '../services';

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
      socketService.disconnect(); // Disconnect socket before logout
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

  const loginWithDev1 = async () => {
    try {
      setLoading(true);
      const { user } = await api.auth.dev1Login();
      setUser(user);
    } catch (error) {
      console.error('Dev1 login failed:', error);
      setLoading(false);
    }
  };

  const loginWithDev2 = async () => {
    try {
      setLoading(true);
      const { user } = await api.auth.dev2Login();
      setUser(user);
    } catch (error) {
      console.error('Dev2 login failed:', error);
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
    loginWithDev1,
    loginWithDev2,
    setLoading,
  };
}
