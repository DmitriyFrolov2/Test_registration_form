import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse, TokenPair, User } from "./types";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (auth: AuthResponse) => void;
  setTokens: (tokens: TokenPair) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_KEY = "training_access_token";
const REFRESH_KEY = "training_refresh_token";
const USER_KEY = "training_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_KEY));

  const setTokens = (tokens: TokenPair) => {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  };

  const setSession = (auth: AuthResponse) => {
    setUser(auth.user);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setTokens(auth.tokens);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  const value = useMemo(
    () => ({ user, accessToken, refreshToken, setSession, setTokens, logout }),
    [user, accessToken, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
