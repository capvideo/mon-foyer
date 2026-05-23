/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jose: '#378ADD',
        anais: '#D4537E',
        lucas: '#639922',
        foyer: {
          50: '#FFF8F5',
          100: '#FFE8D6',
          200: '#FFD0A8',
          300: '#FFB37A',
          400: '#FF8C4A',
          500: '#FF6B35',
          600: '#E8521C',
          700: '#C03D10',
          800: '#952D0A',
          900: '#6B1F05',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
