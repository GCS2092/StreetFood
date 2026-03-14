'use client'

import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'
import { useVendors, useNearbyVendors } from '@/hooks/useVendors'
import { useAuthStore } from '@/store/auth.store'
import VendorCard from '@/components/vendors/VendorCard'
import { useState, useEffect } from 'react'
import type { Vendor } from '@/types'

export default function HomePage() {
  const { isAuth, user } = useAuthStore()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>()

  // Géolocalisation automatique
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        ()  => setCoords({ lat: 14.7167, lng: -17.4677 }) // Dakar par défaut
      )
    }
  }, [])

  const { data: nearbyData, isLoading: loadingNearby } = useNearbyVendors(
    coords ? { ...coords, radius: 5 } : undefined
  )

  const { data: allData, isLoading: loadingAll } = useVendors()

  const nearbyVendors = nearbyData?.vendors?.slice(0, 6) || []
  const topVendors    = allData?.vendors?.slice(0, 6)    || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">

      {/* Hero */}
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-orange-400 font-medium text-sm">📍 Dakar, Sénégal</p>
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            {isAuth ? `Bonjour, ${user?.name?.split(' ')[0]} 👋` : 'Street food à portée de main'}
          </h1>
          <p className="text-neutral-400">
            {isAuth ? "Que veux-tu manger aujourd'hui ?" : 'Découvre les meilleurs vendeurs de rue à Dakar'}
          </p>
        </div>

        {/* Barre de recherche rapide */}
        <Link href="/vendors" className="block">
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-4 py-3.5 transition-colors cursor-pointer">
            <Search size={18} className="text-neutral-500" />
            <span className="text-neutral-500 text-sm">Rechercher un vendeur ou un plat...</span>
          </div>
        </Link>

        {/* CTA si non connecté */}
        {!isAuth && (
          <div className="flex gap-3">
            <Link href="/auth/register" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-colors">
              Créer un compte
            </Link>
            <Link href="/auth/login" className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm border border-neutral-700 transition-colors">
              Se connecter
            </Link>
          </div>
        )}
      </section>

      {/* Vendeurs proches */}
      {coords && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={18} className="text-orange-400" /> Près de toi
            </h2>
            <Link href="/vendors" className="text-orange-400 text-sm hover:text-orange-300">Voir tout</Link>
          </div>

          {loadingNearby ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : nearbyVendors.length === 0 ? (
            <p className="text-neutral-500 text-sm">Aucun vendeur dans un rayon de 5km</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyVendors.map((vendor: Vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
            </div>
          )}
        </section>
      )}

      {/* Top vendeurs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">⭐ Les mieux notés</h2>
          <Link href="/vendors" className="text-orange-400 text-sm hover:text-orange-300">Voir tout</Link>
        </div>

        {loadingAll ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topVendors.map((vendor: Vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
          </div>
        )}
      </section>

    </div>
  )
}