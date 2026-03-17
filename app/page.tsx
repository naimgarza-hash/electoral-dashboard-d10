'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useAlcance } from '@/hooks/useAlcance'
import CaptureForm from '@/components/CaptureForm'

// Leaflet must be loaded client-side only (no SSR)
const ElectoralMap = dynamic(() => import('@/components/ElectoralMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Cargando mapa…</span>
      </div>
    </div>
  ),
})

export default function HomePage() {
  const { alcanceMap, loading, totalPersonas } = useAlcance()
  const [totalSecciones, setTotalSecciones] = useState<number>(0)

  const seccionesAlcanzadas = Array.from(alcanceMap.values()).filter((c) => c > 0).length

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                Alcance Electoral
              </h1>
              <p className="text-xs text-orange-400 font-medium">Distrito 10 — Nuevo León</p>
            </div>
          </div>

          {/* Stats summary in header */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Total personas</div>
              <div className="text-lg font-bold text-orange-400">
                {loading ? '—' : totalPersonas.toLocaleString()}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Secciones</div>
              <div className="text-lg font-bold text-white">
                {loading ? '—' : (
                  <>
                    <span className="text-orange-400">{seccionesAlcanzadas}</span>
                    {totalSecciones > 0 && (
                      <span className="text-gray-500 text-sm font-normal"> / {totalSecciones}</span>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-green-900/40 border border-green-800 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">En vivo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Personas alcanzadas"
            value={loading ? '…' : totalPersonas.toLocaleString()}
            accent
          />
          <StatCard
            label="Secciones activas"
            value={loading ? '…' : seccionesAlcanzadas.toString()}
          />
          <StatCard
            label="Total secciones D10"
            value={totalSecciones > 0 ? totalSecciones.toString() : '…'}
          />
          <StatCard
            label="Cobertura"
            value={
              totalSecciones > 0 && !loading
                ? `${Math.round((seccionesAlcanzadas / totalSecciones) * 100)}%`
                : '…'
            }
          />
        </div>

        {/* Map + Form layout */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          {/* Map */}
          <div className="relative flex-1 min-h-[400px] lg:min-h-[500px] bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <ElectoralMap
              alcanceMap={alcanceMap}
              onSectionesTotal={setTotalSecciones}
            />
          </div>

          {/* Form panel */}
          <div className="lg:w-80 xl:w-96 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Captura de alcance</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Ingresa el número de sección para sumar +1 persona
              </p>
            </div>
            <CaptureForm alcanceMap={alcanceMap} />
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent ? 'text-orange-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
