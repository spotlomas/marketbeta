/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        background: '#050505',
        surface: '#121212',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        dot: ['"DotGothic16"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
