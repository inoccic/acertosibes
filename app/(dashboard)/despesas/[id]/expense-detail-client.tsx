'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Expense, User, EXPENSE_TYPE_LABELS } from '@/lib/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import ExpenseForm from '@/components/expenses/expense-form'
import FileUpload from '@/components/expenses/file-upload'
import ExpenseLogList from '@/components/expenses/expense-log'
import {
  ArrowLeft, Edit, Trash2, CheckCircle2, Calendar,
  Tag, User as UserIcon, Clock, FileText, History, Loader2
} from 'lucide-react'

export default function ExpenseDetailClient({
  expense: initialExpense,
  users,
  currentUser,
}: {
  expense: Expense
  users: User[]
  currentUser: User
}) {
  const router = useRouter()
  const supabase = createClient()
  const [expense, setExpense] = useState(initialExpense)
  const [showEdit, setShowEdit] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function reloadExpense() {
    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        paid_by:paid_by_user_id(id,nome,email,role,created_at),
        created_by:created_by_user_id(id,nome,email,role,created_at),
        files:expense_files(*, uploaded_by:uploaded_by_user_id(id,nome,email,role,created_at)),
        logs:expense_logs(*, user:user_id(id,nome,email,role,created_at))
      `)
      .eq('id', expense.id)
      .single()
    if (data) setExpense(data as Expense)
  }

  async function markAsPaid() {
    setMarkingPaid(true)
    await supabase
      .from('expenses')
      .update({
        status: 'pago',
        paid_by_user_id: currentUser.id,
        paid_at: new Date().toISOString(),
      })
      .eq('id', expense.id)

    await supabase.from('expense_logs').insert({
      expense_id: expense.id,
      user_id: currentUser.id,
      action: 'paid',
    })

    await reloadExpense()
    setMarkingPaid(false)
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    await supabase.from('expenses').delete().eq('id', expense.id)
    router.push('/despesas')
    router.refresh()
  }

  const paidBy = expense.paid_by as User | undefined
  const createdBy = expense.created_by as User | undefined

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/despesas" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{expense.title}</h1>
          <p className="text-sm text-slate-500">{EXPENSE_TYPE_LABELS[expense.type]}</p>
        </div>
        <div className="flex items-center gap-2">
          {expense.status === 'pendente' && (
            <button
              onClick={markAsPaid}
              disabled={markingPaid}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              {markingPaid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Marcar como pago
            </button>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Detalhes</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Tag} label="Categoria" value={expense.category ?? '—'} />
              <InfoItem
                icon={CheckCircle2}
                label="Status"
                value={
                  <Badge variant={expense.status === 'pago' ? 'success' : 'warning'}>
                    {expense.status === 'pago' ? 'Pago' : 'Pendente'}
                  </Badge>
                }
              />
              <InfoItem
                icon={DollarIcon}
                label="Valor"
                value={expense.amount != null ? formatCurrency(expense.amount) : <span className="text-slate-400 italic">a definir</span>}
                large
              />
              <InfoItem
                icon={Calendar}
                label="Vencimento"
                value={formatDate(expense.due_date)}
              />
              <InfoItem
                icon={Calendar}
                label="Referência"
                value={`${String(expense.reference_month).padStart(2, '0')}/${expense.reference_year}`}
              />
              {expense.status === 'pago' && (
                <>
                  <InfoItem
                    icon={UserIcon}
                    label="Quem pagou"
                    value={paidBy?.nome ?? '—'}
                  />
                  <InfoItem
                    icon={Clock}
                    label="Data do pagamento"
                    value={formatDate(expense.paid_at)}
                  />
                </>
              )}
            </div>

            {expense.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-700">{expense.notes}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Criado por {createdBy?.nome ?? '—'} em {formatDateTime(expense.created_at)}
              </p>
            </div>
          </div>

          {/* Files */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <FileUpload
              expenseId={expense.id}
              files={expense.files ?? []}
              currentUser={currentUser}
              onUpdate={reloadExpense}
            />
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Histórico</h2>
          </div>
          <ExpenseLogList logs={(expense.logs ?? []).slice().sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )} />
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar Despesa" size="lg">
        <ExpenseForm
          expense={expense}
          users={users}
          currentUser={currentUser}
          onSuccess={() => { setShowEdit(false); reloadExpense() }}
        />
      </Modal>
    </div>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  large = false,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  large?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div className={`${large ? 'text-xl font-bold text-slate-800' : 'text-sm text-slate-700 font-medium'}`}>
        {value}
      </div>
    </div>
  )
}
