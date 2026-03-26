'use client'

import { Wallet, CheckCircle, Receipt, Banknote, Landmark } from 'lucide-react'
import { useCierreDia } from '@/lib/hooks/useCierreDia'
import { ConnectionStatusBar } from '@/components/campo/ConnectionStatusBar'
import { Skeleton } from '@/components/ui/skeleton'

export default function CierreDiaPage() {
  const { data: cierre, isLoading, error } = useCierreDia()

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto bg-gray-50 min-h-screen">
        <ConnectionStatusBar />
        <div className="px-5 py-5 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        <ConnectionStatusBar />
        <p className="text-red-500 text-sm">Error cargando el cierre: {error.message}</p>
      </div>
    )
  }

  if (!cierre) return null

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-5 pt-5 pb-5 shrink-0">
        <ConnectionStatusBar />

        <div className="mt-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wallet size={13} className="text-blue-600" />
              <span className="text-[12px] font-semibold text-blue-600">
                Resumen Diario
              </span>
            </div>
            <h1 className="text-[22px] font-bold leading-tight text-gray-900 tracking-tight">
              Cierre de Día
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-bold leading-none text-gray-900">
              {cierre.visitasCompletadas}
            </p>
            <p className="text-[11px] mt-1 text-gray-500">
              visitas cerradas
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Arqueo de Caja (Efectivo)</span>
          <h2 className={`text-4xl font-bold ${cierre.efectivoNetoEntregar < 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${cierre.efectivoNetoEntregar.toLocaleString('es-CO')}
          </h2>
          <p className="text-sm text-gray-500">Efectivo neto a entregar en base</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Detalle de Ingresos</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Banknote size={16} />
              <span className="text-sm">Cobros en Efectivo</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              ${cierre.totalCobradoEfectivo.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Landmark size={16} />
              <span className="text-sm">Cobros Transferencia/QR</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              ${cierre.totalCobradoBancos.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Detalle de Descuentos</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Receipt size={16} className="text-red-500" />
              <span className="text-sm">Gastos Operativos (Viáticos)</span>
            </div>
            <span className="text-sm font-semibold text-red-600">
              - ${cierre.totalGastos.toLocaleString('es-CO')}
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <div className="text-center space-y-2">
             <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
             <p className="text-sm text-gray-500 max-w-[250px]">
               Revisa detenidamente los billetes antes de entregar la relación final en la sede.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
