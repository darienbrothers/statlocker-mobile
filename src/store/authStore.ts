/**
 * Authentication Store
 * 
 * Manages authentication state using Zustand
 * Handles user session persistence and auth state resolution
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'athlete' | 'coach';
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasInitialized: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // TODO: Implement actual Firebase Auth sign in
          // For now, simulate sign in with mock user
          await new Promise(resolve => setTimeout(resolve, 1000));

          const mockUser: User = {
            id: '1',
            email,
            firstName: 'Demo',
            lastName: 'User',
            role: 'athlete',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          get().setUser(mockUser);
        } catch (error) {
          console.error('Sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });

        try {
          // TODO: Implement actual Firebase Auth sign out
          await new Promise(resolve => setTimeout(resolve, 500));

          get().setUser(null);
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        if (get().hasInitialized) {
          return;
        }

        set({ isLoading: true });

        try {
          // TODO: Check for existing Firebase Auth session
          // For now, simulate auth state check
          await new Promise(resolve => setTimeout(resolve, 800));

          // The persisted state will be restored automatically
          // We just need to mark as initialized
          set({ hasInitialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear any corrupted state
          get().setUser(null);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);