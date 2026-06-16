import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/design';

// ─── Dark Color Palette ───────────────────────────────────────────────────────
export const darkColors = {
  ...colors,
  // Backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',

  // Text
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textDisabled: '#64748B',

  // Borders
  border: '#334155',
  borderDark: '#475569',
  borderLight: '#1E293B',

  // Special
  white: '#1E293B',   // used for card / tab backgrounds in dark mode
  black: '#F1F5F9',
};

export type Theme = typeof colors;

// ─── Context ──────────────────────────────────────────────────────────────────
type ThemeContextType = {
  isDark: boolean;
  toggleDark: () => void;
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  theme: colors,
});

const DARK_MODE_KEY = 'shoptracker_dark_mode';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY).then((val) => {
      if (val !== null) {
        setIsDark(val === 'true');
      } else {
        setIsDark(false);
      }
    });
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(DARK_MODE_KEY, String(next));
      return next;
    });
  }, []);

  const theme: Theme = isDark ? darkColors : colors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}

export default ThemeContext;
