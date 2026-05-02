/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0ffeb', // Very light green
          100: '#dbfed0',
          500: '#CCFF00', // Electric / neon green
          600: '#aadd00',
          700: '#779900',
          900: '#334400',
        },
        food: {
          50: '#e6f9ef',
          100: '#ccefdc',
          500: '#06c167', // Uber Eats Green
          600: '#05a85a',
          700: '#048f4d',
        },
        background: '#050505',
        surface: '#121212',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        dot: ['"DotGothic16"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        inter: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
