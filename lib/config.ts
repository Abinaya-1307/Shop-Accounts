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

const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://shop-account-backend.onrender.com';

export const API_URL: string = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Optional: export for debugging in dev only
if (__DEV__) {
  console.log('[config] API_URL =', API_URL);
}
