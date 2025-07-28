import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { getBaseUrl } from "../utils/getBaseUrl";

export enum UserRole {
  USER = "user",
  AUDIT = "audit", 
  MANAGER = "manager",
  ADMINISTRATOR = "administrator"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  bootstrapAdmin: (adminData: BootstrapAdminData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isProduction: boolean | null;
  isBootstrapped: boolean | null;
  connectionError: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface BootstrapAdminData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
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
  const [isProduction, setIsProduction] = useState<boolean | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setConnectionError(false);
      
      try {
        // Check environment and bootstrap status in parallel
        const [envResponse, bootstrapResponse] = await Promise.allSettled([
          fetch(`${getBaseUrl()}/auth/environment`),
          fetch(`${getBaseUrl()}/auth/bootstrap-status`)
        ]);

        // Handle environment check
        if (envResponse.status === 'fulfilled' && envResponse.value.ok) {
          const envData = await envResponse.value.json();
          console.log('Environment response:', envData);
          const prodValue = envData.environment === 'production';
          console.log('Setting isProduction to:', prodValue);
          setIsProduction(prodValue);
        } else {
          console.error('Failed to check environment:', envResponse.status === 'rejected' ? envResponse.reason : 'Request failed');
          console.log('Setting isProduction to: true (default)');
          setIsProduction(true); // Default to production
          setConnectionError(true);
        }

        // Handle bootstrap status check
        if (bootstrapResponse.status === 'fulfilled' && bootstrapResponse.value.ok) {
          const bootstrapData = await bootstrapResponse.value.json();
          setIsBootstrapped(bootstrapData.bootstrapped);
        } else {
          console.error('Failed to check bootstrap status:', bootstrapResponse.status === 'rejected' ? bootstrapResponse.reason : 'Request failed');
          setIsBootstrapped(true); // Default to bootstrapped
          setConnectionError(true);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setIsProduction(true);
        setIsBootstrapped(true);
        setConnectionError(true);
      } finally {
        // Load stored user if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Ensure environment is determined before login
    if (isProduction === null) {
      throw new Error('Environment not yet determined. Please wait and try again.');
    }

    try {
      setIsLoading(true);
      setConnectionError(false);
      
      // Use appropriate endpoint based on environment
      const endpoint = isProduction 
        ? `${getBaseUrl()}/auth/login-password`
        : `${getBaseUrl()}/auth/dev-login`;
      
      console.log('Login attempt:', { isProduction, endpoint });
      
      const body = isProduction 
        ? { email: credentials.email.toLowerCase(), password: credentials.password }
        : { email: credentials.email.toLowerCase() };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Get user details using the token
      const userResponse = await fetch(`${getBaseUrl()}/auth/me`, {
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
          role: userData.role as UserRole,
          created_at: userData.created_at,
        };

        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', data.access_token);
      } else {
        throw new Error('Failed to get user details');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setConnectionError(true);
      throw error;
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

      // Start WebAuthn authentication flow
      const response = await fetch(`${getBaseUrl()}/auth/passkey-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Passkey authentication failed');
      }

      const data = await response.json();
      
      // Get user details using the token
      const userResponse = await fetch(`${getBaseUrl()}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user details');
      }

      const userData = await userResponse.json();
      const user: User = {
        id: userData.id,
        name: userData.email.split('@')[0],
        email: userData.email,
        role: userData.role as UserRole,
        created_at: userData.created_at,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const bootstrapAdmin = async (adminData: BootstrapAdminData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${getBaseUrl()}/auth/bootstrap-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminData.email.toLowerCase(),
          password: adminData.password,
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          phone_number: adminData.phone_number,
        }),
      });

      if (!response.ok) {
        throw new Error('Bootstrap admin creation failed');
      }

      // Update bootstrap status
      setIsBootstrapped(true);
    } catch (error) {
      console.error('Bootstrap admin creation failed:', error);
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
      bootstrapAdmin,
      logout,
      isLoading,
      isProduction,
      isBootstrapped,
      connectionError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}