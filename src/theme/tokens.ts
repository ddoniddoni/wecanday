export const palette = {
  ink: '#18201D',
  paper: '#FFFDF7',
  cream: '#F4F1E8',
  moss: '#306B4F',
  mint: '#A7D8B4',
  sun: '#F2C14E',
  night: '#131A18',
  nightRaised: '#202A26',
  nightText: '#F6F3EA',
  borderLight: '#D9DED8',
  borderDark: '#46514C',
  pixelSky: '#92DCE5',
  pixelGround: '#5E8C61',
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
    title: 30,
    display: 38,
    caption: 13,
  },
  lineHeight: {
    body: 24,
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
