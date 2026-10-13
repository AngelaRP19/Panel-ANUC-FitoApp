import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type TonoIconoModal = 'peligro' | 'adv' | 'info' | 'ok'

const TONO_ICONO: Record<TonoIconoModal, string> = {
  peligro: 'bg-peligro-suave text-peligro',
  adv: 'bg-advertencia-suave text-advertencia',
  info: 'bg-info-suave text-info',
  ok: 'bg-verde-100 text-verde-700',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Texto bajo el título; queda como descripción accesible del diálogo. */
  description?: ReactNode
  /** Icono en recuadro a la izquierda del título (confirmaciones). */
  icon?: LucideIcon
  iconTone?: TonoIconoModal
  /** Contenido extra junto al título (p. ej. insignia de estado). */
  headerExtra?: ReactNode
  children?: ReactNode
  /** Pie con fondo verde-50 (botones a la derecha). */
  footer?: ReactNode
  /** md 560 px (formularios, confirmaciones) · sm 480 px (fichas y resúmenes). */
  size?: 'sm' | 'md' | 'lg'
  /** Fichas y resúmenes se abren arriba (pf-velo--arriba); confirmaciones, centradas. */
  position?: 'center' | 'top'
  /** alertdialog para confirmaciones que exigen respuesta. */
  role?: 'dialog' | 'alertdialog'
  /** Oculta el botón de cerrar (diálogos de bloqueo con «Entendido»). */
  hideClose?: boolean
}

/**
 * Ventana modal (pf-velo + pf-modal) sobre Radix Dialog: foco atrapado, Esc cierra y el
 * foco vuelve al control que la abrió.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icono,
  iconTone = 'peligro',
  headerExtra,
  children,
  footer,
  size = 'md',
  position = 'center',
  role = 'dialog',
  hideClose = false,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(abierto) => !abierto && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-verde-950/48" />
        <Dialog.Content
          role={role}
          // Sin descripción, se declara explícitamente para que Radix no la exija.
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed left-1/2 z-50 flex max-h-[calc(100vh-48px)] w-[calc(100%-32px)] -translate-x-1/2 flex-col rounded-lg bg-blanco shadow-2 focus:outline-none',
            position === 'top' ? 'top-[min(120px,8vh)]' : 'top-1/2 -translate-y-1/2',
            { sm: 'max-w-120', md: 'max-w-140', lg: 'max-w-180' }[size],
          )}
        >
          <div className="flex items-start gap-3 px-6 pt-6 pb-4">
            {Icono && (
              <span
                className={cn(
                  'grid size-10 flex-none place-items-center rounded-md',
                  TONO_ICONO[iconTone],
                )}
              >
                <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Dialog.Title className="titulo-h2">{title}</Dialog.Title>
                {headerExtra}
              </div>
              {description && (
                <Dialog.Description className="mt-1 text-cuerpo-sm text-tinta-secundaria">
                  {description}
                </Dialog.Description>
              )}
            </div>
            {!hideClose && (
              <Dialog.Close
                aria-label="Cerrar"
                className="-mt-1 -mr-2 grid size-9 flex-none cursor-pointer place-items-center rounded-md text-tinta-secundaria hover:bg-verde-50"
              >
                <X size={20} strokeWidth={1.75} aria-hidden="true" />
              </Dialog.Close>
            )}
          </div>
          {children && (
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pb-6">{children}</div>
          )}
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 rounded-b-lg border-t border-borde bg-verde-50 px-6 py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
