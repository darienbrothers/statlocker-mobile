/**
 * Onboarding Animations
 * 
 * Centralized exports for all onboarding animation components and hooks
 */

export { ConfettiAnimation, useConfetti } from './ConfettiAnimation';
export { StepTransition, useStepTransition } from './StepTransition';
export { ProgressMilestone, useProgressMilestone } from './ProgressMilestone';
export { CompletionCelebration, useCompletionCelebration } from './CompletionCelebration';

// Re-export animation utilities from theme provider
export { 
  useOnboardingAnimation,
  useOnboardingTheme,
  useOnboardingResponsive 
} from '../OnboardingThemeProvider';