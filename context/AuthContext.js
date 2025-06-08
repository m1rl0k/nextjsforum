import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only check auth once per session
    if (authChecked) {
      setLoading(false);
      return;
    }

    // Check if user is logged in
    const checkAuth = async () => {
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Auth check failed:', error);
        }
        setUser(null);
      } finally {
        setAuthChecked(true);

        // Ensure minimum loading time to prevent flash
        const elapsed = Date.now() - startTime;
        const minLoadTime = 50; // 50ms minimum - very fast for navigation

        if (elapsed < minLoadTime) {
          setTimeout(() => setLoading(false), minLoadTime - elapsed);
        } else {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [authChecked]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Login failed' };
      }

      setUser(data.user);
      setAuthChecked(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Registration failed' };
      }

      // Auto-login after registration
      return await login(userData.email, userData.password);
    } catch (error) {
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setAuthChecked(true);
      // Let the component handle the redirect
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
