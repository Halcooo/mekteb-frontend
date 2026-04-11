import React, { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
}

// JWT payload interface
interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  isTokenExpired: (token: string) => boolean;
  getTokenExpiration: (token: string) => Date | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const ACCESS_TOKEN_KEY = "mekteb_access_token";
const REFRESH_TOKEN_KEY = "mekteb_refresh_token";
const USER_KEY = "mekteb_user";

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build user object from access token payload
  const getUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  };

  // Get token expiration date
  const getTokenExpiration = (token: string): Date | null => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  };

  // Login function
  const login = (
    newAccessToken: string,
    newRefreshToken: string,
    userData: User,
  ) => {
    // Store in localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    // Update state
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // Update tokens (for refresh)
  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
  };

  // Restore auth state from localStorage (used on refresh and cross-tab sync)
  const restoreAuthFromStorage = useCallback(() => {
    try {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedAccessToken && !isTokenExpired(storedAccessToken)) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const tokenUser = getUserFromToken(storedAccessToken);
          if (tokenUser) {
            setUser(tokenUser);
            localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
          } else {
            setUser(null);
          }
        }
        return;
      }

      if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
        setAccessToken(null);
        setRefreshToken(storedRefreshToken);
        setUser(storedUser ? JSON.parse(storedUser) : null);
        return;
      }

      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error("Error restoring auth from storage:", error);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    restoreAuthFromStorage();
    setIsLoading(false);
  }, [restoreAuthFromStorage]);

  // Keep auth state synced across tabs and with interceptor logout events
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === ACCESS_TOKEN_KEY ||
        event.key === REFRESH_TOKEN_KEY ||
        event.key === USER_KEY ||
        event.key === null
      ) {
        restoreAuthFromStorage();
      }
    };

    const handleForcedLogout = () => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:logout", handleForcedLogout as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "auth:logout",
        handleForcedLogout as EventListener,
      );
    };
  }, [restoreAuthFromStorage]);

  // Computed values
  const isAuthenticated = Boolean(user && (accessToken || refreshToken));

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateTokens,
    isTokenExpired,
    getTokenExpiration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
