import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, MapPinned } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { BottomNav } from '@/components/campo/BottomNav'
import { getHomeForRole } from '@/lib/auth/getHomeForRole'
import { resolveCurrentRole } from '@/lib/auth/resolveCurrentRole'

export const dynamic = 'force-dynamic'

export default async function CampoLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const rol = await resolveCurrentRole(supabase, user, user.app_metadata?.rol as string | undefined)
  if (!rol) redirect('/login')
  if (rol !== 'colaboradora') redirect(getHomeForRole(rol))
  const displayName =
    user.user_metadata?.nombre ??
    user.email?.split('@')[0] ??
    'Colaboradora'

  return (
    <div className="min-h-screen pb-16 flex flex-col" style={{ background: 'var(--gray-100)' }}>
      <header
        className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
        style={{ borderColor: 'var(--gray-200)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/campo/ruta-del-dia" className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl"
                style={{ background: 'var(--blue-600)' }}
              >
                <MapPinned className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-[13px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--gray-900)', fontFamily: 'var(--font-jakarta, var(--font-geist-sans))' }}
                >
                  Ruteria
                </p>
                <p className="truncate text-[11px]" style={{ color: 'var(--gray-600)' }}>
                  {displayName}
                </p>
              </div>
            </div>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--gray-700)' }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </form>
        </div>
      </header>

      {children}
      <BottomNav />
    </div>
  )
}
