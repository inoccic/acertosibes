import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Expense, User, ExpenseFile, ExpenseLog } from '@/lib/types'
import ExpenseDetailClient from './expense-detail-client'

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: expense } = await supabase
    .from('expenses')
    .select(`
      *,
      paid_by:paid_by_user_id(id,nome,email,role,created_at),
      created_by:created_by_user_id(id,nome,email,role,created_at),
      files:expense_files(*, uploaded_by:uploaded_by_user_id(id,nome,email,role,created_at)),
      logs:expense_logs(*, user:user_id(id,nome,email,role,created_at))
    `)
    .eq('id', id)
    .single()

  if (!expense) notFound()

  const { data: usersData } = await supabase.from('users').select('*')
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <ExpenseDetailClient
      expense={expense as Expense}
      users={(usersData ?? []) as User[]}
      currentUser={profile as User}
    />
  )
}
