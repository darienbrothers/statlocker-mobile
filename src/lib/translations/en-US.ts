/**
 * English (US) Translations - Default locale for StatLocker
 */
import { type Translations } from '../i18n';

export const enUSTranslations: Translations = {
  // App Shell
  'app.name': 'StatLocker',
  'app.tagline': 'Stat tracking made easy. Progress made visible.',
  
  // Authentication
  'auth.signIn': 'Sign In',
  'auth.signOut': 'Sign Out',
  'auth.signUp': 'Sign Up',
  'auth.welcomeBack': 'Welcome Back',
  'auth.signInDescription': 'Sign in to continue tracking your performance',
  'auth.forgotPassword': 'Forgot Password?',
  'auth.createAccount': 'Create Account',
  'auth.alreadyHaveAccount': 'Already have an account?',
  
  // Onboarding
  'onboarding.welcome': 'Welcome to StatLocker',
  'onboarding.getStarted': 'Get Started',
  'onboarding.skip': 'Skip for now',
  'onboarding.continue': 'Continue',
  'onboarding.completeSetup': 'Complete Setup',
  'onboarding.profile.title': 'Create Your Profile',
  'onboarding.profile.description': 'Tell us about yourself and your sport',
  'onboarding.goals.title': 'Set Your Goals',
  'onboarding.goals.description': 'What do you want to achieve this season?',
  'onboarding.notifications.title': 'Stay Updated',
  'onboarding.notifications.description': 'Get notified about your progress and achievements',
  
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.stats': 'Stats',
  'nav.goals': 'Goals',
  'nav.recruiting': 'Recruiting',
  
  // Common Actions
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.share': 'Share',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.done': 'Done',
  'common.tryAgain': 'Try Again',
  'common.loading': 'Loading',
  'common.error': 'Error',
  'common.success': 'Success',
  
  // Empty States
  'empty.stats.title': 'No games yet—log your first game to unlock trends.',
  'empty.stats.action': 'Log a Game',
  'empty.goals.title': 'No goals yet—pick 3 season goals to stay on track.',
  'empty.goals.action': 'Choose Goals',
  'empty.recruiting.title': 'Start your roadmap—stay organized and on time.',
  'empty.recruiting.action': 'Open Roadmap',
  'empty.dashboard.title': 'Welcome to StatLocker',
  'empty.dashboard.description': 'Start tracking your performance to see your progress',
  'empty.dashboard.action': 'Get Started',
  
  // Error Messages
  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'Please check your internet connection and try again.',
  'error.timeout': 'The request timed out. Please try again.',
  'error.unauthorized': 'Please sign in to continue.',
  'error.forbidden': 'You don\'t have permission to perform this action.',
  'error.notFound': 'The requested resource was not found.',
  'error.serverError': 'Server error. Please try again later.',
  
  // Offline
  'offline.banner': 'No internet connection',
  'offline.message': 'You\'re currently offline. Some features may not be available.',
  
  // Loading States
  'loading.default': 'Loading...',
  'loading.signIn': 'Signing in...',
  'loading.saving': 'Saving...',
  'loading.uploading': 'Uploading...',
  'loading.processing': 'Processing...',
  
  // Accessibility
  'a11y.button': 'Button',
  'a11y.link': 'Link',
  'a11y.image': 'Image',
  'a11y.loading': 'Loading content',
  'a11y.error': 'Error occurred',
  'a11y.success': 'Action completed successfully',
  'a11y.close': 'Close',
  'a11y.menu': 'Menu',
  'a11y.search': 'Search',
  'a11y.filter': 'Filter',
  'a11y.sort': 'Sort',
  'a11y.expand': 'Expand',
  'a11y.collapse': 'Collapse',
  
  // Time and Date
  'time.now': 'now',
  'time.today': 'today',
  'time.yesterday': 'yesterday',
  'time.tomorrow': 'tomorrow',
  'time.thisWeek': 'this week',
  'time.lastWeek': 'last week',
  'time.thisMonth': 'this month',
  'time.lastMonth': 'last month',
  
  // Numbers and Stats
  'stats.goals': {
    message: '{{count}} goal',
    plural: {
      one: '{{count}} goal',
      other: '{{count}} goals',
    },
  },
  'stats.assists': {
    message: '{{count}} assist',
    plural: {
      one: '{{count}} assist',
      other: '{{count}} assists',
    },
  },
  'stats.games': {
    message: '{{count}} game',
    plural: {
      one: '{{count}} game',
      other: '{{count}} games',
    },
  },
  
  // Validation Messages
  'validation.required': 'This field is required',
  'validation.email': 'Please enter a valid email address',
  'validation.password': 'Password must be at least 8 characters',
  'validation.passwordMatch': 'Passwords do not match',
  'validation.minLength': 'Must be at least {{min}} characters',
  'validation.maxLength': 'Must be no more than {{max}} characters',
  
  // Success Messages
  'success.saved': 'Saved successfully',
  'success.updated': 'Updated successfully',
  'success.deleted': 'Deleted successfully',
  'success.created': 'Created successfully',
  'success.uploaded': 'Uploaded successfully',
  
  // Keyboard Test Screen
  'keyboard.test.title': 'Keyboard QA Test',
  'keyboard.test.submit': 'Submit Form',

  // Feature-specific (placeholders for future features)
  'dashboard.welcome': 'Welcome back, {{name}}!',
  'dashboard.todaysStats': 'Today\'s Stats',
  'dashboard.recentGames': 'Recent Games',
  'dashboard.upcomingGoals': 'Upcoming Goals',
  
  'stats.overview': 'Stats Overview',
  'stats.trends': 'Trends',
  'stats.comparison': 'Comparison',
  'stats.filter': 'Filter Stats',
  
  'goals.current': 'Current Goals',
  'goals.completed': 'Completed Goals',
  'goals.progress': 'Progress',
  'goals.setGoal': 'Set New Goal',
  
  'recruiting.timeline': 'Recruiting Timeline',
  'recruiting.contacts': 'Contacts',
  'recruiting.opportunities': 'Opportunities',
  'recruiting.deadlines': 'Deadlines',
};

export default enUSTranslations;