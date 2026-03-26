'use client'

import { FileBarChart2, PackageSearch } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { UserRol } from '@/lib/validations/usuarios'
import { RankingVitrinas } from './RankingVitrinas'
import { ReporteIncidenciasGarantias } from './ReporteIncidenciasGarantias'
import { ReporteInventario } from './ReporteInventario'
import { ReporteVentas } from './ReporteVentas'
import { ReporteVisitas } from './ReporteVisitas'

export function ReportesClient({ rol }: { rol: UserRol }) {
  const esCompras = rol === 'compras'

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--gray-600)' }}
          >
            Centro de Reportes
          </p>
          <h1
            className="mt-1 text-[26px] font-bold"
            style={{
              color: 'var(--gray-900)',
              fontFamily: 'var(--font-jakarta, var(--font-geist-sans))',
              letterSpacing: '-0.02em',
            }}
          >
            Consultas y exportaciones
          </h1>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium"
          style={{
            borderColor: 'var(--gray-200)',
            background: 'white',
            color: 'var(--gray-600)',
          }}
        >
          {esCompras ? <PackageSearch size={14} /> : <FileBarChart2 size={14} />}
          {esCompras ? 'Vista de abastecimiento' : 'Operación multiárea'}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={esCompras ? 'inventario' : 'ventas'} className="space-y-4">
        <TabsList
          className="h-auto w-full justify-start gap-1 p-1.5"
          style={{
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: '0.75rem',
          }}
        >
          {!esCompras && (
            <>
              <TabsTrigger value="ventas" className="rounded-lg px-4 py-2 text-[13px]">
                Ventas
              </TabsTrigger>
              <TabsTrigger value="ranking" className="rounded-lg px-4 py-2 text-[13px]">
                Ranking vitrinas
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="inventario" className="rounded-lg px-4 py-2 text-[13px]">
            Inventario
          </TabsTrigger>
          {!esCompras && (
            <>
              <TabsTrigger value="visitas" className="rounded-lg px-4 py-2 text-[13px]">
                Visitas
              </TabsTrigger>
              <TabsTrigger value="incidencias" className="rounded-lg px-4 py-2 text-[13px]">
                Incidencias / Garantías
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {!esCompras && (
          <TabsContent value="ventas">
            <ReporteVentas />
          </TabsContent>
        )}

        {!esCompras && (
          <TabsContent value="ranking">
            <RankingVitrinas />
          </TabsContent>
        )}

        <TabsContent value="inventario">
          <ReporteInventario />
        </TabsContent>

        {!esCompras && (
          <TabsContent value="visitas">
            <ReporteVisitas />
          </TabsContent>
        )}

        {!esCompras && (
          <TabsContent value="incidencias">
            <ReporteIncidenciasGarantias />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
