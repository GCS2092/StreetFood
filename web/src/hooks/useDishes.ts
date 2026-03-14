'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Dish, DishCategory } from '@/types'

// --- TOUS LES PLATS D'UN VENDEUR ---
// GET /api/dishes/vendor/:vendorId
export function useDishes(vendorId: string, filters?: {
  category?:  DishCategory
  available?: boolean
}) {
  return useQuery({
    queryKey: ['dishes', vendorId, filters],
    queryFn:  async () => {
      const params = new URLSearchParams()
      if (filters?.category)              params.set('category', filters.category)
      if (filters?.available !== undefined) params.set('available', String(filters.available))

      const { data } = await api.get(`/api/dishes/vendor/${vendorId}?${params.toString()}`)
      return data as {
        dishes:  Dish[]
        grouped: Record<DishCategory, Dish[]>
        total:   number
      }
    },
    enabled: !!vendorId,
  })
}

// --- UN PLAT PRÉCIS ---
// GET /api/dishes/vendor/:vendorId/:id
export function useDish(vendorId: string, dishId: string) {
  return useQuery({
    queryKey: ['dish', vendorId, dishId],
    queryFn:  async () => {
      const { data } = await api.get(`/api/dishes/vendor/${vendorId}/${dishId}`)
      return data as { dish: Dish }
    },
    enabled: !!vendorId && !!dishId,
  })
}