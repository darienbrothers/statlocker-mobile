/**
 * App Shell Store - Core state management for app shell
 * 
 * Features:
 * - Auth state management (user, isLoading, isAuthenticated)
 * - Navigation state tracking (activeTab, previousRoute)
 * - UI state for keyboard visibility and offline status
 * - Persistent state with AsyncStorage
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'athlete' | 'coach';
  sport?: string;
  position?: string;
  team?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

export interface NavigationState {
  activeTab: string;
  previousRoute: string | null;
  routeHistory: string[];
}

export interface UIState {
  isKeyboardVisible: boolean;
  isOffline: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

export interface AppShellState {
  // Auth state
  auth: AuthState;
  
  // Navigation state
  navigation: NavigationState;
  
  // UI state
  ui: UIState;
  
  // Actions
  actions: {
    // Auth actions
    setUser: (user: User | null) => void;
    setAuthenticated: (isAuthenticated: boolean) => void;
    setLoading: (isLoading: boolean) => void;
    setOnboardingComplete: (completed: boolean) => void;
    signOut: () => void;
    
    // Navigation actions
    setActiveTab: (tab: string) => void;
    setPreviousRoute: (route: string | null) => void;
    addToHistory: (route: string) => void;
    clearHistory: () => void;
    
    // UI actions
    setKeyboardVisible: (visible: boolean) => void;
    setOfflineStatus: (offline: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    updateNotificationSettings: (settings: Partial<UIState['notifications']>) => void;
    
    // Utility actions
    reset: () => void;
  };
}

// Initial state
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasCompletedOnboarding: false,
};

const initialNavigationState: NavigationState = {
  activeTab: 'dashboard',
  previousRoute: null,
  routeHistory: [],
};

const initialUIState: UIState = {
  isKeyboardVisible: false,
  isOffline: false,
  theme: 'system',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
};

// Store
export const useAppShellStore = create<AppShellState>()(
  persist(
    (set, get) => ({
      // Initial state
      auth: initialAuthState,
      navigation: initialNavigationState,
      ui: initialUIState,
      
      // Actions
      actions: {
        // Auth actions
        setUser: (user) =>
          set((state) => ({
            auth: { ...state.auth, user },
          })),
          
        setAuthenticated: (isAuthenticated) =>
          set((state) => ({
            auth: { ...state.auth, isAuthenticated },
          })),
          
        setLoading: (isLoading) =>
          set((state) => ({
            auth: { ...state.auth, isLoading },
          })),
          
        setOnboardingComplete: (completed) =>
          set((state) => ({
            auth: { ...state.auth, hasCompletedOnboarding: completed },
          })),
          
        signOut: () =>
          set((state) => ({
            auth: initialAuthState,
            navigation: initialNavigationState,
          })),
        
        // Navigation actions
        setActiveTab: (tab) =>
          set((state) => ({
            navigation: { ...state.navigation, activeTab: tab },
          })),
          
        setPreviousRoute: (route) =>
          set((state) => ({
            navigation: { ...state.navigation, previousRoute: route },
          })),
          
        addToHistory: (route) =>
          set((state) => {
            const history = [...state.navigation.routeHistory, route];
            // Keep only last 10 routes
            const trimmedHistory = history.slice(-10);
            return {
              navigation: { ...state.navigation, routeHistory: trimmedHistory },
            };
          }),
          
        clearHistory: () =>
          set((state) => ({
            navigation: { ...state.navigation, routeHistory: [] },
          })),
        
        // UI actions
        setKeyboardVisible: (visible) =>
          set((state) => ({
            ui: { ...state.ui, isKeyboardVisible: visible },
          })),
          
        setOfflineStatus: (offline) =>
          set((state) => ({
            ui: { ...state.ui, isOffline: offline },
          })),
          
        setTheme: (theme) =>
          set((state) => ({
            ui: { ...state.ui, theme },
          })),
          
        updateNotificationSettings: (settings) =>
          set((state) => ({
            ui: {
              ...state.ui,
              notifications: { ...state.ui.notifications, ...settings },
            },
          })),
        
        // Utility actions
        reset: () =>
          set({
            auth: initialAuthState,
            navigation: initialNavigationState,
            ui: initialUIState,
          }),
      },
    }),
    {
      name: 'app-shell-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        auth: {
          user: state.auth.user,
          isAuthenticated: state.auth.isAuthenticated,
          hasCompletedOnboarding: state.auth.hasCompletedOnboarding,
        },
        ui: {
          theme: state.ui.theme,
          notifications: state.ui.notifications,
        },
      }),
    }
  )
);

// Selectors for better performance
export const useAuth = () => useAppShellStore((state) => state.auth);
export const useNavigation = () => useAppShellStore((state) => state.navigation);
export const useUI = () => useAppShellStore((state) => state.ui);
export const useAppActions = () => useAppShellStore((state) => state.actions);

// Specific selectors
export const useUser = () => useAppShellStore((state) => state.auth.user);
export const useIsAuthenticated = () => useAppShellStore((state) => state.auth.isAuthenticated);
export const useIsLoading = () => useAppShellStore((state) => state.auth.isLoading);
export const useActiveTab = () => useAppShellStore((state) => state.navigation.activeTab);
export const useIsOffline = () => useAppShellStore((state) => state.ui.isOffline);
export const useTheme = () => useAppShellStore((state) => state.ui.theme);