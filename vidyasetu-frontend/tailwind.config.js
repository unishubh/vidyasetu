/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4f46e5',
        },
        ink: '#0f172a',
        mist: '#e2e8f0',
        paper: '#f8fafc',
        skywash: '#eef2ff',
        ember: '#4f46e5',
      },
      boxShadow: {
        panel: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 10px 25px -5px rgb(15 23 42 / 0.04)',
        'panel-hover': '0 20px 35px -10px rgba(79, 70, 229, 0.09), 0 1px 3px 0 rgb(0 0 0 / 0.05)',
        glow: '0 0 30px -5px rgba(79, 70, 229, 0.15)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

