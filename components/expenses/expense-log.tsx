import { ExpenseLog } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { History, User, Edit, CheckCircle2, Plus } from 'lucide-react'

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created: { label: 'Criou a despesa', icon: Plus, color: 'text-blue-600 bg-blue-100' },
  updated: { label: 'Editou a despesa', icon: Edit, color: 'text-amber-600 bg-amber-100' },
  paid: { label: 'Marcou como paga', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
}

export default function ExpenseLogList({ logs }: { logs: ExpenseLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400">
        <History className="w-6 h-6 mx-auto mb-1 opacity-40" />
        <p className="text-sm">Nenhum registro de histórico</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const config = actionConfig[log.action] ?? {
          label: log.action,
          icon: User,
          color: 'text-slate-600 bg-slate-100',
        }
        const Icon = config.icon

        return (
          <div key={log.id} className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{log.user?.nome ?? 'Sistema'}</span>
                {' '}{config.label}
              </p>
              <p className="text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
