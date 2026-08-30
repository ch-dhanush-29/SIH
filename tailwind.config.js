/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:     '#1A2B3C',
        paper:   '#F2EFE8',
        saffron: { DEFAULT: '#E8930A', dark: '#C47A08', light: '#F5A72C' },
        sage:    { DEFAULT: '#4A7C6F', dark: '#365A50', light: '#6BA090' },
        mist:    '#C8D8E4',
        alert:   '#B5341C',
        // Keep some utility shades
        ink2:    '#253D52',
        ink3:    '#304E66',
        paper2:  '#E8E4DC',
        paper3:  '#D4CFC5',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Hind', 'system-ui', 'sans-serif'],
        mono:    ['"Noto Sans Mono"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        'hero':    ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'section': ['2.625rem',{ lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'card':    ['1.375rem',{ lineHeight: '1.35' }],
        'body':    ['1.0625rem',{ lineHeight: '1.65' }],
        'data':    ['0.8125rem',{ lineHeight: '1.5', letterSpacing: '0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      animation: {
        'ecg': 'ecg 3s linear infinite',
        'fade-up': 'fadeUp 0.7s ease forwards',
        'card-glow': 'cardGlow 4s ease-in-out infinite',
      },
      keyframes: {
        ecg: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        cardGlow: {
          '0%, 100%': { boxShadow: '0 0 20px 0 rgba(232,147,10,0.15)' },
          '50%':      { boxShadow: '0 0 40px 8px rgba(232,147,10,0.30)' },
        },
      },
    },
  },
  plugins: [],
}
