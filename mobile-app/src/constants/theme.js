export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

// `boxShadow` is supported by React Native (new architecture) and react-native-web,
// so one definition works on every platform.
export const shadow = {
  sm: { boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.08)' },
  md: { boxShadow: '0px 4px 12px rgba(16, 24, 40, 0.08)' },
  lg: { boxShadow: '0px 8px 24px rgba(16, 24, 40, 0.12)' },
};

// Minimum comfortable touch target
export const TOUCH = 48;
