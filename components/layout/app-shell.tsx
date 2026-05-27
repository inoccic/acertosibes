'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './sidebar'
import MobileNav from './mobile-nav'
import { User } from '@/lib/types'

export default function AppShell({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <MobileNav user={user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
