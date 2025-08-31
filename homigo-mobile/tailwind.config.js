/** @type {import('tailwindcss').Config} */
module.exports = {
  // Important: This tells Tailwind which files to scan for classes
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  
  // NativeWind preset (required)
  presets: [require("nativewind/preset")],
  
  theme: {
    extend: {
      colors: {
        // Homigo brand colors
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        error: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#F44336',
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
      },
    },
  },
  plugins: [],
}