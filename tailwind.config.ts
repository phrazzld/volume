import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terminal: {
          bg: "#000000",
          bgSecondary: "#0a0a0a",
          border: "#333333",
          borderLight: "#444444",
          text: "#f0f0f0",
          textSecondary: "#999999",
          textMuted: "#666666",
          success: "#00ff00",
          danger: "#ff0000",
          warning: "#ffaa00",
          info: "#00ffff",
          accent: "#ffcc00",
        },
      },
      spacing: {
        terminal: "1px",
      },
      borderRadius: {
        terminal: "0px",
        "terminal-sm": "2px",
      },
      boxShadow: {
        terminal: "none",
      },
      keyframes: {
        "theme-rotate": {
          "0%": { transform: "rotate(0deg)", opacity: "0" },
          "100%": { transform: "rotate(180deg)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "theme-rotate": "theme-rotate 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
