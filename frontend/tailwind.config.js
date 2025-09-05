/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
      colors: {
        // MRC Brand Colors from design-principles.md
        'mrc': {
          'deep-navy': '#131A7F',
          'professional-blue': '#4C55A0',
          'pure-white': '#FFFFFF',
          'off-white': '#F8F8F8',
          'warm-gray': '#B2A09B',
          'charcoal': '#2A2A2A',
          'light-gray': '#E5E5E5',
          'medium-gray': '#8A8A8A',
          'success-green': '#10B981',
          'error-red': '#EF4444',
          'warning-amber': '#F59E0B',
          'info-blue': '#3B82F6',
        },
        // Shadcn/ui default colors mapped to MRC brand
        border: "#E5E5E5",
        input: "#F8F8F8",
        ring: "#131A7F",
        background: "#FFFFFF",
        foreground: "#2A2A2A",
        primary: {
          DEFAULT: "#131A7F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#4C55A0",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F8F8F8",
          foreground: "#8A8A8A",
        },
        accent: {
          DEFAULT: "#F8F8F8",
          foreground: "#2A2A2A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2A2A2A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2A2A2A",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '28px',
      },
      spacing: {
        '18': '72px',
        '88': '352px',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}