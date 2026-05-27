'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/types'
import { Loader2, Check } from 'lucide-react'

export default function ConfiguracoesClient({ currentUser }: { currentUser: User }) {
  const supabase = createClient()
  const [nome, setNome] = useState(currentUser.nome)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [savedPassword, setSavedPassword] = useState(false)

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoadingProfile(true)
    await supabase.from('users').update({ nome: nome.trim() }).eq('id', currentUser.id)
    setLoadingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoadingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoadingPassword(false)
    if (error) {
      setPasswordError(error.message)
    } else {
      setSavedPassword(true)
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setSavedPassword(false), 2000)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie seu perfil e segurança</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Meu perfil</h2>
        <form onSubmit={updateProfile} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              value={currentUser.email}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado aqui</p>
          </div>
          <button
            type="submit"
            disabled={loadingProfile}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loadingProfile
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : savedProfile
              ? <Check className="w-4 h-4" />
              : null
            }
            {savedProfile ? 'Salvo!' : 'Salvar perfil'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Alterar senha</h2>
        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">{passwordError}</div>
        )}
        <form onSubmit={updatePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loadingPassword}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loadingPassword
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : savedPassword
              ? <Check className="w-4 h-4" />
              : null
            }
            {savedPassword ? 'Senha alterada!' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
