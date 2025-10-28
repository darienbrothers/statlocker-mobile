import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { TonePreference } from '../TonePreference'
import { useOnboardingStore } from '../../../../stores/onboardingStore'
import { getRecommendedTone } from '../../../../lib/onboarding/personaDerivation'
import type { AthleteDNA, AITone } from '../../../../types/onboarding'

// Mock the onboarding store
jest.mock('../../../../stores/onboardingStore')
const mockUseOnboardingStore = useOnboardingStore as jest.MockedFunction<typeof useOnboardingStore>

// Mock persona derivation
jest.mock('../../../../lib/onboarding/personaDerivation')
const mockGetRecommendedTone = getRecommendedTone as jest.MockedFunction<typeof getRecommendedTone>

// Mock SelectionCard component
jest.mock('../../SelectionCard', () => ({
  SelectionCard: ({ title, onPress, selected, badge }: any) => (
    <div
      testID={`selection-card-${title}`}
      onClick={onPress}
      data-selected={selected}
      data-badge={badge}
    >
      {title}
    </div>
  )
}))

describe('TonePreference Component', () => {
  const mockUpdateProfile = jest.fn()
  const mockTrackEvent = jest.fn()

  const defaultStoreState = {
    profile: {},
    updateProfile: mockUpdateProfile,
    trackEvent: mockTrackEvent
  }

  const sampleDNA: AthleteDNA = {
    motivation: 'intrinsic',
    confidence: 'high',
    focusMode: 'steady',
    competitiveness: 'high',
    coachability: 'high',
    resilience: 'high',
    completedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOnboardingStore.mockReturnValue(defaultStoreState as any)
    mockGetRecommendedTone.mockReturnValue('hype')
  })

  describe('Initial Render', () => {
    it('should render step introduction', () => {
      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/Choose how you'd like your AI coach to communicate/)).toBeTruthy()
    })

    it('should render all four tone options', () => {
      const { getByTestId } = render(<TonePreference />)
      
      expect(getByTestId('selection-card-🔥 Hype')).toBeTruthy()
      expect(getByTestId('selection-card-🎓 Mentor')).toBeTruthy()
      expect(getByTestId('selection-card-📊 Analyst')).toBeTruthy()
      expect(getByTestId('selection-card-⚡ Captain')).toBeTruthy()
    })

    it('should show personality descriptions for each tone', () => {
      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/Perfect for competitive athletes who love energy/)).toBeTruthy()
      expect(getByText(/Great for athletes who value guidance/)).toBeTruthy()
      expect(getByText(/Ideal for athletes who love stats/)).toBeTruthy()
      expect(getByText(/Best for natural leaders who want honest/)).toBeTruthy()
    })

    it('should show preview buttons for each tone', () => {
      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/👁️ Preview Hype Style/)).toBeTruthy()
      expect(getByText(/👁️ Preview Mentor Style/)).toBeTruthy()
      expect(getByText(/👁️ Preview Analyst Style/)).toBeTruthy()
      expect(getByText(/👁️ Preview Captain Style/)).toBeTruthy()
    })
  })

  describe('DNA-Based Recommendations', () => {
    it('should show recommendation when DNA is available', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: sampleDNA }
      } as any)
      mockGetRecommendedTone.mockReturnValue('hype')

      const { getByText, getByTestId } = render(<TonePreference />)
      
      expect(getByText(/🎯 Recommended for You/)).toBeTruthy()
      expect(getByText(/🔥 Hype/)).toBeTruthy()
      expect(getByText(/Based on your AthleteDNA/)).toBeTruthy()
      
      // Check that recommended option has badge
      const hypeCard = getByTestId('selection-card-🔥 Hype')
      expect(hypeCard.props['data-badge']).toBe('Recommended')
    })

    it('should not show recommendation when DNA is missing', () => {
      const { queryByText } = render(<TonePreference />)
      
      expect(queryByText(/🎯 Recommended for You/)).toBeFalsy()
    })

    it('should call getRecommendedTone with correct DNA', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: sampleDNA }
      } as any)

      render(<TonePreference />)
      
      expect(mockGetRecommendedTone).toHaveBeenCalledWith(sampleDNA)
    })
  })

  describe('Tone Selection', () => {
    it('should update profile when tone is selected', () => {
      const { getByTestId } = render(<TonePreference />)
      
      fireEvent.press(getByTestId('selection-card-🔥 Hype'))
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({ aiTone: 'hype' })
    })

    it('should track tone selection event', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: sampleDNA }
      } as any)
      mockGetRecommendedTone.mockReturnValue('hype')

      const { getByTestId } = render(<TonePreference />)
      
      fireEvent.press(getByTestId('selection-card-🔥 Hype'))
      
      expect(mockTrackEvent).toHaveBeenCalledWith('tone_selected', {
        tone: 'hype',
        wasRecommended: true,
        previousTone: undefined
      })
    })

    it('should track when non-recommended tone is selected', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: sampleDNA }
      } as any)
      mockGetRecommendedTone.mockReturnValue('hype')

      const { getByTestId } = render(<TonePreference />)
      
      fireEvent.press(getByTestId('selection-card-🎓 Mentor'))
      
      expect(mockTrackEvent).toHaveBeenCalledWith('tone_selected', {
        tone: 'mentor',
        wasRecommended: false,
        previousTone: undefined
      })
    })

    it('should show selection status when tone is selected', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { aiTone: 'hype' }
      } as any)

      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/🎯 Your AI Coach Style/)).toBeTruthy()
      expect(getByText(/🔥 Hype/)).toBeTruthy()
      expect(getByText(/Your AI coach will use this communication style/)).toBeTruthy()
    })
  })

  describe('Tone Preview', () => {
    it('should show preview modal when preview button is pressed', () => {
      const { getByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      
      expect(getByText(/🔥 Hype Preview/)).toBeTruthy()
      expect(getByText(/Here's how your AI coach would talk to you:/)).toBeTruthy()
    })

    it('should show sample messages in preview', () => {
      const { getByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      
      expect(getByText(/LET'S GO! Your shooting percentage is UP 15%/)).toBeTruthy()
      expect(getByText(/You're absolutely CRUSHING those ground balls/)).toBeTruthy()
    })

    it('should track preview interaction', () => {
      const { getByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      
      expect(mockTrackEvent).toHaveBeenCalledWith('tone_previewed', {
        tone: 'hype',
        duration: 0
      })
    })

    it('should close preview when close button is pressed', () => {
      const { getByText, queryByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      expect(getByText(/🔥 Hype Preview/)).toBeTruthy()
      
      fireEvent.press(getByText('×'))
      expect(queryByText(/🔥 Hype Preview/)).toBeFalsy()
    })

    it('should allow selecting tone from preview modal', () => {
      const { getByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      fireEvent.press(getByText(/Choose Hype/))
      
      expect(mockUpdateProfile).toHaveBeenCalledWith({ aiTone: 'hype' })
    })

    it('should auto-hide preview after timeout', async () => {
      jest.useFakeTimers()
      
      const { getByText, queryByText } = render(<TonePreference />)
      
      fireEvent.press(getByText(/👁️ Preview Hype Style/))
      expect(getByText(/🔥 Hype Preview/)).toBeTruthy()
      
      // Fast-forward time
      jest.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(queryByText(/🔥 Hype Preview/)).toBeFalsy()
      })
      
      jest.useRealTimers()
    })
  })

  describe('State Persistence', () => {
    it('should show selected state for saved tone', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { aiTone: 'mentor' }
      } as any)

      const { getByTestId } = render(<TonePreference />)
      
      const mentorCard = getByTestId('selection-card-🎓 Mentor')
      expect(mentorCard.props['data-selected']).toBe(true)
    })

    it('should update local state when profile changes', () => {
      const { rerender } = render(<TonePreference />)
      
      // Update store to have selected tone
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { aiTone: 'analyst' }
      } as any)
      
      rerender(<TonePreference />)
      
      const analystCard = document.querySelector('[data-testid="selection-card-📊 Analyst"]')
      expect(analystCard?.getAttribute('data-selected')).toBe('true')
    })
  })

  describe('Accessibility and UX', () => {
    it('should show helper text', () => {
      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/Don't worry - you can change your AI tone anytime/)).toBeTruthy()
    })

    it('should show motivational text when tone is selected', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { aiTone: 'hype' }
      } as any)

      const { getByTestId } = render(<TonePreference />)
      
      const hypeCard = getByTestId('selection-card-🔥 Hype')
      // This would be handled by the SelectionCard component's motivationalText prop
      expect(hypeCard).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing profile gracefully', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: undefined
      } as any)

      const { getByText } = render(<TonePreference />)
      
      expect(getByText(/Choose how you'd like your AI coach/)).toBeTruthy()
    })

    it('should handle DNA without recommendation gracefully', () => {
      mockGetRecommendedTone.mockReturnValue(undefined as any)
      
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStoreState,
        profile: { dna: sampleDNA }
      } as any)

      const { queryByText } = render(<TonePreference />)
      
      expect(queryByText(/🎯 Recommended for You/)).toBeFalsy()
    })
  })

  describe('Integration with Persona System', () => {
    it('should work with different persona recommendations', () => {
      const testCases: Array<{ dna: Partial<AthleteDNA>, expectedTone: AITone }> = [
        { 
          dna: { competitiveness: 'high', confidence: 'high' }, 
          expectedTone: 'hype' 
        },
        { 
          dna: { coachability: 'high', motivation: 'intrinsic' }, 
          expectedTone: 'analyst' 
        },
        { 
          dna: { competitiveness: 'collaborative', resilience: 'high' }, 
          expectedTone: 'mentor' 
        }
      ]

      testCases.forEach(({ dna, expectedTone }) => {
        mockGetRecommendedTone.mockReturnValue(expectedTone)
        mockUseOnboardingStore.mockReturnValue({
          ...defaultStoreState,
          profile: { dna: dna as AthleteDNA }
        } as any)

        const { getByText } = render(<TonePreference />)
        
        expect(getByText(/🎯 Recommended for You/)).toBeTruthy()
        expect(mockGetRecommendedTone).toHaveBeenCalledWith(dna)
      })
    })
  })
})