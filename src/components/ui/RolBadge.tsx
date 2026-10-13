import { ROL_LABEL, etiqueta } from '@/locales/es'
import type { Rol } from '@/types/enums'
import { cn } from '@/utils/cn'

/** Etiqueta rectangular del rol (pf-rol). El líder técnico va en verde. */
export function RolBadge({ rol }: { rol: Rol | string }) {
  const esLider = rol === 'LIDER_TECNICO'
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-sm border px-2 text-xs leading-4 font-semibold whitespace-nowrap',
        esLider
          ? 'border-verde-300 bg-verde-100 text-verde-800'
          : 'border-borde bg-neutro-suave text-neutro',
      )}
    >
      {etiqueta(ROL_LABEL, rol)}
    </span>
  )
}
