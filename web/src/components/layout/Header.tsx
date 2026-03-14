'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import Avatar from '@/components/ui/Avatar'
import { clsx } from 'clsx'

export default function Header() {
  const pathname = usePathname()
  const { user, isAuth } = useAuthStore()

  if (pathname?.startsWith('/auth')) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍢</span>
          <span className="font-display font-bold text-lg">
            Street<span className="text-orange-500">Food</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuth ? (
            <>
              <button className="relative p-2 rounded-xl hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
              </button>

              <Link href="/orders" className="p-2 rounded-xl hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
                <ShoppingBag size={20} />
              </Link>

              <Link href="/profile">
                <Avatar
                  src={user?.avatar}
                  name={user?.name || '?'}
                  size="sm"
                  className="ring-2 ring-transparent hover:ring-orange-500 transition-all cursor-pointer"
                />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}