import type { ReactNode } from 'react'
import { AlertTriangle, type LucideIcon } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  /** Acción destructiva o que cambia el acceso: botón rojo e icono de peligro. */
  danger?: boolean
  loading?: boolean
  icon?: LucideIcon
  /** Campos extra (p. ej. «Motivo del descarte *»). */
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmación de una acción (alertdialog): Cancelar / acción. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = false,
  loading = false,
  icon = AlertTriangle,
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      role="alertdialog"
      title={title}
      description={message}
      icon={icon}
      iconTone={danger ? 'peligro' : 'adv'}
      hideClose
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
