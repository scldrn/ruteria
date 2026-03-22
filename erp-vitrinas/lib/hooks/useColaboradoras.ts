import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type Colaboradora = {
  id: string
  nombre: string
  nombreCompleto: string
}

export function useColaboradoras() {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['colaboradoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .eq('rol', 'colaboradora')
        .eq('activo', true)
        .order('nombre')
      if (error) throw new Error(error.message)
      return (data ?? []).map((u) => ({
        id: u.id,
        nombre: u.nombre,
        nombreCompleto: u.nombre,
      })) as Colaboradora[]
    },
  })
}
