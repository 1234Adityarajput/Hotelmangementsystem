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
        // IVORY & ESPRESSO — Primary Luxury Palette
        espresso: {
          DEFAULT: "#362A22",
          50: "#F7F5F3",
          100: "#EFEBE7",
          200: "#DDD4CE",
          300: "#C4B5AC",
          400: "#8D786C",
          500: "#5D493D",
          600: "#43352B",
          700: "#362A22",
          800: "#2A201A",
          900: "#1E1611",
        },
        mocha: {
          DEFAULT: "#79695B",
          light: "#948779",
          dark: "#5F5145",
        },
        "antique-gold": {
          DEFAULT: "#B08A60",
          light: "#C9A781",
          dark: "#96724A",
          50: "#FAF6F0",
          100: "#F3ECE1",
          200: "#E6D8C2",
          300: "#D6C0A0",
          400: "#C4A77E",
          500: "#B08A60",
          600: "#987248",
          700: "#7A5935",
        },
        "warm-ivory": {
          DEFAULT: "#EEE7DA",
          light: "#F7F4EE",
          dark: "#E3D9CA",
        },
        ivory: {
          bg: "#F7F4EE",
          surface: "#FFFFFF",
          border: "#E3D9CA",
          divider: "#EAE3D8",
          hover: "#F2EADF",
          selected: "#E9DFD0",
          disabled: "#E8E2D9",
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
