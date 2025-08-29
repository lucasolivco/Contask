// frontend/src/components/ui/Button.tsx - USANDO CYAN

import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const Button = ({ 
  variant = 'primary',
  size = 'md', 
  loading = false, 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-600 text-white shadow-sm focus:ring-cyan-500 disabled:bg-cyan-300',
    secondary: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 focus:ring-emerald-500',
    ghost: 'hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 focus:ring-cyan-500',
    danger: 'hover:bg-red-50 text-red-600 hover:text-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 disabled:bg-emerald-300'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export default Button