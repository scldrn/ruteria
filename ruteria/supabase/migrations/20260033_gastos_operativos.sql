CREATE TABLE gastos_operativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaboradora_id UUID NOT NULL REFERENCES usuarios(id),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gastos_operativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gastos_select" ON gastos_operativos FOR SELECT TO authenticated
  USING (colaboradora_id = auth.uid() OR get_my_rol() IN ('admin','supervisor'));

CREATE POLICY "gastos_insert" ON gastos_operativos FOR INSERT TO authenticated
  WITH CHECK (get_my_rol() IN ('colaboradora','admin') AND (get_my_rol() = 'admin' OR colaboradora_id = auth.uid()));

CREATE POLICY "gastos_update" ON gastos_operativos FOR UPDATE TO authenticated
  USING (get_my_rol() = 'admin') WITH CHECK (get_my_rol() = 'admin');

CREATE POLICY "gastos_delete" ON gastos_operativos FOR DELETE TO authenticated
  USING (get_my_rol() = 'admin');
