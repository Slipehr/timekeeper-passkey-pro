import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { getApiUrl } from '../lib/config';

export function useApi() {
  const { logout } = useAuth();
  const { toast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const handleApiError = (error: any, defaultMessage: string = 'An error occurred') => {
    if (error.status === 401) {
      logout();
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (error.status === 403) {
      toast({
        title: "Access Denied",
        description: error.detail || "You don't have permission to perform this action.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Error",
      description: error.detail || defaultMessage,
      variant: "destructive",
    });
  };

  const apiRequest = async (urlOrEndpoint: string, options: RequestInit = {}) => {
    try {
      // If URL is already complete, use it; otherwise, treat as endpoint and build full URL
      const url = urlOrEndpoint.startsWith('http') ? urlOrEndpoint : getApiUrl(urlOrEndpoint);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          detail: errorData.detail || response.statusText,
        };
      }

      return await response.json();
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        status: 0,
        detail: 'Network error occurred',
      };
    }
  };

  return {
    getAuthHeaders,
    handleApiError,
    apiRequest,
  };
}