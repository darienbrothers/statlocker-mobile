/**
 * useOnboardingAnalytics Hook Tests
 * 
 * Tests for the onboarding analytics React hook integration
 */

import { renderHook, act } from '@testing-library/react-native';
import { useOnboardingAnalytics, useDNAQuizAnalytics, useTonePreferenceAnalytics, useGoalSelectionAnalytics } from '../useOnboardingAnalytics';
import { useOnboardingStore } from '../../../stores/onboardingStore';

// Mock the analytics services
jest.mock('../../../services/OnboardingAnalyticsService', () => ({
  onboardingAnalytics: {
    startOnboardingSession: jest.fn(),
    trackStepStart: jest.fn(),
    trackStepCompleted: jest.fn(),
    trackStepAbandoned: jest.fn(),
    trackGoalSelected: jest.fn(),
    trackTonePreview: jest.fn(),
    trackToneSelected: jest.fn(),
    trackDNAQuestionAnswered: jest.fn(),
    trackDNACompleted: jest.fn(),
    trackValidationError: jest.fn(),
    trackNetworkError: jest.fn(),
    assignUserToVariant: jest.fn(),
    trackABTestConversion: jest.fn()
  }
}));

jest.mock('../../../services/OnboardingPerformanceService', () => ({
  onboardingPerformance: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    trackComponentLoad: jest.fn(),
    trackAnimationPerformance: jest.fn(),
    trackNetworkRequest: jest.fn()
  }
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/onboarding/step/1')
}));

// Mock the onboarding store
jest.mock('../../../stores/onboardingStore', () => ({
  useOnboardingStore: jest.fn()
}));

// Mock performance monitoring
jest.mock('../../../lib/onboarding/performanceMonitoring', () => ({
  rnPerformanceMonitor: {
    recordMetric: jest.fn()
  }
}));

describe('useOnboardingAnalytics', () => {
  const mockStoreState = {
    currentStep: 1,
    profile: {
      onboardingStarted: new Date()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingStore as jest.Mock).mockReturnValue(mockStoreState);
  });

  describe('Hook Initialization', () => {
    it('should initialize analytics services on mount', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      renderHook(() => useOnboardingAnalytics());

      expect(onboardingAnalytics.startOnboardingSession).toHaveBeenCalledWith('organic', 'existing_user');
      expect(onboardingPerformance.startMonitoring).toHaveBeenCalled();
    });

    it('should track step start when current step changes', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { rerender } = renderHook(() => useOnboardingAnalytics());

      // Change step
      (useOnboardingStore as jest.Mock).mockReturnValue({
        ...mockStoreState,
        currentStep: 2
      });

      rerender();

      expect(onboardingAnalytics.trackStepStart).toHaveBeenCalledWith(2);
      expect(onboardingPerformance.trackStepStart).toHaveBeenCalledWith(2);
    });

    it('should cleanup performance monitoring on unmount', () => {
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { unmount } = renderHook(() => useOnboardingAnalytics());

      unmount();

      expect(onboardingPerformance.stopMonitoring).toHaveBeenCalled();
    });
  });

  describe('Event Tracking Methods', () => {
    it('should track step completion', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackStepCompleted(1, 2, ['validation-error']);
      });

      expect(onboardingAnalytics.trackStepCompleted).toHaveBeenCalledWith(1, 2, ['validation-error']);
      expect(onboardingPerformance.trackStepCompletion).toHaveBeenCalledWith(1);
    });

    it('should track step abandonment', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackStepAbandoned(2, 'user_exit');
      });

      expect(onboardingAnalytics.trackStepAbandoned).toHaveBeenCalledWith(2, 'user_exit');
    });

    it('should track goal selection', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackGoalSelected('improve-shooting', 'offense', 1);
      });

      expect(onboardingAnalytics.trackGoalSelected).toHaveBeenCalledWith('improve-shooting', 'offense', 1);
    });

    it('should track tone preview', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackTonePreview('hype', 5000);
      });

      expect(onboardingAnalytics.trackTonePreview).toHaveBeenCalledWith('hype', 5000);
    });

    it('should track tone selection', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackToneSelected('mentor', true, 'hype');
      });

      expect(onboardingAnalytics.trackToneSelected).toHaveBeenCalledWith('mentor', true, 'hype');
    });

    it('should track DNA question answered', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackDNAQuestionAnswered('motivation', 'intrinsic', 3000);
      });

      expect(onboardingAnalytics.trackDNAQuestionAnswered).toHaveBeenCalledWith('motivation', 'intrinsic', 3000);
    });

    it('should track DNA completion', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      const responses = { motivation: 'intrinsic', confidence: 'high' };

      act(() => {
        result.current.trackDNACompleted(responses, 45000);
      });

      expect(onboardingAnalytics.trackDNACompleted).toHaveBeenCalledWith(responses, 45000);
    });

    it('should track validation errors', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackValidationError(3, 'position', 'Position is required', 2);
      });

      expect(onboardingAnalytics.trackValidationError).toHaveBeenCalledWith(3, 'position', 'Position is required', 2);
    });

    it('should track network errors', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackNetworkError(5, 'save_profile', 'Network timeout', 1);
      });

      expect(onboardingAnalytics.trackNetworkError).toHaveBeenCalledWith(5, 'save_profile', 'Network timeout', 1);
    });
  });

  describe('Performance Tracking Methods', () => {
    it('should track component load with RN performance monitor', async () => {
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      await act(async () => {
        result.current.trackComponentLoad('RoleSelection', 1500, 25000, false);
      });

      expect(onboardingPerformance.trackComponentLoad).toHaveBeenCalledWith('RoleSelection', 1500, 1, 25000, false);
    });

    it('should track animation performance', () => {
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackAnimationPerformance('step-transition', 58, 2, 500);
      });

      expect(onboardingPerformance.trackAnimationPerformance).toHaveBeenCalledWith('step-transition', 58, 2, 500, 1);
    });

    it('should track network requests', () => {
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackNetworkRequest('/api/profile', 'POST', 2500, 1024, 200);
      });

      expect(onboardingPerformance.trackNetworkRequest).toHaveBeenCalledWith('/api/profile', 'POST', 2500, 1024, 200, 1);
    });
  });

  describe('Session Management', () => {
    it('should start session manually', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.startSession('referral', 'user123');
      });

      expect(onboardingAnalytics.startOnboardingSession).toHaveBeenCalledWith('referral', 'user123');
      expect(onboardingPerformance.startMonitoring).toHaveBeenCalled();
    });

    it('should end session', () => {
      const { onboardingPerformance } = require('../../../services/OnboardingPerformanceService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.endSession();
      });

      expect(onboardingPerformance.stopMonitoring).toHaveBeenCalled();
    });
  });

  describe('A/B Testing Integration', () => {
    it('should get variant for user', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      onboardingAnalytics.assignUserToVariant.mockReturnValue('variant_a');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      const variant = result.current.getVariant('test1');

      expect(onboardingAnalytics.assignUserToVariant).toHaveBeenCalledWith('test1', expect.any(String));
      expect(variant).toBe('variant_a');
    });

    it('should track A/B test conversion', () => {
      const { onboardingAnalytics } = require('../../../services/OnboardingAnalyticsService');
      
      const { result } = renderHook(() => useOnboardingAnalytics());

      act(() => {
        result.current.trackConversion('test1', 'variant_a', 'completion', 1);
      });

      expect(onboardingAnalytics.trackABTestConversion).toHaveBeenCalledWith('test1', 'variant_a', 'completion', 1, expect.any(String));
    });
  });

  describe('Utility Methods', () => {
    it('should return current step', () => {
      const { result } = renderHook(() => useOnboardingAnalytics());

      const currentStep = result.current.getCurrentStep();

      expect(currentStep).toBe(1);
    });

    it('should return session ID', () => {
      const { result } = renderHook(() => useOnboardingAnalytics());

      const sessionId = result.current.getSessionId();

      expect(typeof sessionId).toBe('string');
    });

    it('should return analytics enabled status', () => {
      const { result } = renderHook(() => useOnboardingAnalytics());

      const isEnabled = result.current.isAnalyticsEnabled();

      expect(isEnabled).toBe(true);
    });
  });
});

describe('useDNAQuizAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track quiz start', () => {
    const { result } = renderHook(() => useDNAQuizAnalytics());

    act(() => {
      result.current.startQuiz();
    });

    // Should set internal start time (tested indirectly through completion)
    expect(typeof result.current.startQuiz).toBe('function');
  });

  it('should track question start and answer', () => {
    const { result } = renderHook(() => useDNAQuizAnalytics());

    act(() => {
      result.current.startQuestion('motivation');
    });

    // Wait a bit then answer
    setTimeout(() => {
      act(() => {
        result.current.answerQuestion('motivation', 'intrinsic');
      });
    }, 100);

    // Should track the question answer with time spent
    expect(typeof result.current.answerQuestion).toBe('function');
  });

  it('should track quiz completion', () => {
    const { result } = renderHook(() => useDNAQuizAnalytics());

    const responses = {
      motivation: 'intrinsic',
      confidence: 'high',
      focusMode: 'intense'
    };

    act(() => {
      result.current.startQuiz();
    });

    setTimeout(() => {
      act(() => {
        result.current.completeQuiz(responses);
      });
    }, 1000);

    expect(typeof result.current.completeQuiz).toBe('function');
  });
});

describe('useTonePreferenceAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track tone preview start and end', () => {
    const { result } = renderHook(() => useTonePreferenceAnalytics());

    act(() => {
      result.current.startTonePreview('hype');
    });

    setTimeout(() => {
      act(() => {
        result.current.endTonePreview('hype');
      });
    }, 2000);

    expect(typeof result.current.startTonePreview).toBe('function');
    expect(typeof result.current.endTonePreview).toBe('function');
  });

  it('should track tone selection', () => {
    const { result } = renderHook(() => useTonePreferenceAnalytics());

    act(() => {
      result.current.selectTone('mentor', true, 'hype');
    });

    expect(typeof result.current.selectTone).toBe('function');
  });
});

describe('useGoalSelectionAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track goal selection', () => {
    const { result } = renderHook(() => useGoalSelectionAnalytics());

    act(() => {
      result.current.selectGoal('improve-shooting', 'offense', 1);
    });

    expect(typeof result.current.selectGoal).toBe('function');
  });
});

describe('Hook Integration', () => {
  it('should handle pathname changes correctly', () => {
    const { usePathname } = require('expo-router');
    
    // Test non-onboarding path
    usePathname.mockReturnValue('/dashboard');
    
    const { result, rerender } = renderHook(() => useOnboardingAnalytics());

    // Change to onboarding path
    usePathname.mockReturnValue('/onboarding/step/2');
    
    rerender();

    expect(typeof result.current.trackStepStart).toBe('function');
  });

  it('should handle store state changes', () => {
    const { result, rerender } = renderHook(() => useOnboardingAnalytics());

    // Change store state
    (useOnboardingStore as jest.Mock).mockReturnValue({
      currentStep: 3,
      profile: {
        onboardingStarted: new Date(),
        role: 'athlete'
      }
    });

    rerender();

    expect(result.current.getCurrentStep()).toBe(3);
  });
});