/**
 * Store Index - Central export for all stores
 */

// App Shell Store
export {
  useAppShellStore,
  useAuth,
  useNavigation,
  useUI,
  useAppActions,
  useUser,
  useIsAuthenticated,
  useIsLoading,
  useActiveTab,
  useIsOffline,
  useTheme,
  type User,
  type AuthState,
  type NavigationState,
  type UIState,
  type AppShellState,
} from './appShellStore';

// Future stores can be added here
// export { useFeatureStore } from './featureStore';