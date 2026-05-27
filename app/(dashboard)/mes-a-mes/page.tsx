import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Expense, User } from '@/lib/types'
import MesAMesClient from './mes-a-mes-client'

export default async function MesAMesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1
  const year = params.year ? parseInt(params.year) : now.getFullYear()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, paid_by:paid_by_user_id(id,nome,email,role,created_at), created_by:created_by_user_id(id,nome,email,role,created_at)')
    .eq('reference_month', month)
    .eq('reference_year', year)
    .order('status', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <MesAMesClient
      expenses={(expenses ?? []) as Expense[]}
      currentUser={profile as User}
      month={month}
      year={year}
    />
  )
}
