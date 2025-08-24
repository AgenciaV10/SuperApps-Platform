
import { defineConfig } from 'unocss';

const COLOR_PRIMITIVES = {
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  alpha: {
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      10: 'rgba(255, 255, 255, 0.10)',
      20: 'rgba(255, 255, 255, 0.20)',
    },
    gray: {
      5: 'rgba(120, 113, 108, 0.05)',
      10: 'rgba(120, 113, 108, 0.10)',
      20: 'rgba(120, 113, 108, 0.20)',
    },
    accent: {
      5: 'rgba(99, 102, 241, 0.05)',
      10: 'rgba(99, 102, 241, 0.10)',
      20: 'rgba(99, 102, 241, 0.20)',
    },
  },
};

export default defineConfig({
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      primary: {
        DEFAULT: 'var(--bolt-elements-accent-purple)',
        50: 'var(--bolt-elements-accent-purple)',
        100: 'var(--bolt-elements-accent-purple)',
        200: 'var(--bolt-elements-accent-purple)',
        300: 'var(--bolt-elements-accent-purple)',
        400: 'var(--bolt-elements-accent-purple)',
        500: 'var(--bolt-elements-accent-purple)',
        600: 'var(--bolt-elements-button-primary-background)',
        700: 'var(--bolt-elements-button-primary-background)',
        800: 'var(--bolt-elements-button-primary-background)',
        900: 'var(--bolt-elements-button-primary-background)',
      },
      'bolt-elements': {
        'bg-depth': {
          1: 'var(--bolt-elements-bg-depth-1)',
          2: 'var(--bolt-elements-bg-depth-2)',
          3: 'var(--bolt-elements-bg-depth-3)',
        },
        'textPrimary': 'var(--bolt-elements-textPrimary)',
        'textSecondary': 'var(--bolt-elements-textSecondary)',
        'button-primary-background': 'var(--bolt-elements-button-primary-background)',
        'button-secondary-background': 'var(--bolt-elements-button-secondary-background)',
      },
    },
  },
  rules: [
    // Custom rules for bg-primary with opacity
    [/^bg-primary(?:\/([0-9]+))?$/, ([, opacity]) => {
      const opacityValue = opacity ? parseInt(opacity) / 100 : 1;
      return {
        'background-color': `color-mix(in srgb, var(--bolt-elements-accent-purple) ${opacityValue * 100}%, transparent)`
      };
    }],
    // Custom rules for text-primary with opacity
    [/^text-primary(?:\/([0-9]+))?$/, ([, opacity]) => {
      const opacityValue = opacity ? parseInt(opacity) / 100 : 1;
      return {
        'color': `color-mix(in srgb, var(--bolt-elements-accent-purple) ${opacityValue * 100}%, transparent)`
      };
    }],
  ],
});