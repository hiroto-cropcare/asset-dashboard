'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { migrateLocalToSupabase } from '@/lib/db'
import { LogIn, X, CheckCircle, AlertCircle, Loader2, LogOut, UserCircle } from 'lucide-react'

interface Props {
  user: User | null
  onUserChange: (user: User | null) => void
}

type AuthStatus = 'logged-in' | 'pending-confirm' | 'anonymous'

function getAuthStatus(user: User | null): AuthStatus {
  if (!user || user.is_anonymous) return 'anonymous'
  if (!user.email_confirmed_at && !user.confirmed_at) return 'pending-confirm'
  return 'logged-in'
}

export default function AuthBar({ user, onUserChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const status = getAuthStatus(user)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      if (user?.is_anonymous) {
        // 匿名ユーザーをメール+パスワードへ昇格させる（IDが変わらず既存データを保持）
        const { data, error } = await supabase.auth.updateUser({ email, password })
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else if (data.user) {
          await migrateLocalToSupabase(data.user.id)
          onUserChange(data.user)
          setMessage({ type: 'success', text: '確認メールを送信しました。受信トレイを確認してください。' })
          // フォームを閉じずにメッセージを表示したままにする
        }
      } else {
        // 匿名セッションなし → 通常のサインアップ
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          // data.user が null になる場合（既存メール等）もメール送信自体は成功しているため表示する
          setMessage({ type: 'success', text: '確認メールを送信しました。受信トレイを確認してください。' })
        }
      }
    } else {
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

  // ── Status Badge ──────────────────────────────────────────────
  const StatusBadge = () => {
    if (status === 'logged-in') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline max-w-[140px] truncate">{user?.email}</span>
          <span className="sm:hidden">ログイン中</span>
        </div>
      )
    }
    if (status === 'pending-confirm') {
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>メール確認待ち</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-panel px-2.5 py-1 text-xs font-medium text-text-muted">
        <UserCircle className="h-3.5 w-3.5 shrink-0" />
        <span>未ログイン</span>
      </div>
    )
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Always-visible status badge */}
      <StatusBadge />

      {/* Action button */}
      {status === 'logged-in' ? (
        <button
          onClick={handleSignOut}
          title="ログアウト"
          className="flex items-center gap-1 rounded-lg border border-panel px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      ) : (
        <button
          onClick={() => { setShowForm((v) => !v); setMessage(null) }}
          className="flex items-center gap-1.5 rounded-lg border border-panel px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">ログイン</span>
        </button>
      )}

      {/* Dropdown form */}
      {showForm && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-panel bg-surface p-4 shadow-xl">
          {/* Tabs */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setMode('login')}
                className={`pb-1 text-sm font-semibold transition-colors ${
                  mode === 'login'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                ログイン
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`pb-1 text-sm font-semibold transition-colors ${
                  mode === 'signup'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                新規登録
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
              autoComplete="email"
              className="rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <input
              type="password"
              placeholder="パスワード（6文字以上）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="rounded-lg border border-panel bg-ink px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent py-2 text-sm font-semibold text-ink hover:bg-accent/80 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </button>
          </form>

          {/* Feedback message */}
          {message && (
            <div
              className={`mt-3 rounded-lg border p-2.5 text-xs ${
                message.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-red-500/40 bg-red-500/10 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
