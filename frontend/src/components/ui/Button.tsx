import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue'
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
    primary: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm focus:ring-rose-500 disabled:bg-rose-300',
    secondary: 'bg-blue-50 hover:bg-blue-100 text-grey-700 border border-blue-200 focus:ring-blue-500',
    ghost: 'hover:bg-rose-50 text-rose-600 hover:text-rose-700 focus:ring-rose-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm focus:ring-red-500 disabled:bg-red-300',
    blue: 'hover:bg-blue-200 text-dark shadow-sm focus:ring-blue-500 disabled:bg-blue-300'
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