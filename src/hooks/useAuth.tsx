import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext } from
'react';
import type { AuthData } from '../types/auth';
import type { User } from '../types/user';
import { userService } from '../services/userService';
interface AuthContextType {
  user: User | null;
  authData: AuthData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
function missingProvider(): never {
  throw new Error('AuthProvider chưa được mount');
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  authData: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => missingProvider(),
  logout: () => missingProvider(),
  refreshUser: async () => missingProvider()
});
export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<User | null>(null);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_data');
    setUser(null);
    setAuthData(null);
  }, []);
  const refreshUser = useCallback(async () => {
    try {
      const res = await userService.getMe();
      if (res.success) {
        setUser(res.data);
      }
    } catch {
      logout();
    }
  }, [logout]);
  const login = useCallback(
    (data: AuthData) => {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('auth_data', JSON.stringify(data));
      setAuthData(data);
      return refreshUser();  // Return promise để có thể await
    },
    [refreshUser]
  );
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedAuth = localStorage.getItem('auth_data');
    if (token && savedAuth) {
      try {
        setAuthData(JSON.parse(savedAuth));
        refreshUser().finally(() => setIsLoading(false));
      } catch {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [refreshUser, logout]);
  return (
    <AuthContext.Provider
      value={{
        user,
        authData,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser
      }}>
      
      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  return useContext(AuthContext);
}