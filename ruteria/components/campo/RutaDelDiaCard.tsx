'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, MapPin, ChevronRight } from 'lucide-react'
import type { VisitaDelDia } from '@/lib/hooks/useRutaDelDia'

type Estado = VisitaDelDia['estado']

const estadoConfig: Record<
  Estado,
  {
    label: string
    icon: typeof CheckCircle2
    badgeBg: string
    badgeText: string
    cardBorder: string
    cardBg: string
  }
> = {
  planificada: {
    label: 'Pendiente',
    icon: Clock,
    badgeBg: 'var(--gray-100)',
    badgeText: 'var(--gray-600)',
    cardBorder: 'var(--gray-200)',
    cardBg: 'white',
  },
  en_ejecucion: {
    label: 'En ejecución',
    icon: Clock,
    badgeBg: 'var(--blue-100)',
    badgeText: 'var(--blue-600)',
    cardBorder: 'var(--blue-600)',
    cardBg: 'white',
  },
  completada: {
    label: 'Completada',
    icon: CheckCircle2,
    badgeBg: 'oklch(0.958 0.040 145)',
    badgeText: 'oklch(0.420 0.140 145)',
    cardBorder: 'oklch(0.850 0.060 145)',
    cardBg: 'oklch(0.978 0.012 145)',
  },
  no_realizada: {
    label: 'No realizada',
    icon: XCircle,
    badgeBg: 'oklch(0.577 0.245 27 / 10%)',
    badgeText: 'oklch(0.495 0.240 27)',
    cardBorder: 'oklch(0.577 0.245 27 / 30%)',
    cardBg: 'oklch(0.577 0.245 27 / 4%)',
  },
}

interface Props {
  visita: VisitaDelDia
}

function formatHora(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function RutaDelDiaCard({ visita }: Props) {
  const cfg = estadoConfig[visita.estado]
  const Icon = cfg.icon
  const isEnEjecucion = visita.estado === 'en_ejecucion'
  const isPlanificada = visita.estado === 'planificada'
  const isCompletada = visita.estado === 'completada'
  const isClickable = isPlanificada || isEnEjecucion

  const cardContent = (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: cfg.cardBg,
        border: `1.5px solid ${cfg.cardBorder}`,
        boxShadow: isEnEjecucion ? '0 2px 12px oklch(0.548 0.230 263 / 12%)' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Número */}
        <div
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: 'var(--gray-100)' }}
        >
          <span className="text-[11px] font-bold" style={{ color: 'var(--gray-600)' }}>
            {visita.orden_visita}
          </span>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Badge de estado */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.badgeBg, color: cfg.badgeText }}
            >
              <Icon size={10} />
              {cfg.label}
            </span>

            {visita.syncStatus === 'pending' && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'oklch(0.928 0.08 75)', color: 'oklch(0.520 0.18 65)' }}
              >
                sync pendiente
              </span>
            )}
            {visita.syncStatus === 'error' && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'oklch(0.577 0.245 27 / 10%)', color: 'oklch(0.495 0.240 27)' }}
              >
                error sync
              </span>
            )}
          </div>

          <p
            className="font-bold text-[15px] leading-tight truncate"
            style={{ color: 'var(--gray-900)' }}
          >
            {visita.pdv.nombre_comercial}
          </p>

          {visita.pdv.direccion && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: 'var(--gray-600)' }} className="shrink-0" />
              <p className="text-[12px] truncate" style={{ color: 'var(--gray-600)' }}>
                {visita.pdv.direccion}
              </p>
            </div>
          )}

          {isCompletada && (
            <p
              className="text-[12px] font-semibold mt-1.5"
              style={{ color: 'oklch(0.420 0.140 145)' }}
            >
              {formatHora(visita.fecha_hora_fin)} · {formatMonto(visita.monto_calculado)}
            </p>
          )}

          {visita.estado === 'no_realizada' && visita.motivo_no_realizada && (
            <p
              className="text-[12px] mt-1 truncate"
              style={{ color: 'oklch(0.495 0.240 27)' }}
            >
              {visita.motivo_no_realizada}
            </p>
          )}

          {isEnEjecucion && visita.fecha_hora_inicio && (
            <p
              className="text-[12px] font-semibold mt-1.5"
              style={{ color: 'var(--blue-600)' }}
            >
              En curso desde {formatHora(visita.fecha_hora_inicio)}
            </p>
          )}
        </div>

        {/* CTA */}
        {isClickable && (
          <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: isEnEjecucion ? 'var(--blue-600)' : 'var(--gray-900)',
            }}
          >
            <ChevronRight size={16} className="text-white" />
          </div>
        )}
      </div>
    </div>
  )

  if (isClickable) {
    return (
      <Link href={`/campo/visita/${visita.id}`} className="block active:scale-[0.99] transition-transform">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
