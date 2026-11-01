/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
          raised: "var(--color-ink-raised)",
        },
        gold: {
          DEFAULT: "#7731E6",
          bright: "#9D4EDD",
          dim: "#5A189A",
        },
        brand: {
          DEFAULT: "#7731E6",
          bright: "#9D4EDD",
          dim: "#5A189A",
          light: "#C77DFF",
        },
        purple: {
          DEFAULT: "#7731E6",
          bright: "#9D4EDD",
          dim: "#5A189A",
          light: "#C77DFF",
        },
        emerald: {
          DEFAULT: "#34D399",
          soft: "#1F5C46",
        },
        crimson: "#E4572E",
        paper: "var(--color-paper)",
        mist: "var(--color-mist)",
        hairline: "var(--color-hairline)",
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
        glass: "0 8px 32px rgba(0,0,0,0.5)",
        goldGlow: "0 0 0 1px rgba(119,49,230,0.35), 0 8px 24px rgba(119,49,230,0.22)",
        purpleGlow: "0 0 0 1px rgba(119,49,230,0.35), 0 8px 24px rgba(119,49,230,0.22)",
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
