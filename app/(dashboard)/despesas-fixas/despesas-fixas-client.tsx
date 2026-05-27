'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RecurringExpense, User } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import RecurringForm from '@/components/expenses/recurring-form'
import { Plus, Edit, Trash2, RefreshCw, AlertCircle, Power, Loader2, Zap } from 'lucide-react'

interface Props {
  recurring: RecurringExpense[]
  currentUser: User
}

export default function DespesasFixasClient({ recurring: initialRecurring, currentUser }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [recurring, setRecurring] = useState(initialRecurring)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [genMonth, setGenMonth] = useState(() => new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(() => new Date().getFullYear())

  async function reload() {
    const { data } = await supabase
      .from('recurring_expenses')
      .select('*, created_by:created_by_user_id(id,nome,email,role,created_at)')
      .order('created_at', { ascending: false })
    if (data) setRecurring(data as RecurringExpense[])
  }

  async function toggleActive(r: RecurringExpense) {
    await supabase.from('recurring_expenses').update({ active: !r.active }).eq('id', r.id)
    reload()
  }

  async function handleDelete(r: RecurringExpense) {
    if (!confirm(`Excluir "${r.title}"? As despesas geradas não serão excluídas.`)) return
    await supabase.from('recurring_expenses').delete().eq('id', r.id)
    reload()
  }

  async function generateForMonth() {
    setGenerating('all')
    const active = recurring.filter((r) => r.active)

    for (const r of active) {
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('recurring_expense_id', r.id)
        .eq('reference_month', genMonth)
        .eq('reference_year', genYear)
        .maybeSingle()

      if (!existing) {
        const dueDate = new Date(genYear, genMonth - 1, 10)
        await supabase.from('expenses').insert({
          title: r.title,
          category: r.category,
          type: r.has_predefined_value ? 'fixa_predefined' : 'fixa_open',
          amount: r.fixed_amount,
          due_date: dueDate.toISOString().split('T')[0],
          reference_month: genMonth,
          reference_year: genYear,
          status: 'pendente',
          recurring_expense_id: r.id,
          created_by_user_id: currentUser.id,
        })
      }
    }

    setShowGenerate(false)
    setGenerating(null)
    router.push(`/despesas?month=${genMonth}&year=${genYear}`)
  }

  const active = recurring.filter((r) => r.active)
  const inactive = recurring.filter((r) => !r.active)

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i)

  const editingExpense = editingId ? recurring.find((r) => r.id === editingId) ?? null : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Despesas Fixas</h1>
          <p className="text-sm text-slate-500">{active.length} ativa{active.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Zap className="w-4 h-4" />
            Gerar para mês
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Nova
          </button>
        </div>
      </div>

      {recurring.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma despesa fixa cadastrada</p>
          <p className="text-slate-400 text-sm mt-1">Cadastre despesas recorrentes como aluguel, energia, água...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-green-50">
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ativas ({active.length})</span>
              </div>
              {active.map((r, idx) => (
                <RecurringRow
                  key={r.id}
                  recurring={r}
                  isLast={idx === active.length - 1}
                  onEdit={() => setEditingId(r.id)}
                  onToggle={() => toggleActive(r)}
                  onDelete={() => handleDelete(r)}
                />
              ))}
            </div>
          )}

          {inactive.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inativas ({inactive.length})</span>
              </div>
              {inactive.map((r, idx) => (
                <RecurringRow
                  key={r.id}
                  recurring={r}
                  isLast={idx === inactive.length - 1}
                  onEdit={() => setEditingId(r.id)}
                  onToggle={() => toggleActive(r)}
                  onDelete={() => handleDelete(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nova Despesa Fixa">
        <RecurringForm
          currentUser={currentUser}
          onSuccess={() => { setShowNew(false); reload() }}
          onCancel={() => setShowNew(false)}
        />
      </Modal>

      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Editar Despesa Fixa"
      >
        <RecurringForm
          expense={editingExpense}
          currentUser={currentUser}
          onSuccess={() => { setEditingId(null); reload() }}
          onCancel={() => setEditingId(null)}
        />
      </Modal>

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Gerar Despesas para o Mês">
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Serão geradas despesas para todas as {active.length} despesa{active.length !== 1 ? 's' : ''} fixa{active.length !== 1 ? 's' : ''} ativa{active.length !== 1 ? 's' : ''} no mês selecionado (apenas se ainda não existirem).
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mês</label>
              <select
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
              <select
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateForMonth}
              disabled={generating === 'all'}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg"
            >
              {generating === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Gerar despesas
            </button>
            <button
              onClick={() => setShowGenerate(false)}
              className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function RecurringRow({
  recurring: r,
  isLast,
  onEdit,
  onToggle,
  onDelete,
}: {
  recurring: RecurringExpense
  isLast: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${!isLast ? 'border-b border-slate-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${r.active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
            {r.title}
          </span>
          {r.category && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{r.category}</span>
          )}
          <Badge variant={r.has_predefined_value ? 'info' : 'default'}>
            {r.has_predefined_value ? 'Valor fixo' : 'Valor variável'}
          </Badge>
        </div>
        {r.fixed_amount != null && (
          <p className="text-xs text-slate-400 mt-0.5">
            Valor: {formatCurrency(r.fixed_amount)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggle}
          title={r.active ? 'Desativar' : 'Ativar'}
          className={`p-2 rounded-lg transition-colors ${
            r.active
              ? 'text-green-600 bg-green-50 hover:bg-green-100'
              : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
