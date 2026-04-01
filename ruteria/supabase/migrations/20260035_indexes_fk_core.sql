-- ============================================================
-- Índices FK faltantes en tablas core
-- Resuelve hallazgo M-06 del reporte de auditoría de seguridad
-- ============================================================

-- visitas: columnas FK sin índice
CREATE INDEX IF NOT EXISTS idx_visitas_ruta_id
  ON visitas(ruta_id);

CREATE INDEX IF NOT EXISTS idx_visitas_vitrina_id
  ON visitas(vitrina_id);

-- detalle_visita: join más frecuente del sistema
CREATE INDEX IF NOT EXISTS idx_detalle_visita_visita_id
  ON detalle_visita(visita_id);

CREATE INDEX IF NOT EXISTS idx_detalle_visita_producto_id
  ON detalle_visita(producto_id);

-- cobros: joins en reportes y dashboard
CREATE INDEX IF NOT EXISTS idx_cobros_visita_id
  ON cobros(visita_id);

CREATE INDEX IF NOT EXISTS idx_cobros_colaboradora_id
  ON cobros(colaboradora_id);

-- movimientos_inventario: consultas de inventario y triggers
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id
  ON movimientos_inventario(producto_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_origen_id
  ON movimientos_inventario(origen_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_destino_id
  ON movimientos_inventario(destino_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_visita_id
  ON movimientos_inventario(visita_id);

-- incidencias
CREATE INDEX IF NOT EXISTS idx_incidencias_pdv_id
  ON incidencias(pdv_id);

CREATE INDEX IF NOT EXISTS idx_incidencias_visita_id
  ON incidencias(visita_id);

-- fotos_visita: join por visita (acceso frecuente en detalle de visita)
CREATE INDEX IF NOT EXISTS idx_fotos_visita_visita_id
  ON fotos_visita(visita_id);

-- fotos_incidencia
CREATE INDEX IF NOT EXISTS idx_fotos_incidencia_incidencia_id
  ON fotos_incidencia(incidencia_id);

-- Índice compuesto para la query ruta-del-día del campo
-- (colaboradora + estado + fecha — la query más frecuente del sistema)
CREATE INDEX IF NOT EXISTS idx_visitas_colaboradora_fecha_estado
  ON visitas(colaboradora_id, estado, created_at DESC);
