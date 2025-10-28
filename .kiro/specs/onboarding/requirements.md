# Onboarding Requirements Document

## Introduction

The Onboarding System guides new users through a 5-step process to collect essential profile information, set initial goals, and create their account with proper Firestore profile storage. This system ensures users are properly configured before accessing the main application features.

## Glossary

- **Onboarding_System**: The 5-step user registration and profile setup flow
- **Profile_Data**: User information collected during onboarding and stored in Firestore
- **Goal_Selection**: Process where users choose 3 performance goals from predefined options
- **Role_Lock**: System constraint that limits user registration to Athlete or Coach roles only
- **Tone_Preference**: User's selected AI communication style (Hype, Mentor, Analyst, Captain)
- **Firestore_Profile**: User profile document stored in Firebase Firestore database
- **Account_Creation**: Firebase Authentication account registration process
- **Graduation_Year**: User's expected high school graduation year (2025-2029)
- **Academic_Level**: User's current academic/athletic level (Freshman, JV, Varsity)
- **School_Details**: User's high school name and location information
- **Club_Details**: Optional club team organization and team name information
- **AthleteDNA_Quiz**: Six-question personality assessment for AI personalization
- **Age_Verification**: COPPA/GDPR-K compliance process for users under 16
- **Guardian_Consent**: Parental consent process for users aged 13-15
- **Legal_Consent**: Terms of Service and Privacy Policy acceptance
- **Trial_Activation**: Automatic 7-day trial initiation through RevenueCat
- **Onboarding_Recovery**: System to save and resume incomplete onboarding sessions

## Requirements

### Requirement 1

**User Story:** As a new user, I want to select my role during onboarding, so that the app can provide role-appropriate features and content.

#### Acceptance Criteria

1. WHEN a user starts onboarding, THE Onboarding_System SHALL display role selection with only Athlete and Coach options
2. THE Onboarding_System SHALL prevent progression until a role is selected
3. THE Onboarding_System SHALL store the selected role in Profile_Data
4. THE Onboarding_System SHALL configure subsequent steps based on the selected role

### Requirement 2

**User Story:** As a new user, I want to specify my sport and gender, so that the app can provide relevant statistics and comparisons.

#### Acceptance Criteria

1. WHEN a user completes role selection, THE Onboarding_System SHALL display sport selection with lacrosse as the primary option
2. THE Onboarding_System SHALL display gender selection with male and female options
3. THE Onboarding_System SHALL require both sport and gender selection before allowing progression
4. THE Onboarding_System SHALL store sport and gender selections in Profile_Data

### Requirement 3

**User Story:** As an athlete or coach, I want to select my position, so that the app can provide position-specific statistics and insights.

#### Acceptance Criteria

1. WHEN a user completes sport and gender selection, THE Onboarding_System SHALL display position options relevant to the selected sport and gender
2. THE Onboarding_System SHALL require position selection before allowing progression
3. THE Onboarding_System SHALL store the selected position in Profile_Data
4. THE Onboarding_System SHALL configure position-specific stat tracking based on the selection

### Requirement 4

**User Story:** As a new user, I want to specify whether I play for high school or club teams, so that the app can provide appropriate competitive context.

#### Acceptance Criteria

1. WHEN a user completes position selection, THE Onboarding_System SHALL display team type selection with High School and Club options
2. THE Onboarding_System SHALL require team type selection before allowing progression
3. THE Onboarding_System SHALL store the team type in Profile_Data
4. THE Onboarding_System SHALL use team type for appropriate competitive benchmarking

### Requirement 5

**User Story:** As a new user, I want to choose 3 performance goals during onboarding, so that the app can track my progress toward meaningful objectives.

#### Acceptance Criteria

1. WHEN a user completes team type selection, THE Onboarding_System SHALL display goal selection interface with position-relevant goal options
2. THE Onboarding_System SHALL require selection of exactly 3 goals before allowing progression
3. THE Onboarding_System SHALL prevent selection of more than 3 goals
4. THE Onboarding_System SHALL store the selected goals in Profile_Data
5. THE Onboarding_System SHALL initialize goal tracking with selected objectives

### Requirement 6

**User Story:** As a new user, I want to choose my preferred AI communication tone, so that the app provides insights in a style that motivates me.

#### Acceptance Criteria

1. WHEN a user completes goal selection, THE Onboarding_System SHALL display tone preference selection with Hype, Mentor, Analyst, and Captain options
2. THE Onboarding_System SHALL provide clear descriptions of each tone style
3. THE Onboarding_System SHALL require tone selection before allowing progression
4. THE Onboarding_System SHALL store the Tone_Preference in Profile_Data

### Requirement 7

**User Story:** As a new user, I want to review my onboarding selections before creating my account, so that I can ensure all information is correct.

#### Acceptance Criteria

1. WHEN a user completes tone selection, THE Onboarding_System SHALL display a review screen with all collected Profile_Data
2. THE Onboarding_System SHALL allow users to edit any previous selection from the review screen
3. THE Onboarding_System SHALL require user confirmation before proceeding to account creation
4. THE Onboarding_System SHALL display clear next steps for account creation

### Requirement 8

**User Story:** As a new user, I want to create my account after reviewing my selections, so that I can access the app with my configured profile.

#### Acceptance Criteria

1. WHEN a user confirms their review, THE Onboarding_System SHALL initiate Account_Creation process
2. THE Onboarding_System SHALL collect necessary authentication credentials (email, password)
3. THE Onboarding_System SHALL create Firebase Authentication account
4. THE Onboarding_System SHALL handle authentication errors with clear user feedback
5. IF Account_Creation fails, THEN THE Onboarding_System SHALL allow retry without losing Profile_Data

### Requirement 9

**User Story:** As a new user, I want my profile information automatically saved to the database after account creation, so that my preferences are preserved for future sessions.

#### Acceptance Criteria

1. WHEN Account_Creation succeeds, THE Onboarding_System SHALL create Firestore_Profile document with collected Profile_Data
2. THE Onboarding_System SHALL include user ID, role, sport, gender, position, team type, goals, and tone preference in Firestore_Profile
3. THE Onboarding_System SHALL add profile creation timestamp to Firestore_Profile
4. IF Firestore_Profile creation fails, THEN THE Onboarding_System SHALL retry profile creation and notify user of any persistent errors
5. WHEN Firestore_Profile creation succeeds, THE Onboarding_System SHALL redirect user to main application

### Requirement 10

**User Story:** As a user, I want to navigate between onboarding steps easily, so that I can correct mistakes or review previous selections.

#### Acceptance Criteria

1. THE Onboarding_System SHALL provide clear navigation between steps 1-5
2. THE Onboarding_System SHALL allow backward navigation to previous steps
3. THE Onboarding_System SHALL preserve user selections when navigating between steps
4. THE Onboarding_System SHALL display progress indication showing current step and total steps
5. THE Onboarding_System SHALL prevent forward navigation until current step requirements are met

### Requirement 11

**User Story:** As an athlete, I want to enter my graduation year and current level, so that the app can align goals and recruiting timelines appropriately.

#### Acceptance Criteria

1. WHEN a user completes sport and gender selection, THE Onboarding_System SHALL display Graduation_Year dropdown with options from 2025-2029
2. THE Onboarding_System SHALL display Academic_Level selection with Freshman, JV, and Varsity options
3. THE Onboarding_System SHALL require both graduation year and level selection before allowing progression
4. THE Onboarding_System SHALL store Graduation_Year and Academic_Level in Firestore_Profile
5. THE Onboarding_System SHALL use graduation year for recruiting timeline calculations

### Requirement 12

**User Story:** As an athlete, I want to add my school and optionally my club team, so that stats are properly mapped to the right organizations.

#### Acceptance Criteria

1. WHEN a user completes level selection, THE Onboarding_System SHALL display school information inputs for school name and city/state
2. THE Onboarding_System SHALL provide toggle option "I also play for a club team"
3. WHEN club toggle is enabled, THE Onboarding_System SHALL display club organization and club team name inputs
4. THE Onboarding_System SHALL require school information before allowing progression
5. THE Onboarding_System SHALL store School_Details under profile.school and Club_Details under profile.club in Firestore_Profile

### Requirement 13

**User Story:** As an athlete, I want to complete a personality assessment, so that the app can provide personalized AI insights and recommendations.

#### Acceptance Criteria

1. WHEN a user completes team information, THE Onboarding_System SHALL display AthleteDNA_Quiz with six personality questions
2. THE Onboarding_System SHALL collect responses on motivation, confidence, focus mode, and other personality traits
3. THE Onboarding_System SHALL require completion of all six questions before allowing progression
4. THE Onboarding_System SHALL store quiz responses as userProfile.dna object in Firestore_Profile
5. THE Onboarding_System SHALL use AthleteDNA_Quiz results for AI tone mapping and drill recommendations

### Requirement 14

**User Story:** As a minor user, I need the app to comply with COPPA/GDPR-K by requesting appropriate guardian consent.

#### Acceptance Criteria

1. THE Onboarding_System SHALL collect date of birth and calculate user age
2. IF user age is less than 13, THEN THE Onboarding_System SHALL block registration and redirect to guardian signup
3. IF user age is 13-15, THEN THE Onboarding_System SHALL require Guardian_Consent including guardian email and consent checkbox
4. THE Onboarding_System SHALL store Age_Verification status, guardianEmail, and consentTimestamp in Firestore_Profile
5. THE Onboarding_System SHALL prevent account creation until appropriate consent is obtained

### Requirement 15

**User Story:** As a user, I must agree to legal policies before accessing the application.

#### Acceptance Criteria

1. THE Onboarding_System SHALL display Legal_Consent screen with Terms of Service and Privacy Policy links
2. THE Onboarding_System SHALL require checkbox acceptance of terms and privacy policy
3. THE Onboarding_System SHALL provide optional toggle for "Anonymized data for benchmarks"
4. THE Onboarding_System SHALL prevent progression until legal consent checkbox is checked
5. THE Onboarding_System SHALL store tosAcceptedVersion, privacyAcceptedVersion, and benchmarkingConsent in Firestore_Profile

### Requirement 16

**User Story:** As a user, I want my onboarding progress saved if I exit early, so that I can resume where I left off.

#### Acceptance Criteria

1. THE Onboarding_System SHALL automatically save progress after each completed step to local storage and Firestore
2. WHEN a user returns to onboarding, THE Onboarding_System SHALL resume at the last completed step
3. THE Onboarding_System SHALL provide "Start Over" button to reset Onboarding_Recovery state
4. THE Onboarding_System SHALL store onboardingProgress.stepNumber in Firestore_Profile
5. THE Onboarding_System SHALL preserve all user selections during recovery process

### Requirement 17

**User Story:** As a new user, I want my 7-day trial to start automatically after completing onboarding.

#### Acceptance Criteria

1. WHEN user completes onboarding and selects "Enter Locker", THE Onboarding_System SHALL activate Trial_Activation through RevenueCat
2. THE Onboarding_System SHALL store trialStartDate and trialStatus in Firestore_Profile
3. THE Onboarding_System SHALL display trial confirmation banner "Your 7-day trial is live"
4. THE Onboarding_System SHALL log analytics event trial_started
5. THE Onboarding_System SHALL redirect user to main application dashboard after trial activation

### Requirement 18

**User Story:** As a user with accessibility needs, I want the onboarding to support assistive technologies and different languages.

#### Acceptance Criteria

1. THE Onboarding_System SHALL support dynamic type sizing for improved readability
2. THE Onboarding_System SHALL provide VoiceOver labels for all interactive elements
3. THE Onboarding_System SHALL support English and Spanish language strings
4. THE Onboarding_System SHALL maintain accessibility compliance throughout all onboarding steps
5. THE Onboarding_System SHALL provide high contrast mode support

### Requirement 19

**User Story:** As a product team, I want to track onboarding analytics to understand user behavior and optimize the flow.

#### Acceptance Criteria

1. THE Onboarding_System SHALL log onboarding_start event when user begins process
2. THE Onboarding_System SHALL log step completion events for each onboarding step
3. THE Onboarding_System SHALL log dna_completed event when AthleteDNA_Quiz is finished
4. THE Onboarding_System SHALL log trial_started event when trial activation succeeds
5. THE Onboarding_System SHALL track drop-off points and completion rates for optimization

### Requirement 20

**User Story:** As a user with unreliable internet, I want the onboarding to handle network issues gracefully.

#### Acceptance Criteria

1. THE Onboarding_System SHALL implement graceful network retry mechanisms for failed requests
2. THE Onboarding_System SHALL provide offline autosave functionality for user progress
3. THE Onboarding_System SHALL display clear error messages for network-related failures
4. THE Onboarding_System SHALL allow users to continue onboarding when network connectivity is restored
5. THE Onboarding_System SHALL sync offline progress to Firestore when connection is available