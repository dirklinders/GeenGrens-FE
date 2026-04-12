'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi, type UserInfo } from './api';

// Set NEXT_PUBLIC_REQUIRE_AUTH=false to bypass authentication for testing
const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH !== 'false';

const MOCK_USER: UserInfo = {
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
  isAdmin: true,
};

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loginWithGoogle: (returnUrl?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // If auth is disabled, use mock user
    if (!REQUIRE_AUTH) {
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }
    
    try {
      const userInfo = await authApi.isAuthenticated();
      setUser(userInfo);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      await authApi.login({ email, password, rememberMe });
      await checkAuth();
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const loginWithGoogle = (returnUrl?: string) => {
    const url = authApi.getGoogleLoginUrl(returnUrl || window.location.href);
    window.location.href = url;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
