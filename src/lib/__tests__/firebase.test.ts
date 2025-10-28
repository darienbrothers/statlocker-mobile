/**
 * Firebase Configuration Tests
 */

import { initializeFirebase, getFirebaseAuth, getFirebaseFirestore } from '../firebase';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  initializeAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      environment: 'development',
    },
  },
}));

// Mock environment variables
process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV = 'test-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV = 'test.firebaseapp.com';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_DEV = 'test-project';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV = 'test.appspot.com';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV = '123456789';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID_DEV = '1:123456789:web:test123456';

describe('Firebase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Firebase successfully', () => {
    expect(() => initializeFirebase()).not.toThrow();
  });

  it('should return Firebase Auth instance', () => {
    const auth = getFirebaseAuth();
    expect(auth).toBeDefined();
  });

  it('should return Firestore instance', () => {
    const firestore = getFirebaseFirestore();
    expect(firestore).toBeDefined();
  });

  it('should handle missing environment variables', () => {
    // Temporarily remove required env var
    const originalApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV;
    delete process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV;

    expect(() => initializeFirebase()).toThrow('Firebase configuration missing required field: apiKey');

    // Restore env var
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV = originalApiKey;
  });
});