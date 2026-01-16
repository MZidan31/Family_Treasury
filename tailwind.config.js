/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // --- INI YANG SERING TERLEWAT ---
  // Tanpa baris ini, Tailwind mengabaikan semua class 'dark:'
  darkMode: 'class', 
  // --------------------------------
  theme: {
    extend: {},
  },
  plugins: [],
}