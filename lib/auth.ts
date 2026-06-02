export interface AuthData {
  token: string;
  expiresAt: number;
}

// Token refresh locking mechanism
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem("token");
    if (!stored) return null;

    // Check if stored value is a string (old format) or JSON (new format)
    if (stored.startsWith("{")) {
      const authData: AuthData = JSON.parse(stored);
      
      // Check if token has expired
      if (Date.now() > authData.expiresAt) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        return null;
      }
      
      return authData.token;
    }
    
    // Old format - just a string token, migrate it
    const authData: AuthData = {
      token: stored,
      expiresAt: Date.now() + 31536000000, // 1 year from now
    };
    localStorage.setItem("token", JSON.stringify(authData));
    return authData.token;
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
};

export const setToken = (token: string): void => {
  const authData: AuthData = {
    token,
    expiresAt: Date.now() + 31536000000, // 1 year in milliseconds
  };
  localStorage.setItem("token", JSON.stringify(authData));
};

export const clearToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
};

export const isTokenValid = (): boolean => {
  return getToken() !== null;
};

// Authenticated fetch with token refresh locking
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  
  if (!token) {
    throw new Error("No token available");
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // If 401, token might be expired
    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      
      try {
        // Clear expired token
        clearToken();
        onTokenRefreshed(null);
        throw new Error("Token expired");
      } finally {
        isRefreshing = false;
      }
    }
    
    return response;
  } catch (error) {
    // If refresh is in progress, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            authFetch(url, options).then(resolve).catch(reject);
          } else {
            reject(new Error("Token refresh failed"));
          }
        });
      });
    }
    throw error;
  }
};
