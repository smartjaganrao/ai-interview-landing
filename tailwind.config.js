/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'indigo': {
          '50': '#f0f4ff',
          '100': '#e0e7ff',
          '500': '#6366f1',
          '600': '#4f46e5',
          '700': '#4338ca',
          '900': '#312e81',
        },
        'purple': {
          '900': '#581c87',
          '950': '#3f0f5c',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
