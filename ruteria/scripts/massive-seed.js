const { createClient } = require('@supabase/supabase-js')
const { faker } = require('@faker-js/faker')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  console.log('🚀 Starting massive seed...')

  // 1. Create Users
  const users = [
    { email: 'massive_admin@erp.local', password: 'MassiveAdmin123!', rol: 'admin', nombre: 'Massive Admin' },
    { email: 'massive_colab@erp.local', password: 'MassiveColab123!', rol: 'colaboradora', nombre: 'Colaboradora Pro' }
  ]

  const userIds = {}

  for (const u of users) {
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      app_metadata: { rol: u.rol }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: { users } } = await supabase.auth.admin.listUsers()
        userIds[u.email] = users.find(x => x.email === u.email).id
      } else {
        console.error(`Error creating auth user ${u.email}:`, authError.message)
        continue
      }
    } else {
      userIds[u.email] = user.id
    }

    const { error: publicError } = await supabase.from('usuarios').upsert({
      id: userIds[u.email],
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: true
    })

    if (publicError) console.error(`Error syncing public user ${u.email}:`, publicError.message)
  }

  const adminId = userIds['massive_admin@erp.local']
  const colabId = userIds['massive_colab@erp.local']

  // 2. Categories & Products
  console.log('📦 Seeding categories and products...')
  const categories = []
  for (let i = 0; i < 10; i++) {
    categories.push({ nombre: faker.commerce.department(), created_by: adminId })
  }
  const { data: catData, error: catError } = await supabase.from('categorias').insert(categories).select()
  if (catError) throw catError

  const products = []
  for (let i = 0; i < 100; i++) {
    products.push({
      codigo: `P-${faker.string.alphanumeric(6).toUpperCase()}`,
      nombre: faker.commerce.productName(),
      categoria_id: faker.helpers.arrayElement(catData).id,
      costo_compra: faker.number.float({ min: 5000, max: 50000, multipleOf: 100 }),
      precio_venta_comercio: faker.number.float({ min: 60000, max: 150000, multipleOf: 100 }),
      created_by: adminId
    })
  }
  const { data: prodData, error: prodError } = await supabase.from('productos').insert(products).select()
  if (prodError) throw prodError

  // 3. Zones & PDVs
  console.log('📍 Seeding zones and points of sale...')
  const zones = []
  for (let i = 0; i < 5; i++) {
    zones.push({ nombre: faker.location.city(), ciudad: 'Bogotá', region: 'Centro', created_by: adminId })
  }
  const { data: zoneData, error: zoneError } = await supabase.from('zonas').insert(zones).select()
  if (zoneError) throw zoneError

  const pdvs = []
  for (let i = 0; i < 200; i++) {
    pdvs.push({
      codigo: `PDV-${faker.string.alphanumeric(5).toUpperCase()}`,
      nombre_comercial: faker.company.name(),
      direccion: faker.location.streetAddress(),
      zona_id: faker.helpers.arrayElement(zoneData).id,
      contacto_nombre: faker.person.fullName(),
      contacto_tel: faker.phone.number(),
      forma_pago_preferida: faker.helpers.arrayElement(['efectivo', 'transferencia', 'nequi', 'daviplata']),
      created_by: adminId
    })
  }
  const { data: pdvData, error: pdvError } = await supabase.from('puntos_de_venta').insert(pdvs).select()
  if (pdvError) throw pdvError

  // 4. Vitrinas & Surtido
  console.log('🖼️ Seeding vitrinas and stock objectives...')
  const vitrinas = pdvData.map(p => ({
    codigo: `V-${p.codigo}`,
    pdv_id: p.id,
    tipo: 'Estandar',
    created_by: adminId
  }))
  const { data: vitData, error: vitError } = await supabase.from('vitrinas').insert(vitrinas).select()
  if (vitError) throw vitError

  const surtidos = []
  vitData.forEach(v => {
    const selectedProds = faker.helpers.arrayElements(prodData, { min: 15, max: 25 })
    selectedProds.forEach(p => {
      surtidos.push({
        vitrina_id: v.id,
        producto_id: p.id,
        cantidad_objetivo: faker.number.int({ min: 5, max: 15 }),
        created_by: adminId
      })
    })
  })
  const { error: surError } = await supabase.from('surtido_estandar').insert(surtidos)
  if (surError) throw surError

  // 5. Initial Inventory & Colab Load
  console.log('🔋 Initializing inventory (Central)...')
  const compras = prodData.map(p => ({
    tipo: 'compra',
    direccion: 'entrada',
    origen_tipo: 'central',
    producto_id: p.id,
    cantidad: 10000,
    usuario_id: adminId,
    notas: 'Carga inicial masiva'
  }))
  
  for (let i = 0; i < compras.length; i += 50) {
    const { error } = await supabase.from('movimientos_inventario').insert(compras.slice(i, i + 50))
    if (error) throw error
  }

  console.log('🔋 Charging collaborator inventory...')
  const cargas = prodData.map(p => ({
    tipo: 'carga_colaboradora',
    direccion: 'salida',
    origen_tipo: 'central',
    destino_tipo: 'colaboradora',
    destino_id: colabId,
    producto_id: p.id,
    cantidad: 5000,
    usuario_id: adminId,
    notas: 'Carga inicial colaboradora'
  }))

  for (let i = 0; i < cargas.length; i += 50) {
    const { error } = await supabase.from('movimientos_inventario').insert(cargas.slice(i, i + 50))
    if (error) throw error
  }

  const initialMovements = [] // For subsequent movements (visits)

  // 6. Routes
  console.log('🛣️ Creating routes...')
  const routes = []
  for (let i = 0; i < 5; i++) {
    routes.push({
      codigo: `R-${i + 1}`,
      nombre: `Ruta Massive ${i + 1}`,
      colaboradora_id: colabId,
      zona_id: zoneData[i].id,
      dias_visita: ['Lunes', 'Miércoles', 'Viernes'],
      created_by: adminId
    })
  }
  const { data: routeData, error: routeError } = await supabase.from('rutas').insert(routes).select()
  if (routeError) throw routeError

  const routesPdvs = []
  routeData.forEach(r => {
    const zonePdvs = pdvData.filter(p => p.zona_id === r.zona_id)
    zonePdvs.forEach((p, idx) => {
      routesPdvs.push({
        ruta_id: r.id,
        pdv_id: p.id,
        orden_visita: idx + 1,
        created_by: adminId
      })
    })
  })
  const { error: rpError } = await supabase.from('rutas_pdv').insert(routesPdvs)
  if (rpError) throw rpError

  // 7. Historical Visits (Last 30 days)
  console.log('📅 Simulating 30 days of visits (this may take a while)...')
  const { data: formsPago } = await supabase.from('formas_pago').select()
  const formaPagoId = formsPago[0].id

  const visitChunks = []
  for (let d = 30; d >= 1; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    
    for (const r of routeData) {
      const rPdvs = routesPdvs.filter(rp => rp.ruta_id === r.id)
      for (const rp of rPdvs) {
        const vit = vitData.find(v => v.pdv_id === rp.pdv_id)
        const vSurtido = surtidos.filter(s => s.vitrina_id === vit.id)
        
        const startTime = new Date(date)
        startTime.setHours(8 + faker.number.int({ min: 0, max: 8 }), faker.number.int({ min: 0, max: 59 }))
        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + faker.number.int({ min: 15, max: 45 }))

        // Create visit
        const { data: visit, error: vErr } = await supabase.from('visitas').insert({
          ruta_id: r.id,
          pdv_id: rp.pdv_id,
          vitrina_id: vit.id,
          colaboradora_id: colabId,
          fecha_hora_inicio: startTime.toISOString(),
          fecha_hora_fin: endTime.toISOString(),
          estado: 'completada',
          created_by: colabId
        }).select().single()

        if (vErr) continue

        // Create details
        const details = []
        const reposiciones = []
        let totalMonto = 0

        for (const s of vSurtido) {
          const prod = prodData.find(p => p.id === s.producto_id)
          const invAnterior = faker.number.int({ min: 2, max: s.cantidad_objetivo })
          const invActual = faker.number.int({ min: 0, max: invAnterior })
          const vendidas = invAnterior - invActual
          const repuestas = s.cantidad_objetivo - invActual
          
          details.push({
            visita_id: visit.id,
            producto_id: s.producto_id,
            inv_anterior: invAnterior,
            inv_actual: invActual,
            unidades_vendidas: vendidas,
            unidades_repuestas: repuestas,
            precio_unitario: prod.precio_venta_comercio,
            created_by: colabId
          })

          totalMonto += vendidas * prod.precio_venta_comercio

          if (vendidas > 0) {
            initialMovements.push({
              tipo: 'venta',
              direccion: 'salida',
              origen_tipo: 'vitrina',
              origen_id: vit.id,
              producto_id: s.producto_id,
              cantidad: vendidas,
              referencia_tipo: 'visita',
              referencia_id: visit.id,
              usuario_id: colabId
            })
          }
          if (repuestas > 0) {
            initialMovements.push({
              tipo: 'reposicion',
              direccion: 'salida',
              origen_tipo: 'colaboradora',
              origen_id: colabId,
              destino_tipo: 'vitrina',
              destino_id: vit.id,
              producto_id: s.producto_id,
              cantidad: repuestas,
              referencia_tipo: 'visita',
              referencia_id: visit.id,
              usuario_id: colabId
            })
          }
        }

        await supabase.from('detalle_visita').insert(details)
        await supabase.from('cobros').insert({
          visita_id: visit.id,
          monto: totalMonto,
          forma_pago_id: formaPagoId,
          estado: 'registrado',
          created_by: colabId
        })
        
        // Manual movements insert in chunks if needed
        if (initialMovements.length > 500) {
          await supabase.from('movimientos_inventario').insert(initialMovements.splice(0, 500))
        }
      }
    }
  }

  // Final flush of movements
  if (initialMovements.length > 0) {
    await supabase.from('movimientos_inventario').insert(initialMovements)
  }

  console.log('✅ Massive seed completed successfully!')
}

seed().catch(err => {
  console.error('💥 Seed failed:', err)
  process.exit(1)
})
