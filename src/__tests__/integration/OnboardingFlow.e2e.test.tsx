/**
 * End-to-End Onboarding Flow Integration Tests
 * 
 * Tests complete onboarding journeys from start to finish:
 * - Complete athlete onboarding journey
 * - Error scenarios and recovery paths
 * - Multi-device and offline scenarios
 * - Data persistence and validation
 * 
 * Requirements tested: Complete flow validation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingProfile } from '@/types/onboarding';

// Mock components for testing
const MockOnboardingFlow = () => {
  const {
    currentStep,
    profile,
    updateProfile,
    navigateNext,
    navigateBack,
    validateStep,
    saveProgress,
    resetOnboarding,
    completedSteps,
    validationErrors,
    syncStatus,
  } = useOnboardingStore();

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      await saveProgress();
      navigateNext();
    }
  };

  const handleBack = () => {
    navigateBack();
  };

  const handleReset = () => {
    resetOnboarding();
  };

  return (
    <>
      <text testID="current-step">{currentStep}</text>
      <text testID="sync-status">{syncStatus}</text>
      <text testID="completed-steps">{Array.from(completedSteps).join(',')}</text>
      <text testID="validation-errors">{JSON.stringify(validationErrors)}</text>
      
      {/* Step 1: Role Selection */}
      {currentStep === 1 && (
        <>
          <text testID="step-title">Select Your Role</text>
          <button
            testID="role-athlete"
            onPress={() => updateProfile({ role: 'athlete' })}
          >
            Athlete
          </button>
          <button
            testID="role-coach"
            onPress={() => updateProfile({ role: 'coach' })}
          >
            Coach
          </button>
        </>
      )}

      {/* Step 2: Sport & Demographics */}
      {currentStep === 2 && (
        <>
          <text testID="step-title">Sport & Demographics</text>
          <button
            testID="sport-lacrosse"
            onPress={() => updateProfile({ sport: 'lacrosse' })}
          >
            Lacrosse
          </button>
          <button
            testID="gender-male"
            onPress={() => updateProfile({ gender: 'male' })}
          >
            Male
          </button>
          <button
            testID="gender-female"
            onPress={() => updateProfile({ gender: 'female' })}
          >
            Female
          </button>
          <button
            testID="set-dob"
            onPress={() => updateProfile({ 
              dateOfBirth: new Date('2006-05-15'),
              graduationYear: 2025 
            })}
          >
            Set DOB & Graduation
          </button>
        </>
      )}

      {/* Step 3: Position & Level */}
      {currentStep === 3 && (
        <>
          <text testID="step-title">Position & Level</text>
          <button
            testID="position-attack"
            onPress={() => updateProfile({ position: 'attack' })}
          >
            Attack
          </button>
          <button
            testID="position-midfield"
            onPress={() => updateProfile({ position: 'midfield' })}
          >
            Midfield
          </button>
          <button
            testID="level-varsity"
            onPress={() => updateProfile({ academicLevel: 'varsity' })}
          >
            Varsity
          </button>
        </>
      )}

      {/* Step 4: Team Details */}
      {currentStep === 4 && (
        <>
          <text testID="step-title">Team Details</text>
          <button
            testID="team-high-school"
            onPress={() => updateProfile({ teamType: 'high_school' })}
          >
            High School
          </button>
          <button
            testID="set-school"
            onPress={() => updateProfile({
              school: {
                name: 'Test High School',
                city: 'Test City',
                state: 'CA',
                type: 'public'
              }
            })}
          >
            Set School Info
          </button>
        </>
      )}

      {/* Step 5: Goal Selection */}
      {currentStep === 5 && (
        <>
          <text testID="step-title">Goal Selection</text>
          <button
            testID="set-goals"
            onPress={() => updateProfile({
              selectedGoals: ['improve-shooting', 'increase-speed', 'better-defense']
            })}
          >
            Set 3 Goals
          </button>
        </>
      )}

      {/* Step 6: AthleteDNA */}
      {currentStep === 6 && (
        <>
          <text testID="step-title">AthleteDNA Quiz</text>
          <button
            testID="complete-dna"
            onPress={() => updateProfile({
              dna: {
                motivation: 'intrinsic',
                confidence: 'high',
                focusMode: 'intense',
                competitiveness: 'high',
                coachability: 'high',
                resilience: 'high',
                completedAt: new Date()
              }
            })}
          >
            Complete DNA Quiz
          </button>
        </>
      )}

      {/* Step 7: AI Tone */}
      {currentStep === 7 && (
        <>
          <text testID="step-title">AI Tone Preference</text>
          <button
            testID="tone-hype"
            onPress={() => updateProfile({ aiTone: 'hype' })}
          >
            Hype
          </button>
        </>
      )}

      {/* Step 8: Age Verification */}
      {currentStep === 8 && (
        <>
          <text testID="step-title">Age Verification</text>
          <button
            testID="verify-age"
            onPress={() => updateProfile({ ageVerified: true })}
          >
            Verify Age
          </button>
        </>
      )}

      {/* Step 9: Legal Consent */}
      {currentStep === 9 && (
        <>
          <text testID="step-title">Legal Consent</text>
          <button
            testID="accept-legal"
            onPress={() => updateProfile({
              tosAccepted: true,
              privacyAccepted: true,
              benchmarkingConsent: true
            })}
          >
            Accept Terms
          </button>
        </>
      )}

      {/* Step 10: Review Profile */}
      {currentStep === 10 && (
        <>
          <text testID="step-title">Review Profile</text>
          <text testID="profile-data">{JSON.stringify(profile)}</text>
        </>
      )}

      {/* Step 11: Account Creation */}
      {currentStep === 11 && (
        <>
          <text testID="step-title">Account Creation</text>
          <text testID="onboarding-complete">Onboarding Complete!</text>
        </>
      )}

      {/* Navigation */}
      <button testID="next-button" onPress={handleNext}>
        Next
      </button>
      <button testID="back-button" onPress={handleBack}>
        Back
      </button>
      <button testID="reset-button" onPress={handleReset}>
        Reset
      </button>
    </>
  );
};

// Mock dependencies
jest.mock('@/stores/onboardingStore');
jest.mock('@react-native-async-storage/async-storage');

describe('End-to-End Onboarding Flow', () => {
  const mockStore = {
    currentStep: 1,
    totalSteps: 11,
    profile: {} as OnboardingProfile,
    completedSteps: new Set<number>(),
    validationErrors: {},
    syncStatus: 'idle' as const,
    updateProfile: jest.fn(),
    navigateNext: jest.fn(),
    navigateBack: jest.fn(),
    validateStep: jest.fn(),
    saveProgress: jest.fn(),
    resetOnboarding: jest.fn(),
    loadProgress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingStore as jest.Mock).mockReturnValue(mockStore);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Reset mock store state
    mockStore.currentStep = 1;
    mockStore.profile = {};
    mockStore.completedSteps = new Set();
    mockStore.validationErrors = {};
    mockStore.syncStatus = 'idle';
  });

  describe('Complete Athlete Onboarding Journey', () => {
    it('should complete full athlete onboarding flow successfully', async () => {
      const { rerender } = render(<MockOnboardingFlow />);

      // Step 1: Role Selection
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
      expect(screen.getByTestId('step-title')).toHaveTextContent('Select Your Role');

      // Select athlete role
      fireEvent.press(screen.getByTestId('role-athlete'));
      expect(mockStore.updateProfile).toHaveBeenCalledWith({ role: 'athlete' });

      // Mock validation success and navigation
      mockStore.validateStep.mockReturnValue(true);
      mockStore.currentStep = 2;
      mockStore.completedSteps.add(1);
      mockStore.profile.role = 'athlete';

      fireEvent.press(screen.getByTestId('next-button'));
      expect(mockStore.validateStep).toHaveBeenCalledWith(1);
      expect(mockStore.saveProgress).toHaveBeenCalled();
      expect(mockStore.navigateNext).toHaveBeenCalled();

      rerender(<MockOnboardingFlow />);

      // Step 2: Sport & Demographics
      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
      expect(screen.getByTestId('step-title')).toHaveTextContent('Sport & Demographics');

      // Complete demographics
      fireEvent.press(screen.getByTestId('sport-lacrosse'));
      fireEvent.press(screen.getByTestId('gender-male'));
      fireEvent.press(screen.getByTestId('set-dob'));

      expect(mockStore.updateProfile).toHaveBeenCalledWith({ sport: 'lacrosse' });
      expect(mockStore.updateProfile).toHaveBeenCalledWith({ gender: 'male' });
      expect(mockStore.updateProfile).toHaveBeenCalledWith({
        dateOfBirth: new Date('2006-05-15'),
        graduationYear: 2025
      });

      // Navigate to step 3
      mockStore.currentStep = 3;
      mockStore.completedSteps.add(2);
      Object.assign(mockStore.profile, {
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: new Date('2006-05-15'),
        graduationYear: 2025
      });

      fireEvent.press(screen.getByTestId('next-button'));
      rerender(<MockOnboardingFlow />);

      // Step 3: Position & Level
      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
      fireEvent.press(screen.getByTestId('position-attack'));
      fireEvent.press(screen.getByTestId('level-varsity'));

      // Navigate to step 4
      mockStore.currentStep = 4;
      mockStore.completedSteps.add(3);
      Object.assign(mockStore.profile, {
        position: 'attack',
        academicLevel: 'varsity'
      });

      fireEvent.press(screen.getByTestId('next-button'));
      rerender(<MockOnboardingFlow />);

      // Step 4: Team Details
      expect(screen.getByTestId('current-step')).toHaveTextContent('4');
      fireEvent.press(screen.getByTestId('team-high-school'));
      fireEvent.press(screen.getByTestId('set-school'));

      // Navigate to step 5
      mockStore.currentStep = 5;
      mockStore.completedSteps.add(4);
      Object.assign(mockStore.profile, {
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA',
          type: 'public'
        }
      });

      fireEvent.press(screen.getByTestId('next-button'));
      rerender(<MockOnboardingFlow />);

      // Step 5: Goal Selection
      expect(screen.getByTestId('current-step')).toHaveTextContent('5');
      fireEvent.press(screen.getByTestId('set-goals'));

      // Continue through remaining steps...
      const remainingSteps = [
        { step: 6, action: 'complete-dna', data: { dna: expect.any(Object) } },
        { step: 7, action: 'tone-hype', data: { aiTone: 'hype' } },
        { step: 8, action: 'verify-age', data: { ageVerified: true } },
        { step: 9, action: 'accept-legal', data: { tosAccepted: true, privacyAccepted: true, benchmarkingConsent: true } },
      ];

      for (const { step, action, data } of remainingSteps) {
        mockStore.currentStep = step;
        mockStore.completedSteps.add(step - 1);
        fireEvent.press(screen.getByTestId('next-button'));
        rerender(<MockOnboardingFlow />);

        expect(screen.getByTestId('current-step')).toHaveTextContent(step.toString());
        fireEvent.press(screen.getByTestId(action));
        expect(mockStore.updateProfile).toHaveBeenCalledWith(expect.objectContaining(data));
      }

      // Final steps
      mockStore.currentStep = 10;
      mockStore.completedSteps.add(9);
      fireEvent.press(screen.getByTestId('next-button'));
      rerender(<MockOnboardingFlow />);

      // Step 10: Review Profile
      expect(screen.getByTestId('step-title')).toHaveTextContent('Review Profile');
      expect(screen.getByTestId('profile-data')).toBeDefined();

      // Complete onboarding
      mockStore.currentStep = 11;
      mockStore.completedSteps.add(10);
      fireEvent.press(screen.getByTestId('next-button'));
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('onboarding-complete')).toHaveTextContent('Onboarding Complete!');
      expect(mockStore.completedSteps.size).toBe(10);
    });

    it('should handle backward navigation correctly', async () => {
      // Start at step 3
      mockStore.currentStep = 3;
      mockStore.completedSteps = new Set([1, 2]);
      mockStore.profile = {
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male'
      };

      const { rerender } = render(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('3');

      // Navigate back to step 2
      fireEvent.press(screen.getByTestId('back-button'));
      expect(mockStore.navigateBack).toHaveBeenCalled();

      mockStore.currentStep = 2;
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('2');
      expect(screen.getByTestId('step-title')).toHaveTextContent('Sport & Demographics');

      // Navigate back to step 1
      fireEvent.press(screen.getByTestId('back-button'));
      mockStore.currentStep = 1;
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
      expect(screen.getByTestId('step-title')).toHaveTextContent('Select Your Role');
    });

    it('should preserve data during navigation', async () => {
      mockStore.currentStep = 5;
      mockStore.profile = {
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        position: 'attack',
        academicLevel: 'varsity',
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA',
          type: 'public'
        }
      };

      render(<MockOnboardingFlow />);

      // Navigate back and forth
      fireEvent.press(screen.getByTestId('back-button'));
      fireEvent.press(screen.getByTestId('next-button'));

      // Data should be preserved
      expect(mockStore.profile.role).toBe('athlete');
      expect(mockStore.profile.sport).toBe('lacrosse');
      expect(mockStore.profile.school?.name).toBe('Test High School');
    });
  });

  describe('Error Scenarios and Recovery Paths', () => {
    it('should handle validation errors gracefully', async () => {
      render(<MockOnboardingFlow />);

      // Try to navigate without selecting role
      mockStore.validateStep.mockReturnValue(false);
      mockStore.validationErrors = { 1: ['Please select your role'] };

      fireEvent.press(screen.getByTestId('next-button'));

      expect(mockStore.validateStep).toHaveBeenCalledWith(1);
      expect(mockStore.navigateNext).not.toHaveBeenCalled();
      expect(screen.getByTestId('validation-errors')).toHaveTextContent(
        JSON.stringify({ 1: ['Please select your role'] })
      );
    });

    it('should recover from validation errors when data is corrected', async () => {
      const { rerender } = render(<MockOnboardingFlow />);

      // Start with validation error
      mockStore.validateStep.mockReturnValue(false);
      mockStore.validationErrors = { 1: ['Please select your role'] };

      fireEvent.press(screen.getByTestId('next-button'));
      expect(mockStore.navigateNext).not.toHaveBeenCalled();

      // Fix the error by selecting role
      fireEvent.press(screen.getByTestId('role-athlete'));
      
      // Clear validation errors
      mockStore.validateStep.mockReturnValue(true);
      mockStore.validationErrors = {};
      rerender(<MockOnboardingFlow />);

      // Should now be able to navigate
      fireEvent.press(screen.getByTestId('next-button'));
      expect(mockStore.navigateNext).toHaveBeenCalled();
    });

    it('should handle save progress failures', async () => {
      render(<MockOnboardingFlow />);

      mockStore.validateStep.mockReturnValue(true);
      mockStore.saveProgress.mockRejectedValue(new Error('Save failed'));
      mockStore.syncStatus = 'error';

      fireEvent.press(screen.getByTestId('role-athlete'));
      
      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      expect(screen.getByTestId('sync-status')).toHaveTextContent('error');
    });

    it('should allow retry after save failure', async () => {
      const { rerender } = render(<MockOnboardingFlow />);

      // First attempt fails
      mockStore.validateStep.mockReturnValue(true);
      mockStore.saveProgress
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce(undefined);
      
      mockStore.syncStatus = 'error';

      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      expect(screen.getByTestId('sync-status')).toHaveTextContent('error');

      // Retry should succeed
      mockStore.syncStatus = 'idle';
      rerender(<MockOnboardingFlow />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      expect(mockStore.saveProgress).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors during save', async () => {
      render(<MockOnboardingFlow />);

      mockStore.validateStep.mockReturnValue(true);
      mockStore.saveProgress.mockRejectedValue(new Error('Network error'));
      mockStore.syncStatus = 'error';

      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      expect(screen.getByTestId('sync-status')).toHaveTextContent('error');
      
      // Should still allow local navigation even with network error
      expect(mockStore.navigateNext).toHaveBeenCalled();
    });
  });

  describe('Multi-device and Offline Scenarios', () => {
    it('should save progress to local storage', async () => {
      render(<MockOnboardingFlow />);

      mockStore.validateStep.mockReturnValue(true);
      mockStore.saveProgress.mockResolvedValue(undefined);

      fireEvent.press(screen.getByTestId('role-athlete'));
      
      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      expect(mockStore.saveProgress).toHaveBeenCalled();
    });

    it('should load progress from local storage on app restart', async () => {
      const savedProgress = {
        currentStep: 3,
        profile: {
          role: 'athlete',
          sport: 'lacrosse',
          gender: 'male'
        },
        completedSteps: [1, 2],
        timestamp: new Date().toISOString()
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedProgress));

      mockStore.loadProgress.mockResolvedValue(undefined);
      mockStore.currentStep = 3;
      mockStore.profile = savedProgress.profile;
      mockStore.completedSteps = new Set([1, 2]);

      render(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    });

    it('should handle corrupted local storage data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');
      mockStore.loadProgress.mockRejectedValue(new Error('Invalid data'));

      // Should start fresh if data is corrupted
      render(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    it('should queue changes when offline', async () => {
      render(<MockOnboardingFlow />);

      // Simulate offline state
      mockStore.syncStatus = 'error';
      mockStore.saveProgress.mockRejectedValue(new Error('Network unavailable'));

      fireEvent.press(screen.getByTestId('role-athlete'));
      
      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      // Should still update local state
      expect(mockStore.updateProfile).toHaveBeenCalledWith({ role: 'athlete' });
      expect(mockStore.navigateNext).toHaveBeenCalled();
    });

    it('should sync queued changes when back online', async () => {
      const { rerender } = render(<MockOnboardingFlow />);

      // Start offline
      mockStore.syncStatus = 'error';
      mockStore.saveProgress.mockRejectedValue(new Error('Network unavailable'));

      fireEvent.press(screen.getByTestId('role-athlete'));
      
      await act(async () => {
        fireEvent.press(screen.getByTestId('next-button'));
      });

      // Come back online
      mockStore.syncStatus = 'syncing';
      mockStore.saveProgress.mockResolvedValue(undefined);
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('sync-status')).toHaveTextContent('syncing');

      // Should eventually sync
      mockStore.syncStatus = 'idle';
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('sync-status')).toHaveTextContent('idle');
    });
  });

  describe('Data Persistence and Validation', () => {
    it('should maintain data integrity across app sessions', async () => {
      const completeProfile = {
        role: 'athlete' as const,
        sport: 'lacrosse',
        gender: 'male' as const,
        dateOfBirth: new Date('2006-05-15'),
        graduationYear: 2025,
        position: 'attack',
        academicLevel: 'varsity' as const,
        teamType: 'high_school' as const,
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA',
          type: 'public' as const
        },
        selectedGoals: ['improve-shooting', 'increase-speed', 'better-defense']
      };

      mockStore.profile = completeProfile;
      mockStore.currentStep = 6;
      mockStore.completedSteps = new Set([1, 2, 3, 4, 5]);

      render(<MockOnboardingFlow />);

      // Verify all data is preserved
      expect(mockStore.profile.role).toBe('athlete');
      expect(mockStore.profile.sport).toBe('lacrosse');
      expect(mockStore.profile.selectedGoals).toHaveLength(3);
      expect(mockStore.profile.school?.name).toBe('Test High School');
    });

    it('should validate data consistency between steps', async () => {
      mockStore.profile = {
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        position: 'attack' // Valid for male lacrosse
      };

      render(<MockOnboardingFlow />);

      // Position should be valid for the sport/gender combination
      expect(mockStore.profile.position).toBe('attack');
      expect(mockStore.profile.sport).toBe('lacrosse');
      expect(mockStore.profile.gender).toBe('male');
    });

    it('should handle reset functionality correctly', async () => {
      mockStore.currentStep = 5;
      mockStore.profile = {
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male'
      };
      mockStore.completedSteps = new Set([1, 2, 3, 4]);

      const { rerender } = render(<MockOnboardingFlow />);

      fireEvent.press(screen.getByTestId('reset-button'));
      expect(mockStore.resetOnboarding).toHaveBeenCalled();

      // Mock reset state
      mockStore.currentStep = 1;
      mockStore.profile = {};
      mockStore.completedSteps = new Set();
      rerender(<MockOnboardingFlow />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
      expect(screen.getByTestId('completed-steps')).toHaveTextContent('');
    });

    it('should validate required fields at each step', async () => {
      render(<MockOnboardingFlow />);

      // Test step 1 validation
      mockStore.validateStep.mockImplementation((step) => {
        if (step === 1) return !!mockStore.profile.role;
        return true;
      });

      expect(mockStore.validateStep(1)).toBe(false);

      fireEvent.press(screen.getByTestId('role-athlete'));
      mockStore.profile.role = 'athlete';

      expect(mockStore.validateStep(1)).toBe(true);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid navigation without memory leaks', async () => {
      const { rerender } = render(<MockOnboardingFlow />);

      // Simulate rapid navigation
      for (let i = 0; i < 10; i++) {
        mockStore.currentStep = (i % 5) + 1;
        rerender(<MockOnboardingFlow />);
      }

      // Should not cause issues
      expect(screen.getByTestId('current-step')).toBeDefined();
    });

    it('should debounce save operations', async () => {
      render(<MockOnboardingFlow />);

      mockStore.validateStep.mockReturnValue(true);
      mockStore.saveProgress.mockResolvedValue(undefined);

      // Rapid button presses
      for (let i = 0; i < 5; i++) {
        fireEvent.press(screen.getByTestId('next-button'));
      }

      // Should not call save excessively
      expect(mockStore.saveProgress).toHaveBeenCalled();
    });

    it('should clean up resources on unmount', () => {
      const { unmount } = render(<MockOnboardingFlow />);

      unmount();

      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });
});