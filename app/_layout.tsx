import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ShopProvider } from '@/context/ShopContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ShopProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="shop-session" />
      </Stack>
      <StatusBar style="auto" />
    </ShopProvider>
  );
}