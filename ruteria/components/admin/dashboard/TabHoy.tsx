'use client'

import { Activity, CircleAlert, Route, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardHoy, IncidenciaReciente } from '@/lib/hooks/useDashboard'

interface Props {
  kpis: DashboardHoy | undefined
  incidenciasRecientes: IncidenciaReciente[] | undefined
  isLoading: boolean
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function progress(realizadas: number, planificadas: number) {
  if (planificadas <= 0) return 0
  return Math.min(100, Math.round((realizadas / planificadas) * 100))
}

function formatDateTime(value: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(value))
}

const LABEL_STYLE: React.CSSProperties = {
  color: '#65676B',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

const VALUE_STYLE: React.CSSProperties = {
  color: '#1C1E21',
  fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
  letterSpacing: '-0.02em',
}

function MetricMini({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div
      style={{
        background: '#F0F2F5',
        border: '1px solid #E4E6EB',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <p style={LABEL_STYLE}>{label}</p>
      <p style={{ ...VALUE_STYLE, fontSize: '22px', fontWeight: 700, marginTop: '8px', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: '#65676B', fontSize: '12px', marginTop: '4px' }}>{helper}</p>
    </div>
  )
}

function InsightCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#F0F2F5',
        border: '1px solid #E4E6EB',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={LABEL_STYLE}>{label}</p>
        <span style={{ color: '#65676B' }}>{icon}</span>
      </div>
      <p style={{ ...VALUE_STYLE, fontSize: '22px', fontWeight: 700, marginTop: '12px', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: '#65676B', fontSize: '12px', marginTop: '4px' }}>{helper}</p>
    </div>
  )
}

export function TabHoy({ kpis, incidenciasRecientes, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Skeleton className="h-[280px] w-full rounded-2xl" />
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </div>
    )
  }

  const visitasRealizadas = kpis?.visitas_realizadas ?? 0
  const visitasPlanificadas = kpis?.visitas_planificadas ?? 0
  const cumplimiento = progress(visitasRealizadas, visitasPlanificadas)
  const incidenciasAbiertas = kpis?.incidencias_abiertas ?? 0

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      {/* Pulso operativo */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4E6EB',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <p style={LABEL_STYLE}>Pulso Operativo</p>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginTop: '10px' }}>
          <h3 style={{ ...VALUE_STYLE, fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
            La jornada va en {cumplimiento}%
          </h3>
          <span
            style={{
              flexShrink: 0,
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: 700,
              background: '#E7F0FF',
              color: '#0866FF',
            }}
          >
            {cumplimiento}%
          </span>
        </div>

        {/* Card de progreso */}
        <div
          style={{
            marginTop: '20px',
            background: '#EBF2FF',
            border: '1px solid #C5D9FF',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
            <div>
              <p style={{ ...LABEL_STYLE, color: '#0866FF' }}>Cumplimiento de visitas</p>
              <p style={{ ...VALUE_STYLE, fontSize: '32px', fontWeight: 700, lineHeight: 1, marginTop: '6px' }}>
                {visitasRealizadas}
                <span style={{ fontSize: '18px', fontWeight: 400, color: '#65676B', marginLeft: '4px' }}>
                  / {visitasPlanificadas}
                </span>
              </p>
            </div>
          </div>
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              background: '#C5D9FF',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '999px',
                background: '#0866FF',
                width: `${cumplimiento}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Mini métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
          <MetricMini label="Recaudo" value={formatCOP(kpis?.cobros_mes ?? 0)} helper="Acumulado del mes" />
          <MetricMini label="Ventas" value={formatCOP(kpis?.ventas_hoy ?? 0)} helper="Estimado hoy" />
          <MetricMini label="Riesgo" value={String(incidenciasAbiertas)} helper="Incidencias abiertas" />
        </div>
      </section>

      {/* Lectura rápida */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4E6EB',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <p style={LABEL_STYLE}>Lectura Rápida</p>

        <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
          <InsightCard
            label="Ejecución"
            value={`${cumplimiento}%`}
            helper="Visitas cumplidas sobre lo planificado."
            icon={<Route size={15} />}
          />
          <InsightCard
            label="Recaudo"
            value={formatCOP(kpis?.cobros_mes ?? 0)}
            helper="Caja registrada acumulada del mes."
            icon={<Wallet size={15} />}
          />
          <InsightCard
            label="Actividad"
            value={String(visitasRealizadas)}
            helper="Visitas cerradas con flujo completo."
            icon={<Activity size={15} />}
          />
          <InsightCard
            label="Alertas"
            value={String(incidenciasAbiertas)}
            helper="Casos sin resolución todavía."
            icon={<CircleAlert size={15} />}
          />
        </div>

        {/* Incidencias recientes */}
        <div
          style={{
            marginTop: '16px',
            background: '#F0F2F5',
            border: '1px solid #E4E6EB',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={LABEL_STYLE}>Incidencias recientes</p>
            <span
              style={{
                borderRadius: '999px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'white',
                border: '1px solid #E4E6EB',
                color: '#65676B',
              }}
            >
              {incidenciasRecientes?.length ?? 0} casos
            </span>
          </div>

          <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
            {(incidenciasRecientes?.length ?? 0) === 0 ? (
              <p
                style={{
                  borderRadius: '12px',
                  border: '1px dashed #E4E6EB',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#65676B',
                  background: 'white',
                  textAlign: 'center',
                }}
              >
                No hay incidencias abiertas.
              </p>
            ) : (
              incidenciasRecientes?.map((inc) => (
                <div
                  key={inc.incidencia_id}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #E4E6EB',
                    padding: '12px 16px',
                    background: 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1C1E21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.pdv_nombre}
                      </p>
                      <p style={{ fontSize: '12px', color: '#65676B', textTransform: 'capitalize' }}>
                        {inc.tipo}
                      </p>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        borderRadius: '999px',
                        padding: '2px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#FFF3CD',
                        color: '#856404',
                      }}
                    >
                      {inc.dias_abierta}d
                    </span>
                  </div>
                  <p style={{ marginTop: '6px', fontSize: '11px', color: '#65676B' }}>
                    {formatDateTime(inc.fecha_apertura)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
