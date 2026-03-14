'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
  icon?:    React.ReactNode
  iconEnd?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconEnd, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full bg-neutral-900 border rounded-xl px-4 py-3 text-sm text-neutral-100',
              'placeholder:text-neutral-600 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon    && 'pl-10',
              iconEnd && 'pr-10',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                : 'border-neutral-800 hover:border-neutral-700',
              className
            )}
            {...props}
          />

          {iconEnd && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
              {iconEnd}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-red-400">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input