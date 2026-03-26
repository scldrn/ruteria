'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { VentasDia, VentasRuta } from '@/lib/hooks/useDashboard'

interface Props {
  ventas30dias: VentasDia[] | undefined
  ventasPorRuta: VentasRuta[] | undefined
  isLoading: boolean
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value)
}

function formatFullCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatShortDate(value: string) {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1))
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="flex h-[280px] items-center justify-center rounded-xl border border-dashed text-[13px]"
      style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-600)', background: 'var(--gray-100)' }}
    >
      {message}
    </div>
  )
}

export function TabTendencias({ ventas30dias, ventasPorRuta, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[360px] w-full rounded-2xl" />
        <Skeleton className="h-[360px] w-full rounded-2xl" />
      </div>
    )
  }

  const total30Dias = (ventas30dias ?? []).reduce((sum, item) => sum + item.total_ventas, 0)
  const maxDia = (ventas30dias ?? []).reduce((max, item) => Math.max(max, item.total_ventas), 0)
  const mejorRuta = (ventasPorRuta ?? [])[0]

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Ventas 30 días */}
      <section
        className="rounded-2xl bg-white p-6"
        style={{ border: '1px solid var(--gray-200)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Ventas 30 Días
            </p>
            <h3
              className="mt-1 text-[20px] font-bold"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                letterSpacing: '-0.02em',
              }}
            >
              Ritmo reciente de la operación
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: 'var(--gray-600)' }}>Acumulado</p>
            <p
              className="text-[18px] font-bold"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
            >
              {formatFullCOP(total30Dias)}
            </p>
          </div>
        </div>

        <div className="mt-6 h-[280px]">
          {(ventas30dias?.length ?? 0) === 0 ? (
            <EmptyState message="Todavía no hay cierres suficientes para graficar la tendencia." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ventas30dias} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ventasTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0866FF" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0866FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E4E6EB" strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatShortDate}
                  tick={{ fill: '#65676B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => formatCOP(Number(value))}
                  tick={{ fill: '#65676B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={84}
                />
                <Tooltip
                  formatter={(value) => [formatFullCOP(Number(value)), 'Ventas']}
                  labelFormatter={(label) => formatShortDate(String(label))}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: '#E4E6EB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_ventas"
                  stroke="#0866FF"
                  strokeWidth={2.5}
                  fill="url(#ventasTrendFill)"
                  dot={{ r: 0 }}
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#0866FF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Acumulado
            </p>
            <p
              className="mt-2 text-[20px] font-bold"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
            >
              {formatFullCOP(total30Dias)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Mejor Día
            </p>
            <p
              className="mt-2 text-[20px] font-bold"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
            >
              {formatFullCOP(maxDia)}
            </p>
          </div>
        </div>
      </section>

      {/* Ventas por ruta */}
      <section
        className="rounded-2xl bg-white p-6"
        style={{ border: '1px solid var(--gray-200)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--gray-600)' }}
            >
              Ventas Por Ruta
            </p>
            <h3
              className="mt-1 text-[20px] font-bold"
              style={{
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
                letterSpacing: '-0.02em',
              }}
            >
              Quién está empujando el mes
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[12px]" style={{ color: 'var(--gray-600)' }}>Ruta líder</p>
            <p
              className="text-[16px] font-bold"
              style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
            >
              {mejorRuta?.ruta ?? '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 h-[280px]">
          {(ventasPorRuta?.length ?? 0) === 0 ? (
            <EmptyState message="Aún no hay ventas del mes para comparar entre rutas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorRuta} margin={{ top: 8, right: 8, left: -12, bottom: 16 }}>
                <CartesianGrid vertical={false} stroke="#E4E6EB" strokeDasharray="3 3" />
                <XAxis
                  dataKey="ruta"
                  tick={{ fill: '#65676B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  height={56}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={(value) => formatCOP(Number(value))}
                  tick={{ fill: '#65676B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={84}
                />
                <Tooltip
                  formatter={(value) => [formatFullCOP(Number(value)), 'Ventas']}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload as VentasRuta | undefined
                    return row ? `${row.ruta} · ${row.colaboradora}` : String(label)
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: '#E4E6EB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="total_ventas" radius={[8, 8, 2, 2]}>
                  {(ventasPorRuta ?? []).map((row, index) => (
                    <Cell
                      key={`${row.ruta}-${row.colaboradora}`}
                      fill={index === 0 ? '#0866FF' : index === 1 ? '#34d399' : '#D0D5DD'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div
          className="mt-5 rounded-xl p-4"
          style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--gray-600)' }}
          >
            Lectura líder
          </p>
          <p
            className="mt-2 text-[16px] font-bold"
            style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
          >
            {mejorRuta ? `${mejorRuta.ruta} · ${mejorRuta.colaboradora}` : 'Sin líder todavía'}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--gray-600)' }}>
            {mejorRuta
              ? `${formatFullCOP(mejorRuta.total_ventas)} en ventas acumuladas del mes.`
              : 'Esperando datos del período.'}
          </p>
        </div>
      </section>
    </div>
  )
}
