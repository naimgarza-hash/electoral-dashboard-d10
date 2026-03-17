'use client'

import { useEffect, useRef, useState } from 'react'
import type { AlcanceMap } from '@/hooks/useAlcance'

// Colors: orange monochromatic scale
function getColor(count: number): string {
  if (count === 0) return '#e5e5e5'
  if (count <= 10) return '#fde8d0'
  if (count <= 50) return '#f9b977'
  if (count <= 100) return '#f47920'
  return '#bf4e00'
}

function getOpacity(count: number): number {
  if (count === 0) return 0.5
  return 0.8
}

interface Props {
  alcanceMap: AlcanceMap
  onSectionesTotal?: (total: number) => void
}

export default function ElectoralMap({ alcanceMap, onSectionesTotal }: Props) {
  const mapRef = useRef<any>(null)
  const geoJsonLayerRef = useRef<any>(null)
  const [geojson, setGeojson] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const alcanceMapRef = useRef(alcanceMap)

  // Keep ref in sync so Leaflet handlers can always read latest data
  useEffect(() => {
    alcanceMapRef.current = alcanceMap
  }, [alcanceMap])

  // Load Leaflet and GeoJSON data (client-side only)
  useEffect(() => {
    let L: any

    async function init() {
      // Dynamic import to avoid SSR issues (CSS is imported in globals.css)
      L = (await import('leaflet')).default

      // Load GeoJSON
      const res = await fetch('/data/distrito10.geojson')
      if (!res.ok) {
        console.error('GeoJSON not found. Did you run: npm run convert-shapefile?')
        return
      }
      const data = await res.json()
      setGeojson(data)

      if (onSectionesTotal) {
        onSectionesTotal(data.features?.length ?? 0)
      }

      // Init map
      const mapContainer = document.getElementById('electoral-map')
      if (!mapContainer || mapRef.current) return

      // Default center: San Nicolás de los Garza, NL
      const map = L.map('electoral-map', { center: [25.73, -100.30], zoom: 12 })
      mapRef.current = map

      // CartoDB Dark tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      // GeoJSON choropleth layer
      const layer = L.geoJSON(data, {
        style: (feature: any) => styleFeature(feature),
        onEachFeature: (feature: any, layer: any) => {
          const seccion = feature.properties?.seccion ?? feature.properties?.SECCION ?? '?'
          layer.bindTooltip('', { sticky: true, className: 'electoral-tooltip' })
          layer.on({
            mouseover: (e: any) => {
              const l = e.target
              l.setStyle({ weight: 2.5, color: '#ffffff', fillOpacity: 0.95 })
              l.bringToFront()

              const count = alcanceMapRef.current.get(Number(seccion)) ?? 0
              l.setTooltipContent(
                `<div class="tooltip-content">
                  <span class="tooltip-seccion">Sección ${seccion}</span>
                  <span class="tooltip-count">${count.toLocaleString()} persona${count !== 1 ? 's' : ''}</span>
                </div>`
              )
              l.openTooltip()
            },
            mouseout: (e: any) => {
              layer.resetStyle(e.target)
              e.target.closeTooltip()
            },
          })
        },
      }).addTo(map)

      geoJsonLayerRef.current = layer

      // Fit map to district bounds
      try {
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch (e) {
        console.warn('fitBounds failed, using default NL view', e)
      }
      setMapReady(true)
    }

    function styleFeature(feature: any) {
      const seccion = feature.properties?.seccion ?? feature.properties?.SECCION
      const count = alcanceMapRef.current.get(Number(seccion)) ?? 0
      return {
        fillColor: getColor(count),
        fillOpacity: getOpacity(count),
        color: '#ffffff',
        weight: 0.8,
      }
    }

    init()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        geoJsonLayerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-style GeoJSON when alcanceMap changes
  useEffect(() => {
    if (!mapReady || !geoJsonLayerRef.current || !geojson) return

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature
      const seccion = feature.properties?.seccion ?? feature.properties?.SECCION
      const count = alcanceMap.get(Number(seccion)) ?? 0
      layer.setStyle({
        fillColor: getColor(count),
        fillOpacity: getOpacity(count),
        color: '#ffffff',
        weight: 0.8,
      })
    })
  }, [alcanceMap, mapReady, geojson])

  return (
    <>
      <div
        id="electoral-map"
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-[1000] bg-gray-900/90 border border-gray-700 rounded-lg p-3 text-xs text-gray-200 shadow-lg">
        <div className="font-semibold mb-2 text-orange-300">Personas alcanzadas</div>
        {[
          { color: '#e5e5e5', label: '0' },
          { color: '#fde8d0', label: '1 – 10' },
          { color: '#f9b977', label: '11 – 50' },
          { color: '#f47920', label: '51 – 100' },
          { color: '#bf4e00', label: '100+' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-4 h-4 rounded-sm border border-gray-600"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
