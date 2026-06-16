/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        space: {
          950: "#050B18",
          900: "#0A1628",
          850: "#0E1F38",
          800: "#132A47",
          700: "#1E3A5F",
        },
        steel: {
          cyan: "#00D4FF",
          green: "#00FF94",
          red: "#FF4D6D",
          yellow: "#FFC93C",
          purple: "#B794F4",
          orange: "#FF8C42",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.35)",
        'glow-sm': "0 0 10px rgba(0, 212, 255, 0.25)",
        panel: "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        'radial-glow': "radial-gradient(ellipse at top, rgba(0,212,255,0.08), transparent 60%)",
        'grid-lines': "linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
