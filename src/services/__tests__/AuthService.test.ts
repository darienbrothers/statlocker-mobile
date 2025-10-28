/**
 * AuthService Tests
 * 
 * Tests for the authentication service functionality
 */

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
  OAuthProvider: jest.fn(() => ({
    credential: jest.fn(),
  })),
  signInWithCredential: jest.fn(),
  AuthErrorCodes: {
    INVALID_EMAIL: 'auth/invalid-email',
    INVALID_PASSWORD: 'auth/wrong-password',
    EMAIL_EXISTS: 'auth/email-already-in-use',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
    NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
    WEAK_PASSWORD: 'auth/weak-password',
  },
}));

// Mock Expo modules
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mocked-hash')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'hex',
  },
}));

// Mock Firebase config
jest.mock('@/lib/firebase', () => ({
  getFirebaseAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

// Mock logging
jest.mock('@/lib/logging', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

import { AuthService } from '../AuthService';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('Email Authentication', () => {
    it('should sign in with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: true,
          displayName: 'Test User',
          photoURL: null,
          providerData: [],
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        },
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithEmail('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });

    it('should create user with email and password', async () => {
      const mockUserCredential = {
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: false,
          displayName: null,
          photoURL: null,
          providerData: [],
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        },
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.createUserWithEmail('test@example.com', 'password123');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toBe(mockUserCredential);
    });
  });

  describe('Apple Sign-In', () => {
    it('should sign in with Apple successfully', async () => {
      const mockAppleCredential = {
        user: 'apple-user-id',
        email: 'test@privaterelay.appleid.com',
        identityToken: 'mock-identity-token',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const mockFirebaseCredential = {
        user: {
          uid: 'firebase-uid',
          email: 'test@privaterelay.appleid.com',
          emailVerified: true,
          displayName: null,
          photoURL: null,
          providerData: [{
            providerId: 'apple.com',
            uid: 'apple-user-id',
            email: 'test@privaterelay.appleid.com',
          }],
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        },
      };

      (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(mockAppleCredential);
      (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('hashed-nonce');

      // Mock Firebase signInWithCredential
      const { signInWithCredential } = require('firebase/auth');
      signInWithCredential.mockResolvedValue(mockFirebaseCredential);

      const result = await authService.signInWithApple();

      expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalled();
      expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: 'hashed-nonce',
      });
      expect(result).toBe(mockFirebaseCredential);
    });

    it('should handle Apple Sign-In cancellation', async () => {
      const cancelError = new Error('ERR_CANCELED');
      (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(cancelError);

      await expect(authService.signInWithApple()).rejects.toMatchObject({
        code: 'auth/apple-cancelled',
        userMessage: 'Sign-in was cancelled.',
        retryable: true,
      });
    });

    it('should handle Apple Sign-In unavailable', async () => {
      (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await expect(authService.signInWithApple()).rejects.toThrow(
        'Apple Sign-In is not available on this device'
      );
    });
  });

  describe('User Management', () => {
    it('should get current user', () => {
      const mockFirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: null,
        providerData: [],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Mock the auth instance to return a user
      const mockAuth = {
        currentUser: mockFirebaseUser,
      };
      
      const { getFirebaseAuth } = require('@/lib/firebase');
      getFirebaseAuth.mockReturnValue(mockAuth);

      // Create new instance to pick up the mocked auth
      const newAuthService = new AuthService();
      const user = newAuthService.getCurrentUser();

      expect(user).toMatchObject({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
      });
    });

    it('should return null when no user is signed in', () => {
      const mockAuth = {
        currentUser: null,
      };
      
      const { getFirebaseAuth } = require('@/lib/firebase');
      getFirebaseAuth.mockReturnValue(mockAuth);

      const newAuthService = new AuthService();
      const user = newAuthService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('Authentication State', () => {
    it('should check if user is authenticated', () => {
      const mockAuth = {
        currentUser: { uid: 'test-uid' },
      };
      
      const { getFirebaseAuth } = require('@/lib/firebase');
      getFirebaseAuth.mockReturnValue(mockAuth);

      const newAuthService = new AuthService();
      expect(newAuthService.isAuthenticated()).toBe(true);
    });

    it('should check if email is verified', () => {
      const mockAuth = {
        currentUser: { emailVerified: true },
      };
      
      const { getFirebaseAuth } = require('@/lib/firebase');
      getFirebaseAuth.mockReturnValue(mockAuth);

      const newAuthService = new AuthService();
      expect(newAuthService.isEmailVerified()).toBe(true);
    });
  });
});