import { redirect } from 'next/navigation'
import { getHomeForRole } from '@/lib/auth/getHomeForRole'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')
  redirect(getHomeForRole(rol))
}
