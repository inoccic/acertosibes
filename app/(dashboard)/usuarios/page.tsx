import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { Users, Shield, User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: stats } = await supabase
    .from('expenses')
    .select('paid_by_user_id, status')

  const paymentCounts: Record<string, number> = {}
  stats?.forEach((e) => {
    if (e.status === 'pago' && e.paid_by_user_id) {
      paymentCounts[e.paid_by_user_id] = (paymentCounts[e.paid_by_user_id] ?? 0) + 1
    }
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Usuários</h1>
          <p className="text-sm text-slate-500">{(users ?? []).length} usuário{(users ?? []).length !== 1 ? 's' : ''} cadastrado{(users ?? []).length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-4">
        {(users ?? []).map((u: User, idx) => (
          <div
            key={u.id}
            className={`flex items-center gap-4 px-5 py-4 ${
              idx < (users ?? []).length - 1 ? 'border-b border-slate-50' : ''
            } ${u.id === user.id ? 'bg-indigo-50/30' : ''}`}
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
              {u.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-700">{u.nome}</span>
                {u.id === user.id && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Você</span>
                )}
                <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
                  {u.role === 'admin' ? (
                    <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Admin</span>
                  ) : (
                    <span className="flex items-center gap-1"><UserIcon className="w-2.5 h-2.5" /> Usuário</span>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
              <p className="text-xs text-slate-300 mt-0.5">Desde {formatDateTime(u.created_at)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-slate-700">{paymentCounts[u.id] ?? 0}</p>
              <p className="text-xs text-slate-400">pagamento{(paymentCounts[u.id] ?? 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Como adicionar usuários</p>
        <p>Novos usuários devem ser criados diretamente no painel do Supabase → Authentication → Users. Após o cadastro, o perfil será criado automaticamente na tabela de usuários.</p>
      </div>
    </div>
  )
}
