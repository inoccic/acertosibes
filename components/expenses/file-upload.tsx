'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseFile, User } from '@/lib/types'
import { Upload, FileText, Trash2, ExternalLink, Loader2, FileImage, FileSpreadsheet } from 'lucide-react'

interface FileUploadProps {
  expenseId: string
  files: ExpenseFile[]
  currentUser: User
  onUpdate: () => void
}

function fileIcon(type: string | null) {
  if (!type) return FileText
  if (type.startsWith('image/')) return FileImage
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
  return FileText
}

export default function FileUpload({ expenseId, files, currentUser, onUpdate }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${expenseId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('expense-files')
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('expense-files')
        .getPublicUrl(path)

      const { error: dbError } = await supabase.from('expense_files').insert({
        expense_id: expenseId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by_user_id: currentUser.id,
      })

      if (dbError) throw dbError

      onUpdate()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(fileRecord: ExpenseFile) {
    if (!confirm(`Remover "${fileRecord.file_name}"?`)) return

    const url = new URL(fileRecord.file_url)
    const parts = url.pathname.split('/expense-files/')
    const filePath = parts[1]

    await supabase.storage.from('expense-files').remove([filePath])
    await supabase.from('expense_files').delete().eq('id', fileRecord.id)
    onUpdate()
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Arquivos anexados</h3>
        <label className="cursor-pointer">
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Enviando...' : 'Anexar arquivo'}
          </span>
        </label>
      </div>

      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

      {files.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
        >
          <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Clique para anexar um arquivo</p>
          <p className="text-xs text-slate-300 mt-0.5">Boleto, comprovante, nota fiscal...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((f) => {
            const Icon = fileIcon(f.file_type)
            return (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate font-medium">{f.file_name}</p>
                  {f.file_size && (
                    <p className="text-xs text-slate-400">{formatSize(f.file_size)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={f.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
