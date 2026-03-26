'use client'

import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'
import type { UserRol } from '@/lib/validations/usuarios'

interface AppShellProps {
  children: ReactNode
  user: {
    nombre: string
    email: string
    rol: UserRol
  }
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar rol={user.rol} user={user} />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 overflow-auto">
            <div className="max-w-[1400px] mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
