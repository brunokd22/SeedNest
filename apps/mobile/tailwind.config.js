/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:   '#2D6A4F',
        secondary: '#52B788',
        accent:    '#B7E4C7',
      },
    },
  },
};
