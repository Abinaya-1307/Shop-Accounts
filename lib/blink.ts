import { createClient, AsyncStorageAdapter } from '@blinkdotnew/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

const projectId = process.env.EXPO_PUBLIC_BLINK_PROJECT_ID || 'shoptracke-diary-app-2bhaih3s';
const publishableKey = process.env.EXPO_PUBLIC_BLINK_PUBLISHABLE_KEY || 'blnk_pk_your_key_here';

export const blink = createClient({
  projectId,
  publishableKey,
  auth: {
    mode: 'headless',
    webBrowser: WebBrowser,
  },
  storage: new AsyncStorageAdapter(AsyncStorage),
});
