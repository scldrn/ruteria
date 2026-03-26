'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getBusinessDate, getBusinessDayUtcRange } from '@/lib/dates'

export type CierreDiaData = {
  visitasCompletadas: number
  totalCobradoEfectivo: number
  totalCobradoBancos: number
  totalGastos: number
  efectivoNetoEntregar: number
}

export function useCierreDia() {
  const supabase = createClient()
  const today = getBusinessDate()

  return useQuery({
    queryKey: ['cierre_dia', today],
    queryFn: async (): Promise<CierreDiaData> => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Usuario no autenticado')

      const { start, end } = getBusinessDayUtcRange()

      // 1. Obtener visitas completadas de hoy para esta colaboradora
      const { data: visitas, error: visitasErr } = await supabase
        .from('visitas')
        .select(`
          id,
          cobros(monto, forma_pago)
        `)
        .eq('colaboradora_id', user.id)
        .eq('estado', 'completada')
        .gte('created_at', start)
        .lt('created_at', end)

      if (visitasErr) throw new Error(visitasErr.message)

      let totalCobradoEfectivo = 0
      let totalCobradoBancos = 0

      // Sumar cobros
      ;(visitas || []).forEach(v => {
        const cobro = Array.isArray(v.cobros) ? v.cobros[0] : v.cobros
        if (cobro) {
          const monto = Number(cobro.monto)
          if (cobro.forma_pago === 'efectivo') {
            totalCobradoEfectivo += monto
          } else {
            totalCobradoBancos += monto
          }
        }
      })

      // 2. Obtener gastos de hoy
      const { data: gastos, error: gastosErr } = await supabase
        .from('gastos_operativos')
        .select('monto')
        .eq('colaboradora_id', user.id)
        .eq('fecha', today)

      if (gastosErr) throw new Error(gastosErr.message)

      let totalGastos = 0
      ;(gastos || []).forEach(g => {
        totalGastos += Number(g.monto)
      })

      // 3. Calcular neto en efectivo
      const efectivoNetoEntregar = totalCobradoEfectivo - totalGastos

      return {
        visitasCompletadas: visitas?.length || 0,
        totalCobradoEfectivo,
        totalCobradoBancos,
        totalGastos,
        efectivoNetoEntregar,
      }
    },
  })
}
