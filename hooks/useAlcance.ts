'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type AlcanceMap = Map<number, number>

export function useAlcance() {
  const [alcanceMap, setAlcanceMap] = useState<AlcanceMap>(new Map())
  const [loading, setLoading] = useState(true)

  // Load initial data
  const loadInitial = useCallback(async () => {
    const { data, error } = await supabase
      .from('seccion_alcance')
      .select('seccion, count')

    if (error) {
      console.error('Error loading alcance data:', error)
      return
    }

    const map = new Map<number, number>()
    for (const row of data ?? []) {
      map.set(row.seccion, row.count)
    }
    setAlcanceMap(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadInitial()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('alcance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seccion_alcance',
        },
        (payload) => {
          const row = payload.new as { seccion: number; count: number }
          if (row && row.seccion != null) {
            setAlcanceMap((prev) => {
              const next = new Map(prev)
              next.set(row.seccion, row.count)
              return next
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadInitial])

  const totalPersonas = Array.from(alcanceMap.values()).reduce((a, b) => a + b, 0)

  return { alcanceMap, loading, totalPersonas }
}
