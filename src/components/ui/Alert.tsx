import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type AlertTone = 'info' | 'warning' | 'danger' | 'success'

const TONES: Record<AlertTone, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: { box: 'bg-info-suave', icon: Info, iconColor: 'text-info' },
  warning: { box: 'bg-advertencia-suave', icon: AlertTriangle, iconColor: 'text-advertencia' },
  danger: { box: 'bg-peligro-suave', icon: AlertCircle, iconColor: 'text-peligro' },
  success: { box: 'bg-verde-100', icon: CheckCircle2, iconColor: 'text-verde-700' },
}

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
}

/** Aviso en línea (pf-aviso). Los de tono "danger" se anuncian a lectores de pantalla. */
export function Alert({ tone = 'info', title, children }: AlertProps) {
  const { box, icon: Icon, iconColor } = TONES[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md px-4 py-3 text-cuerpo-sm text-tinta', box)}
    >
      <Icon size={20} className={cn('shrink-0', iconColor)} aria-hidden="true" />
      <div>
        {title && <b className="font-semibold">{title}</b>} {children}
      </div>
    </div>
  )
}
