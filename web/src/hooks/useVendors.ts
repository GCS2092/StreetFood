'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Vendor, VendorCategory } from '@/types'

// --- TOUS LES VENDEURS ---
// GET /api/vendors?category=xxx&isOpen=true&search=xxx
export function useVendors(filters?: {
  category?: string
  isOpen?:   boolean
  search?:   string
}) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn:  async () => {
      const params = new URLSearchParams()
      if (filters?.category)           params.set('category', filters.category)
      if (filters?.isOpen !== undefined) params.set('isOpen', String(filters.isOpen))
      if (filters?.search)             params.set('search', filters.search)

      const { data } = await api.get(`/api/vendors?${params.toString()}`)
      return data as { vendors: Vendor[]; total: number }
    },
  })
}

// --- VENDEURS PROCHES ---
// GET /api/vendors/nearby?lat=xxx&lng=xxx&radius=5
export function useNearbyVendors(coords?: { lat: number; lng: number; radius?: number }) {
  return useQuery({
    queryKey: ['vendors', 'nearby', coords],
    queryFn:  async () => {
      if (!coords) return { vendors: [], total: 0 }
      const { lat, lng, radius = 5 } = coords
      const { data } = await api.get(`/api/vendors/nearby?lat=${lat}&lng=${lng}&radius=${radius}`)
      return data as { vendors: Vendor[]; total: number }
    },
    enabled: !!coords,
  })
}

// --- UN VENDEUR ---
// GET /api/vendors/:id
export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn:  async () => {
      const { data } = await api.get(`/api/vendors/${id}`)
      return data as { vendor: Vendor }
    },
    enabled: !!id,
  })
}

// --- CATEGORIES ---
// GET /api/vendors/categories
export function useVendorCategories() {
  return useQuery({
    queryKey: ['vendor-categories'],
    queryFn:  async () => {
      const { data } = await api.get('/api/vendors/categories')
      return data as { categories: VendorCategory[] }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — les catégories changent peu
  })
}

// --- FAVORIS ---
// POST /api/vendors/:id/favorite
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { data } = await api.post(`/api/vendors/${vendorId}/favorite`)
      return data as { isFavorite: boolean; message: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

// --- MES FAVORIS ---
// GET /api/vendors/me/favorites
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn:  async () => {
      const { data } = await api.get('/api/vendors/me/favorites')
      return data as { vendors: Vendor[]; total: number }
    },
  })
}