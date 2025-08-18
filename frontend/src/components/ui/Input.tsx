import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = ({ label, error, icon, className = '', ...props }: InputProps) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm
            placeholder:text-gray-400
            focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-500
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-100' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Input