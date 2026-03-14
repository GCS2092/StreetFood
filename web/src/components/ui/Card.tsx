import { clsx } from 'clsx'

interface CardProps {
  children:   React.ReactNode
  className?: string
  onClick?:   () => void
  hoverable?: boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ children, className, onClick, hoverable, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-200',
        hoverable && 'hover:border-neutral-700 hover:bg-neutral-800/80 cursor-pointer',
        onClick   && 'cursor-pointer',
        padding === 'none' && 'p-0',
        padding === 'sm'   && 'p-3',
        padding === 'md'   && 'p-5',
        padding === 'lg'   && 'p-7',
        className
      )}
    >
      {children}
    </div>
  )
}