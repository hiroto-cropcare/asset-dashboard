'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, X } from 'lucide-react'
import type { Alert } from '@/types'

const DURATION = 8000 // ms

interface ActiveToast extends Alert {
  uid: string
  addedAt: number
}

interface Props {
  alerts: Alert[]
  updateKey: number // increments on each price update → re-triggers toasts
}

export default function ToastNotifications({ alerts, updateKey }: Props) {
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const seenIdsRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const dismiss = useCallback((uid: string) => {
    setExiting((prev) => new Set(Array.from(prev).concat(uid)))
    clearTimeout(timersRef.current.get(uid))
    timersRef.current.delete(uid)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.uid !== uid))
      setExiting((prev) => { const s = new Set(prev); s.delete(uid); return s })
    }, 300)
  }, [])

  // Reset seen IDs on each price update so alerts re-trigger
  useEffect(() => {
    if (updateKey === 0) return
    seenIdsRef.current = new Set()
  }, [updateKey])

  // Add new toasts when alerts or updateKey changes
  useEffect(() => {
    if (alerts.length === 0) return

    const now = Date.now()
    const newAlerts = alerts.filter((a) => !seenIdsRef.current.has(a.id))
    if (newAlerts.length === 0) return

    newAlerts.forEach((a) => seenIdsRef.current.add(a.id))

    const newToasts: ActiveToast[] = newAlerts.map((a) => ({
      ...a,
      uid: `${a.id}-${now}-${Math.random().toString(36).slice(2)}`,
      addedAt: now,
    }))

    setToasts((prev) => [...prev, ...newToasts])

    // Auto-dismiss timers
    newToasts.forEach((t) => {
      const timer = setTimeout(() => dismiss(t.uid), DURATION)
      timersRef.current.set(t.uid, timer)
    })

    // Browser OS notification when tab is not focused
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.hidden
    ) {
      newAlerts.forEach((a) => {
        new Notification(a.assetName, { body: a.message, tag: a.id })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, updateKey, dismiss])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { timersRef.current.forEach((t) => clearTimeout(t)) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] flex-col gap-2 sm:w-80 pointer-events-none">
      {toasts.map((toast) => {
        const isOut = exiting.has(toast.uid)
        const isDanger = toast.severity === 'danger'
        return (
          <div
            key={toast.uid}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-xl transition-all duration-300 ${
              isOut
                ? 'translate-x-4 opacity-0'
                : 'translate-x-0 opacity-100'
            } ${
              isDanger
                ? 'border-danger/40 bg-surface'
                : 'border-gold/40 bg-surface'
            }`}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              {isDanger ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold ${isDanger ? 'text-danger' : 'text-gold'}`}>
                  {isDanger ? '⚠ DANGER' : '⚠ WARNING'} — {toast.assetName}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{toast.message}</p>
              </div>
              <button
                onClick={() => dismiss(toast.uid)}
                className="shrink-0 rounded p-0.5 text-text-muted transition-colors hover:text-text-primary"
                title="閉じる"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${isDanger ? 'bg-danger' : 'bg-gold'}`}
              style={{ animation: `toast-shrink ${DURATION}ms linear forwards` }}
            />
          </div>
        )
      })}
    </div>
  )
}
