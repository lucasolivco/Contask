// frontend/src/components/ui/ThemeToggle.tsx
import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="
        relative flex items-center justify-center
        w-10 h-10 rounded-xl
        bg-gray-100 hover:bg-gray-200
        dark:bg-slate-700 dark:hover:bg-slate-600
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400
        group
      "
      aria-label={`Mudar para modo ${resolvedTheme === 'light' ? 'escuro' : 'claro'}`}
      title={`Modo ${resolvedTheme === 'light' ? 'escuro' : 'claro'}`}
    >
      {/* Sun Icon (Light Mode) */}
      <Sun
        className={`
          absolute w-5 h-5 text-amber-500
          transition-all duration-300 transform
          ${resolvedTheme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
          }
        `}
      />

      {/* Moon Icon (Dark Mode) */}
      <Moon
        className={`
          absolute w-5 h-5 text-slate-300
          transition-all duration-300 transform
          ${resolvedTheme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
          }
        `}
      />
    </button>
  )
}

export default ThemeToggle
