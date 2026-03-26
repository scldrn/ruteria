'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Package, Receipt, Wallet } from 'lucide-react'

const TABS = [
  { name: 'Ruta', href: '/campo/ruta-del-dia', icon: MapPin },
  { name: 'Inventario', href: '/campo/inventario', icon: Package },
  { name: 'Gastos', href: '/campo/gastos', icon: Receipt },
  { name: 'Cierre', href: '/campo/cierre-dia', icon: Wallet },
]

export function BottomNav() {
  const pathname = usePathname()

  // Ocultar BottomNav si estamos dentro del wizard de una visita (ej: /campo/visita/uuid)
  if (pathname?.includes('/campo/visita/')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe" style={{ borderColor: 'var(--gray-200)' }}>
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
