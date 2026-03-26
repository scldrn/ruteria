import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/admin/AppShell'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')

  // Obtener nombre desde public.usuarios
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const userInfo = {
    nombre: perfil?.nombre ?? '',
    email: user.email ?? '',
    rol,
  }

  return <AppShell user={userInfo}>{children}</AppShell>
}
