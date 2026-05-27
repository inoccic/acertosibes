'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RecurringExpense, User, CATEGORIES } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface RecurringFormProps {
  expense?: RecurringExpense | null
  currentUser: User
  onSuccess: () => void
  onCancel: () => void
}

export default function RecurringForm({ expense, currentUser, onSuccess, onCancel }: RecurringFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: expense?.title ?? '',
    category: expense?.category ?? '',
    has_predefined_value: expense?.has_predefined_value ?? true,
    fixed_amount: expense?.fixed_amount != null ? String(expense.fixed_amount) : '',
    notes: expense?.notes ?? '',
    active: expense?.active ?? true,
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      title: form.title.trim(),
      category: form.category || null,
      has_predefined_value: form.has_predefined_value,
      fixed_amount: form.has_predefined_value && form.fixed_amount
        ? parseFloat(form.fixed_amount.replace(',', '.'))
        : null,
      notes: form.notes || null,
      active: form.active,
    }

    try {
      if (expense) {
        const { error: err } = await supabase
          .from('recurring_expenses')
          .update(payload)
          .eq('id', expense.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase
          .from('recurring_expenses')
          .insert({ ...payload, created_by_user_id: currentUser.id })
        if (err) throw err
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da despesa *</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          placeholder="Ex: Aluguel, Energia..."
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
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de valor</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={form.has_predefined_value}
              onChange={() => set('has_predefined_value', true)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Valor fixo pré-definido (ex: aluguel, sistema)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              checked={!form.has_predefined_value}
              onChange={() => set('has_predefined_value', false)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-slate-700">Valor variável por mês (ex: energia, água)</span>
          </label>
        </div>
      </div>

      {form.has_predefined_value && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor fixo *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
            <input
              type="text"
              value={form.fixed_amount}
              onChange={(e) => set('fixed_amount', e.target.value)}
              required={form.has_predefined_value}
              placeholder="0,00"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Observações opcionais..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {expense && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="accent-indigo-600"
          />
          <span className="text-sm text-slate-700">Despesa ativa (gera mensalmente)</span>
        </label>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {expense ? 'Salvar' : 'Criar despesa fixa'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
