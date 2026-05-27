'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Expense, User } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, AlertCircle, TrendingUp, TrendingDown, DollarSign, Printer } from 'lucide-react'

interface Props {
  expenses: Expense[]
  currentUser: User
  month: number
  year: number
}

export default function MesAMesClient({ expenses, currentUser, month, year }: Props) {
  const router = useRouter()

  function navigate(direction: number) {
    let m = month + direction, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    router.push(`/mes-a-mes?month=${m}&year=${y}`)
  }

  const paid = expenses.filter((e) => e.status === 'pago')
  const pending = expenses.filter((e) => e.status === 'pendente')

  const totalAmount = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const paidAmount = paid.reduce((s, e) => s + (e.amount ?? 0), 0)
  const pendingAmount = pending.reduce((s, e) => s + (e.amount ?? 0), 0)

  const paidByUser: Record<string, { nome: string; total: number }> = {}
  paid.forEach((e) => {
    if (e.paid_by) {
      const u = e.paid_by as User
      if (!paidByUser[u.id]) paidByUser[u.id] = { nome: u.nome, total: 0 }
      paidByUser[u.id].total += e.amount ?? 0
    }
  })

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mês a Mês</h1>
          <p className="text-sm text-slate-500">Relatório mensal de despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <select
            value={month}
            onChange={(e) => router.push(`/mes-a-mes?month=${e.target.value}&year=${year}`)}
            className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => router.push(`/mes-a-mes?month=${month}&year=${e.target.value}`)}
            className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-slate-500 font-medium">Total</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{expenses.length} despesa{expenses.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500 font-medium">Pago</span>
          </div>
          <p className="text-lg font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{paid.length} despesa{paid.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500 font-medium">Pendente</span>
          </div>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(pendingAmount)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{pending.length} despesa{pending.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-500 font-medium">% Pago</span>
          </div>
          <p className="text-lg font-bold text-slate-700">
            {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%
          </p>
          <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment by user */}
      {Object.keys(paidByUser).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pagamentos por usuário</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(paidByUser).map((u) => (
              <div key={u.nome} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                    {u.nome.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{u.nome}</span>
                </div>
                <span className="text-sm font-bold text-green-600">{formatCurrency(u.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma despesa em {getMonthName(month)} {year}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-100 bg-amber-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Pendentes ({pending.length})
                  </span>
                  <span className="text-sm font-bold text-amber-700">{formatCurrency(pendingAmount)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400">Despesa</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 hidden sm:table-cell">Categoria</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 hidden md:table-cell">Vencimento</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-400">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((e, idx) => (
                      <tr key={e.id} className={`hover:bg-slate-50 ${idx < pending.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="px-5 py-3">
                          <Link href={`/despesas/${e.id}`} className="text-sm text-slate-700 hover:text-indigo-600 font-medium">
                            {e.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-slate-400">{e.category ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-500">{formatDate(e.due_date)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm font-semibold text-slate-700">
                            {e.amount != null ? formatCurrency(e.amount) : <span className="text-slate-400 text-xs italic">a definir</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-green-100 bg-green-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Pagas ({paid.length})
                  </span>
                  <span className="text-sm font-bold text-green-700">{formatCurrency(paidAmount)}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400">Despesa</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 hidden sm:table-cell">Categoria</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 hidden sm:table-cell">Pago por</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400 hidden md:table-cell">Data</th>
                      <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-400">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.map((e, idx) => (
                      <tr key={e.id} className={`hover:bg-slate-50 ${idx < paid.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className="px-5 py-3">
                          <Link href={`/despesas/${e.id}`} className="text-sm text-slate-700 hover:text-indigo-600 font-medium">
                            {e.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-slate-400">{e.category ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs text-green-600 font-medium">
                            {(e.paid_by as User | undefined)?.nome ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-500">{formatDate(e.paid_at)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {e.amount != null ? formatCurrency(e.amount) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
