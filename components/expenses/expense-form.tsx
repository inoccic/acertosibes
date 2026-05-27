'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Expense, ExpenseType, User, CATEGORIES, EXPENSE_TYPE_LABELS } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface ExpenseFormProps {
  expense?: Expense | null
  users: User[]
  currentUser: User
  onSuccess?: () => void
  defaultMonth?: number
  defaultYear?: number
}

export default function ExpenseForm({
  expense,
  users,
  currentUser,
  onSuccess,
  defaultMonth,
  defaultYear,
}: ExpenseFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const now = new Date()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: expense?.title ?? '',
    category: expense?.category ?? '',
    type: (expense?.type ?? 'avulsa') as ExpenseType,
    amount: expense?.amount != null ? String(expense.amount) : '',
    due_date: expense?.due_date ?? '',
    reference_month: expense?.reference_month ?? (defaultMonth ?? now.getMonth() + 1),
    reference_year: expense?.reference_year ?? (defaultYear ?? now.getFullYear()),
    status: expense?.status ?? 'pendente',
    paid_by_user_id: expense?.paid_by_user_id ?? '',
    paid_at: expense?.paid_at ? expense.paid_at.substring(0, 10) : '',
    notes: expense?.notes ?? '',
  })

  useEffect(() => {
    if (form.status === 'pago' && !form.paid_by_user_id) {
      setForm((f) => ({ ...f, paid_by_user_id: currentUser.id }))
    }
    if (form.status === 'pago' && !form.paid_at) {
      setForm((f) => ({ ...f, paid_at: new Date().toISOString().substring(0, 10) }))
    }
  }, [form.status])

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      title: form.title.trim(),
      category: form.category || null,
      type: form.type,
      amount: form.amount ? parseFloat(form.amount.replace(',', '.')) : null,
      due_date: form.due_date || null,
      reference_month: Number(form.reference_month),
      reference_year: Number(form.reference_year),
      status: form.status,
      paid_by_user_id: form.status === 'pago' ? (form.paid_by_user_id || currentUser.id) : null,
      paid_at: form.status === 'pago' ? (form.paid_at ? new Date(form.paid_at).toISOString() : new Date().toISOString()) : null,
      notes: form.notes || null,
    }

    try {
      if (expense) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', expense.id)

        if (updateError) throw updateError

        await supabase.from('expense_logs').insert({
          expense_id: expense.id,
          user_id: currentUser.id,
          action: 'updated',
          details: { changes: payload },
        })
      } else {
        const { data: newExpense, error: insertError } = await supabase
          .from('expenses')
          .insert({ ...payload, created_by_user_id: currentUser.id })
          .select()
          .single()

        if (insertError) throw insertError

        await supabase.from('expense_logs').insert({
          expense_id: newExpense.id,
          user_id: currentUser.id,
          action: 'created',
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/despesas')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar despesa')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  const currentYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da despesa *</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            placeholder="Ex: Conta de Energia"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Selecionar...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Valor {form.type === 'fixa_open' ? '(preencher depois)' : '*'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
            <input
              type="text"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              required={form.type !== 'fixa_open'}
              placeholder="0,00"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Data de vencimento</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => set('due_date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mês de referência *</label>
          <select
            value={form.reference_month}
            onChange={(e) => set('reference_month', e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ano *</label>
          <select
            value={form.reference_year}
            onChange={(e) => set('reference_year', e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </div>

        {form.status === 'pago' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quem pagou</label>
              <select
                value={form.paid_by_user_id}
                onChange={(e) => set('paid_by_user_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Selecionar...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data do pagamento</label>
              <input
                type="date"
                value={form.paid_at}
                onChange={(e) => set('paid_at', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Observações opcionais..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none sm:px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {expense ? 'Salvar alterações' : 'Criar despesa'}
        </button>
        <button
          type="button"
          onClick={() => onSuccess ? onSuccess() : router.back()}
          className="flex-1 sm:flex-none sm:px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
