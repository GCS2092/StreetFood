'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, MapIcon, List } from 'lucide-react'
import { useVendors, useVendorCategories } from '@/hooks/useVendors'
import VendorCard from '@/components/vendors/VendorCard'
import dynamic from 'next/dynamic'
import { clsx } from 'clsx'

// Leaflet ne fonctionne pas côté serveur — import dynamique obligatoire
const VendorMap = dynamic(() => import('@/components/vendors/VendorMap'), { ssr: false })

export default function VendorsPage() {
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('')
  const [isOpen,      setIsOpen]      = useState<boolean | undefined>(undefined)
  const [view,        setView]        = useState<'list' | 'map'>('list')

  const { data, isLoading } = useVendors({
    search:   search || undefined,
    category: category || undefined,
    isOpen,
  })

  const { data: categoriesData } = useVendorCategories()

  const vendors    = data?.vendors || []
  const categories = categoriesData?.categories || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold text-white">Explorer</h1>
        <p className="text-neutral-400 text-sm">{data?.total || 0} vendeurs disponibles</p>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Rechercher un vendeur, un plat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Filtre ouvert/fermé */}
        <button
          onClick={() => setIsOpen(isOpen === true ? undefined : true)}
          className={clsx(
            'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
            isOpen === true
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
          )}
        >
          Ouvert maintenant
        </button>

        {/* Filtres par catégorie */}
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(category === cat.id ? '' : cat.id)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
              category === cat.id
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
            )}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Toggle liste / carte */}
      <div className="flex items-center justify-between">
        <span className="text-neutral-500 text-sm">
          {isLoading ? 'Chargement...' : `${vendors.length} résultat${vendors.length > 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setView('list')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              view === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            <List size={15} /> Liste
          </button>
          <button
            onClick={() => setView('map')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              view === 'map' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
            )}
          >
            <MapIcon size={15} /> Carte
          </button>
        </div>
      </div>

      {/* Vue carte */}
      {view === 'map' && (
        <VendorMap vendors={vendors} height="500px" />
      )}

      {/* Vue liste */}
      {view === 'list' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <span className="text-5xl">🔍</span>
              <p className="text-neutral-400">Aucun vendeur trouvé</p>
              <button
                onClick={() => { setSearch(''); setCategory(''); setIsOpen(undefined) }}
                className="text-orange-400 text-sm hover:text-orange-300"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}