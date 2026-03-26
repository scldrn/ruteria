'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, BanknoteArrowDown, ShoppingBag, Waypoints } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardHoy } from '@/lib/hooks/useDashboard'

interface Props {
  data: DashboardHoy | undefined
  isLoading: boolean
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function percentage(realizadas: number, planificadas: number) {
  if (planificadas <= 0) return 0
  return Math.min(100, Math.round((realizadas / planificadas) * 100))
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  loading,
  accentColor,
}: {
  title: string
  value: string
  hint: string
  icon: LucideIcon
  loading: boolean
  accentColor: string
}) {
  return (
    <div
      className="relative rounded-2xl bg-white p-5"
      style={{ border: '1px solid var(--gray-200)' }}
    >
      {/* Borde superior de color */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between gap-4 pt-1">
        <div className="space-y-2 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--gray-600)' }}
          >
            {title}
          </p>
          {loading ? (
            <>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-36" />
            </>
          ) : (
            <>
              <p
                className="text-[26px] font-bold leading-none"
                style={{
                  color: 'var(--gray-900)',
                  fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                  letterSpacing: '-0.02em',
                }}
              >
                {value}
              </p>
              <p className="text-[13px]" style={{ color: 'var(--gray-600)' }}>{hint}</p>
            </>
          )}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

export function KpiCards({ data, isLoading }: Props) {
  const visitasRealizadas = data?.visitas_realizadas ?? 0
  const visitasPlanificadas = data?.visitas_planificadas ?? 0
  const avance = percentage(visitasRealizadas, visitasPlanificadas)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Ventas Hoy"
        value={formatCOP(data?.ventas_hoy ?? 0)}
        hint="Ingresos por cierre de visita"
        accentColor="oklch(0.618 0.142 178)"
        icon={ShoppingBag}
        loading={isLoading}
      />
      <KpiCard
        title="Cobros del Mes"
        value={formatCOP(data?.cobros_mes ?? 0)}
        hint="Recaudo confirmado del mes"
        accentColor="var(--blue-600)"
        icon={BanknoteArrowDown}
        loading={isLoading}
      />
      <KpiCard
        title="Visitas"
        value={`${visitasRealizadas} / ${visitasPlanificadas}`}
        hint={`${avance}% de ejecución del día`}
        accentColor="oklch(0.720 0.175 65)"
        icon={Waypoints}
        loading={isLoading}
      />
      <KpiCard
        title="Incidencias Abiertas"
        value={String(data?.incidencias_abiertas ?? 0)}
        hint="Casos que requieren atención"
        accentColor="oklch(0.577 0.245 27.325)"
        icon={AlertTriangle}
        loading={isLoading}
      />
    </div>
  )
}
