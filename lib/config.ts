// ============================================================
// API CONFIGURATION
// ============================================================
// __DEV__ is a React Native global:
//   true  → running via Expo Go / `expo start` (development)
//   false → embedded in a release/preview/production APK
//
// Development: http://localhost:3000  (your local backend)
// Production:  https://shop-account-backend.onrender.com
// ============================================================

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

const DEV_API_URL = getDevApiUrl();
const PROD_API_URL = 'https://shop-account-backend.onrender.com';

export const API_URL: string = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Optional: export for debugging in dev only
if (__DEV__) {
  console.log('[config] API_URL =', API_URL);
}
