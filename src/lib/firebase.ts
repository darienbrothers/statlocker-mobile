/**
 * Firebase Configuration
 * 
 * Initializes Firebase app with environment-specific configuration
 * Provides Firebase Auth instance for authentication services
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Environment-specific Firebase configurations
const getFirebaseConfig = (): FirebaseConfig => {
  const env = Constants.expoConfig?.extra?.environment || 'development';
  
  switch (env) {
    case 'production':
      return {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_PROD!,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD!,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_PROD!,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD!,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD!,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_PROD!,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_PROD,
      };
    
    case 'staging':
      return {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_STAGING!,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_STAGING!,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_STAGING!,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_STAGING!,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_STAGING!,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_STAGING!,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_STAGING,
      };
    
    default: // development
      return {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_DEV!,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN_DEV!,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID_DEV!,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET_DEV!,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_DEV!,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_DEV!,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID_DEV,
      };
  }
};

// Validate Firebase configuration
const validateFirebaseConfig = (config: FirebaseConfig): void => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  
  for (const field of requiredFields) {
    if (!config[field as keyof FirebaseConfig]) {
      throw new Error(`Firebase configuration missing required field: ${field}`);
    }
  }
};

// Initialize Firebase app
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export const initializeFirebase = (): { app: FirebaseApp; auth: Auth; firestore: Firestore } => {
  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      const config = getFirebaseConfig();
      validateFirebaseConfig(config);
      
      // Initialize Firebase app
      firebaseApp = initializeApp(config);
      
      // Initialize Auth (Firebase handles persistence automatically in React Native)
      auth = initializeAuth(firebaseApp);
      
      // Initialize Firestore
      firestore = getFirestore(firebaseApp);
      
      console.log('Firebase initialized successfully');
    } else {
      // Use existing Firebase app
      firebaseApp = getApps()[0];
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    }
    
    return { app: firebaseApp, auth, firestore };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export Firebase instances (initialized lazily)
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    const { app } = initializeFirebase();
    return app;
  }
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const { auth: authInstance } = initializeFirebase();
    return authInstance;
  }
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!firestore) {
    const { firestore: firestoreInstance } = initializeFirebase();
    return firestoreInstance;
  }
  return firestore;
};

// Export configuration getter for debugging
export const getFirebaseConfigForEnv = getFirebaseConfig;