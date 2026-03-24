# Spec: Fase 2 — Gestión y Analítica

**Fecha:** 2026-03-24
**Estado:** Aprobado
**HUs:** HU-32, HU-33, HU-34, HU-35, HU-36, HU-37
**Sprints:** Sprint 7 (Garantías + Proveedores/Compras) · Sprint 8 (Dashboard + Reportes)

---

## Contexto

Fase 1 completada (Sprints 1–6, mergeados a `main`). El sistema cubre el flujo operativo de campo completo con soporte offline. Fase 2 agrega la capa de gestión (garantías, proveedores, compras) y la capa analítica (dashboard en tiempo real, reportes exportables).

Las tablas `garantias`, `compras`, `detalle_compra` y `proveedores` ya existen en el schema de Fase 0. Esta fase añade RLS, RPCs, vistas SQL, UI y tests sobre esa base.

### Nombres de columna confirmados contra el schema

| Tabla | Columna spec → columna real |
|---|---|
| `garantias` | `visita_recepcion_id` (FK a `visitas.id`) — no tiene `vitrina_id` |
| `garantias` | estado: `'abierta' / 'en_proceso' / 'resuelta' / 'cerrada'` |
| `garantias` | `resolucion TEXT` sin CHECK constraint — validar en el RPC |
| `compras` | estado default `'pendiente'` (enum: `pendiente / confirmada / recibida / cancelada`) |
| `detalle_compra` | `cantidad_recibida` (columna existente; `cantidad_pedida` = estimada) |
| `visitas` | sin columna `fecha`; usar `fecha_hora_inicio TIMESTAMPTZ` |
| `cobros` | columna `fecha TIMESTAMPTZ DEFAULT now()` — cobros del día = `fecha::date = current_date` |
| `movimientos_inventario` | ajuste de entrada a central: `tipo='ajuste'`, `direccion='entrada'`, **`origen_tipo='central'`** |

---

## Sprint 7 — Garantías + Proveedores/Compras

### F2-01 / F2-02 — Módulo de Garantías (HU-32, HU-33)

#### Flujo campo (HU-32)

- Botón **"Registrar garantía"** en `/campo/visita/[id]`, visible en todas las etapas de la visita (mismo patrón que `IncidenciaSheet`).
- `GarantiaSheet` recibe como props: `visitaId`, `pdvId`, `vitrinaId`.
- `vitrinaId` es **solo para filtrado UI**: se usa para popular el select de productos con el surtido de esa vitrina. No se almacena en `garantias` (la tabla no tiene columna `vitrina_id`). No se pasa al RPC.
- El select de productos se popula reutilizando el hook que ya provee surtido por vitrina (verificar si existe `useSurtidoVitrina` o `useSurtidoEstandar` en `lib/hooks/` antes de crear uno nuevo en `useGarantias`).
- Campos del sheet: producto (select), cantidad, motivo (texto), fecha aprox de venta (date input).
- Al guardar, el cliente genera un UUID (`garantia_id`) y llama RPC `registrar_garantia`.

#### RPC `registrar_garantia`

```sql
registrar_garantia(
  p_garantia_id UUID,        -- UUID generado por el cliente (idempotency key)
  p_visita_recepcion_id UUID,
  p_pdv_id UUID,
  p_producto_id UUID,
  p_cantidad INT,
  p_motivo TEXT,
  p_fecha_venta_aprox DATE
  -- NO incluye p_vitrina_id: vitrinaId es solo para filtrado UI en el cliente
)
```

**Idempotencia correcta — patrón RETURNING:**

```sql
DECLARE v_inserted_id UUID;
BEGIN
  INSERT INTO garantias (id, visita_recepcion_id, pdv_id, producto_id, cantidad, motivo, fecha_venta_aprox)
  VALUES (p_garantia_id, ...)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  -- Si la fila ya existía (conflict), v_inserted_id es NULL → salir sin duplicar movimiento
  IF v_inserted_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO movimientos_inventario (producto_id, cantidad, tipo, direccion, origen_tipo, origen_id, ...)
  VALUES (p_producto_id, p_cantidad, 'devolucion_garantia', 'salida', 'vitrina', <vitrina_id_de_visita>, ...);
END;
```

El `vitrina_id` para `origen_id` del movimiento se obtiene dentro del RPC desde `visitas.vitrina_id` usando `p_visita_recepcion_id`. Este patrón garantiza que el movimiento de inventario nunca se inserta si la garantía ya existía: no hay risk de doble descuento de stock.

#### Offline — `visit:create-garantia`

Se añade una nueva rama al discriminated union `OfflineQueueItem` en `lib/offline/queue.ts`:

```ts
| {
    id: string
    type: 'visit:create-garantia'
    visitId: string
    payload: {
      garantia_id: string       // UUID generado en cliente (idempotency key)
      pdv_id: string
      vitrina_id: string        // usado solo para filtrado UI durante el registro offline
      producto_id: string
      cantidad: number
      motivo: string
      fecha_venta_aprox: string | null
    }
    attemptCount: number
    lastError: string | null
    createdAt: string
    updatedAt: string
  }
```

- Nueva función `enqueueCreateGarantia(visitId, payload)` exportada desde `queue.ts`.
- Handler en `processOfflineSyncQueue` llama `registrar_garantia` vía RPC.
- Al sincronizar con éxito: `queryClient.invalidateQueries(['garantias'])`.
- El ID del item en la cola: `buildQueueItemId('visit:create-garantia', visitId, payload.garantia_id)`.

#### Ciclo de vida admin (HU-33)

Estado completo de `garantias`: `abierta → en_proceso → resuelta → cerrada`

- **`abierta`:** creada en campo.
- **`en_proceso`:** admin/supervisor asigna `responsable_id` y mueve el estado. No requiere acción de inventario.
- **`resuelta`:** admin elige resolución y ejecuta RPC `resolver_garantia`.
- **`cerrada`:** revisión final, estado terminal.

`/admin/garantias` — tabla filtrable por estado (todos: `abierta / en_proceso / resuelta / cerrada`), PDV y período. Al hacer click en una fila, abre `GarantiaDetalleSheet` como drawer (mismo patrón que `IncidenciaDetalleSheet`). No hay ruta `/admin/garantias/[id]`.

`GarantiaDetalleSheet` muestra detalle y permite: (a) asignar responsable + mover a `en_proceso`, (b) resolver. Tres opciones de resolución controladas por campo `resolucion`:

| `resolucion` | Acción de inventario | Movimiento |
|---|---|---|
| `'cambio'` | Repone unidad al stock central | `tipo='ajuste'`, `direccion='entrada'`, **`origen_tipo='central'`**, `origen_id=<inventario_central.id del producto>` |
| `'baja'` | Baja definitiva, sin ingreso | `tipo='baja'`, `direccion='salida'`, `origen_tipo='central'` |
| `'devolucion_proveedor'` | Sin movimiento (ya salió de vitrina al registrar) | ninguno |

Se usa `tipo='ajuste'` (no `'compra'`) para el ingreso por cambio, evitando colisión semántica con el módulo de Compras en reportes y vistas de inventario.

**Importante — trigger `actualizar_inventario`:** para `tipo='ajuste'` con `direccion='entrada'`, el trigger aplica `delta_central := NEW.cantidad` solo cuando `NEW.origen_tipo = 'central'`. Usar `destino_tipo='central'` causaría que el trigger tomara la rama `ELSE NULL` y no actualizara el stock. Siempre usar `origen_tipo='central'` para ajustes de entrada a central.

#### RPC `resolver_garantia`

```sql
resolver_garantia(
  p_garantia_id UUID,
  p_resolucion TEXT,   -- validado internamente: 'cambio' | 'baja' | 'devolucion_proveedor'
  p_notas TEXT
)
```

- El RPC usa `SECURITY DEFINER` y verifica `get_my_rol() IN ('admin', 'supervisor')` internamente; lanza excepción si no.
- Valida `p_resolucion` con `IF p_resolucion NOT IN ('cambio','baja','devolucion_proveedor') THEN RAISE EXCEPTION`.
- En transacción: inserta movimiento si aplica + actualiza `garantias.resolucion`, `garantias.estado = 'resuelta'`.

#### Hook `useGarantias`

Exporta: `useGarantiasList(filters)` · `useGarantiaDetalle(id)` · `useSurtidoVitrina(vitrinaId)` (para el select del sheet en campo) · `useRegistrarGarantia()` mutation · `useResolverGarantia()` mutation.

#### Migraciones Sprint 7 — Garantías

```sql
-- REEMPLAZAR política RLS existente (la actual es USING(true) — demasiado permisiva):
DROP POLICY IF EXISTS "garantias_select" ON garantias;
CREATE POLICY "garantias_select" ON garantias FOR SELECT TO authenticated
  USING (
    get_my_rol() IN ('admin','supervisor','analista','compras')
    OR (
      get_my_rol() = 'colaboradora'
      AND visita_recepcion_id IN (
        SELECT id FROM visitas WHERE colaboradora_id = auth.uid()
      )
    )
  );
-- Las políticas INSERT y UPDATE existentes ya son correctas; solo agregar supervisores al UPDATE:
DROP POLICY IF EXISTS "garantias_update" ON garantias;
CREATE POLICY "garantias_update" ON garantias FOR UPDATE TO authenticated
  USING (get_my_rol() IN ('admin','supervisor'))
  WITH CHECK (get_my_rol() IN ('admin','supervisor'));

-- Función registrar_garantia(...) — SECURITY INVOKER con RLS
-- Función resolver_garantia(...) — SECURITY DEFINER con check de rol
-- Índices: garantias(estado), garantias(visita_recepcion_id), garantias(pdv_id)
```

---

### F2-03 — Módulo de Proveedores

- `/admin/proveedores` — tabla con búsqueda y filtro activo/inactivo.
- `ProveedorSheet` (crear/editar): nombre, contacto_nombre, contacto_email, contacto_tel, condiciones_pago, activo.
- RLS: `compras` y `admin`: CRUD. `supervisor` y `analista`: SELECT. `colaboradora`: sin acceso (intencional — no tiene caso de uso).
- La tabla `proveedores` ya existe. Solo se añaden RLS y UI.

---

### F2-04 — Módulo de Compras

#### Estados de una orden

```
pendiente → confirmada → recibida   (terminal)
     ↘          ↘
      cancelada  cancelada           (terminal, sin movimientos)
```

`'pendiente'` es el estado inicial (ya definido en el schema, no requiere migración de enum). No se añade `'borrador'`.

#### Flujo

1. **Crear orden** (`/admin/compras` → `CompraSheet`): seleccionar proveedor, añadir líneas (producto + `cantidad_pedida`). Estado inicial `pendiente`.
2. **Confirmar** → estado `confirmada`. Las líneas quedan bloqueadas para edición.
3. **Recibir** → `RecepcionSheet` por orden: ingresar `cantidad_recibida` por línea (puede ser ≤ `cantidad_pedida`). Llama RPC `recibir_compra`.
4. **Cancelar** → disponible desde `pendiente` o `confirmada`. Estado `cancelada`. Sin movimientos de inventario.

#### Estado `recibida` es terminal

Una vez que una compra pasa a `recibida`, las cantidades no se pueden corregir. Si se recibió de forma incorrecta, se crea un ajuste manual vía el módulo de inventario (futuro). Esto simplifica la idempotencia del RPC.

#### RPC `recibir_compra`

```sql
recibir_compra(
  p_compra_id UUID,
  p_items JSONB   -- [{detalle_compra_id, cantidad_recibida}]
)
```

- **Idempotente:** si `compras.estado = 'recibida'`, retorna éxito sin re-insertar movimientos.
- En transacción: por cada línea, actualiza `detalle_compra.cantidad_recibida` + inserta `movimientos_inventario` (`tipo='compra'`, `direccion='entrada'`, `destino_tipo='central'`, `cantidad = cantidad_recibida`) + actualiza `compras.estado = 'recibida'` + calcula `compras.total_real`.
- El check constraint `cantidad_recibida <= cantidad_pedida` ya existe en la tabla — el RPC no necesita re-validarlo.

#### Remoción de `InventarioCentralSheet`

- Eliminar `InventarioCentralSheet.tsx` y su botón de acción en `/admin/inventario`.
- El tab `Central` en inventario pasa a ser read-only con link a `/admin/compras`.

#### Migraciones Sprint 7 — Compras

```sql
-- RLS para compras (compras + admin: CRUD; supervisor + analista: SELECT)
-- RLS para detalle_compra (mismos roles que compras)
-- Función recibir_compra(p_compra_id UUID, p_items JSONB)
-- Índices: compras(estado), compras(proveedor_id), compras(fecha)
-- NOTA: estado 'cancelada' ya existe en el CHECK constraint. No alterar.
```

---

### Tests Sprint 7

| Tipo | Descripción |
|---|---|
| E2E | Colaboradora registra garantía durante visita → admin asigna responsable (→ `en_proceso`) → resuelve con cambio → stock central aumenta en 1 |
| E2E | Colaboradora registra garantía → admin resuelve con baja → estado `resuelta`, sin movimiento de entrada |
| E2E | Ciclo completo compra: crear (pendiente) → confirmar → recibir parcial → verificar stock central y `cantidad_recibida` |
| E2E | Cancelar orden en estado `confirmada` → no genera movimientos → estado `cancelada` |
| RLS (Vitest) | `garantias`: colaboradora solo ve/crea las asociadas a sus visitas; supervisor puede ver todas |
| RLS (Vitest) | `compras`: rol `compras` y `admin` pueden crear; `analista` solo SELECT; `colaboradora` sin acceso |
| Offline (E2E) | Garantía registrada offline queda en cola → sincroniza al reconectar → aparece en admin |
| Offline (Vitest) | Cola con `create-garantia` fallida incrementa `attemptCount` y persiste `lastError` |

---

## Sprint 8 — Dashboard + Reportes

### F2-05 a F2-09 — Dashboard en Tiempo Real (HU-34, HU-37)

**Ruta:** `/admin/dashboard`
**Roles con acceso:** `admin`, `supervisor`, `analista`

#### Compatibilidad Tremor + Tailwind v4

El primer paso de Sprint 8 es instalar `@tremor/react` y verificar compatibilidad con Tailwind v4. Si la verificación falla (Tremor v3 usa convenciones de Tailwind v2/v3), el fallback es **Recharts + shadcn `Card`**: mismos componentes de layout con `<AreaChart>` y `<BarChart>` de Recharts. Esta decisión se toma antes de construir cualquier UI del dashboard.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Ventas hoy]  [Visitas]  [Cobros]  [Incidencias]   │  ← KPI cards, actualizados vía Realtime
├─────────────────────────────────────────────────────┤
│  [Hoy]  [Tendencias]  [Vitrinas]                    │  ← shadcn Tabs
│                                                     │
│  Contenido del tab activo                           │
└─────────────────────────────────────────────────────┘
```

#### Tabs

**"Hoy"** — Ventas acumuladas del día con desglose por hora (`AreaChart`). Progreso visitas (realizadas / planificadas). Cobros del día con indicador de discrepancias.

**"Tendencias"** — `AreaChart` ventas diarias últimos 30 días. `BarChart` ventas por ruta/colaboradora en el mes actual.

**"Vitrinas"** — Tabla top 10 por ventas del mes. Tabla vitrinas con stock bajo (<30% del surtido estándar) con badge de alerta.

#### Hook `useDashboard`

```ts
// 1. Query inicial: v_dashboard_hoy (staleTime: 60_000)
// 2. Estado de salud Realtime:
//    const [realtimeHealthy, setRealtimeHealthy] = useState(false)
// 3. Suscripción:
//    channel.on('postgres_changes', ...).subscribe((status) => {
//      if (status === 'SUBSCRIBED') setRealtimeHealthy(true)
//      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeHealthy(false)
//    })
// 4. React Query refetchInterval:
//    refetchInterval: realtimeHealthy ? false : 30_000
// 5. Cleanup en useEffect: supabase.removeChannel(channel)  ← Supabase JS v2, no channel.unsubscribe()
// 6. Al recibir evento Realtime: actualizar estado local (no refetch completo)
```

El estado `realtimeHealthy` vive en `useDashboard`. Cuando es `false`, React Query toma el control con polling cada 30s. Cuando Realtime reconecta y `status === 'SUBSCRIBED'`, vuelve a `true` y se desactiva el polling.

#### Vistas SQL nuevas

```sql
-- v_dashboard_hoy: una sola fila con KPIs del día actual
CREATE OR REPLACE VIEW v_dashboard_hoy AS
SELECT
  COALESCE(SUM(dv.subtotal_cobro), 0)                                       AS ventas_hoy,
  COUNT(DISTINCT v.id) FILTER (WHERE v.estado = 'completada')               AS visitas_realizadas,
  COUNT(DISTINCT v.id)                                                        AS visitas_planificadas,
  COALESCE((
    SELECT SUM(c.monto) FROM cobros c
    WHERE c.fecha::date = current_date
  ), 0)                                                                       AS cobros_hoy,
  (SELECT COUNT(*) FROM incidencias
   WHERE estado IN ('abierta','en_analisis'))                                AS incidencias_abiertas
FROM visitas v
LEFT JOIN detalle_visita dv
  ON dv.visita_id = v.id AND v.estado = 'completada'
WHERE v.fecha_hora_inicio::date = current_date
   OR (v.fecha_hora_inicio IS NULL AND v.created_at::date = current_date);
-- Nota: visitas planificadas del día tienen fecha_hora_inicio NULL hasta que se inician.
-- El fallback a created_at::date captura las generadas hoy por el cron.
-- El implementor debe verificar contra la lógica real del cron de generación de visitas.

-- v_stock_bajo: vitrinas donde stock < 30% del surtido estándar, por producto
CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT
  iv.vitrina_id,
  iv.producto_id,
  iv.cantidad_actual AS stock_actual,
  se.cantidad_objetivo,
  ROUND(iv.cantidad_actual::NUMERIC / NULLIF(se.cantidad_objetivo, 0) * 100, 1) AS pct_stock,
  v.id AS vitrina_db_id,
  pdv.nombre AS pdv_nombre
FROM inventario_vitrina iv
INNER JOIN surtido_estandar se
  ON se.vitrina_id = iv.vitrina_id AND se.producto_id = iv.producto_id
INNER JOIN vitrinas v ON v.id = iv.vitrina_id
INNER JOIN puntos_de_venta pdv ON pdv.id = v.pdv_id
WHERE se.cantidad_objetivo > 0
  AND iv.cantidad_actual::NUMERIC / se.cantidad_objetivo < 0.30;
-- INNER JOIN: solo productos que están en el surtido estándar. Productos con cantidad_objetivo=0
-- excluidos para evitar división por cero. Stock fuera del surtido no se alerta.
```

#### Índices de soporte

```sql
-- visitas no tiene columna 'fecha'; la columna de fecha es fecha_hora_inicio
CREATE INDEX IF NOT EXISTS idx_visitas_fecha_inicio_estado
  ON visitas(fecha_hora_inicio, estado);

CREATE INDEX IF NOT EXISTS idx_cobros_fecha
  ON cobros(fecha);
```

#### Loading states

Todos los componentes del dashboard muestran skeletons (Tremor `Skeleton` o shadcn `Skeleton`) durante carga inicial. No hay flashes de estado vacío.

---

### F2-10 a F2-14 — Reportes y Exportaciones (HU-35, HU-36)

**Ruta:** `/admin/reportes`
**Roles:** `admin`, `supervisor`, `analista` acceden a todos los tabs. `compras` accede solo a Inventario.

#### Tabs

| Tab | HU | Función SQL | Filtros |
|---|---|---|---|
| **Ventas** | HU-35 | `get_reporte_ventas(desde, hasta, ruta_id?, colaboradora_id?, pdv_id?)` | Período, ruta, colaboradora, PDV |
| **Ranking vitrinas** | HU-36 | `get_ranking_vitrinas(desde_actual, hasta_actual, desde_anterior, hasta_anterior)` | Período (los 4 params; el hook `useRankingVitrinas` calcula el período anterior = mismo rango desplazado hacia atrás) |
| **Inventario** | — | Vista `inventario_valorizado` (existente) | — |
| **Visitas** | — | `get_reporte_visitas(desde, hasta, ruta_id?)` | Período, ruta |
| **Incidencias/Garantías** | — | `get_reporte_incidencias_garantias(desde, hasta, tipo?, pdv_id?)` | Período, tipo, PDV |

#### Shapes de retorno de funciones SQL

```ts
// get_reporte_ventas → Row[]
{ pdv_nombre, ruta_nombre, colaboradora_nombre, fecha, unidades_vendidas, monto_cobrado, forma_pago }

// get_ranking_vitrinas → Row[]
{ vitrina_id, pdv_nombre, ventas_actual, ventas_anterior, variacion_pct }

// get_reporte_visitas → Row[]
{ pdv_nombre, ruta_nombre, colaboradora_nombre, fecha_planificada, estado, motivo_no_realizada }

// get_reporte_incidencias_garantias → Row[]
// UNION entre incidencias y garantias. Mapping de columnas:
//   incidencias: fecha_apertura → fecha_apertura, fecha_cierre → fecha_cierre (columnas nativas)
//   garantias:   created_at → fecha_apertura, updated_at WHERE estado='cerrada' → fecha_cierre (ELSE NULL)
{ tipo_registro ('incidencia'|'garantia'), pdv_nombre, descripcion_o_motivo, estado, fecha_apertura, fecha_cierre, dias_abierta }
```

`get_ranking_vitrinas` acepta 4 fechas explícitas. El hook `useRankingVitrinas(desde, hasta)` calcula automáticamente el período anterior: `desde_anterior = desde - (hasta - desde + 1 día)`, `hasta_anterior = desde - 1 día`. La función SQL agrega ambos períodos en un solo round-trip y devuelve `variacion_pct = (ventas_actual - ventas_anterior) / NULLIF(ventas_anterior, 0) * 100`.

#### Comportamiento de hooks

- Todos arrancan con `enabled: false`.
- Los datos se fetchen **solo cuando el usuario presiona "Buscar"** con filtros aplicados.
- `staleTime: 5 * 60 * 1000` — los reportes no se refrescan automáticamente.

#### Exportación a Excel

- SheetJS (`xlsx`) importado **dinámicamente**: `const xlsx = await import('xlsx')` dentro del handler del botón.
- Si el dataset supera 5.000 filas: mostrar shadcn `AlertDialog` de confirmación antes de proceder (no `window.confirm`). El export procede si el usuario confirma.
- El workbook tiene una hoja con headers en español, columnas de fecha como `dd/mm/yyyy`, números con 2 decimales.
- Errores de exportación: toast destructivo con mensaje en español.

#### Dependencias

```bash
npm install @tremor/react     # Sprint 8 — verificar compat Tailwind v4 primero
npm install xlsx              # Sprint 8 — dynamic import, no bundle estático
```

---

### Tests Sprint 8

| Tipo | Descripción |
|---|---|
| Unit (Vitest) | `useDashboard`: `realtimeHealthy` se setea a `false` en `CHANNEL_ERROR`, activa `refetchInterval` |
| Unit (Vitest) | Transformación SheetJS: headers en español, fechas `dd/mm/yyyy`, números correctos |
| E2E | Dashboard carga KPIs con valores > 0 + los tres tabs navegan sin error de JS |
| E2E | Reporte de ventas: aplicar filtros → tabla carga → botón exportar genera `.xlsx` descargable |
| E2E | Ranking vitrinas muestra columna de variación con signo `+`/`-` correcto |

---

## Orden de implementación sugerido

### Sprint 7

1. Migraciones: RLS + RPCs garantías + índices
2. Hook `useGarantias` + UI campo (`GarantiaSheet` con `vitrinaId` prop)
3. UI admin `/admin/garantias` + `GarantiaDetalleSheet`
4. Offline queue: rama `visit:create-garantia` + `enqueueCreateGarantia` + handler en `processOfflineSyncQueue`
5. Migraciones: RLS compras + `recibir_compra` RPC + índices
6. Hook `useProveedores` + UI `/admin/proveedores`
7. Hook `useCompras` + UI `/admin/compras` (crear/confirmar/cancelar)
8. `RecepcionSheet` + `recibir_compra`
9. Eliminar `InventarioCentralSheet` + actualizar tab Central
10. Regenerar `database.types.ts`
11. Tests

### Sprint 8

1. Instalar Tremor → verificar compat Tailwind v4 → decidir Tremor vs Recharts+shadcn
2. Migraciones: `v_dashboard_hoy`, `v_stock_bajo`, índices
3. Hook `useDashboard` con Realtime + fallback polling
4. UI `/admin/dashboard`: KPIs → Tab Hoy → Tab Tendencias → Tab Vitrinas
5. Funciones SQL de reportes (`get_reporte_ventas`, `get_ranking_vitrinas`, etc.)
6. Hooks de reportes (`enabled: false`)
7. UI `/admin/reportes` con tabs + filtros + tabla preview
8. Integrar SheetJS (dynamic import) + AlertDialog de confirmación
9. Regenerar `database.types.ts`
10. Tests
11. `next build` + análisis de bundle (verificar SheetJS cargado on-demand)

---

## Convenciones aplicadas

- RPCs de escritura multi-tabla: transaccionales + idempotentes (PK UUID generado en cliente con `ON CONFLICT (id) DO NOTHING` o check de estado terminal).
- Hooks: `useQueryClient()` antes de `useQuery()`/`useMutation()`.
- Formularios: `z.input<typeof schema>` para tipos con `.default()`. `z.preprocess` para selects opcionales con `""`.
- Params en client components: `use(params)`.
- Migraciones: numeración secuencial, verificar última existente antes de crear.
- Tipos: regenerar `database.types.ts` después de cada migración.
- Comentarios de lógica de negocio: en español. Infraestructura: en inglés.
- Movimientos de inventario: inmutables. `tipo='ajuste'` para correcciones de garantía, `tipo='compra'` reservado para recepción de órdenes de compra.
