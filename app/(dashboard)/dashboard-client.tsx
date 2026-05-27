'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Expense, User } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import ExpenseForm from '@/components/expenses/expense-form'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, TrendingDown, DollarSign, Plus, RefreshCw,
  ChevronRight, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight as ChevRight
} from 'lucide-react'

interface Props {
  expenses: Expense[]
  total: number
  paid: number
  pending: number
  month: number
  year: number
  currentUser: User
}

export default function DashboardClient({ expenses, total, paid, pending, month, year, currentUser }: Props) {
  const router = useRouter()
  const [showNewExpense, setShowNewExpense] = useState(false)
  const [users, setUsers] = useState<User[]>([currentUser])

  const supabase = createClient()

  async function loadUsers() {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data as User[])
  }

  function openNewExpense() {
    loadUsers()
    setShowNewExpense(true)
  }

  function navigateMonth(direction: number) {
    let m = month + direction
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    router.push(`/?month=${m}&year=${y}`)
  }

  const pendingExpenses = expenses.filter((e) => e.status === 'pendente')
  const paidExpenses = expenses.filter((e) => e.status === 'pago')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral das contas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-[140px] text-center">
            {getMonthName(month)} {year}
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Total do mês</span>
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} despesa{expenses.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Pago</span>
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(paid)}</p>
          <p className="text-xs text-slate-400 mt-1">{paidExpenses.length} despesa{paidExpenses.length !== 1 ? 's' : ''} paga{paidExpenses.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Pendente</span>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(pending)}</p>
          <p className="text-xs text-slate-400 mt-1">{pendingExpenses.length} despesa{pendingExpenses.length !== 1 ? 's' : ''} pendente{pendingExpenses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={openNewExpense}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova despesa
        </button>
        <Link
          href="/despesas-fixas"
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Nova despesa fixa
        </Link>
        <Link
          href={`/despesas?month=${month}&year=${year}`}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          Ver todas as despesas
          <ChevRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Expenses table */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma despesa em {getMonthName(month)} {year}</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Nova despesa" para começar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Despesas de {getMonthName(month)}</h2>
          </div>

          {/* Pending */}
          {pendingExpenses.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Pendentes ({pendingExpenses.length})
                </span>
              </div>
              {pendingExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}

          {/* Paid */}
          {paidExpenses.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-green-50 border-b border-green-100">
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Pagas ({paidExpenses.length})
                </span>
              </div>
              {paidExpenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showNewExpense} onClose={() => setShowNewExpense(false)} title="Nova Despesa" size="lg">
        <ExpenseForm
          users={users}
          currentUser={currentUser}
          defaultMonth={month}
          defaultYear={year}
          onSuccess={() => {
            setShowNewExpense(false)
            router.refresh()
          }}
        />
      </Modal>
    </div>
  )
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <Link
      href={`/despesas/${expense.id}`}
      className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 truncate">{expense.title}</span>
          {expense.category && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{expense.category}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {expense.due_date && (
            <span className="text-xs text-slate-400">Vence: {formatDate(expense.due_date)}</span>
          )}
          {expense.status === 'pago' && expense.paid_by && (
            <span className="text-xs text-slate-400">Pago por: {(expense.paid_by as User).nome}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">
            {expense.amount != null ? formatCurrency(expense.amount) : <span className="text-slate-400 italic text-xs">a definir</span>}
          </p>
        </div>
        <Badge variant={expense.status === 'pago' ? 'success' : 'warning'}>
          {expense.status === 'pago' ? 'Pago' : 'Pendente'}
        </Badge>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
      </div>
    </Link>
  )
}
