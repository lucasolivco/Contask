import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const Card = ({ children, className = '', padding = 'md', ...props }: CardProps) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props} // <-- isso garante suporte a onClick, id, role, etc
    >
      {children}
    </div>
  )
}

export default Card
