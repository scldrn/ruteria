import { redirect } from 'next/navigation'
import { getHomeForRole } from '@/lib/auth/getHomeForRole'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'
import { createClient } from '@/lib/supabase/server'
import { ProveedoresClient } from '@/components/admin/ProveedoresClient'

export default async function ProveedoresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')
  if (!['admin', 'compras', 'supervisor', 'analista'].includes(rol)) {
    redirect(getHomeForRole(rol))
  }

  return <ProveedoresClient rol={rol} />
}
