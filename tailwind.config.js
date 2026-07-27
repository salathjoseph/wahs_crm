/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F5F2",
        card: "#FFFFFF",
        sidebar: "#FFFFFF",
        primaryText: "#101010",
        secondaryText: "#6E6E73",
        border: "#E8E5DF",
        divider: "#EFECE7",
        accent: {
          DEFAULT: "#B89C63",
          hover: "#A38750"
        },
        hoverBg: "#F3EFE8",
        success: "#198754",
        danger: "#D14343",
        warning: "#F5A623",
        // Keep the old crm palette as fallback for any existing component imports
        crm: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
      },
      boxShadow: {
        premium: "0 2px 8px -2px rgba(16, 16, 16, 0.04), 0 4px 16px -4px rgba(16, 16, 16, 0.02)",
        soft: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)"
      }
    },
  },
  plugins: [],
}
