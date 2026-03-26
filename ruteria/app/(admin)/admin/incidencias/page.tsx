import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'
import { IncidenciasTable } from '@/components/admin/IncidenciasTable'

export default async function IncidenciasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')
  if (!['admin', 'supervisor', 'analista'].includes(rol)) {
    redirect('/admin/dashboard')
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Incidencias</h1>
      <IncidenciasTable rol={rol} />
    </main>
  )
}
