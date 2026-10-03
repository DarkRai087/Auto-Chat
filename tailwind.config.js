/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{html,tsx,ts}',
    './components/**/*.{tsx,ts}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          dark: '#0F0F0F',
          surface: '#1A1A1A',
          card: '#212121',
          border: '#333333',
          text: '#F1F1F1',
          muted: '#AAAAAA',
          success: '#2BA640',
          error: '#EF4444',
        },
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
