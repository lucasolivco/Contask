// frontend/src/components/ui/Logo.tsx - CORRIGIDO

import React from 'react'
import logoContask from '../../assets/logo contaskz.png'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  showText?: boolean
  className?: string
  variant?: 'default' | 'white' | 'dark'
  customSize?: string
  onClick?: () => void
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = false,
  className = '',
  variant = 'default',
  customSize,
  onClick
}) => {
  const sizeConfig = {
    xs: {
      image: 'h-6 w-auto',
      text: 'text-sm',
      container: 'gap-2'
    },
    sm: {
      image: 'h-8 w-auto',
      text: 'text-lg',
      container: 'gap-2'
    },
    md: {
      image: 'h-10 w-auto',
      text: 'text-xl',
      container: 'gap-2'
    },
    lg: {
      image: 'h-12 w-auto',
      text: 'text-2xl',
      container: 'gap-3'
    },
    xl: {
      image: 'h-16 w-auto',
      text: 'text-3xl',
      container: 'gap-3'
    },
    custom: {
      image: customSize || 'h-10 w-auto',
      text: 'text-xl',
      container: 'gap-2'
    }
  }

  const variantConfig = {
    default: {
      text: 'from-gray-700 to-gray-800',
      filter: ''
    },
    white: {
      text: 'from-white to-gray-100',
      filter: 'brightness-0 invert'
    },
    dark: {
      text: 'from-gray-800 to-gray-900',
      filter: ''
    }
  }

  const config = sizeConfig[size]
  const colors = variantConfig[variant]

  return (
    <div 
      className={`flex items-center ${config.container} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* ✅ IMAGEM PNG CORRIGIDA */}
        <img
        src={logoContask}
        alt="Contask"
        className={`
            logo-image
            ${config.image}
            object-contain
            transition-transform duration-200
            ${onClick ? 'hover:scale-105 active:scale-95' : ''}
            ${colors.filter ? `filter ${colors.filter}` : ''}
        `}
        />

      

      {showText && (
        <span className={`
          ${config.text} font-bold 
          bg-gradient-to-r ${colors.text} 
          bg-clip-text text-transparent
          tracking-tight
        `}>
          Contask
        </span>
      )}
    </div>
  )
}

export default Logo