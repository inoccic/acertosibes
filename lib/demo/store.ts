import { Expense, ExpenseFile, ExpenseLog, RecurringExpense, User } from '@/lib/types'

export interface DemoStore {
  users: User[]
  expenses: (Expense & Record<string, unknown>)[]
  recurring_expenses: (RecurringExpense & Record<string, unknown>)[]
  expense_files: (ExpenseFile & Record<string, unknown>)[]
  expense_logs: (ExpenseLog & Record<string, unknown>)[]
}

const now = new Date()
const cm = now.getMonth() + 1
const cy = now.getFullYear()
const pm = cm === 1 ? 12 : cm - 1
const py = cm === 1 ? cy - 1 : cy

export const DEMO_USERS: User[] = [
  { id: 'user-admin', nome: 'João Silva', email: 'admin@ibes.com', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-02', nome: 'Maria Santos', email: 'maria@ibes.com', role: 'user', created_at: '2024-01-02T00:00:00Z' },
  { id: 'user-03', nome: 'Pedro Costa', email: 'pedro@ibes.com', role: 'user', created_at: '2024-01-03T00:00:00Z' },
]

export const DEMO_PASSWORD = 'demo123'

function pad(n: number) { return String(n).padStart(2, '0') }
function dueDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function createInitialStore(): DemoStore {
  return {
    users: DEMO_USERS,
    recurring_expenses: [
      { id: 'rec-1', title: 'Aluguel', category: 'Aluguel', recurrence_type: 'monthly', fixed_amount: 2500, has_predefined_value: true, notes: null, active: true, created_by_user_id: 'user-admin', created_at: '2024-01-01T00:00:00Z' },
      { id: 'rec-2', title: 'Energia Elétrica', category: 'Energia', recurrence_type: 'monthly', fixed_amount: null, has_predefined_value: false, notes: null, active: true, created_by_user_id: 'user-admin', created_at: '2024-01-01T00:00:00Z' },
      { id: 'rec-3', title: 'Água', category: 'Água', recurrence_type: 'monthly', fixed_amount: null, has_predefined_value: false, notes: null, active: true, created_by_user_id: 'user-admin', created_at: '2024-01-01T00:00:00Z' },
      { id: 'rec-4', title: 'Telefone e Internet', category: 'Internet', recurrence_type: 'monthly', fixed_amount: 220, has_predefined_value: true, notes: 'Plano empresarial', active: true, created_by_user_id: 'user-02', created_at: '2024-01-01T00:00:00Z' },
    ],
    expenses: [
      // Mês atual
      { id: 'exp-1', title: 'Aluguel', category: 'Aluguel', type: 'fixa_predefined', amount: 2500, due_date: dueDate(cy, cm, 5), reference_month: cm, reference_year: cy, status: 'pago', paid_by_user_id: 'user-admin', paid_at: new Date(cy, cm - 1, 5).toISOString(), notes: null, recurring_expense_id: 'rec-1', created_by_user_id: 'user-admin', created_at: new Date(cy, cm - 1, 1).toISOString(), updated_at: new Date(cy, cm - 1, 5).toISOString() },
      { id: 'exp-2', title: 'Energia Elétrica', category: 'Energia', type: 'fixa_open', amount: 385, due_date: dueDate(cy, cm, 10), reference_month: cm, reference_year: cy, status: 'pendente', paid_by_user_id: null, paid_at: null, notes: null, recurring_expense_id: 'rec-2', created_by_user_id: 'user-admin', created_at: new Date(cy, cm - 1, 1).toISOString(), updated_at: new Date(cy, cm - 1, 1).toISOString() },
      { id: 'exp-3', title: 'Água', category: 'Água', type: 'fixa_open', amount: 98, due_date: dueDate(cy, cm, 15), reference_month: cm, reference_year: cy, status: 'pendente', paid_by_user_id: null, paid_at: null, notes: null, recurring_expense_id: 'rec-3', created_by_user_id: 'user-admin', created_at: new Date(cy, cm - 1, 1).toISOString(), updated_at: new Date(cy, cm - 1, 1).toISOString() },
      { id: 'exp-4', title: 'Telefone e Internet', category: 'Internet', type: 'fixa_predefined', amount: 220, due_date: dueDate(cy, cm, 10), reference_month: cm, reference_year: cy, status: 'pago', paid_by_user_id: 'user-02', paid_at: new Date(cy, cm - 1, 10).toISOString(), notes: null, recurring_expense_id: 'rec-4', created_by_user_id: 'user-02', created_at: new Date(cy, cm - 1, 1).toISOString(), updated_at: new Date(cy, cm - 1, 10).toISOString() },
      { id: 'exp-5', title: 'Sistema de Gestão', category: 'Sistema', type: 'fixa_predefined', amount: 120, due_date: dueDate(cy, cm, 8), reference_month: cm, reference_year: cy, status: 'pago', paid_by_user_id: 'user-admin', paid_at: new Date(cy, cm - 1, 8).toISOString(), notes: 'Plano mensal', recurring_expense_id: null, created_by_user_id: 'user-admin', created_at: new Date(cy, cm - 1, 1).toISOString(), updated_at: new Date(cy, cm - 1, 8).toISOString() },
      { id: 'exp-6', title: 'Material de Escritório', category: 'Material', type: 'avulsa', amount: 145, due_date: dueDate(cy, cm, 20), reference_month: cm, reference_year: cy, status: 'pendente', paid_by_user_id: null, paid_at: null, notes: 'Resmas de papel, canetas e toners', recurring_expense_id: null, created_by_user_id: 'user-03', created_at: new Date(cy, cm - 1, 3).toISOString(), updated_at: new Date(cy, cm - 1, 3).toISOString() },
      { id: 'exp-7', title: 'Seguro Patrimonial', category: 'Seguros', type: 'avulsa', amount: 450, due_date: dueDate(cy, cm, 25), reference_month: cm, reference_year: cy, status: 'pendente', paid_by_user_id: null, paid_at: null, notes: null, recurring_expense_id: null, created_by_user_id: 'user-admin', created_at: new Date(cy, cm - 1, 2).toISOString(), updated_at: new Date(cy, cm - 1, 2).toISOString() },
      // Mês anterior
      { id: 'exp-8', title: 'Aluguel', category: 'Aluguel', type: 'fixa_predefined', amount: 2500, due_date: dueDate(py, pm, 5), reference_month: pm, reference_year: py, status: 'pago', paid_by_user_id: 'user-admin', paid_at: new Date(py, pm - 1, 5).toISOString(), notes: null, recurring_expense_id: 'rec-1', created_by_user_id: 'user-admin', created_at: new Date(py, pm - 1, 1).toISOString(), updated_at: new Date(py, pm - 1, 5).toISOString() },
      { id: 'exp-9', title: 'Energia Elétrica', category: 'Energia', type: 'fixa_open', amount: 312, due_date: dueDate(py, pm, 10), reference_month: pm, reference_year: py, status: 'pago', paid_by_user_id: 'user-02', paid_at: new Date(py, pm - 1, 9).toISOString(), notes: null, recurring_expense_id: 'rec-2', created_by_user_id: 'user-admin', created_at: new Date(py, pm - 1, 1).toISOString(), updated_at: new Date(py, pm - 1, 9).toISOString() },
      { id: 'exp-10', title: 'Água', category: 'Água', type: 'fixa_open', amount: 87, due_date: dueDate(py, pm, 15), reference_month: pm, reference_year: py, status: 'pago', paid_by_user_id: 'user-03', paid_at: new Date(py, pm - 1, 14).toISOString(), notes: null, recurring_expense_id: 'rec-3', created_by_user_id: 'user-admin', created_at: new Date(py, pm - 1, 1).toISOString(), updated_at: new Date(py, pm - 1, 14).toISOString() },
      { id: 'exp-11', title: 'Telefone e Internet', category: 'Internet', type: 'fixa_predefined', amount: 220, due_date: dueDate(py, pm, 10), reference_month: pm, reference_year: py, status: 'pago', paid_by_user_id: 'user-02', paid_at: new Date(py, pm - 1, 10).toISOString(), notes: null, recurring_expense_id: 'rec-4', created_by_user_id: 'user-02', created_at: new Date(py, pm - 1, 1).toISOString(), updated_at: new Date(py, pm - 1, 10).toISOString() },
      { id: 'exp-12', title: 'Sistema de Gestão', category: 'Sistema', type: 'fixa_predefined', amount: 120, due_date: dueDate(py, pm, 8), reference_month: pm, reference_year: py, status: 'pago', paid_by_user_id: 'user-admin', paid_at: new Date(py, pm - 1, 8).toISOString(), notes: null, recurring_expense_id: null, created_by_user_id: 'user-admin', created_at: new Date(py, pm - 1, 1).toISOString(), updated_at: new Date(py, pm - 1, 8).toISOString() },
    ],
    expense_files: [],
    expense_logs: [
      { id: 'log-1', expense_id: 'exp-1', user_id: 'user-admin', action: 'created', details: null, created_at: new Date(cy, cm - 1, 1).toISOString() },
      { id: 'log-2', expense_id: 'exp-1', user_id: 'user-admin', action: 'paid', details: null, created_at: new Date(cy, cm - 1, 5).toISOString() },
      { id: 'log-3', expense_id: 'exp-4', user_id: 'user-02', action: 'created', details: null, created_at: new Date(cy, cm - 1, 1).toISOString() },
      { id: 'log-4', expense_id: 'exp-4', user_id: 'user-02', action: 'paid', details: null, created_at: new Date(cy, cm - 1, 10).toISOString() },
    ],
  }
}

// Server-side singleton store
declare global {
  // eslint-disable-next-line no-var
  var __demoStore: DemoStore | undefined
}

export function getStore(): DemoStore {
  if (!global.__demoStore) {
    global.__demoStore = createInitialStore()
  }
  return global.__demoStore
}

export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'demo' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === ''
}
