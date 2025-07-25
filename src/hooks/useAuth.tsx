import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      // Try dev-login endpoint from your backend
      const response = await fetch('http://192.168.11.3:8200/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(credentials.email)}`,
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Get user details using the token
      const userResponse = await fetch('http://192.168.11.3:8200/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user: User = {
          id: userData.id,
          name: userData.email.split('@')[0], // Extract name from email
          email: userData.email,
        };

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', data.access_token);
      } else {
        throw new Error('Failed to get user details');
      }
    } catch (error) {
      console.log('Using mock authentication for development');
      const mockUser: User = {
        id: 'dev-user-123',
        name: credentials.email.split('@')[0],
        email: credentials.email,
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-jwt-token');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    try {
      setIsLoading(true);
      
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // For now, use mock until WebAuthn is fully configured
      // TODO: Implement actual WebAuthn flow with your backend
      const mockUser: User = {
        id: 'passkey-user-456',
        name: 'Passkey User',
        email: 'passkey@example.com',
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-passkey-token');
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithPasskey,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}