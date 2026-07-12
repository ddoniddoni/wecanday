import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme } from '@/theme/themes/dark';
import { lightTheme } from '@/theme/themes/light';
import { pixelDefaultTheme } from '@/theme/themes/pixel-default';
import type { AppTheme, ThemeId, ThemePreference } from '@/theme/types';

const themes: Record<ThemeId, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
  'pixel-default': pixelDefaultTheme,
};

type ThemeContextValue = {
  preference: ThemePreference;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = PropsWithChildren<{
  preference?: ThemePreference;
}>;

export function ThemeProvider({
  children,
  preference = 'system',
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const resolvedThemeId: ThemeId =
    preference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;
  const value = useMemo(
    () => ({ preference, theme: themes[resolvedThemeId] }),
    [preference, resolvedThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('ThemeProvider is required.');
  }

  return context;
}
