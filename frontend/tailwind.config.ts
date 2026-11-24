import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-manrope)",
          "Manrope",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "var(--font-playfair)",
          "Playfair Display",
          "Georgia",
          "Cambria",
          "serif",
        ],
        heading: [
          "var(--font-playfair)",
          "Playfair Display",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        // ROYAL BURGUNDY & PEARL — Exact Theme Tokens
        burgundy: {
          DEFAULT: "#59283A", // Primary Royal Burgundy
          deep: "#472130",    // Deep Wine
          muted: "#7A4652",   // Muted Burgundy
          hover: "#4D2232",
          50: "#FAF5F7",
          100: "#F3E8EC",
          200: "#E5CCD6",
          300: "#D3AAB9",
          400: "#A96277",
          500: "#7A4652",
          600: "#59283A",
          700: "#472130",
          800: "#381926",
          900: "#2A121D",
        },
        champagne: {
          DEFAULT: "#C4A06A", // Champagne Gold
          light: "#D8BC8F",
          dark: "#A8834F",
          hover: "#B8935D",
          50: "#FCF9F4",
          100: "#F7F1E7",
          200: "#EFE2CD",
          300: "#E3CFA9",
          400: "#D4B988",
          500: "#C4A06A",
          600: "#AB8652",
          700: "#8B6A3D",
        },
        pearl: {
          DEFAULT: "#F5F0EA", // Pearl Background
          light: "#FAF7F3",
          dark: "#EFE8E0",
          surface: "#FFFFFF", // Warm White
          border: "#E8DDD8",  // Soft Border
        },
        rose: {
          DEFAULT: "#8E7079", // Muted Rose
          muted: "#8E7079",
        },
        ink: {
          main: "#352630",      // Main Text
          secondary: "#82747A", // Secondary Text
        },
        // Backward-compatibility aliases for existing utility classes
        espresso: {
          DEFAULT: "#59283A",
          50: "#FAF5F7",
          100: "#F3E8EC",
          200: "#E5CCD6",
          300: "#D3AAB9",
          400: "#7A4652",
          500: "#59283A",
          600: "#472130",
          700: "#381926",
          800: "#2A121D",
          900: "#1D0B14",
        },
        mocha: {
          DEFAULT: "#82747A",
          light: "#8E7079",
          dark: "#59283A",
        },
        "antique-gold": {
          DEFAULT: "#C4A06A",
          light: "#D8BC8F",
          dark: "#A8834F",
          50: "#FCF9F4",
          100: "#F7F1E7",
          200: "#EFE2CD",
          300: "#E3CFA9",
          400: "#D4B988",
          500: "#C4A06A",
          600: "#AB8652",
          700: "#8B6A3D",
        },
        "warm-ivory": {
          DEFAULT: "#F5F0EA",
          light: "#FAF7F3",
          dark: "#E8DDD8",
        },
        ivory: {
          bg: "#F5F0EA",
          surface: "#FFFFFF",
          border: "#E8DDD8",
          divider: "#E8DDD8",
          hover: "#FAF7F3",
          selected: "#EFE8E0",
          disabled: "#E8DDD8",
        },
        // Semantic Hospitality Status Colors
        status: {
          success: "#32765B",
          "success-bg": "#E7F1E9",
          warning: "#A97832",
          "warning-bg": "#F6EDDC",
          danger: "#B54C44",
          "danger-bg": "#F8E8E5",
          info: "#627D91",
          "info-bg": "#E9EFF3",
        },

        // CSS Variables compatibility mapping
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
