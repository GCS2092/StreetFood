'use client'

import { useEffect, useRef } from 'react'
import type { Vendor } from '@/types'

interface VendorMapProps {
  vendors: Vendor[]
  center?: [number, number]
  height?: string
}

export default function VendorMap({ vendors, center = [14.7167, -17.4677], height = '400px' }: VendorMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    // Attendre que le DOM soit prêt et éviter la double initialisation
    if (!mapRef.current) return
    if (mapInstance.current) return

    // Vérifier que le container a une taille réelle
    if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) return

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default

        // Fix icônes Leaflet avec Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Vérifier une dernière fois que le container existe toujours
        if (!mapRef.current) return

        const map = L.map(mapRef.current, {
          center,
          zoom:        13,
          zoomControl: true,
        })

        mapInstance.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(map)

        const openIcon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#F97316;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🍢</div>`,
          iconSize:   [36, 36],
          iconAnchor: [18, 18],
        })

        const closedIcon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#525252;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🍢</div>`,
          iconSize:   [36, 36],
          iconAnchor: [18, 18],
        })

        vendors.forEach(vendor => {
          const marker = L.marker(
            [vendor.latitude, vendor.longitude],
            { icon: vendor.isOpen ? openIcon : closedIcon }
          ).addTo(map)

          marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <strong style="font-size:14px">${vendor.name}</strong><br/>
              <span style="color:${vendor.isOpen ? '#10B981' : '#6B7280'};font-size:12px">
                ${vendor.isOpen ? '● Ouvert' : '● Fermé'}
              </span><br/>
              <span style="font-size:12px;color:#888">${vendor.address || 'Dakar'}</span><br/>
              <a href="/vendors/${vendor.id}" style="color:#F97316;font-size:12px;font-weight:600">
                Voir le menu →
              </a>
            </div>
          `)
        })

        // Forcer le recalcul de la taille après le rendu
        setTimeout(() => map.invalidateSize(), 100)

      } catch (err) {
        console.error('Erreur initialisation carte:', err)
      }
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [vendors, center])

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', minHeight: height }}
      className="rounded-2xl overflow-hidden border border-neutral-800"
    />
  )
}