/**
 * Empty State Copy - Centralized messaging for empty states
 * 
 * Features:
 * - Finalized one-liners + actions per tab
 * - Consistent messaging across the app
 * - Easy to maintain and update
 * - Supports internationalization
 */

export interface EmptyStateConfig {
  title: string;
  description?: string;
  action: {
    label: string;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  icon?: string;
}

/**
 * Empty state configurations for each tab/screen
 */
export const EMPTY_STATES: Record<string, EmptyStateConfig> = {
  // Dashboard Tab
  dashboard: {
    title: 'Welcome to StatLocker',
    description: 'Start tracking your performance to see your progress',
    action: {
      label: 'Get Started',
      variant: 'primary',
    },
    icon: '🏆',
  },

  // Stats Tab
  stats: {
    title: 'No games yet—log your first game to unlock trends.',
    action: {
      label: 'Log a Game',
      variant: 'primary',
    },
    icon: '📊',
  },

  // Goals Tab
  goals: {
    title: 'No goals yet—pick 3 season goals to stay on track.',
    action: {
      label: 'Choose Goals',
      variant: 'primary',
    },
    icon: '🎯',
  },

  // Recruiting Tab
  recruiting: {
    title: 'Start your roadmap—stay organized and on time.',
    action: {
      label: 'Open Roadmap',
      variant: 'primary',
    },
    icon: '🗺️',
  },

  // Additional empty states for future features
  games: {
    title: 'No games logged yet',
    description: 'Start logging games to track your performance over time',
    action: {
      label: 'Log First Game',
      variant: 'primary',
    },
    icon: '🏃‍♂️',
  },

  achievements: {
    title: 'No achievements unlocked yet',
    description: 'Complete goals and log games to earn achievements',
    action: {
      label: 'View Goals',
      variant: 'secondary',
    },
    icon: '🏅',
  },

  teams: {
    title: 'No teams joined yet',
    description: 'Join or create a team to collaborate with teammates',
    action: {
      label: 'Find Teams',
      variant: 'primary',
    },
    icon: '👥',
  },

  notifications: {
    title: 'No notifications',
    description: 'You\'re all caught up! New notifications will appear here',
    action: {
      label: 'Manage Settings',
      variant: 'ghost',
    },
    icon: '🔔',
  },

  search: {
    title: 'No results found',
    description: 'Try adjusting your search terms or filters',
    action: {
      label: 'Clear Filters',
      variant: 'secondary',
    },
    icon: '🔍',
  },

  favorites: {
    title: 'No favorites yet',
    description: 'Favorite games, goals, or achievements to find them quickly',
    action: {
      label: 'Explore Content',
      variant: 'primary',
    },
    icon: '⭐',
  },

  history: {
    title: 'No history available',
    description: 'Your activity history will appear here as you use the app',
    action: {
      label: 'Get Started',
      variant: 'primary',
    },
    icon: '📅',
  },

  // Error states (special empty states for errors)
  error: {
    title: 'Something went wrong',
    description: 'We\'re having trouble loading this content. Please try again.',
    action: {
      label: 'Try Again',
      variant: 'primary',
    },
    icon: '⚠️',
  },

  offline: {
    title: 'You\'re offline',
    description: 'Check your internet connection and try again',
    action: {
      label: 'Retry',
      variant: 'primary',
    },
    icon: '📡',
  },

  maintenance: {
    title: 'Under maintenance',
    description: 'We\'re making improvements. Please check back soon.',
    action: {
      label: 'Check Status',
      variant: 'secondary',
    },
    icon: '🔧',
  },
};

/**
 * Get empty state configuration by key
 */
export function getEmptyState(key: string): EmptyStateConfig | null {
  return EMPTY_STATES[key] || null;
}

/**
 * Get empty state with fallback
 */
export function getEmptyStateWithFallback(
  key: string, 
  fallback: EmptyStateConfig
): EmptyStateConfig {
  return EMPTY_STATES[key] || fallback;
}

/**
 * Check if empty state exists
 */
export function hasEmptyState(key: string): boolean {
  return key in EMPTY_STATES;
}

/**
 * Get all available empty state keys
 */
export function getEmptyStateKeys(): string[] {
  return Object.keys(EMPTY_STATES);
}

/**
 * Create custom empty state configuration
 */
export function createEmptyState(
  title: string,
  actionLabel: string,
  options?: {
    description?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    icon?: string;
  }
): EmptyStateConfig {
  return {
    title,
    description: options?.description,
    action: {
      label: actionLabel,
      variant: options?.variant || 'primary',
    },
    icon: options?.icon,
  };
}

/**
 * Empty state copy for specific contexts
 */
export const CONTEXTUAL_EMPTY_STATES = {
  // Onboarding contexts
  onboarding: {
    profile: createEmptyState(
      'Complete your profile',
      'Continue Setup',
      {
        description: 'Help us personalize your StatLocker experience',
        icon: '👤',
      }
    ),
    goals: createEmptyState(
      'Set your season goals',
      'Choose Goals',
      {
        description: 'Pick 3 goals to track your progress this season',
        icon: '🎯',
      }
    ),
    notifications: createEmptyState(
      'Stay updated',
      'Enable Notifications',
      {
        description: 'Get notified about your progress and achievements',
        icon: '🔔',
      }
    ),
  },

  // Game logging contexts
  gameLogging: {
    noPosition: createEmptyState(
      'Select your position',
      'Choose Position',
      {
        description: 'We\'ll customize stat tracking for your position',
        icon: '⚽',
      }
    ),
    noStats: createEmptyState(
      'No stats entered yet',
      'Add Stats',
      {
        description: 'Enter your game statistics to track performance',
        icon: '📝',
      }
    ),
  },

  // Settings contexts
  settings: {
    noPreferences: createEmptyState(
      'Customize your experience',
      'Update Preferences',
      {
        description: 'Set your preferences to personalize StatLocker',
        icon: '⚙️',
      }
    ),
  },
};

/**
 * Get contextual empty state
 */
export function getContextualEmptyState(
  context: string, 
  key: string
): EmptyStateConfig | null {
  const contextStates = CONTEXTUAL_EMPTY_STATES[context as keyof typeof CONTEXTUAL_EMPTY_STATES];
  return contextStates?.[key as keyof typeof contextStates] || null;
}

/**
 * Default empty state for unknown contexts
 */
export const DEFAULT_EMPTY_STATE: EmptyStateConfig = {
  title: 'Nothing here yet',
  description: 'Content will appear here as you use the app',
  action: {
    label: 'Get Started',
    variant: 'primary',
  },
  icon: '📱',
};

/**
 * Helper function to get empty state with translation support
 */
export function getTranslatedEmptyState(
  key: string,
  t: (key: string) => string
): EmptyStateConfig | null {
  const emptyState = getEmptyState(key);
  if (!emptyState) return null;

  return {
    ...emptyState,
    title: t(`empty.${key}.title`) || emptyState.title,
    description: emptyState.description ? (t(`empty.${key}.description`) || emptyState.description) : undefined,
    action: {
      ...emptyState.action,
      label: t(`empty.${key}.action`) || emptyState.action.label,
    },
  };
}

export default EMPTY_STATES;