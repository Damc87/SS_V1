import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,jsx,js}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb',
        background: '#f8fafc',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        primary: {
          DEFAULT: '#5b8def',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#eef2ff',
          foreground: '#1e293b',
        },
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '10px',
      },
      boxShadow: {
        soft: '0 10px 50px -30px rgba(15,23,42,0.45)',
        card: '0 12px 40px -20px rgba(15,23,42,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
