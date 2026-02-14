/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0a0a",
          slate: "#1e293b", 
          neon: "#00ff9d", // Main accent
          blue: "#00d9f9", // Secondary accent
          red: "#ff2a6d", // Alert/Threat
          yellow: "#fcee0a", // Warning
          dim: "rgba(0, 255, 157, 0.1)", // Glass effect
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'], // For that terminal look
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
