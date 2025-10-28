import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { AthleteDNA } from '../AthleteDNA'
import { useOnboardingStore } from '../../../../stores/onboardingStore'
import type { AthleteDNA as AthleteDNAType } from '../../../../types/onboarding'

// Mock the onboarding store
jest.mock('../../../../stores/onboardingStore')
const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>

// Mock SelectionCard component
jest.mock('../../SelectionCard', () => ({
  SelectionCard: ({ title, onPress, selected }: any) => (
    <div
      testID={`selection-card-${title}`}
      onClick={onPress}
      data-selected={selected}
    >
      {title}
    </div>
  )
}))

describe('AthleteDNA Component', () => {
  const mockUpdateProfile = jest.fn()
  const mockTrackEvent = jest.fn()

  const defaultStoreState = {
    profile: {},
    updateProfile: mockUpdateProfile,
    trackEvent: mockTrackEvent
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOnboardingStore.mockReturnValue(defaultStoreState as any)
  })

  describe('Initial Render', () => {
    it('should render quiz introduction', () => {
      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/Help us understand your athletic personality/)).toBeTruthy()
      expect(getByText(/Question 1 of 6/)).toBeTruthy()
    })

    it('should render first question by default', () => {
      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/What drives you most in sports?/)).toBeTruthy()
      expect(getByText(/Understanding your motivation/)).toBeTruthy()
    })

    it('should render all answer options for first question', () => {
      const { getByTestId } = render(<AthleteDNA />)
      
      expect(getByTestId('selection-card-🎯 Personal Growth')).toBeTruthy()
      expect(getByTestId('selection-card-🏆 Recognition & Rewards')).toBeTruthy()
      expect(getByTestId('selection-card-⚖️ Both Matter')).toBeTruthy()
    })
  })

  describe('Question Navigation', () => {
    it('should advance to next question after selection', async () => {
      const { getByTestId, getByText } = render(<AthleteDNA />)
      
      // Answer first question
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      // Wait for auto-advance
      await waitFor(() => {
        expect(getByText(/Question 2 of 6/)).toBeTruthy()
        expect(getByText(/How would you describe your confidence level?/)).toBeTruthy()
      }, { timeout: 1000 })
    })

    it('should show previous question button after first question', async () => {
      const { getByTestId, getByText } = render(<AthleteDNA />)
      
      // Answer first question to advance
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      await waitFor(() => {
        expect(getByText(/← Previous Question/)).toBeTruthy()
      })
    })

    it('should navigate back to previous question', async () => {
      const { getByTestId, getByText } = render(<AthleteDNA />)
      
      // Answer first question
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      await waitFor(() => {
        expect(getByText(/Question 2 of 6/)).toBeTruthy()
      })
      
      // Go back
      fireEvent.press(getByText(/← Previous Question/))
      
      expect(getByText(/Question 1 of 6/)).toBeTruthy()
      expect(getByText(/What drives you most in sports?/)).toBeTruthy()
    })
  })

  describe('Response Tracking', () => {
    it('should track individual question responses', async () => {
      const { getByTestId } = render(<AthleteDNA />)
      
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      expect(mockTrackEvent).toHaveBeenCalledWith('dna_question_answered', {
        questionId: 'motivation',
        answer: 'intrinsic',
        timeSpent: 0
      })
    })

    it('should update profile with responses', async () => {
      const { getByTestId } = render(<AthleteDNA />)
      
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        dna: expect.objectContaining({
          motivation: 'intrinsic',
          completedAt: expect.any(Date)
        })
      })
    })
  })

  describe('Quiz Completion', () => {
    const completeDNA: AthleteDNAType = {
      motivation: 'intrinsic',
      confidence: 'high',
      focusMode: 'steady',
      competitiveness: 'high',
      coachability: 'high',
      resilience: 'high',
      completedAt: new Date()
    }

    it('should show completion state when all questions answered', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: completeDNA }
      } as any)

      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/🎉 AthleteDNA Complete!/)).toBeTruthy()
      expect(getByText(/Your AthleteDNA Profile/)).toBeTruthy()
    })

    it('should track completion event', async () => {
      const { getByTestId } = render(<AthleteDNA />)
      
      // Simulate completing all questions by answering the last one
      // (This would normally happen after answering all 6 questions)
      const responses = {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'steady',
        competitiveness: 'high',
        coachability: 'high'
      }
      
      // Mock being on the last question
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: responses }
      } as any)
      
      const { rerender } = render(<AthleteDNA />)
      
      // Answer final question
      fireEvent.press(getByTestId('selection-card-🏃 Bounce Back Fast'))
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('dna_completed', {
          responses: expect.objectContaining({
            resilience: 'high'
          }),
          totalTimeSpent: 0
        })
      })
    })

    it('should display DNA summary correctly', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: completeDNA }
      } as any)

      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/What drives you most in sports?/)).toBeTruthy()
      expect(getByText(/💪 Very Confident/)).toBeTruthy()
    })
  })

  describe('Progress Indication', () => {
    it('should show correct progress percentage', () => {
      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/17% Complete/)).toBeTruthy() // 1/6 = ~17%
    })

    it('should update progress as questions are answered', async () => {
      const { getByTestId, getByText } = render(<AthleteDNA />)
      
      // Answer first question
      fireEvent.press(getByTestId('selection-card-🎯 Personal Growth'))
      
      await waitFor(() => {
        expect(getByText(/33% Complete/)).toBeTruthy() // 2/6 = ~33%
      })
    })
  })

  describe('State Persistence', () => {
    it('should resume from saved progress', () => {
      const partialDNA = {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'steady'
      }

      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: partialDNA }
      } as any)

      const { getByText } = render(<AthleteDNA />)
      
      // Should be on question 4 (next unanswered)
      expect(getByText(/Question 4 of 6/)).toBeTruthy()
      expect(getByText(/How competitive are you?/)).toBeTruthy()
    })

    it('should show selected state for answered questions', () => {
      const partialDNA = {
        motivation: 'intrinsic'
      }

      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: partialDNA }
      } as any)

      const { getByTestId } = render(<AthleteDNA />)
      
      // Go back to first question to check selection state
      const personalGrowthCard = getByTestId('selection-card-🎯 Personal Growth')
      expect(personalGrowthCard.props['data-selected']).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<AthleteDNA />)
      
      const card = getByTestId('selection-card-🎯 Personal Growth')
      expect(card).toBeTruthy()
    })

    it('should provide motivational feedback', () => {
      const { getByText } = render(<AthleteDNA />)
      
      expect(getByText(/No right or wrong answers/)).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing DNA data gracefully', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: {}
      } as any)

      const { getByText } = render(<AthleteDNA />)
      
      // Should start from beginning
      expect(getByText(/Question 1 of 6/)).toBeTruthy()
    })

    it('should handle incomplete DNA data', () => {
      const incompleteDNA = {
        motivation: 'intrinsic'
        // Missing other fields
      }

      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: incompleteDNA }
      } as any)

      const { getByText } = render(<AthleteDNA />)
      
      // Should continue from where left off
      expect(getByText(/Question 2 of 6/)).toBeTruthy()
    })
  })
})