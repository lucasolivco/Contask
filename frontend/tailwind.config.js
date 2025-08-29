// tailwind.config.js - AZUL ESVERDADO CLARO

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ PALETA CONTASK - AZUL ESVERDADO CLARO
        primary: {
          50: '#ecfeff',   // Muito claro
          100: '#cffafe',  // Claro
          200: '#a5f3fc',  // Claro médio
          300: '#67e8f9',  // Médio claro
          400: '#22d3ee',  // Médio
          500: '#06b6d4',  // Principal - Azul esverdado claro
          600: '#0891b2',  // Escuro
          700: '#0e7490',  // Mais escuro
          800: '#155e75',  // Muito escuro
          900: '#164e63',  // Quase preto
        },
        // ✅ COR SECUNDÁRIA VERDE COMPLEMENTAR
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Verde complementar
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // ✅ TONS DE CINZA PERSONALIZADOS
        neutral: {
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
        }
      },
      // ✅ GRADIENTES PERSONALIZADOS
      backgroundImage: {
        'gradient-contask': 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
        'gradient-primary': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      }
    },
  },
  plugins: [],
}