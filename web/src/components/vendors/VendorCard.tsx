import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { Vendor } from '@/types'

interface VendorCardProps {
  vendor: Vendor
}

export default function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className={clsx(
        'group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden',
        'hover:border-neutral-700 transition-all duration-200 cursor-pointer'
      )}>

        {/* Image de couverture */}
        <div className="relative h-44 bg-neutral-800 overflow-hidden">
          {vendor.coverImage ? (
            <Image
              src={vendor.coverImage}
              alt={vendor.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-neutral-800">
              🍢
            </div>
          )}

          {/* Badge statut */}
          <div className="absolute top-3 left-3">
            <span className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              vendor.isOpen
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-neutral-700/80 text-neutral-400 border border-neutral-600'
            )}>
              {vendor.isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </div>

          {/* Catégorie */}
          {vendor.category && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
                {vendor.category.icon} {vendor.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-4 space-y-2">
          <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-orange-400 transition-colors">
            {vendor.name}
          </h3>

          {vendor.description && (
            <p className="text-neutral-500 text-sm line-clamp-1">
              {vendor.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              {/* Note */}
              <span className="flex items-center gap-1 text-sm">
                <Star size={13} className="text-orange-400 fill-orange-400" />
                <span className="font-semibold text-white">
                  {vendor.averageRating.toFixed(1)}
                </span>
                <span className="text-neutral-500">
                  ({vendor.totalReviews})
                </span>
              </span>
            </div>

            {/* Distance ou adresse */}
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <MapPin size={12} />
              {vendor.distance !== undefined
                ? `${vendor.distance.toFixed(1)} km`
                : vendor.address || 'Dakar'
              }
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}