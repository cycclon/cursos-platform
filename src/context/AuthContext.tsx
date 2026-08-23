import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserRole } from '@/types';
import { authService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isMainTeacher: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (data: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; language?: 'es' | 'en' }) => Promise<{
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

  /**
   * Drop everything fetched as the previous viewer.
   *
   * Most payloads are shaped by who is asking — `/courses` strips module videos
   * for anyone without access, `/enrollments` is per-student. Signing in
   * changes the answer to every one of those requests, but React Query has no
   * way to know that: with a 5-minute `staleTime` it keeps serving the
   * anonymous payload, which is how a freshly logged-in student opens a course
   * and is told it has no video until they hard-reload.
   *
   * `['auth']` is left alone — the caller has just written the new identity
   * into it.
   */
  const resetViewerScopedQueries = () => {
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
  };

  const loginWithGoogle = () => {
    // Full page navigation — the cache is rebuilt from scratch on return.
    window.location.href = authService.getGoogleLoginUrl();
  };

  const loginWithEmail = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const loggedUser = await authService.login(data);
    queryClient.setQueryData(['auth', 'me'], loggedUser);
    resetViewerScopedQueries();
  };

  const register = async (data: { name: string; email: string; password: string; language?: 'es' | 'en' }) => {
    // Non-Gmail accounts now go through email verification — they are only
    // signed in after clicking the link. Seeded users (placeholder googleId)
    // are upgraded in place and signed in immediately, so we still need to
    // hydrate the cache when the response is a User.
    const result = await authService.register(data);
    if (!('status' in result)) {
      queryClient.setQueryData(['auth', 'me'], result);
      resetViewerScopedQueries();
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    // Signing out must *discard*, not just invalidate: the cache holds data
    // fetched as the signed-in student (course videos, enrolments, progress),
    // and invalidated entries are still served while they refetch. On a shared
    // phone that would show the next person the previous one's content.
    //
    // Drop the new identity first, then the data. Writing `['auth', 'me']`
    // before the reset means every `enabled: isAuthenticated` query is already
    // switched off by the time the refetch pass runs, so signing out doesn't
    // fire a burst of requests that can only 401.
    queryClient.setQueryData(['auth', 'me'], null);
    // NOT `queryClient.clear()`. `clear()` *removes* every Query object,
    // including the `['auth', 'me']` one this provider's `useQuery` observer is
    // attached to — and removal neither detaches nor notifies that observer. A
    // following `setQueryData` therefore builds a brand-new Query the observer
    // never sees, so `user` keeps its pre-logout value and the header goes on
    // rendering the signed-in state until the page is reloaded by hand.
    // `resetQueries` keeps the same Query objects, so observers are notified:
    // the data is dropped exactly as before and whatever is still on screen
    // refetches as an anonymous viewer.
    queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        role: user?.role ?? 'visitor',
        isMainTeacher: !!user?.isMainTeacher,
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
