import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GarantiasTable } from '@/components/admin/GarantiasTable'
import { getHomeForRole } from '@/lib/auth/getHomeForRole'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'

export default async function GarantiasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')
  if (!['admin', 'supervisor', 'analista', 'compras'].includes(rol)) {
    redirect(getHomeForRole(rol))
  }

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Garantías</h1>
        <p className="text-sm text-slate-500 mt-1">
          Seguimiento de productos devueltos, asignación de responsables y resolución administrativa.
        </p>
      </div>
      <GarantiasTable rol={rol} />
    </main>
  )
}
