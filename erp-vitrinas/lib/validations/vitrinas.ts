import { z } from 'zod'

export const vitrinaSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(50),
  pdv_id: z.string().uuid('Selecciona un Punto de Venta'),
  tipo: z.string().optional(),
  estado: z.enum(['activa', 'inactiva', 'retirada']).default('activa'),
  notas: z.string().optional(),
})

export type VitrinaFormValues = z.infer<typeof vitrinaSchema>
