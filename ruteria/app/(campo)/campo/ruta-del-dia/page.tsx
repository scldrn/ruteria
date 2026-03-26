'use client'

import { useRutaDelDia } from '@/lib/hooks/useRutaDelDia'
import { RutaDelDiaCard } from '@/components/campo/RutaDelDiaCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectionStatusBar } from '@/components/campo/ConnectionStatusBar'
import { MapPin } from 'lucide-react'

function formatFecha(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function RutaDelDiaPage() {
  const {
    data: visitas = [],
    isLoading,
    error,
    isOfflineFallback,
    lastSyncedAt,
  } = useRutaDelDia()

  const completadas = visitas.filter((v) => v.estado === 'completada').length
  const rutaNombre = visitas[0]?.ruta?.nombre ?? 'Ruta del día'
  const progresoPct = visitas.length > 0 ? Math.round((completadas / visitas.length) * 100) : 0

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto" style={{ background: 'var(--gray-100)', minHeight: '100vh' }}>
        <div className="bg-white px-5 pt-5 pb-5 border-b" style={{ borderColor: 'var(--gray-200)' }}>
          <ConnectionStatusBar />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="px-4 py-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        <ConnectionStatusBar />
        <p className="text-red-500 text-sm">Error cargando la ruta: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col" style={{ background: 'var(--gray-100)' }}>

      {/* Header blanco */}
      <div
        className="bg-white border-b px-5 pt-5 pb-5 shrink-0"
        style={{ borderColor: 'var(--gray-200)' }}
      >
        <ConnectionStatusBar isOfflineFallback={isOfflineFallback} lastSyncedAt={lastSyncedAt} />

        <div className="mt-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin size={13} style={{ color: 'var(--blue-600)' }} />
              <span
                className="text-[12px] font-semibold"
                style={{ color: 'var(--blue-600)' }}
              >
                {rutaNombre}
              </span>
            </div>
            <h1
              className="text-[22px] font-bold leading-tight"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                letterSpacing: '-0.02em',
              }}
            >
              Ruta del día
            </h1>
            <p className="text-[13px] capitalize mt-0.5" style={{ color: 'var(--gray-600)' }}>
              {formatFecha()}
            </p>
          </div>

          <div className="text-right">
            <p
              className="text-[28px] font-bold leading-none"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
              }}
            >
              {completadas}
              <span className="text-[16px] font-normal" style={{ color: 'var(--gray-600)' }}>
                /{visitas.length}
              </span>
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--gray-600)' }}>
              completadas
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        {visitas.length > 0 && (
          <div className="mt-5">
            <div
              className="h-1.5 rounded-full"
              style={{ background: 'var(--gray-200)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progresoPct}%`,
                  background: 'var(--blue-600)',
                }}
              />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--gray-600)' }}>
              {progresoPct}% completado
            </p>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 px-4 py-5">
        {visitas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--blue-50)' }}
            >
              <MapPin size={24} style={{ color: 'var(--blue-600)' }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--gray-900)' }}>
              Sin visitas programadas
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--gray-600)' }}>
              No hay visitas para hoy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visitas.map((visita) => (
              <RutaDelDiaCard key={visita.id} visita={visita} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
