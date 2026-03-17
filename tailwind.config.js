/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fde8d0',
          300: '#fdba74',
          400: '#f9b977',
          500: '#f97316',
          600: '#f47920',
          700: '#ea580c',
          800: '#c2410c',
          900: '#bf4e00',
        },
      },
    },
  },
  plugins: [],
}
