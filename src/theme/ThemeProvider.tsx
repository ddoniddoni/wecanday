import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import type { CompanionId } from '@/features/companion/domain/companions';
import { applyCompanionAccent } from '@/theme/companionAccent';
import { darkTheme } from '@/theme/themes/dark';
import { lightTheme } from '@/theme/themes/light';
import type { AppTheme, ThemeId, ThemePreference } from '@/theme/types';

const themes: Record<ThemeId, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

const companionThemes: Record<ThemeId, Record<CompanionId, AppTheme>> = {
  dark: {
    dew: applyCompanionAccent(darkTheme, 'dew'),
    ember: applyCompanionAccent(darkTheme, 'ember'),
    luna: applyCompanionAccent(darkTheme, 'luna'),
    sprout: applyCompanionAccent(darkTheme, 'sprout'),
  },
  light: {
    dew: applyCompanionAccent(lightTheme, 'dew'),
    ember: applyCompanionAccent(lightTheme, 'ember'),
    luna: applyCompanionAccent(lightTheme, 'luna'),
    sprout: applyCompanionAccent(lightTheme, 'sprout'),
  },
};

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = PropsWithChildren<{
  companionId?: CompanionId;
  preference?: ThemePreference;
}>;

export function ThemeProvider({
  children,
  companionId,
  preference = 'system',
}: ThemeProviderProps) {
  const [selectedPreference, setSelectedPreference] = useState<ThemePreference>(preference);
  const systemColorScheme = useColorScheme();
  const resolvedThemeId: ThemeId =
    selectedPreference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : selectedPreference;
  const resolvedTheme = companionId
    ? companionThemes[resolvedThemeId][companionId]
    : themes[resolvedThemeId];
  const value = useMemo(
    () => ({ preference: selectedPreference, setPreference: setSelectedPreference, theme: resolvedTheme }),
    [resolvedTheme, selectedPreference],
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
