import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Expense, User } from '@/lib/types'
import DashboardClient from './(dashboard)/dashboard-client'

export default async function HomePage({
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
    .order('due_date', { ascending: true })

  const list = (expenses ?? []) as Expense[]
  const total = list.reduce((s, e) => s + (e.amount ?? 0), 0)
  const paid = list.filter((e) => e.status === 'pago').reduce((s, e) => s + (e.amount ?? 0), 0)
  const pending = list.filter((e) => e.status === 'pendente').reduce((s, e) => s + (e.amount ?? 0), 0)

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <DashboardClient
      expenses={list}
      total={total}
      paid={paid}
      pending={pending}
      month={month}
      year={year}
      currentUser={profile as User}
    />
  )
}
