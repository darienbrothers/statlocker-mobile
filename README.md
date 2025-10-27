# StatLocker Mobile
Stat tracking made easy. Progress made visible.

**Stack:** React Native + Expo • Firebase • RevenueCat • NativeWind  
**Platforms:** iOS & Android

- Long-form plan: see [`/docs/overview.md`](docs/overview.md)
- Feature specs live under `/specs/*` (`requirements.md`, `design.md`, `tasks.md`)

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on specific platforms**
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## 🏗️ Project Structure

```
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── features/          # Feature-specific components
│   ├── lib/              # Utilities and configurations
│   ├── services/         # API and external services
│   ├── store/            # Zustand state stores
│   └── types/            # TypeScript type definitions
├── specs/                # Feature specifications
└── docs/                 # Documentation
```

## 🛠️ Development Commands

### Code Quality
```bash
npm run type-check    # TypeScript type checking
npm run lint          # ESLint linting
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier formatting
npm run format:check  # Check formatting
```

### Building
```bash
npm run build:dev:ios        # Development build for iOS
npm run build:dev:android    # Development build for Android
npm run build:production     # Production build for all platforms
```

## 📋 Requirements

- Node.js 18+
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Expo CLI

## 🎯 Current Status

✅ **Task 1 Complete**: Project foundation and configuration
- Expo Router with (auth) and (tabs) route groups
- TypeScript strict mode with path aliases (@/* → src/*)
- NativeWind with StatLocker design tokens
- ESLint, Prettier, and CI configuration
- Basic project structure and placeholder screens