import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import type { LucideIcon } from 'lucide-react'

interface OpcionRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  titulo: string
  descripcion?: ReactNode
  icono?: LucideIcon
  ref?: Ref<HTMLInputElement>
}

/**
 * Opción en tarjeta seleccionable (pf-opcion): radio nativo + icono + título + descripción.
 * Toda la tarjeta es la etiqueta. Se agrupa dentro de un <fieldset> con <legend>.
 */
export function OpcionRadio({ titulo, descripcion, icono: Icono, ...props }: OpcionRadioProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-borde-control bg-blanco p-3 hover:bg-verde-50 has-[:checked]:border-2 has-[:checked]:border-verde-700 has-[:checked]:bg-verde-50 has-[:checked]:p-[11px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600">
      <input
        type="radio"
        className="mt-0.5 size-4.5 flex-none accent-verde-700 focus-visible:outline-none"
        {...props}
      />
      <span className="flex flex-col">
        <span className="flex items-center gap-1.5 text-cuerpo-sm font-semibold">
          {Icono && <Icono size={16} strokeWidth={1.75} aria-hidden="true" />}
          {titulo}
        </span>
        {descripcion && <span className="text-nota text-tinta-terciaria">{descripcion}</span>}
      </span>
    </label>
  )
}
