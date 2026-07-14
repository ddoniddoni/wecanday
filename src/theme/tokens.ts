export const palette = {
  lightBackground: '#F7F5FF',
  lightSurface: '#FFFFFF',
  lightText: '#28213D',
  lightMuted: '#736A8A',
  lightPrimary: '#6553C7',
  lightAccent: '#E98A6C',
  lightBorder: '#E3DEF3',
  darkBackground: '#151827',
  darkSurface: '#22283A',
  darkText: '#F8F8FC',
  darkMuted: '#B9C0D3',
  darkPrimary: '#A99BFF',
  darkAccent: '#F3A36E',
  darkBorder: '#394158',
  pixelSky: '#EEF5EB',
  pixelCloud: '#FFFDF5',
  pixelInk: '#263C46',
  pixelShade: '#657985',
  pixelCoral: '#D9785A',
  pixelGold: '#E9BB51',
  pixelBorder: '#C6D7C8',
  pixelFocus: '#4F8A78',
  transparent: 'transparent',
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
