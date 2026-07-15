export const palette = {
  lightBackground: '#F8F9FF',
  lightSurface: '#FFFFFF',
  lightText: '#171C23',
  lightMuted: '#5F6874',
  lightPrimary: '#4CD400',
  lightAccent: '#FF9600',
  lightBorder: '#DDE3EB',
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

export const companionAccents = {
  dark: {
    dew: { accent: '#B6EAFF', focus: '#75C8F3', primary: '#75C8F3' },
    ember: { accent: '#FFD09B', focus: '#FF956D', primary: '#FF956D' },
    sprout: { accent: '#E2F58A', focus: '#B7D663', primary: '#B7D663' },
  },
  light: {
    dew: { accent: '#73CBEA', focus: '#1E7FB7', primary: '#1E7FB7' },
    ember: { accent: '#F2A463', focus: '#CE643E', primary: '#CE643E' },
    sprout: { accent: '#B4D95A', focus: '#5F7A2B', primary: '#5F7A2B' },
  },
  'pixel-default': {
    dew: { accent: '#7ECCE6', focus: '#2584B8', primary: '#2584B8' },
    ember: { accent: '#EFA162', focus: '#C95E3D', primary: '#C95E3D' },
    sprout: { accent: '#C7DE6B', focus: '#65833D', primary: '#65833D' },
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
