'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getBusinessDate } from '@/lib/dates'

export type GastoOperativo = {
  id: string
  fecha: string
  concepto: string
  monto: number
  comprobante_url: string | null
  notas: string | null
  created_at: string
}

export function useGastos() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const today = getBusinessDate()

  const query = useQuery({
    queryKey: ['gastos_operativos', today],
    queryFn: async (): Promise<GastoOperativo[]> => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw new Error(userErr.message)
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('gastos_operativos')
        .select('*')
        .eq('colaboradora_id', user.id)
        .eq('fecha', today)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as GastoOperativo[]
    },
  })

  const agregarGasto = useMutation({
    mutationFn: async (nuevoGasto: {
      concepto: string
      monto: number
      notas?: string
    }) => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) throw new Error('Usuario no autenticado')

      const { data, error } = await supabase
        .from('gastos_operativos')
        .insert({
          colaboradora_id: user.id,
          fecha: today,
          concepto: nuevoGasto.concepto,
          monto: nuevoGasto.monto,
          notas: nuevoGasto.notas || null,
        })
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      return data as GastoOperativo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos_operativos', today] })
      queryClient.invalidateQueries({ queryKey: ['cierre_dia'] })
    },
  })

  return {
    ...query,
    agregarGasto,
  }
}
