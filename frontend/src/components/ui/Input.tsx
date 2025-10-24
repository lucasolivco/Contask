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
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border border-gray-200 dark:border-slate-600
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-slate-100
            px-3 py-2.5 text-sm
            placeholder:text-gray-400 dark:placeholder:text-slate-500
            focus:border-cyan-300 dark:focus:border-cyan-500
            focus:ring-2 focus:ring-cyan-100 dark:focus:ring-cyan-900
            focus:outline-none
            disabled:bg-gray-50 dark:disabled:bg-slate-700
            disabled:text-gray-500 dark:disabled:text-slate-400
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-300 dark:border-red-500 focus:border-red-300 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default Input