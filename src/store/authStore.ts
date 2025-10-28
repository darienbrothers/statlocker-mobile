/**
 * Authentication Store
 * 
 * Manages authentication state using Zustand with Firebase Auth integration
 * Handles user session persistence and auth state resolution
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/AuthService';
import { logInfo, logError } from '@/lib/logging';
import { sessionManager } from '@/lib/sessionManager';
import { User, AuthError, IAuthStore, AuthProvider } from '@/types/auth';

interface AuthState extends IAuthStore {

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  
  // Account linking methods
  linkAppleAccount: () => Promise<void>;
  linkEmailPassword: (email: string, password: string) => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  getLinkedProviders: () => AuthProvider[];
  canUnlinkProvider: (providerId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasInitialized: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null, // Clear any previous errors on successful auth
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting sign in', { email });
          
          const userCredential = await authService.signInWithEmail(email, password);
          const user = authService.getCurrentUser();
          
          if (user) {
            get().setUser(user);
            logInfo('AuthStore: Sign in successful', { uid: user.uid });
          }
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Sign in failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithApple: async () => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting Apple Sign-In');
          
          const userCredential = await authService.signInWithApple();
          const user = authService.getCurrentUser();
          
          if (user) {
            get().setUser(user);
            logInfo('AuthStore: Apple Sign-In successful', { uid: user.uid });
          }
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Apple Sign-In failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting sign up', { email });
          
          const userCredential = await authService.createUserWithEmail(email, password);
          const user = authService.getCurrentUser();
          
          if (user) {
            get().setUser(user);
            logInfo('AuthStore: Sign up successful', { uid: user.uid });
          }
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Sign up failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting sign out');
          
          await authService.signOut();
          get().setUser(null);
          
          logInfo('AuthStore: Sign out successful');
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Sign out failed', error as Error);
          get().setError(authError);
          // Still clear user data even if sign out fails
          get().setUser(null);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      sendPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Sending password reset', { email });
          
          await authService.sendPasswordReset(email);
          
          logInfo('AuthStore: Password reset sent');
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Password reset failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      sendEmailVerification: async () => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Sending email verification');
          
          await authService.sendEmailVerification();
          
          logInfo('AuthStore: Email verification sent');
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Email verification failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        if (get().hasInitialized) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Initializing auth state');

          // Initialize session manager
          await sessionManager.initialize();

          // Validate existing session if user is present
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const isSessionValid = await authService.validateSession();
            if (!isSessionValid) {
              logInfo('AuthStore: Session invalid, signing out');
              await authService.signOut();
            }
          }

          // Set up auth state listener
          const unsubscribe = authService.onAuthStateChanged(async (user) => {
            logInfo('AuthStore: Auth state changed', { 
              authenticated: !!user,
              uid: user?.uid 
            });
            
            // Update session data when user changes
            if (user) {
              try {
                const sessionData = await sessionManager.createSessionData(user.uid);
                await sessionManager.storeSessionData(sessionData);
              } catch (sessionError) {
                logError('AuthStore: Failed to store session data', sessionError as Error);
              }
            } else {
              // Clear session data when user signs out
              await sessionManager.clearSessionData();
            }
            
            get().setUser(user);
          });

          // Store the unsubscribe function for cleanup
          // Note: In a real app, you'd want to store this somewhere accessible for cleanup
          
          set({ hasInitialized: true });
          logInfo('AuthStore: Auth state initialized');
        } catch (error) {
          logError('AuthStore: Auth initialization failed', error as Error);
          // Clear any corrupted state
          get().setUser(null);
          get().setError({
            code: 'auth/initialization-failed' as any,
            message: 'Failed to initialize authentication',
            userMessage: 'Something went wrong during startup. Please restart the app.',
            retryable: true,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Account linking methods
      linkAppleAccount: async () => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting Apple account linking');
          
          await authService.linkAppleAccount();
          
          // Refresh user data to include new provider
          const user = authService.getCurrentUser();
          if (user) {
            get().setUser(user);
          }
          
          logInfo('AuthStore: Apple account linked successfully');
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Apple account linking failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      linkEmailPassword: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting email/password linking', { email });
          
          await authService.linkEmailPassword(email, password);
          
          // Refresh user data to include new provider
          const user = authService.getCurrentUser();
          if (user) {
            get().setUser(user);
          }
          
          logInfo('AuthStore: Email/password linked successfully');
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Email/password linking failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      unlinkProvider: async (providerId: string) => {
        set({ isLoading: true, error: null });

        try {
          logInfo('AuthStore: Attempting provider unlinking', { providerId });
          
          await authService.unlinkProvider(providerId);
          
          // Refresh user data to remove unlinked provider
          const user = authService.getCurrentUser();
          if (user) {
            get().setUser(user);
          }
          
          logInfo('AuthStore: Provider unlinked successfully', { providerId });
        } catch (error) {
          const authError = error as AuthError;
          logError('AuthStore: Provider unlinking failed', error as Error);
          get().setError(authError);
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      getLinkedProviders: () => {
        return authService.getLinkedProviders();
      },

      canUnlinkProvider: (providerId: string) => {
        return authService.canUnlinkProvider(providerId);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not loading states or errors
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export the User type for convenience
export type { User } from '@/types/auth';