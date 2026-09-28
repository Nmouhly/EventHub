import { createContext, useEffect, useState } from 'react';
import { getMe, signIn } from '../api/authApi';
import { SESSION_KEY } from '../utils/constants';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
  }
  useEffect(() => {
    let active = true;
    window.addEventListener('session-expired', logout);
    (async () => {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) {
          const result = await getMe();
          if (active) setUser(result.user || result);
        }
      } catch {
        if (active) logout();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      window.removeEventListener('session-expired', logout);
    };
  }, []);
  async function login(credentials) {
    try {
      const result = await signIn(credentials);
      if (!result.token) throw new Error('Missing token');
      sessionStorage.setItem(SESSION_KEY, result.token);
      const profile = await getMe();
      setToken(result.token);
      setUser(profile.user || profile);
    } catch (error) {
      logout();
      throw error;
    }
  }
  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: Boolean(user && token), login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
