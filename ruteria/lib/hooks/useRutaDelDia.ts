import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getBusinessDate, getBusinessDayUtcRange, getBusinessWeekday } from '@/lib/dates'
import { applyVisitDraftToRoute, listVisitDrafts } from '@/lib/offline/drafts'
import { isProbablyOfflineError } from '@/lib/offline/network'
import { getRouteSnapshot, saveRouteSnapshot } from '@/lib/offline/snapshots'

export type VisitaDelDia = {
  id: string
  estado: 'planificada' | 'en_ejecucion' | 'completada' | 'no_realizada'
  fecha_hora_inicio: string | null
  fecha_hora_fin: string | null
  monto_calculado: number
  motivo_no_realizada: string | null
  pdv: { nombre_comercial: string; direccion: string | null }
  ruta: { nombre: string }
  orden_visita: number
  syncStatus?: 'pending' | 'error'
}

type RutaDelDiaResult = {
  visitas: VisitaDelDia[]
  source: 'remote' | 'snapshot'
  lastSyncedAt: string | null
}

const SELECT = `
  id,
  estado,
  fecha_hora_inicio,
  fecha_hora_fin,
  monto_calculado,
  motivo_no_realizada,
  pdv_id,
  puntos_de_venta(nombre_comercial, direccion),
  rutas!inner(nombre, rutas_pdv(orden_visita, pdv_id))
` as const

type RutasPdvEntry = { orden_visita: number; pdv_id: string }
type RutasEntry = { nombre: string; rutas_pdv: RutasPdvEntry[] | null }

type RawVisita = {
  id: string
  estado: string
  fecha_hora_inicio: string | null
  fecha_hora_fin: string | null
  monto_calculado: number
  motivo_no_realizada: string | null
  pdv_id: string
  puntos_de_venta: { nombre_comercial: string; direccion: string | null } | { nombre_comercial: string; direccion: string | null }[] | null
  rutas: RutasEntry | RutasEntry[] | null
}

type RutaProgramada = {
  id: string
  nombre: string
  colaboradora_id: string | null
  rutas_pdv: Array<{ pdv_id: string; orden_visita: number }> | null
}

type PdvActivo = {
  id: string
  nombre_comercial: string
  direccion: string | null
  activo: boolean
}

type VitrinaActiva = {
  id: string
  pdv_id: string
}

// PostgREST may return a single object or an array for joined relations
function firstOrNull<T>(value: T | T[] | null): T | null {
  if (value === null || value === undefined) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapRow(v: RawVisita): VisitaDelDia {
  const pdvRaw = v.puntos_de_venta
  const pdv: VisitaDelDia['pdv'] = Array.isArray(pdvRaw)
    ? (pdvRaw[0] ?? { nombre_comercial: '', direccion: null })
    : (pdvRaw ?? { nombre_comercial: '', direccion: null })

  const rutasData = firstOrNull<RutasEntry>(v.rutas as RutasEntry | RutasEntry[] | null)
  const ordenVisita = rutasData?.rutas_pdv?.find((rp) => rp.pdv_id === v.pdv_id)?.orden_visita ?? 0

  return {
    id: v.id,
    estado: v.estado as VisitaDelDia['estado'],
    fecha_hora_inicio: v.fecha_hora_inicio ?? null,
    fecha_hora_fin: v.fecha_hora_fin ?? null,
    monto_calculado: v.monto_calculado ?? 0,
    motivo_no_realizada: v.motivo_no_realizada ?? null,
    pdv,
    ruta: { nombre: rutasData?.nombre ?? '' },
    orden_visita: ordenVisita,
  }
}

async function ensureTodayVisits(userId: string, start: string, end: string) {
  const supabase = createClient()
  const weekday = getBusinessWeekday()

  const { data: rutas, error: rutasError } = await supabase
    .from('rutas')
    .select('id, nombre, colaboradora_id, rutas_pdv(pdv_id, orden_visita)')
    .eq('estado', 'activa')
    .eq('colaboradora_id', userId)
    .contains('dias_visita', [weekday])

  if (rutasError) throw new Error(rutasError.message)
  if (!rutas || rutas.length === 0) return

  const programmedRoutes = rutas as RutaProgramada[]
  const pdvIds = Array.from(
    new Set(
      programmedRoutes.flatMap((ruta) => (ruta.rutas_pdv ?? []).map((rp) => rp.pdv_id))
    )
  )

  if (pdvIds.length === 0) return

  const [{ data: pdvs, error: pdvsError }, { data: vitrinas, error: vitrinasError }, { data: existing, error: existingError }] =
    await Promise.all([
      supabase
        .from('puntos_de_venta')
        .select('id, nombre_comercial, direccion, activo')
        .in('id', pdvIds)
        .eq('activo', true),
      supabase
        .from('vitrinas')
        .select('id, pdv_id')
        .in('pdv_id', pdvIds)
        .eq('estado', 'activa'),
      supabase
        .from('visitas')
        .select('pdv_id')
        .eq('colaboradora_id', userId)
        .gte('created_at', start)
        .lt('created_at', end),
    ])

  if (pdvsError) throw new Error(pdvsError.message)
  if (vitrinasError) throw new Error(vitrinasError.message)
  if (existingError) throw new Error(existingError.message)

  const activePdvs = new Map((pdvs as PdvActivo[] | null ?? []).map((pdv) => [pdv.id, pdv]))
  const activeVitrinasByPdv = new Map((vitrinas as VitrinaActiva[] | null ?? []).map((vitrina) => [vitrina.pdv_id, vitrina]))
  const existingPdvIds = new Set((existing ?? []).map((visita) => visita.pdv_id))

  const missingVisits = programmedRoutes.flatMap((ruta) =>
    (ruta.rutas_pdv ?? [])
      .filter((rp) => activePdvs.has(rp.pdv_id) && activeVitrinasByPdv.has(rp.pdv_id) && !existingPdvIds.has(rp.pdv_id))
      .map((rp) => ({
        ruta_id: ruta.id,
        pdv_id: rp.pdv_id,
        vitrina_id: activeVitrinasByPdv.get(rp.pdv_id)!.id,
        colaboradora_id: userId,
        estado: 'planificada' as const,
      }))
  )

  if (missingVisits.length === 0) return

  const { error: insertError } = await supabase.from('visitas').insert(missingVisits)
  if (insertError) throw new Error(insertError.message)
}

export function useRutaDelDia() {
  const supabase = createClient()
  const todayKey = getBusinessDate()

  const query = useQuery({
    queryKey: ['ruta-del-dia'],
    queryFn: async (): Promise<RutaDelDiaResult> => {
      try {
        const { start, end } = getBusinessDayUtcRange()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw new Error(userError.message)
        if (!user) throw new Error('Debes iniciar sesión para ver tu ruta del día')

        await ensureTodayVisits(user.id, start, end)

        const [planificadas, activas, noRealizadas] = await Promise.all([
          supabase
            .from('visitas')
            .select(SELECT)
            .eq('estado', 'planificada')
            .gte('created_at', start)
            .lt('created_at', end),
          supabase
            .from('visitas')
            .select(SELECT)
            .in('estado', ['en_ejecucion', 'completada'])
            .not('fecha_hora_inicio', 'is', null)
            .gte('fecha_hora_inicio', start)
            .lt('fecha_hora_inicio', end),
          supabase
            .from('visitas')
            .select(SELECT)
            .eq('estado', 'no_realizada')
            .gte('created_at', start)
            .lt('created_at', end),
        ])

        if (planificadas.error) throw new Error(planificadas.error.message)
        if (activas.error) throw new Error(activas.error.message)
        if (noRealizadas.error) throw new Error(noRealizadas.error.message)

        const deduped = new Map<string, VisitaDelDia>()

        for (const visita of [
          ...(planificadas.data ?? []),
          ...(activas.data ?? []),
          ...(noRealizadas.data ?? []),
        ]) {
          const mapped = mapRow(visita as unknown as RawVisita)
          deduped.set(mapped.id, mapped)
        }

        const drafts = await listVisitDrafts()
        const draftMap = new Map(drafts.map((draft) => [draft.visitId, draft]))
        const visitas = Array.from(deduped.values())
          .map((visita) => applyVisitDraftToRoute(visita, draftMap.get(visita.id) ?? null))
          .sort((a, b) => a.orden_visita - b.orden_visita)
        await saveRouteSnapshot(todayKey, visitas)

        return {
          visitas,
          source: 'remote',
          lastSyncedAt: new Date().toISOString(),
        }
      } catch (error) {
        if (!isProbablyOfflineError(error)) {
          throw error
        }

        const snapshot = await getRouteSnapshot(todayKey)
        if (!snapshot) {
          throw error
        }

        const drafts = await listVisitDrafts()
        const draftMap = new Map(drafts.map((draft) => [draft.visitId, draft]))

        return {
          visitas: snapshot.visitas.map((visita) =>
            applyVisitDraftToRoute(visita, draftMap.get(visita.id) ?? null)
          ),
          source: 'snapshot',
          lastSyncedAt: snapshot.savedAt,
        }
      }
    },
  })

  return {
    ...query,
    data: query.data?.visitas ?? [],
    isOfflineFallback: query.data?.source === 'snapshot',
    lastSyncedAt: query.data?.lastSyncedAt ?? null,
  }
}
