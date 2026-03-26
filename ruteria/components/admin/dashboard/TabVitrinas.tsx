'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { StockBajo, TopVitrina } from '@/lib/hooks/useDashboard'

interface Props {
  topVitrinas: TopVitrina[] | undefined
  stockBajo: StockBajo[] | undefined
  isLoading: boolean
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function StockBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value))
  const barColor =
    safeValue < 15
      ? 'oklch(0.577 0.245 27.325)'
      : safeValue < 30
        ? 'oklch(0.720 0.175 65)'
        : 'oklch(0.618 0.142 178)'

  return (
    <div
      className="h-1.5 overflow-hidden rounded-full w-full"
      style={{ background: 'var(--gray-200)' }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${safeValue}%`, background: barColor }}
      />
    </div>
  )
}

export function TabVitrinas({ topVitrinas, stockBajo, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Top Vitrinas */}
      <section
        className="rounded-2xl bg-white p-6"
        style={{ border: '1px solid var(--gray-200)' }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Top Vitrinas
            </p>
            <h3
              className="mt-1 text-[20px] font-bold"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                letterSpacing: '-0.02em',
              }}
            >
              Las que más venden este mes
            </h3>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--gray-600)' }}>
            {topVitrinas?.length ?? 0} posiciones
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {(topVitrinas?.length ?? 0) === 0 ? (
            <div
              className="flex h-[280px] items-center justify-center rounded-xl border border-dashed text-[13px]"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)', background: 'var(--gray-100)' }}
            >
              Sin vitrinas rankeadas en el período actual.
            </div>
          ) : (
            topVitrinas?.map((item, index) => (
              <div
                key={item.vitrina_id}
                className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                    style={{ background: index === 0 ? 'var(--blue-600)' : 'var(--gray-900)' }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold"
                      style={{ color: 'var(--gray-900)' }}
                    >
                      {item.pdv_nombre}
                    </p>
                  </div>
                </div>
                <p
                  className="text-right text-[13px] font-bold shrink-0"
                  style={{ color: 'var(--gray-900)' }}
                >
                  {formatCOP(item.total_ventas)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Stock Bajo */}
      <section
        className="rounded-2xl bg-white p-6"
        style={{ border: '1px solid var(--gray-200)' }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Stock Bajo
            </p>
            <h3
              className="mt-1 text-[20px] font-bold"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                letterSpacing: '-0.02em',
              }}
            >
              Alertas de surtido más sensibles
            </h3>
          </div>
          <Badge
            variant={(stockBajo?.length ?? 0) > 0 ? 'destructive' : 'secondary'}
            className="rounded-full px-3 py-1 text-[12px]"
          >
            {stockBajo?.length ?? 0} alertas
          </Badge>
        </div>

        <div className="mt-5 space-y-2">
          {(stockBajo?.length ?? 0) === 0 ? (
            <div
              className="flex h-[280px] items-center justify-center rounded-xl border border-dashed text-[13px]"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)', background: 'var(--gray-100)' }}
            >
              No hay vitrinas por debajo del 30% de surtido objetivo.
            </div>
          ) : (
            stockBajo?.slice(0, 10).map((item) => (
              <div
                key={`${item.vitrina_id}-${item.producto_id}`}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold"
                      style={{ color: 'var(--gray-900)' }}
                    >
                      {item.pdv_nombre}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: 'var(--gray-600)' }}>
                      {item.producto_nombre}
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-[13px] font-bold"
                    style={{ color: 'var(--gray-900)' }}
                  >
                    {item.pct_stock.toFixed(1)}%
                  </p>
                </div>

                <div className="mt-2.5">
                  <StockBar value={item.pct_stock} />
                </div>

                <div className="mt-2 flex justify-between text-[11px]" style={{ color: 'var(--gray-600)' }}>
                  <span>Actual: {item.stock_actual}</span>
                  <span>Objetivo: {item.cantidad_objetivo}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
