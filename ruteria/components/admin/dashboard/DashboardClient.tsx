'use client'

import { Signal, WifiOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { KpiCards } from './KpiCards'
import { TabHoy } from './TabHoy'
import { TabTendencias } from './TabTendencias'
import { TabVitrinas } from './TabVitrinas'

export function DashboardClient() {
  const { kpis, incidenciasRecientes, ventas30dias, ventasPorRuta, topVitrinas, stockBajo, realtimeHealthy } =
    useDashboard()
  const isLoadingVitrinas = topVitrinas.isLoading || stockBajo.isLoading
  const isLoadingTendencias = ventas30dias.isLoading || ventasPorRuta.isLoading

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--gray-600)' }}
          >
            Dashboard Ejecutivo
          </p>
          <h1
            className="mt-1 text-[26px] font-bold"
            style={{
              color: 'var(--gray-900)',
              fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
              letterSpacing: '-0.02em',
            }}
          >
            Operación comercial
          </h1>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium"
          style={
            realtimeHealthy
              ? { borderColor: 'oklch(0.850 0.060 145)', background: 'oklch(0.958 0.040 145)', color: 'oklch(0.420 0.140 145)' }
              : { borderColor: 'oklch(0.928 0.08 75)', background: 'oklch(0.975 0.022 85)', color: 'oklch(0.520 0.18 65)' }
          }
        >
          {realtimeHealthy ? <Signal size={14} /> : <WifiOff size={14} />}
          {realtimeHealthy ? 'En vivo' : 'Fallback cada 30s'}
        </div>
      </div>

      {/* KPI cards */}
      <KpiCards data={kpis.data} isLoading={kpis.isLoading} />

      {/* Tabs */}
      <Tabs defaultValue="hoy" className="space-y-4">
        <TabsList
          className="h-auto w-full justify-start gap-1 p-1.5"
          style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: '0.75rem',
          }}
        >
          <TabsTrigger value="hoy" className="rounded-lg px-4 py-2 text-[13px]">
            Hoy
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="rounded-lg px-4 py-2 text-[13px]">
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="vitrinas" className="rounded-lg px-4 py-2 text-[13px]">
            Vitrinas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hoy">
          <TabHoy
            kpis={kpis.data}
            incidenciasRecientes={incidenciasRecientes.data}
            isLoading={kpis.isLoading || incidenciasRecientes.isLoading}
          />
        </TabsContent>

        <TabsContent value="tendencias">
          <TabTendencias
            ventas30dias={ventas30dias.data}
            ventasPorRuta={ventasPorRuta.data}
            isLoading={isLoadingTendencias}
          />
        </TabsContent>

        <TabsContent value="vitrinas">
          <TabVitrinas
            topVitrinas={topVitrinas.data}
            stockBajo={stockBajo.data}
            isLoading={isLoadingVitrinas}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
