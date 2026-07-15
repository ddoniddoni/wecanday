export const palette = {
  lightBackground: '#F8F9FF',
  lightSurface: '#FFFFFF',
  lightText: '#171C23',
  lightMuted: '#626B7A',
  lightPrimary: '#58CC02',
  lightPrimaryDark: '#2B6C00',
  lightPrimaryShadow: '#46A302',
  lightAccent: '#FF9C27',
  lightGold: '#F4C542',
  lightBorder: '#DEE3EC',
  lightContainer: '#EFF4FD',
  lightContainerHigh: '#E4E8F2',
  lightSecondary: '#2FB8FF',
  lightSecondarySoft: '#C8E6FF',
  lightSecondaryDark: '#006590',
  lightAccentSoft: '#FFD7A7',
  lightAccentDark: '#8C5000',
  journeyDaySky: '#B7E4FA',
  journeyDaySkyGlow: '#E8F8FF',
  journeyDayCloud: '#FFFFFF',
  journeyDaySun: '#FFC94F',
  journeyDaySunGlow: '#FFE49A',
  journeyDayHillFar: '#9DD77A',
  journeyDayHillNear: '#62B95D',
  journeyDayGrass: '#3E9A51',
  journeyDayPath: '#FFFFFF',
  journeyDayNode: '#F9FEFF',
  journeyDayNodeBorder: '#6EADD0',
  journeyDayLabel: 'rgba(255, 255, 255, 0.94)',
  journeyDayLabelBorder: '#E2F2F9',
  journeyDayText: '#183443',
  journeyNightSky: '#172B59',
  journeyNightSkyGlow: '#273E76',
  journeyNightMoon: '#FFF0A3',
  journeyNightStar: '#FFF7C9',
  journeyNightHillFar: '#405C77',
  journeyNightHillNear: '#294864',
  journeyNightGrass: '#173A4D',
  journeyNightPath: '#D5E3FF',
  journeyNightNode: 'rgba(247, 250, 255, 0.96)',
  journeyNightNodeBorder: '#AFC6EC',
  journeyNightLabel: 'rgba(21, 36, 73, 0.94)',
  journeyNightLabelBorder: '#54729A',
  journeyNightText: '#F7FAFF',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  scrim: 'rgba(23, 28, 35, 0.48)',
  darkBackground: '#151827',
  darkSurface: '#22283A',
  darkText: '#F8F8FC',
  darkMuted: '#B9C0D3',
  darkPrimary: '#A99BFF',
  darkAccent: '#F3A36E',
  darkBorder: '#394158',
  transparent: 'transparent',
} as const;

export const companionAccents = {
  dark: {
    dew: { accent: '#B6EAFF', focus: '#2D8DB7', onPrimary: '#151827', primary: '#75C8F3' },
    ember: { accent: '#FFD09B', focus: '#C65332', onPrimary: '#151827', primary: '#FF956D' },
    luna: { accent: '#E5CAFF', focus: '#7A3CAF', onPrimary: '#151827', primary: '#C184FF' },
    sprout: { accent: '#E2F58A', focus: '#638A2D', onPrimary: '#151827', primary: '#B7D663' },
  },
  light: {
    dew: { accent: '#88CEFF', focus: '#006590', onPrimary: '#171C23', primary: '#2FB8FF' },
    ember: { accent: '#FFB872', focus: '#8C5000', onPrimary: '#171C23', primary: '#FF9C27' },
    luna: { accent: '#C9A7FF', focus: '#4B1F8C', onPrimary: '#FFFFFF', primary: '#7C4DFF' },
    sprout: { accent: '#87FE45', focus: '#2B6C00', onPrimary: '#171C23', primary: '#58CC02' },
  },
} as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const typography = {
  family: {
    body: 'PlusJakartaSans_500Medium',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  size: {
    body: 16,
    heading: 24,
    title: 30,
    display: 38,
    caption: 13,
  },
  lineHeight: {
    body: 24,
    heading: 32,
    title: 38,
    display: 46,
    caption: 18,
  },
  weight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
} as const;

export const shadows = {
  card: {
    elevation: 2,
    opacity: 0.12,
    radius: 8,
    offsetY: 3,
  },
} as const;

export const motion = {
  duration: {
    instant: 0,
    fast: 150,
    standard: 250,
  },
} as const;

export const touchTarget = {
  minimum: 44,
} as const;
