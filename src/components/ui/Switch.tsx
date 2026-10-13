import { useId, type ReactNode } from 'react'
import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Etiqueta visible al lado («Activo»). */
  label?: ReactNode
  /** Nombre accesible cuando la etiqueta no basta («Desactivar a Diana Rincón»). */
  'aria-label'?: string
  disabled?: boolean
  id?: string
}

/** Interruptor (pf-switch, Radix): 40 × 24, verde-700 cuando está activo. */
export function Switch({ checked, onCheckedChange, label, disabled, id, ...aria }: SwitchProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  return (
    <span className="inline-flex items-center gap-2">
      <RadixSwitch.Root
        id={controlId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={aria['aria-label']}
        className={cn(
          'relative h-6 w-10 flex-none cursor-pointer rounded-pill bg-borde-control transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-verde-700',
        )}
      >
        <RadixSwitch.Thumb className="block size-4.5 translate-x-[3px] rounded-full bg-blanco shadow-1 transition-transform data-[state=checked]:translate-x-[19px]" />
      </RadixSwitch.Root>
      {label && (
        <label htmlFor={controlId} className="cursor-pointer text-cuerpo-sm font-medium">
          {label}
        </label>
      )}
    </span>
  )
}
