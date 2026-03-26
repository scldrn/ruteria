import { redirect } from 'next/navigation'
import { ReportesClient } from '@/components/admin/reportes/ReportesClient'
import { getHomeForRole } from '@/lib/auth/getHomeForRole'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'
import { createClient } from '@/lib/supabase/server'

export default async function ReportesPage() {
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

  return <ReportesClient rol={rol} />
}
