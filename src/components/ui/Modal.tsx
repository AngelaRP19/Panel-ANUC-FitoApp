import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Modal basado en <dialog> nativo (foco y Escape gestionados por el navegador). */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-lg bg-blanco p-0 shadow-1 backdrop:bg-black/40"
    >
      <header className="flex items-center justify-between border-b border-borde px-5 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-tinta-secundaria"
        >
          <X size={18} />
        </button>
      </header>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <footer className="flex justify-end gap-2 border-t border-borde px-5 py-3">{footer}</footer>
      )}
    </dialog>
  )
}
