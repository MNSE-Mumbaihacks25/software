/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617", // Deep Navy/Black
        surface: "#0f172a",    // Slightly lighter for cards
        primary: "#3b82f6",    // Trust Blue
        accent: "#8b5cf6",     // AI Purple
        success: "#10b981",    // Money Green
        warning: "#f59e0b",    // Risk Orange
        danger: "#ef4444",     // Critical Red
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}