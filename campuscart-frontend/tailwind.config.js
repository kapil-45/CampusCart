/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0C10",
          soft: "#12151C",
          raised: "#181C25",
        },
        gold: {
          DEFAULT: "#C9A227",
          bright: "#E4C25A",
          dim: "#8A6F1D",
        },
        emerald: {
          DEFAULT: "#34D399",
          soft: "#1F5C46",
        },
        crimson: "#E4572E",
        paper: "#F5F3EE",
        mist: "#A8A6A0",
        hairline: "rgba(245,243,238,0.09)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        goldGlow: "0 0 0 1px rgba(201,162,39,0.25), 0 8px 24px rgba(201,162,39,0.08)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(20px, -30px) scale(1.05)" },
        },
        sheen: {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        driftSlow: "drift 22s ease-in-out infinite",
        sheen: "sheen 1.4s ease forwards",
      },
    },
  },
  plugins: [],
};
