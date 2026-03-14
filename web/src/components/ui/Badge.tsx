import { clsx } from 'clsx'
import type { OrderStatus } from '@/types'

interface BadgeProps {
  children:   React.ReactNode
  variant?:   'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | OrderStatus
  size?:      'sm' | 'md'
  className?: string
}

const statusStyles: Record<OrderStatus, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PREPARING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  READY:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  COMPLETED: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const variantStyles: Record<string, string> = {
  default: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error:   'bg-red-500/10 text-red-400 border-red-500/20',
  info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const isStatus = variant in statusStyles
  const style    = isStatus ? statusStyles[variant as OrderStatus] : variantStyles[variant] || variantStyles.default

  return (
    <span className={clsx(
      'inline-flex items-center font-medium border rounded-full',
      size === 'sm' && 'px-2 py-0.5 text-xs',
      size === 'md' && 'px-3 py-1 text-sm',
      style,
      className
    )}>
      {children}
    </span>
  )
}