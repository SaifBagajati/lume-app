import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Lume Velocity Color Palette
      colors: {
        // Primary (Action) - Signal Orange
        orange: {
          50: "#FFF4ED",
          100: "#FFE4D1",
          200: "#FFC8A3",
          300: "#FFA775",
          400: "#FF814D",
          500: "#FF5C00", // Primary
          600: "#E54D00",
          700: "#CC4400",
          800: "#993300",
          900: "#662200",
        },
        // Secondary (Trust) - Deep Navy
        navy: {
          50: "#E6E7EB",
          100: "#C2C5CF",
          200: "#9EA3B3",
          300: "#7A8197",
          400: "#565F7B",
          500: "#0A1128", // Secondary
          600: "#080D1F",
          700: "#060A17",
          800: "#04070F",
          900: "#020308",
        },
        // Accent (Success) - Mint Green
        mint: {
          50: "#E6FFFC",
          100: "#B3FFF6",
          200: "#80FFF0",
          300: "#4DFFEA",
          400: "#1AFFE4",
          500: "#00F5D4", // Accent
          600: "#00C2AA",
          700: "#008F80",
          800: "#005C55",
          900: "#00292B",
        },
        // Background (Surface) - Cool Slate
        slate: {
          50: "#FAFBFC",
          100: "#F0F2F5", // Background
          200: "#E4E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      // Modern border radius (12-16px range)
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "14px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      // Soft, modern shadows
      boxShadow: {
        sm: "0 1px 2px 0 rgba(10, 17, 40, 0.05)",
        DEFAULT: "0 2px 8px 0 rgba(10, 17, 40, 0.08)",
        md: "0 4px 12px 0 rgba(10, 17, 40, 0.10)",
        lg: "0 8px 24px 0 rgba(10, 17, 40, 0.12)",
        xl: "0 12px 32px 0 rgba(10, 17, 40, 0.15)",
        "2xl": "0 16px 48px 0 rgba(10, 17, 40, 0.18)",
        none: "none",
      },
      // Typography - clean sans-serif
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: [
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
