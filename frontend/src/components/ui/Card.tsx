import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

export default Card