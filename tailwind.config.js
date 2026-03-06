/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ← IMPORTANT: we'll toggle `class="dark"` on <html>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // use: className="font-sans"
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        // use for luxury headings: className="font-display"
        display: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          gold: "#f5b400",      // accent for jewellery
          goldSoft: "#fef3c7",  // light background
          pink: "#f9739b",      // hero / CTA accents
          dark: "#0b1120",      // deep navy/black
        },
        diamond: {
          cyan: "#22d3ee",
          sky: "#38bdf8",
          glow: "#a5b4fc",
        },
      },
      boxShadow: {
        "soft-card": "0 18px 45px rgba(15,23,42,0.12)",
        "lux-card": "0 26px 70px rgba(15,23,42,0.25)",
      },
    },
  },
  plugins: [],
};
