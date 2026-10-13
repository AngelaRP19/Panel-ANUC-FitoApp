import { toast as sonner, Toaster as SonnerToaster } from 'sonner'
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

type TonoToast = 'exito' | 'error' | 'info'

const TONOS: Record<TonoToast, { borde: string; icono: LucideIcon; color: string }> = {
  exito: { borde: 'border-verde-300', icono: CheckCircle2, color: 'text-verde-700' },
  error: { borde: 'border-peligro', icono: AlertCircle, color: 'text-peligro' },
  info: { borde: 'border-info', icono: Info, color: 'text-info' },
}

/** Contenedor de avisos: arriba a la derecha, 5 s (artboard «Estados»). Va una vez en la app. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={5000}
      offset={80}
      containerAriaLabel="Notificaciones del panel"
      toastOptions={{ unstyled: true }}
    />
  )
}

function mostrar(tono: TonoToast, titulo: string, texto?: string) {
  const { borde, icono: Icono, color } = TONOS[tono]
  return sonner.custom(() => (
    <div
      className={cn(
        'flex w-100 max-w-[calc(100vw-32px)] items-start gap-3 rounded-md border bg-blanco p-4 text-cuerpo-sm text-tinta shadow-2',
        borde,
      )}
    >
      <Icono size={20} strokeWidth={2} className={cn('flex-none', color)} aria-hidden="true" />
      <div>
        <b className="block font-semibold">{titulo}</b>
        {texto}
      </div>
    </div>
  ))
}

/**
 * Avisos efímeros (pf-toast). Ejemplo del diseño:
 * `toast.exito('Diagnóstico guardado', 'Caso #0241 · ya puedes cerrar el caso.')`
 */
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  exito: (titulo: string, texto?: string) => mostrar('exito', titulo, texto),
  error: (titulo: string, texto?: string) => mostrar('error', titulo, texto),
  info: (titulo: string, texto?: string) => mostrar('info', titulo, texto),
}
