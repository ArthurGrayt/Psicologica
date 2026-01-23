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
          primary: '#139690',   // Gama Green - Active Items
          secondary: '#04092E', // Prussian Blue - Text/Logos/Buttons
          accent: '#00A4C2',    // Turquoise - Details
          surface: '#F9FAFB',   // Light Gray - Page Background
        }
      }
    },
  },
  plugins: [],
}
