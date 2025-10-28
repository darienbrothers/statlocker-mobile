# Apple Sign-In Setup Guide

## Overview

This guide covers the complete setup for Apple Sign-In integration with Firebase Auth, including the native iOS flow that passes tokens to Firebase.

## What We've Implemented

### 1. AuthService Apple Integration
- ✅ Native Apple Sign-In flow using `expo-apple-authentication`
- ✅ Secure nonce generation for security
- ✅ Firebase credential creation from Apple ID token
- ✅ Proper error handling for cancellation and unavailability
- ✅ Display name handling for first-time sign-ins

### 2. Security Features
- **Nonce Verification**: Generated random nonce and SHA256 hash for security
- **Token Exchange**: Apple ID token is securely exchanged for Firebase credential
- **Error Handling**: Comprehensive error mapping for Apple-specific scenarios

## Configuration Required

### 1. Apple Team ID
You need to update `app.json` with your actual Apple Team ID:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-apple-authentication",
        {
          "appleTeamId": "YOUR_ACTUAL_TEAM_ID"
        }
      ]
    ]
  }
}
```

**To find your Apple Team ID:**
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Sign in with your Apple Developer account
3. Go to "Membership" section
4. Your Team ID is displayed there (usually 10 characters)

### 2. Bundle ID Configuration
Ensure your bundle IDs match across:
- **Expo/React Native**: `com.statlocker.mobile.dev`
- **Apple Developer Console**: Same bundle ID
- **Firebase iOS App**: Same bundle ID

### 3. Apple Developer Console Setup

#### App ID Configuration
1. **Go to**: Certificates, Identifiers & Profiles → Identifiers
2. **Select your App ID**: `com.statlocker.mobile.dev`
3. **Enable Capabilities**:
   - ✅ Sign In with Apple
   - ✅ Associated Domains (for universal links)
   - ✅ Push Notifications

#### Sign In with Apple Configuration
1. **Edit your App ID** → Sign In with Apple → Configure
2. **Primary App ID**: Use the same App ID
3. **Domains and Subdomains**: Add Firebase domains:
   - `statlocker-dev.firebaseapp.com`
   - `statlocker-staging.firebaseapp.com` (for staging)
   - `statlocker-prod.firebaseapp.com` (for production)
4. **Return URLs**: Add Firebase callback URLs:
   - `https://statlocker-dev.firebaseapp.com/__/auth/handler`

### 4. Firebase Configuration (Optional)
Since we're using the native flow, you don't need to configure Apple as a provider in Firebase Console. Our implementation:
1. Uses native Apple Sign-In to get ID token
2. Creates Firebase credential from the token
3. Signs in to Firebase with the credential

This approach gives us more control and better user experience.

## Implementation Details

### Apple Sign-In Flow
```typescript
// 1. Check availability
const isAvailable = await AppleAuthentication.isAvailableAsync();

// 2. Generate secure nonce
const nonce = generateRandomNonce();
const hashedNonce = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256, 
  nonce
);

// 3. Request Apple credential
const appleCredential = await AppleAuthentication.signInAsync({
  requestedScopes: [FULL_NAME, EMAIL],
  nonce: hashedNonce,
});

// 4. Create Firebase credential
const provider = new OAuthProvider('apple.com');
const credential = provider.credential({
  idToken: appleCredential.identityToken,
  rawNonce: nonce,
});

// 5. Sign in to Firebase
const userCredential = await signInWithCredential(auth, credential);
```

### Error Handling
- **Cancellation**: User cancels Apple Sign-In → Show "Sign-in was cancelled"
- **Unavailable**: Device doesn't support Apple Sign-In → Graceful fallback
- **Network Issues**: Firebase connection problems → Retry suggestion
- **Invalid Token**: Apple token issues → Contact support

### Privacy Features
- **Email Privacy**: Supports Apple Private Relay emails
- **Name Privacy**: Handles cases where user doesn't share name
- **Minimal Data**: Only requests necessary scopes (name, email)

## Testing

### Test Scenarios
1. **First-time sign-in**: User creates new account with Apple ID
2. **Returning user**: User signs in with existing Apple ID
3. **Cancellation**: User cancels the Apple Sign-In flow
4. **Private email**: User uses Apple Private Relay email
5. **No name sharing**: User doesn't share their name

### Test Accounts
- Use your personal Apple ID for testing
- Test on physical iOS device (required for Apple Sign-In)
- Test in development build (Apple Sign-In doesn't work in Expo Go)

## Next Steps

1. **Update app.json** with your Apple Team ID
2. **Build development app** with EAS Build
3. **Test Apple Sign-In** on physical iOS device
4. **Verify Firebase integration** works correctly

## Troubleshooting

### Common Issues

#### "Apple Sign-In not available"
- **Cause**: Testing in simulator or Expo Go
- **Solution**: Test on physical iOS device with development build

#### "Invalid configuration"
- **Cause**: Bundle ID mismatch or missing Team ID
- **Solution**: Verify all bundle IDs match and Team ID is correct

#### "Network error"
- **Cause**: Firebase configuration issues
- **Solution**: Check Firebase project settings and auth domain

#### "Token validation failed"
- **Cause**: Nonce mismatch or expired token
- **Solution**: Ensure nonce generation is working correctly

### Debug Tips
1. **Check logs**: Use `logInfo` and `logError` for debugging
2. **Verify tokens**: Log (but don't store) tokens for debugging
3. **Test incrementally**: Test Apple Sign-In first, then Firebase integration
4. **Use development build**: Apple Sign-In requires native build

## Security Considerations

### Best Practices
- ✅ **Nonce verification**: Prevents replay attacks
- ✅ **Token validation**: Firebase validates Apple ID tokens
- ✅ **Secure storage**: Tokens stored securely by Firebase
- ✅ **Minimal scopes**: Only request necessary permissions

### Privacy Compliance
- ✅ **Apple Guidelines**: Follows Apple's Sign In with Apple guidelines
- ✅ **User choice**: Users can choose to hide email/name
- ✅ **Data minimization**: Only collect necessary user data
- ✅ **Transparent handling**: Clear error messages and user feedback

The Apple Sign-In integration is now complete and ready for testing once you update the Team ID configuration!