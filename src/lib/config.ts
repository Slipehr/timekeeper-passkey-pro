/**
 * Configuration utility for dynamic backend URL detection
 */

export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'production';
}

/**
 * Determines the appropriate backend API URL based on the current frontend URL
 */
export function getApiConfig(): AppConfig {
  const currentUrl = window.location.origin;
  
  // Production mapping: https://time.krilee.se -> https://time-api.krilee.se
  if (currentUrl === 'https://time.krilee.se') {
    return {
      apiBaseUrl: 'https://time-api.krilee.se',
      environment: 'production'
    };
  }
  
  // Development/local: 192.168.11.3:3000 -> 192.168.11.3:8200
  if (currentUrl.includes('192.168.11.3:3000') || currentUrl.includes('localhost:3000')) {
    return {
      apiBaseUrl: 'http://192.168.11.3:8200',
      environment: 'development'
    };
  }
  
  // Lovable preview environment - assume production API
  if (currentUrl.includes('lovableproject.com')) {
    return {
      apiBaseUrl: 'https://time-api.krilee.se',
      environment: 'production'
    };
  }
  
  // Default fallback to development
  return {
    apiBaseUrl: 'http://192.168.11.3:8200',
    environment: 'development'
  };
}

/**
 * Get the full API URL for a given endpoint
 */
export function getApiUrl(endpoint: string): string {
  const config = getApiConfig();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}${cleanEndpoint}`;
}

/**
 * Check if we're in production environment
 */
export function isProductionEnvironment(): boolean {
  return getApiConfig().environment === 'production';
}