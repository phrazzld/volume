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
          bg: "var(--terminal-bg)",
          bgSecondary: "var(--terminal-bg-secondary)",
          border: "var(--terminal-border)",
          borderLight: "var(--terminal-border-light)",
          text: "var(--terminal-text)",
          textSecondary: "var(--terminal-text-secondary)",
          textMuted: "var(--terminal-text-muted)",
          success: "var(--terminal-success)",
          danger: "var(--terminal-danger)",
          warning: "var(--terminal-warning)",
          info: "var(--terminal-info)",
          accent: "var(--terminal-accent)",
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
        "blink-cursor": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "theme-rotate": "theme-rotate 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.2s ease-out",
        "blink-cursor": "blink-cursor 1s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
