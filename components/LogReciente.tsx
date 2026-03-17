'use client'

import type { LogEntry } from './CaptureForm'

interface Props {
  entries: LogEntry[]
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'ahora'
  if (seconds < 60) return `hace ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours}h`
}

export default function LogReciente({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-gray-600 text-sm text-center py-4 border border-dashed border-gray-700 rounded-lg">
        Los registros ingresados en esta sesión aparecerán aquí
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
        Historial de esta sesión
      </h3>
      <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {entries.map((entry, i) => (
          <li
            key={i}
            className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2
                       text-sm border border-gray-700/50"
          >
            <span>
              <span className="text-gray-400">Sección </span>
              <span className="text-white font-semibold">{entry.seccion}</span>
              <span className="text-gray-500 mx-1">→</span>
              <span className="text-orange-400 font-semibold">
                {entry.count.toLocaleString()} persona{entry.count !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="text-gray-500 text-xs ml-3 shrink-0">{timeAgo(entry.timestamp)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
