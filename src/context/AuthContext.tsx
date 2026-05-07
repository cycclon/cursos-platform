import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserRole } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (data: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<{
    status: 'verification_sent';
    email: string;
    message: string;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false,
    staleTime: Infinity,
  });

  const loginWithGoogle = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  const loginWithEmail = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const loggedUser = await authService.login(data);
    queryClient.setQueryData(['auth', 'me'], loggedUser);
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    // Account is no longer activated immediately — user receives a verification
    // email and is signed in only after they click the link.
    return authService.register(data);
  };

  const logout = async () => {
    await authService.logout();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        role: user?.role ?? 'visitor',
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
