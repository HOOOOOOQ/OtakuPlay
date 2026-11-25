import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090811',
        surface: '#12111D',
        'secondary-surface': '#1B1928',
        primary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#A78BFA',
          foreground: '#090811',
        },
        accent: {
          DEFAULT: '#C084FC',
          foreground: '#090811',
        },
        'text-primary': '#FFFFFF',
        'text-secondary': '#A5A1B5',
        success: '#22C55E',
        danger: '#EF4444',
        border: '#252236',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '22px',
      },
      boxShadow: {
        violet: '0 0 28px rgba(139, 92, 246, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
