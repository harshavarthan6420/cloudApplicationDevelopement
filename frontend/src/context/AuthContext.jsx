import { createContext, useContext, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from './authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY));

  const login = (nextUsername) => {
    localStorage.setItem(AUTH_STORAGE_KEY, nextUsername);
    setUsername(nextUsername);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUsername(null);
  };

  const value = useMemo(
    () => ({
      username,
      isAuthenticated: Boolean(username),
      login,
      logout
    }),
    [username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
