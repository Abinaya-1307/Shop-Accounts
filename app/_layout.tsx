import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ShopProvider } from '@/context/ShopContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutInner() {
  const { isDark } = useTheme();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="shop-session" />
        <Stack.Screen name="manage-items" />
        <Stack.Screen name="manage-shops" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ShopProvider>
          <RootLayoutInner />
        </ShopProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}