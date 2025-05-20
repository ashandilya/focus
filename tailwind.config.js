/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'youtube-black': '#0f0f0f',
        'youtube-dark': '#1f1f1f',
        'youtube-gray': '#272727',
      },
    },
  },
  plugins: [],
} 