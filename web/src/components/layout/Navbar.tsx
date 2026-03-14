'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, Wallet, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { clsx } from 'clsx'

const navItems = [
  { href: '/',        icon: Home,        label: 'Accueil'   },
  { href: '/vendors', icon: Search,      label: 'Explorer'  },
  { href: '/orders',  icon: ShoppingBag, label: 'Commandes' },
  { href: '/wallet',  icon: Wallet,      label: 'Wallet'    },
  { href: '/profile', icon: User,        label: 'Profil'    },
]

export default function Navbar() {
  const pathname = usePathname()
  const { isAuth } = useAuthStore()

  if (pathname?.startsWith('/auth') || pathname?.startsWith('/vendor-space')) return null
  if (!isAuth) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200',
                isActive ? 'text-orange-500' : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={clsx('text-xs font-medium', isActive ? 'opacity-100' : 'opacity-60')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}