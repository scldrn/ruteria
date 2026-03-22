import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  // Guard: fallar rápido si no hay service role key
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const hoy = new Date()
  const diaActual = DIAS_SEMANA[hoy.getDay()] // 'lunes', 'martes', etc.
  const fechaHoy = hoy.toISOString().split('T')[0] // 'YYYY-MM-DD'

  // 1. Rutas activas que tienen programado el día actual
  const { data: rutas, error: rutasError } = await supabase
    .from('rutas')
    .select('id, colaboradora_id, rutas_pdv(pdv_id, orden_visita, puntos_de_venta(id, activo))')
    .eq('estado', 'activa')
    .contains('dias_visita', [diaActual])

  if (rutasError) {
    console.error('Error fetching rutas:', rutasError.message)
    return new Response(JSON.stringify({ error: rutasError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let creadas = 0
  let omitidas = 0

  for (const ruta of rutas ?? []) {
    const pdvsActivos = (ruta.rutas_pdv ?? []).filter(
      (rp: any) => rp.puntos_de_venta?.activo === true
    )

    for (const rp of pdvsActivos) {
      const pdvId = rp.pdv_id

      // 2. Vitrina activa asignada a este PDV
      const { data: vitrina } = await supabase
        .from('vitrinas')
        .select('id')
        .eq('pdv_id', pdvId)
        .eq('estado', 'activa')
        .maybeSingle()

      if (!vitrina) continue // PDV sin vitrina activa — saltar

      // 3. Idempotencia: ya existe planificada para hoy con esta combinación?
      const { data: existente } = await supabase
        .from('visitas')
        .select('id')
        .eq('pdv_id', pdvId)
        .eq('vitrina_id', vitrina.id)
        .eq('colaboradora_id', ruta.colaboradora_id)
        .eq('estado', 'planificada')
        .gte('created_at', `${fechaHoy}T00:00:00.000Z`)
        .lt('created_at', `${fechaHoy}T23:59:59.999Z`)
        .maybeSingle()

      if (existente) {
        omitidas++
        continue
      }

      // 4. Insertar visita planificada
      const { error: insertError } = await supabase.from('visitas').insert({
        ruta_id: ruta.id,
        pdv_id: pdvId,
        vitrina_id: vitrina.id,
        colaboradora_id: ruta.colaboradora_id,
        estado: 'planificada',
      })

      if (insertError) {
        console.error(`Error inserting visita for pdv ${pdvId}:`, insertError.message)
      } else {
        creadas++
      }
    }
  }

  console.log(`Visitas generadas: ${creadas}, omitidas (ya existían): ${omitidas}`)
  return new Response(JSON.stringify({ creadas, omitidas }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
