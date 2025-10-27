# StatLocker Mobile Deployment Guide

## Overview

This guide covers the deployment process for the StatLocker mobile application using Expo Application Services (EAS).

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Git

### Required Accounts
- Expo account (for EAS services)
- Apple Developer account (for iOS deployment)
- Google Play Console account (for Android deployment)
- Firebase project (for backend services)

### Required Credentials
- Apple Developer certificates and provisioning profiles
- Google Play Console service account key
- Firebase configuration files
- Analytics service API keys

## Environment Setup

### 1. Environment Variables

Copy the environment template and configure for each environment:

```bash
# Development
cp .env.example .env.development
# Edit .env.development with development values

# Production
cp .env.example .env.production
# Edit .env.production with production values
```

### 2. EAS Secrets

Set sensitive environment variables as EAS secrets:

```bash
# Firebase configuration
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"

# Analytics
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_API_KEY --value "your-posthog-key"

# Sentry
eas secret:create --scope project --name SENTRY_DSN --value "your-sentry-dsn"
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your-sentry-token"

# RevenueCat
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_API_KEY --value "your-revenuecat-key"
```

### 3. Credentials Setup

```bash
# Configure iOS credentials
eas credentials:configure --platform ios

# Configure Android credentials
eas credentials:configure --platform android
```

## Build Process

### Development Builds

Development builds include the Expo development client for testing:

```bash
# iOS development build
npm run build:dev:ios

# Android development build
npm run build:dev:android

# Both platforms
eas build --profile development --platform all
```

### Preview Builds

Preview builds are production-like builds for internal testing:

```bash
# iOS preview build
npm run build:preview:ios

# Android preview build
npm run build:preview:android

# Both platforms
eas build --profile preview --platform all
```

### Production Builds

Production builds are optimized for app store submission:

```bash
# Production build for both platforms
npm run build:production

# Individual platforms
eas build --profile production --platform ios
eas build --profile production --platform android
```

## Testing Builds

### Internal Testing

1. **Development Builds**: Install on physical devices for development testing
2. **Preview Builds**: Distribute to internal testers via EAS Update or direct download
3. **TestFlight (iOS)**: Submit preview builds to TestFlight for broader internal testing
4. **Internal Testing (Android)**: Upload to Google Play Console internal testing track

### Quality Assurance

Before production deployment, ensure:

- [ ] All CI/CD checks pass
- [ ] Manual testing on physical devices (iOS and Android)
- [ ] Accessibility testing with screen readers
- [ ] Performance testing on older devices
- [ ] Network connectivity testing (offline/online scenarios)
- [ ] Analytics and error tracking verification

## Deployment Process

### 1. Pre-Deployment Checklist

- [ ] All tests pass (`npm run ci:test`)
- [ ] Code quality checks pass (`npm run ci:quality`)
- [ ] Security audit passes (`npm run ci:security`)
- [ ] Performance budget maintained
- [ ] Accessibility compliance verified
- [ ] Environment variables configured
- [ ] App store metadata prepared
- [ ] Release notes written

### 2. iOS Deployment

#### App Store Connect Setup

1. Create app record in App Store Connect
2. Configure app metadata, screenshots, and descriptions
3. Set up pricing and availability
4. Configure App Store Review information

#### Build and Submit

```bash
# Build for production
eas build --profile production --platform ios

# Submit to App Store Connect
eas submit --profile production --platform ios

# Or submit manually through App Store Connect
```

#### App Store Review

1. Monitor build processing in App Store Connect
2. Submit for App Store Review when ready
3. Respond to any review feedback
4. Release when approved

### 3. Android Deployment

#### Google Play Console Setup

1. Create app in Google Play Console
2. Configure store listing with metadata and screenshots
3. Set up pricing and distribution
4. Configure content rating and target audience

#### Build and Submit

```bash
# Build for production
eas build --profile production --platform android

# Submit to Google Play Console
eas submit --profile production --platform android

# Or upload manually through Google Play Console
```

#### Google Play Review

1. Upload to Internal Testing track first
2. Promote to Closed Testing (Alpha/Beta) for broader testing
3. Submit to Production track when ready
4. Monitor review status and respond to feedback

## Over-the-Air Updates

### EAS Update Setup

EAS Update allows you to push JavaScript and asset updates without going through app stores:

```bash
# Configure update channels
eas update:configure

# Publish update to development channel
eas update --branch development --message "Development update"

# Publish update to preview channel
eas update --branch preview --message "Preview update with bug fixes"

# Publish update to production channel
eas update --branch production --message "Production hotfix"
```

### Update Strategy

- **Development**: Frequent updates for active development
- **Preview**: Weekly updates for internal testing
- **Production**: Only critical bug fixes and small feature updates

### Update Limitations

OTA updates can only update:
- JavaScript code
- Assets (images, fonts, etc.)
- Configuration changes

Cannot update:
- Native code changes
- New native dependencies
- App permissions
- App configuration (app.json changes affecting native code)

## Monitoring and Analytics

### Post-Deployment Monitoring

1. **Error Tracking**: Monitor Sentry for crashes and errors
2. **Analytics**: Track user engagement through PostHog/Firebase Analytics
3. **Performance**: Monitor app performance metrics
4. **User Feedback**: Monitor app store reviews and ratings

### Key Metrics to Track

- App crashes and error rates
- User retention and engagement
- Feature adoption rates
- Performance metrics (app launch time, screen load times)
- User satisfaction (app store ratings)

## Rollback Procedures

### EAS Update Rollback

```bash
# Rollback to previous update
eas update --branch production --message "Rollback to previous version"

# Or republish a specific previous update
eas update:republish --group-id <previous-update-group-id>
```

### App Store Rollback

1. **iOS**: Remove current version from sale and promote previous version
2. **Android**: Halt rollout and promote previous release

### Emergency Procedures

For critical issues:

1. Immediately halt any ongoing rollouts
2. Push emergency OTA update if possible
3. If native code issue, prepare emergency app store update
4. Communicate with users through in-app messaging or social media

## Automation

### GitHub Actions Integration

The CI/CD pipeline automatically:

- Runs quality checks on all PRs
- Builds preview versions for approved PRs
- Deploys to production on main branch merges
- Publishes OTA updates for JavaScript-only changes

### Automated Deployment Triggers

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
    tags: ['v*']
  
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          eas update --branch production --message "Auto-deploy from main"
```

## Security Considerations

### Secrets Management

- Never commit sensitive keys to version control
- Use EAS secrets for all sensitive environment variables
- Rotate API keys regularly
- Use different keys for different environments

### Code Signing

- Protect iOS certificates and provisioning profiles
- Use EAS credentials management for secure storage
- Regularly update and rotate certificates

### App Security

- Enable code obfuscation for production builds
- Implement certificate pinning for API calls
- Use secure storage for sensitive user data
- Regular security audits and dependency updates

## Troubleshooting

### Common Build Issues

1. **Certificate Issues**: Ensure certificates are valid and properly configured
2. **Dependency Conflicts**: Check for version conflicts in package.json
3. **Memory Issues**: Use larger resource classes for complex builds
4. **Timeout Issues**: Optimize build process or increase timeout limits

### Common Deployment Issues

1. **App Store Rejection**: Review App Store guidelines and fix issues
2. **Google Play Rejection**: Check Play Console policy compliance
3. **Update Failures**: Verify update compatibility and rollback if needed
4. **Performance Issues**: Monitor metrics and optimize as needed

### Getting Help

- Expo Documentation: https://docs.expo.dev/
- EAS Documentation: https://docs.expo.dev/eas/
- Community Forums: https://forums.expo.dev/
- GitHub Issues: Create issues in the project repository

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate API keys quarterly
- Update certificates before expiration
- Monitor app store compliance changes
- Review and update deployment procedures

### Performance Optimization

- Regular bundle size analysis
- Performance metric monitoring
- User feedback analysis
- A/B testing for feature improvements

This deployment guide should be updated as the deployment process evolves and new requirements are identified.