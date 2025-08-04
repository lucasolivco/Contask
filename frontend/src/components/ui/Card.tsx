// Card reutilizável - como uma "caixa" bonita para colocar conteúdo
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = true 
}) => {
  return (
    <div className={`card ${!padding ? 'p-0' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default Card