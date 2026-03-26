'use client'

import { Package, Search } from 'lucide-react'
import { useState } from 'react'
import { useMiInventario } from '@/lib/hooks/useMiInventario'
import { ConnectionStatusBar } from '@/components/campo/ConnectionStatusBar'
import { Skeleton } from '@/components/ui/skeleton'

export default function MiInventarioPage() {
  const { data: inventario = [], isLoading, error } = useMiInventario()
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = inventario.filter(
    (item) =>
      item.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producto_codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnidades = inventario.reduce((acc, item) => acc + item.cantidad_actual, 0)

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto bg-gray-50 min-h-screen">
        <div className="bg-white px-5 pt-5 pb-5 border-b border-gray-200">
          <ConnectionStatusBar />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="px-4 py-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        <ConnectionStatusBar />
        <p className="text-red-500 text-sm">Error cargando inventario: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-5 pt-5 pb-5 shrink-0">
        <ConnectionStatusBar />

        <div className="mt-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Package size={13} className="text-blue-600" />
              <span className="text-[12px] font-semibold text-blue-600">
                A Bordo
              </span>
            </div>
            <h1 className="text-[22px] font-bold leading-tight text-gray-900 tracking-tight">
              Mi Inventario
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-bold leading-none text-gray-900">
              {totalUnidades}
            </p>
            <p className="text-[11px] mt-1 text-gray-500">
              unidades en total
            </p>
          </div>
        </div>

        <div className="mt-5 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow outline-none"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 px-4 py-5 pb-24 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">No se encontraron productos en tu inventario.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.producto_id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div className="min-w-0 pr-4">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                  {item.producto_codigo} • {item.categoria_nombre}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.producto_nombre}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xl font-bold text-blue-600">{item.cantidad_actual}</p>
                <p className="text-[10px] text-gray-500 font-medium">unidades</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
