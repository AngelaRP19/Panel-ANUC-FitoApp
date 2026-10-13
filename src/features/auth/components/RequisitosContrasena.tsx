import { Check, Circle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { REQUISITOS_CONTRASENA } from '../schemas'

/**
 * Lista de requisitos de la contraseña que se marcan mientras se escribe. Cada ítem dice
 * si se cumple en texto (no solo con color o icono).
 */
export function RequisitosContrasena({ id, valor }: { id: string; valor: string }) {
  return (
    <ul id={id} className="flex flex-wrap gap-x-4 gap-y-1 text-nota">
      {REQUISITOS_CONTRASENA.map((r) => {
        const ok = r.cumple(valor)
        const Icono = ok ? Check : Circle
        return (
          <li
            key={r.id}
            className={cn(
              'flex items-center gap-1.5',
              ok ? 'text-verde-700' : 'text-tinta-terciaria',
            )}
          >
            <Icono size={14} strokeWidth={ok ? 2.5 : 1.75} aria-hidden="true" />
            {r.texto}
            <span className="sr-only">{ok ? ': cumple' : ': pendiente'}</span>
          </li>
        )
      })}
    </ul>
  )
}
