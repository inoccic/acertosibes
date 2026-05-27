import { getStore } from './store'

// Table-to-join resolver: maps foreign key patterns to target tables and join types
const JOIN_CONFIG: Record<string, { alias?: string; targetTable: string; reverseKey?: string }[]> = {
  expenses: [
    { alias: 'paid_by', targetTable: 'users' },
    { alias: 'created_by', targetTable: 'users' },
    { alias: 'files', targetTable: 'expense_files', reverseKey: 'expense_id' },
    { alias: 'logs', targetTable: 'expense_logs', reverseKey: 'expense_id' },
  ],
  expense_files: [
    { alias: 'uploaded_by', targetTable: 'users' },
  ],
  expense_logs: [
    { alias: 'user', targetTable: 'users' },
  ],
  recurring_expenses: [
    { alias: 'created_by', targetTable: 'users' },
  ],
}

// Foreign key map: alias → field that holds the id on the parent table
const FK_MAP: Record<string, string> = {
  paid_by: 'paid_by_user_id',
  created_by: 'created_by_user_id',
  uploaded_by: 'uploaded_by_user_id',
  user: 'user_id',
}

function resolveJoins(items: any[], table: string, selectStr: string): any[] {
  const store = getStore()
  const config = JOIN_CONFIG[table] || []

  return items.map((item) => {
    const result = { ...item }
    for (const { alias, targetTable, reverseKey } of config) {
      if (!alias) continue
      // Only resolve if the alias appears in the select string
      if (!selectStr.includes(alias) && selectStr !== '*') continue

      if (reverseKey) {
        // Reverse join: find all records in targetTable where reverseKey === item.id
        const related = (store[targetTable as keyof typeof store] as any[] || []).filter(
          (r: any) => r[reverseKey] === item.id
        )
        result[alias] = resolveJoins(related, targetTable, '*')
      } else {
        // Forward join: find user where id === item[foreignKey]
        const fk = FK_MAP[alias] ?? `${alias}_id`
        const related = (store[targetTable as keyof typeof store] as any[] || []).find(
          (r: any) => r.id === item[fk]
        )
        result[alias] = related ?? null
      }
    }
    return result
  })
}

type Method = 'select' | 'insert' | 'update' | 'delete'

export class MockQueryBuilder {
  private _table: string
  private _filters: [string, unknown][] = []
  private _selectStr = '*'
  private _orderList: [string, boolean][] = []
  private _isSingle = false
  private _isMaybeSingle = false
  private _method: Method = 'select'
  private _insertData: unknown = null
  private _updateData: unknown = null

  constructor(table: string) {
    this._table = table
  }

  select(fields = '*') {
    this._selectStr = fields
    return this
  }

  eq(column: string, value: unknown) {
    this._filters.push([column, value])
    return this
  }

  order(column: string, opts: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this._orderList.push([column, opts.ascending !== false])
    return this
  }

  single() {
    this._isSingle = true
    return this
  }

  maybeSingle() {
    this._isMaybeSingle = true
    return this
  }

  insert(data: unknown) {
    this._method = 'insert'
    this._insertData = data
    return this
  }

  update(data: unknown) {
    this._method = 'update'
    this._updateData = data
    return this
  }

  delete() {
    this._method = 'delete'
    return this
  }

  // Thenable so it works as a Promise
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve().then(() => this._execute()).then(resolve, reject)
  }

  private _execute(): { data: unknown; error: null } {
    const store = getStore()
    const tableData = store[this._table as keyof typeof store] as any[]

    if (this._method === 'select') {
      let items = [...(tableData || [])]

      for (const [col, val] of this._filters) {
        items = items.filter((item) => item[col] === val)
      }

      for (const [col, asc] of this._orderList) {
        items.sort((a, b) => {
          if (a[col] == null && b[col] == null) return 0
          if (a[col] == null) return 1
          if (b[col] == null) return -1
          if (a[col] < b[col]) return asc ? -1 : 1
          if (a[col] > b[col]) return asc ? 1 : -1
          return 0
        })
      }

      items = resolveJoins(items, this._table, this._selectStr)

      if (this._isSingle || this._isMaybeSingle) {
        return { data: items[0] ?? null, error: null }
      }
      return { data: items, error: null }
    }

    if (this._method === 'insert') {
      const raw = Array.isArray(this._insertData)
        ? this._insertData[0]
        : this._insertData
      const newItem = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(raw as object),
      }
      ;(store[this._table as keyof typeof store] as any[]).push(newItem)

      if (this._isSingle || this._isMaybeSingle) {
        return { data: newItem, error: null }
      }
      return { data: [newItem], error: null }
    }

    if (this._method === 'update') {
      const items = store[this._table as keyof typeof store] as any[]
      let updated: unknown = null
      for (let i = 0; i < items.length; i++) {
        const matches = this._filters.every(([col, val]) => items[i][col] === val)
        if (matches) {
          items[i] = {
            ...items[i],
            ...(this._updateData as object),
            updated_at: new Date().toISOString(),
          }
          updated = items[i]
        }
      }
      return { data: updated, error: null }
    }

    if (this._method === 'delete') {
      const items = store[this._table as keyof typeof store] as any[]
      const remaining = items.filter(
        (item) => !this._filters.every(([col, val]) => item[col] === val)
      )
      ;(store as any)[this._table] = remaining
      return { data: null, error: null }
    }

    return { data: null, error: null }
  }
}
