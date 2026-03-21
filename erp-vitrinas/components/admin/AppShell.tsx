'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './AppSidebar'

interface AppShellProps {
  children: React.ReactNode
  user: {
    nombre: string
    email: string
    rol: string
  }
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AppSidebar rol={user.rol} />
        <div className="flex flex-col flex-1 min-w-0">
          {/* Navbar superior */}
          <header className="h-12 bg-[#1e293b] flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-bold text-slate-100 tracking-widest">POWERP</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{user.nombre || user.email}</span>
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                {(user.nombre || user.email).charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          {/* Contenido */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
