import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { User } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Acertos IBES',
  description: 'Sistema de gerenciamento de pagamento de contas',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: User | null = null
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    profile = data as User | null
  }

  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">
        <AppShell user={profile}>{children}</AppShell>
      </body>
    </html>
  )
}
