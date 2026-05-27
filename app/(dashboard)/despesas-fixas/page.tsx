import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecurringExpense, User } from '@/lib/types'
import DespesasFixasClient from './despesas-fixas-client'

export default async function DespesasFixasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recurring } = await supabase
    .from('recurring_expenses')
    .select('*, created_by:created_by_user_id(id,nome,email,role,created_at)')
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  return (
    <DespesasFixasClient
      recurring={(recurring ?? []) as RecurringExpense[]}
      currentUser={profile as User}
    />
  )
}
