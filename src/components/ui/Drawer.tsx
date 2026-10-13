import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Contenido extra junto al título (p. ej. insignia de estado). */
  headerExtra?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/**
 * Panel lateral derecho (ficha en ventana) sobre Radix Dialog: abre una ficha sin salir
 * de la lista. Foco atrapado y Esc cierra.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  headerExtra,
  children,
  footer,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(abierto) => !abierto && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-verde-950/48" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-120 flex-col bg-blanco shadow-2 focus:outline-none"
        >
          <div className="flex items-start gap-3 border-b border-borde px-6 py-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Dialog.Title className="titulo-h2">{title}</Dialog.Title>
                {headerExtra}
              </div>
              {description && (
                <Dialog.Description className="mt-1 text-cuerpo-sm text-tinta-terciaria">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mr-2 grid size-9 flex-none cursor-pointer place-items-center rounded-md text-tinta-secundaria hover:bg-verde-50"
            >
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-borde bg-verde-50 px-6 py-4">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
