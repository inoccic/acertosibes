'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Expense, User } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import ExpenseForm from '@/components/expenses/expense-form'
import { Plus, Search, ChevronLeft, ChevronRight, Filter, AlertCircle, ChevronRight as Arrow } from 'lucide-react'

interface Props {
  expenses: Expense[]
  users: User[]
  currentUser: User
  month: number
  year: number
  statusFilter: string
  searchQuery: string
}

export default function DespesasClient({ expenses, users, currentUser, month, year, statusFilter, searchQuery }: Props) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState(searchQuery)

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses
    const q = search.toLowerCase()
    return expenses.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      (e.category?.toLowerCase().includes(q)) ||
      (e.notes?.toLowerCase().includes(q))
    )
  }, [expenses, search])

  const total = filtered.reduce((s, e) => s + (e.amount ?? 0), 0)
  const paid = filtered.filter((e) => e.status === 'pago').reduce((s, e) => s + (e.amount ?? 0), 0)
  const pending = filtered.filter((e) => e.status === 'pendente').reduce((s, e) => s + (e.amount ?? 0), 0)

  function navigate(direction: number) {
    let m = month + direction, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    router.push(`/despesas?month=${m}&year=${y}&status=${statusFilter}`)
  }

  function setStatus(s: string) {
    router.push(`/despesas?month=${month}&year=${year}&status=${s}`)
  }

  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i)
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Despesas</h1>
          <p className="text-sm text-slate-500">{getMonthName(month)} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          <select
            value={month}
            onChange={(e) => router.push(`/despesas?month=${e.target.value}&year=${year}&status=${statusFilter}`)}
            className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>

          <select
            value={year}
            onChange={(e) => router.push(`/despesas?month=${month}&year=${e.target.value}&status=${statusFilter}`)}
            className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>

          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova despesa</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total', value: total, color: 'text-slate-700' },
          { label: 'Pago', value: paid, color: 'text-green-600' },
          { label: 'Pendente', value: pending, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar despesa..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'pago', label: 'Pagas' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma despesa encontrada</p>
          <p className="text-slate-400 text-sm mt-1">Tente outros filtros ou crie uma nova despesa</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.map((expense, idx) => (
            <Link
              key={expense.id}
              href={`/despesas/${expense.id}`}
              className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group ${
                idx < filtered.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">{expense.title}</span>
                  {expense.category && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{expense.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {expense.due_date && (
                    <span className="text-xs text-slate-400">Vence: {formatDate(expense.due_date)}</span>
                  )}
                  {expense.status === 'pago' && expense.paid_by && (
                    <span className="text-xs text-green-600">Pago por: {(expense.paid_by as User).nome}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-sm font-semibold text-slate-700">
                  {expense.amount != null
                    ? formatCurrency(expense.amount)
                    : <span className="text-slate-400 italic text-xs">a definir</span>
                  }
                </p>
                <Badge variant={expense.status === 'pago' ? 'success' : 'warning'}>
                  {expense.status === 'pago' ? 'Pago' : 'Pendente'}
                </Badge>
                <Arrow className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nova Despesa" size="lg">
        <ExpenseForm
          users={users}
          currentUser={currentUser}
          defaultMonth={month}
          defaultYear={year}
          onSuccess={() => { setShowNew(false); router.refresh() }}
        />
      </Modal>
    </div>
  )
}
