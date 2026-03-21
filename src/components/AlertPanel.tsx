'use client'

import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import type { Alert } from '@/types'

interface AlertPanelProps {
  alerts: Alert[]
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  if (alerts.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            alert.severity === 'danger'
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-gold/30 bg-gold/10 text-gold'
          }`}
        >
          {alert.severity === 'danger' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{alert.message}</span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
              alert.severity === 'danger'
                ? 'bg-danger/20 text-danger'
                : 'bg-gold/20 text-gold'
            }`}
          >
            {alert.severity === 'danger' ? '危険' : '警告'}
          </span>
        </div>
      ))}
    </div>
  )
}
