import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Core surface
        canvas: "#F5F7FA",
        ink:    "#0F1B2D",
        mist:   "#D4E2F0",
        // Primary brand — navy blue
        navy: {
          DEFAULT: "#1B3A6B",
          light:   "#2451A0",
          dark:    "#122755"
        },
        // Legacy aliases kept for compatibility (mapped to navy)
        pine: {
          DEFAULT: "#1B3A6B",
          light:   "#2451A0",
          dark:    "#122755"
        },
        // Secondary — sky / azure
        azure: {
          DEFAULT: "#1565C0",
          light:   "#1E88E5",
          dark:    "#0D47A1"
        },
        // Accent — warm amber (replaces copper)
        amber: {
          DEFAULT: "#F59E0B",
          light:   "#FBBF24",
          dark:    "#D97706"
        },
        // Legacy alias for copper → amber
        copper: {
          DEFAULT: "#F59E0B",
          light:   "#FBBF24",
          dark:    "#D97706"
        },
        // Success / trust
        emerald: {
          DEFAULT: "#059669",
          light:   "#10B981",
          dark:    "#047857"
        },
        // Neutral backgrounds
        oat:    "#F8FAFF",
        sand:   "#EBF0F7",
        sage:   "#E2EAF4"
      },
      fontFamily: {
        sans:  ["Manrope", "Inter", "IBM Plex Sans", "Segoe UI", "sans-serif"],
        serif: ["Libre Baskerville", "Georgia", "Times New Roman", "serif"]
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "0.96", letterSpacing: "-0.025em" }],
        "display-lg": ["3.75rem", { lineHeight: "0.97", letterSpacing: "-0.022em" }],
        "display-md": ["3rem", { lineHeight: "0.98", letterSpacing: "-0.018em" }],
        "display-sm": ["2.25rem", { lineHeight: "1.02", letterSpacing: "-0.014em" }]
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem"
      },
      boxShadow: {
        soft:   "0 2px 4px rgba(15,27,45,0.03), 0 8px 24px rgba(15,27,45,0.06), 0 24px 64px rgba(15,27,45,0.06)",
        medium: "0 4px 8px rgba(15,27,45,0.05), 0 16px 40px rgba(15,27,45,0.09), 0 40px 80px rgba(15,27,45,0.07)",
        strong: "0 8px 16px rgba(15,27,45,0.08), 0 24px 56px rgba(15,27,45,0.12), 0 56px 120px rgba(15,27,45,0.10)",
        hero:   "0 8px 32px rgba(15,27,45,0.14), 0 40px 96px rgba(15,27,45,0.18), 0 80px 180px rgba(15,27,45,0.14)",
        inset:  "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(15,27,45,0.04)"
      },
      backgroundImage: {
        "navy-gradient":  "linear-gradient(135deg, #122755 0%, #1B3A6B 45%, #2451A0 100%)",
        "azure-gradient": "linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)",
        "warm-gradient":  "linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 50%, #EBF0F7 100%)",
        // Legacy aliases
        "pine-gradient":   "linear-gradient(135deg, #122755 0%, #1B3A6B 45%, #2451A0 100%)",
        "copper-gradient": "linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)"
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)"
      }
    }
  },
  plugins: []
};

export default config;
