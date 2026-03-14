import Image from 'next/image'
import { clsx } from 'clsx'

interface AvatarProps {
  src?:       string | null
  name?:      string
  size?:      'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const colors = [
  'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-blue-500',   'bg-purple-500', 'bg-rose-500',
]

const sizeMap = {
  xs: { container: 'w-6 h-6',   text: 'text-xs',   img: 24 },
  sm: { container: 'w-8 h-8',   text: 'text-sm',   img: 32 },
  md: { container: 'w-10 h-10', text: 'text-sm',   img: 40 },
  lg: { container: 'w-12 h-12', text: 'text-base', img: 48 },
  xl: { container: 'w-16 h-16', text: 'text-lg',   img: 64 },
}

export default function Avatar({ src, name = '?', size = 'md', className }: AvatarProps) {
  const { container, text, img } = sizeMap[size]
  const initials  = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const bgColor   = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={clsx('relative rounded-full overflow-hidden flex-shrink-0', container, className)}>
      {src ? (
        <Image src={src} alt={name} width={img} height={img} className="object-cover w-full h-full" />
      ) : (
        <div className={clsx('w-full h-full flex items-center justify-center font-bold text-white', text, bgColor)}>
          {initials}
        </div>
      )}
    </div>
  )
}