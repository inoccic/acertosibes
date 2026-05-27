import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Expense, User } from '@/lib/types'
import DespesasClient from './despesas-client'

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1
  const year = params.year ? parseInt(params.year) : now.getFullYear()

  let query = supabase
    .from('expenses')
    .select('*, paid_by:paid_by_user_id(id,nome,email,role,created_at), created_by:created_by_user_id(id,nome,email,role,created_at)')
    .eq('reference_month', month)
    .eq('reference_year', year)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: expenses } = await query
  const { data: usersData } = await supabase.from('users').select('*')
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <DespesasClient
      expenses={(expenses ?? []) as Expense[]}
      users={(usersData ?? []) as User[]}
      currentUser={profile as User}
      month={month}
      year={year}
      statusFilter={params.status ?? 'all'}
      searchQuery={params.q ?? ''}
    />
  )
}
