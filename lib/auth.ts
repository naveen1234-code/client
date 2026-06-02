export interface AuthData {
  token: string;
  expiresAt: number;
}

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
