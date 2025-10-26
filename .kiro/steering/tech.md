# Tech Stack & Development Guidelines

## Core Stack
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS classes)
- **State Management**: Zustand
- **Animation**: React Native Reanimated
- **Forms**: react-hook-form + Zod validation

## Backend & Infrastructure
- **Database**: Firebase Firestore (real-time, offline-first)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Push Notifications**: expo-notifications + FCM
- **Subscriptions**: RevenueCat (iOS/Android in-app purchases)

## Key External APIs
- **AI Services**: OpenAI/Anthropic for AI Coach insights
- **College Data**: US Dept. of Education College Scorecard API
- **Maps**: Google Maps Places API or Mapbox
- **Calendar**: Google Calendar API + expo-calendar
- **OCR (Future)**: Google ML Kit or Cloud Vision

## Development Tools
- **Build & Deploy**: EAS Build & Submit
- **Updates**: Expo Updates (OTA)
- **Analytics**: PostHog or Amplitude + Firebase Analytics
- **Error Tracking**: Sentry
- **Performance**: Firebase Performance Monitoring

## Common Commands
```bash
# Development
npx expo start
npx expo start --clear

# Building
eas build --platform ios
eas build --platform android
eas build --platform all

# Updates
eas update --branch preview
eas update --branch production

# Testing
npm test
npm run type-check
```

## Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zod schemas for data validation
- Follow React Native best practices for performance
- Implement proper error boundaries
- Use NativeWind for consistent styling