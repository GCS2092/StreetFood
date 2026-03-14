'use client'

import Image from 'next/image'
import { Plus, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import type { Dish } from '@/types'

interface DishCardProps {
  dish:     Dish
  onAdd?:   (dish: Dish) => void
}

const categoryLabel: Record<string, string> = {
  ENTREE:  'Entrée',
  PLAT:    'Plat',
  DESSERT: 'Dessert',
  BOISSON: 'Boisson',
  SNACK:   'Snack',
}

export default function DishCard({ dish, onAdd }: DishCardProps) {
  return (
    <div className={clsx(
      'flex gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl',
      'hover:border-neutral-700 transition-all duration-200',
      !dish.isAvailable && 'opacity-50'
    )}>

      {/* Image du plat */}
      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-800">
        {dish.image ? (
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-white text-sm leading-tight">
              {dish.name}
            </h4>
            {dish.description && (
              <p className="text-neutral-500 text-xs mt-0.5 line-clamp-2">
                {dish.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-400 text-sm">
              {dish.price.toLocaleString()} FCFA
            </span>
            {dish.prepTime && (
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Clock size={11} />
                {dish.prepTime} min
              </span>
            )}
          </div>

          {/* Bouton ajouter */}
          {dish.isAvailable && onAdd && (
            <button
              onClick={() => onAdd(dish)}
              className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          )}

          {!dish.isAvailable && (
            <span className="text-xs text-neutral-600 font-medium">
              Indisponible
            </span>
          )}
        </div>
      </div>
    </div>
  )
}