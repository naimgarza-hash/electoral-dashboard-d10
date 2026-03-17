'use client'

import { useState, useRef, useCallback } from 'react'
import LogReciente from './LogReciente'

export type LogEntry = {
  seccion: number
  count: number
  timestamp: Date
}

interface Props {
  alcanceMap: Map<number, number>
}

export default function CaptureForm({ alcanceMap }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async () => {
    const seccion = parseInt(inputValue.trim(), 10)
    if (isNaN(seccion) || seccion <= 0) {
      setError('Ingresa un número de sección válido')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/alcance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seccion }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Error al guardar. Intenta de nuevo.')
        return
      }

      const { count } = await res.json()

      setLog((prev) => [
        { seccion, count, timestamp: new Date() },
        ...prev.slice(0, 49), // keep last 50
      ])
      setInputValue('')
      inputRef.current?.focus()
    } catch {
      setError('Error de conexión. Verifica tu internet.')
    } finally {
      setLoading(false)
    }
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
            Número de sección
          </label>
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="ej. 1804"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg
                       placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1
                       focus:ring-orange-500 transition-colors
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !inputValue}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700
                     disabled:text-gray-500 text-white font-semibold rounded-lg
                     transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500
                     focus:ring-offset-2 focus:ring-offset-gray-900 min-w-[110px]"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Guardando
            </span>
          ) : (
            'Ingresar'
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Section preview (count before submit) */}
      {inputValue && !isNaN(parseInt(inputValue)) && (
        <p className="text-sm text-gray-400">
          Sección <span className="text-white font-medium">{inputValue}</span> tiene actualmente{' '}
          <span className="text-orange-400 font-medium">
            {(alcanceMap.get(parseInt(inputValue)) ?? 0).toLocaleString()}
          </span>{' '}
          persona(s) registrada(s)
        </p>
      )}

      {/* Recent log */}
      <LogReciente entries={log} />
    </div>
  )
}
