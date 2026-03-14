'use client'

import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   'primary' | 'secondary' | 'ghost' | 'danger'
  size?:      'sm' | 'md' | 'lg'
  loading?:   boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          variant === 'primary'   && 'bg-orange-500 hover:bg-orange-400 text-white focus:ring-orange-500 active:scale-[0.98]',
          variant === 'secondary' && 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 focus:ring-neutral-600 border border-neutral-700',
          variant === 'ghost'     && 'bg-transparent hover:bg-neutral-800 text-neutral-300 hover:text-white focus:ring-neutral-600',
          variant === 'danger'    && 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500',

          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-5 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3.5 text-base',

          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Chargement...</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button