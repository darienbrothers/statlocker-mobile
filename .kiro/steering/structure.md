# Project Structure & Organization

## Repository Layout
```
/
├── .kiro/                 # Kiro IDE configuration and steering rules
├── docs/                  # Project documentation
├── specs/                 # Feature specifications organized by feature
│   ├── dashboard/         # Dashboard feature specs
│   ├── log-game/         # Game logging feature specs
│   └── onboarding/       # User onboarding specs
├── README.md             # Project overview and quick start
└── statlocker-business-plan.md  # Comprehensive business plan
```

## Specs Organization
Each feature under `/specs/` should follow this structure:
- `requirements.md` - Feature requirements and user stories
- `design.md` - UI/UX design specifications and mockups
- `tasks.md` - Implementation tasks and technical details

## Expected App Structure (when implemented)
```
src/
├── app/                  # Expo Router pages
├── components/           # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── stores/              # Zustand state stores
├── types/               # TypeScript type definitions
├── constants/           # App constants and configuration
└── assets/              # Images, fonts, and static assets
```

## Development Workflow
1. Feature specs are created in `/specs/[feature-name]/`
2. Each spec includes requirements, design, and implementation tasks
3. Code implementation follows the established app structure
4. Features are built incrementally following the MVP roadmap

## Naming Conventions
- Use kebab-case for folder names and file names
- Use PascalCase for React components
- Use camelCase for functions and variables
- Use SCREAMING_SNAKE_CASE for constants

## Documentation Standards
- All features must have corresponding specs before implementation
- README files should be concise and actionable
- Business documentation lives at the root level
- Technical documentation goes in `/docs/`