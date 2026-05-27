export type UserRole = 'admin' | 'user'
export type ExpenseType = 'avulsa' | 'fixa_predefined' | 'fixa_open'
export type ExpenseStatus = 'pendente' | 'pago'

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  created_at: string
}

export interface RecurringExpense {
  id: string
  title: string
  category: string | null
  recurrence_type: string
  fixed_amount: number | null
  has_predefined_value: boolean
  notes: string | null
  active: boolean
  created_by_user_id: string | null
  created_at: string
  created_by?: User
}

export interface Expense {
  id: string
  title: string
  category: string | null
  type: ExpenseType
  amount: number | null
  due_date: string | null
  reference_month: number
  reference_year: number
  status: ExpenseStatus
  paid_by_user_id: string | null
  paid_at: string | null
  notes: string | null
  recurring_expense_id: string | null
  created_by_user_id: string | null
  created_at: string
  updated_at: string
  paid_by?: User
  created_by?: User
  files?: ExpenseFile[]
  logs?: ExpenseLog[]
}

export interface ExpenseFile {
  id: string
  expense_id: string
  file_url: string
  file_name: string
  file_type: string | null
  file_size: number | null
  uploaded_by_user_id: string | null
  uploaded_at: string
  uploaded_by?: User
}

export interface ExpenseLog {
  id: string
  expense_id: string
  user_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
  user?: User
}

export interface MonthSummary {
  total: number
  paid: number
  pending: number
  count: number
  paid_count: number
  pending_count: number
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const CATEGORIES = [
  'Aluguel', 'Energia', 'Água', 'Telefone', 'Internet',
  'Impostos', 'Seguros', 'Salários', 'Fornecedores', 'Sistema',
  'Mensalidade', 'Manutenção', 'Material', 'Outros'
]

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  avulsa: 'Despesa Avulsa',
  fixa_predefined: 'Despesa Fixa (valor fixo)',
  fixa_open: 'Despesa Fixa (sem valor fixo)',
}
