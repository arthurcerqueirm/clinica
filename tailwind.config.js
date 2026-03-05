/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          light: '#FDFBF7',
          DEFAULT: '#F9F6F0',
          dark: '#F2EDDF',
        },
        sage: {
          light: '#A7BDAA',
          DEFAULT: '#8DAA91',
          dark: '#738C76',
        },
        rose: {
          light: '#ECCACA',
          DEFAULT: '#E5B7B7',
          dark: '#D19A9A',
        },
        dark: '#2D2D2D',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'ios': '20px',
        'ios-lg': '28px',
      },
      boxShadow: {
        'ios': '0 4px 12px rgba(0,0,0,0.05)',
        'ios-hover': '0 8px 24px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
