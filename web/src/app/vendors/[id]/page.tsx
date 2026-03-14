'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Star, MapPin, Phone, Heart, Clock, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useVendor } from '@/hooks/useVendors'
import { useDishes } from '@/hooks/useDishes'
import { useToggleFavorite } from '@/hooks/useVendors'
import { useAuthStore } from '@/store/auth.store'
import DishCard from '@/components/vendors/DishCard'
import type { Dish, DishCategory } from '@/types'

const categoryLabel: Record<DishCategory, string> = {
  ENTREE:  '🥗 Entrées',
  PLAT:    '🍽️ Plats',
  DESSERT: '🍰 Desserts',
  BOISSON: '🥤 Boissons',
  SNACK:   '🥪 Snacks',
}

const dayLabel: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu', FRIDAY: 'Ven', SATURDAY: 'Sam', SUNDAY: 'Dim',
}

export default function VendorPage() {
  const { id }    = useParams<{ id: string }>()
  const [tab, setTab] = useState<'menu' | 'info'>('menu')
  const { isAuth }    = useAuthStore()

  const { data: vendorData, isLoading: loadingVendor } = useVendor(id)
  const { data: dishData,   isLoading: loadingDishes  } = useDishes(id)
  const toggleFavorite = useToggleFavorite()

  const vendor  = vendorData?.vendor
  const grouped = dishData?.grouped || {}

  if (loadingVendor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-56 bg-neutral-900 rounded-2xl animate-pulse" />
        <div className="h-8 bg-neutral-900 rounded-xl animate-pulse w-2/3" />
        <div className="h-4 bg-neutral-900 rounded-xl animate-pulse w-1/2" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-20 space-y-3">
        <span className="text-5xl">😕</span>
        <p className="text-neutral-400">Vendeur introuvable</p>
        <Link href="/vendors" className="text-orange-400 text-sm">Retour à la liste</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Image cover */}
      <div className="relative h-56 bg-neutral-800">
        {vendor.coverImage ? (
          <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍢</div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />

        {/* Bouton retour */}
        <Link
          href="/vendors"
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>

        {/* Bouton favori */}
        {isAuth && (
          <button
            onClick={() => toggleFavorite.mutate(vendor.id)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl text-white hover:bg-black/70 transition-colors"
          >
            <Heart size={18} className={toggleFavorite.isPending ? 'opacity-50' : ''} />
          </button>
        )}

        {/* Badge statut */}
        <div className="absolute bottom-4 left-4">
          <span className={clsx(
            'px-3 py-1 rounded-full text-xs font-semibold',
            vendor.isOpen
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm'
              : 'bg-neutral-700/80 text-neutral-400 border border-neutral-600'
          )}>
            {vendor.isOpen ? '● Ouvert' : '● Fermé'}
          </span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* Infos principales */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-white">{vendor.name}</h1>

          {vendor.description && (
            <p className="text-neutral-400 text-sm">{vendor.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-orange-400 fill-orange-400" />
              <span className="font-semibold text-white">{vendor.averageRating.toFixed(1)}</span>
              <span className="text-neutral-500">({vendor.totalReviews} avis)</span>
            </span>

            {vendor.address && (
              <span className="flex items-center gap-1 text-neutral-500">
                <MapPin size={13} />
                {vendor.address}
              </span>
            )}
          </div>

          {vendor.phone && (
            <span className="flex items-center gap-1 text-neutral-500 text-sm">
              <Phone size={13} />
              {vendor.phone}
            </span>
          )}
        </div>

        {/* Tabs menu / infos */}
        <div className="flex border-b border-neutral-800">
          {(['menu', 'info'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px',
                tab === t
                  ? 'text-orange-400 border-orange-400'
                  : 'text-neutral-500 border-transparent hover:text-neutral-300'
              )}
            >
              {t === 'menu' ? 'Menu' : 'Informations'}
            </button>
          ))}
        </div>

        {/* Contenu tab menu */}
        {tab === 'menu' && (
          <div className="space-y-6">
            {loadingDishes ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 bg-neutral-900 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <span className="text-4xl">🍽️</span>
                <p className="text-neutral-500">Aucun plat disponible</p>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, dishes]) => (
                <div key={cat} className="space-y-3">
                  <h2 className="font-display font-bold text-white text-lg">
                    {categoryLabel[cat as DishCategory] || cat}
                  </h2>
                  <div className="space-y-3">
                    {(dishes as Dish[]).map(dish => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        onAdd={(d) => console.log('Ajouter au panier:', d)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contenu tab infos */}
        {tab === 'info' && (
          <div className="space-y-4">
            {vendor.openingHours.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Clock size={15} className="text-orange-400" />
                  Horaires
                </h3>
                <div className="space-y-1">
                  {vendor.openingHours.map(h => (
                    <div key={h.id} className="flex justify-between text-sm">
                      <span className="text-neutral-400">{dayLabel[h.day] || h.day}</span>
                      <span className={h.isClosed ? 'text-neutral-600' : 'text-white'}>
                        {h.isClosed ? 'Fermé' : `${h.openTime} – ${h.closeTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vendor.category && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                <p className="text-sm text-neutral-400">
                  Catégorie : <span className="text-white font-medium">
                    {vendor.category.icon} {vendor.category.name}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 