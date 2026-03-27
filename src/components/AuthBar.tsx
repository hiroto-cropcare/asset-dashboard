'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { migrateLocalToSupabase } from '@/lib/db'
import { LogIn, Mail, X, CheckCircle } from 'lucide-react'

interface Props {
  user: User | null
  onUserChange: (user: User | null) => void
}

export default function AuthBar({ user, onUserChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isAnonymous = user?.is_anonymous ?? true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      // 匿名ユーザーをメールアカウントにアップグレード
      const { data, error } = await supabase.auth.updateUser({ email, password })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else if (data.user) {
        await migrateLocalToSupabase(data.user.id)
        onUserChange(data.user)
        setMessage({ type: 'success', text: '確認メールを送信しました。メールを確認してください。' })
        setShowForm(false)
      }
    } else {
      // ログイン
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: 'メールアドレスまたはパスワードが違います' })
      } else if (data.user) {
        await migrateLocalToSupabase(data.user.id)
        onUserChange(data.user)
        setShowForm(false)
        setMessage(null)
      }
    }

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    onUserChange(null)
  }

  // ログイン済みユーザー（本アカウント）
  if (user && !isAnonymous) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-accent">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          ログアウト
        </button>
      </div>
    )
  }

  // 匿名ユーザー or 未ログイン
  return (
    <div className="relative">
      {message && (
        <div
          className={`absolute right-0 top-10 z-50 w-72 rounded-lg border p-3 text-xs shadow-lg ${
            message.type === 'success'
              ? 'border-accent bg-surface text-accent'
              : 'border-red-500/40 bg-surface text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm ? (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-panel bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('signup')}
                className={`text-sm font-medium ${mode === 'signup' ? 'text-accent' : 'text-text-muted'}`}
              >
                新規登録
              </button>
              <span className="text-text-muted">|</span>
              <button
                onClick={() => setMode('login')}
                className={`text-sm font-medium ${mode === 'login' ? 'text-accent' : 'text-text-muted'}`}
              >
                ログイン
              </button>
            </div>
            <button onClick={() => { setShowForm(false); setMessage(null) }}>
              <X className="h-4 w-4 text-text-muted hover:text-text-primary" />
            </button>
          </div>

          {mode === 'signup' && (
            <p className="mb-3 text-xs text-text-muted">
              現在のデータを引き継いでアカウントを作成します
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <input
              type="password"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-accent py-2 text-sm font-semibold text-ink hover:bg-accent/80 disabled:opacity-60"
            >
              {loading ? '処理中...' : mode === 'signup' ? 'アカウント作成' : 'ログイン'}
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg border border-panel px-3 py-1.5 text-xs text-text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">同期・ログイン</span>
        </button>
      )}
    </div>
  )
}
