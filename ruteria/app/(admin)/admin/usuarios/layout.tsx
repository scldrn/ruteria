import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'

// Solo accesible para usuarios con rol 'admin'
export default async function UsuariosLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rol = await resolveCurrentRole(supabase, user, user?.app_metadata?.rol as string | undefined)

  if (!user || rol !== 'admin') {
    redirect('/admin/dashboard')
  }

  return <>{children}</>
}
