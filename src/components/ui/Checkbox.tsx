import { useId, type ReactNode } from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CheckboxProps {
  checked: boolean | 'indeterminate'
  onCheckedChange: (checked: boolean) => void
  /** Etiqueta visible. Si no hay, usa `aria-label`. */
  label?: ReactNode
  'aria-label'?: string
  disabled?: boolean
  id?: string
  className?: string
}

/** Casilla de verificación (Radix) de 18 px con área de clic de 24 px. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  className,
  ...aria
}: CheckboxProps) {
  const autoId = useId()
  const controlId = id ?? autoId
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <RadixCheckbox.Root
        id={controlId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        aria-label={aria['aria-label']}
        className={cn(
          'grid size-4.5 flex-none cursor-pointer place-items-center rounded-[4px] border border-borde-control bg-blanco text-blanco',
          'relative before:absolute before:-inset-[3px] before:content-[""]',
          'data-[state=checked]:border-verde-700 data-[state=checked]:bg-verde-700',
          'data-[state=indeterminate]:border-verde-700 data-[state=indeterminate]:bg-verde-700',
          'disabled:cursor-not-allowed disabled:border-borde disabled:bg-inactivo-suave',
        )}
      >
        <RadixCheckbox.Indicator>
          {checked === 'indeterminate' ? (
            <Minus size={14} strokeWidth={3} aria-hidden="true" />
          ) : (
            <Check size={14} strokeWidth={3} aria-hidden="true" />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label htmlFor={controlId} className="cursor-pointer text-cuerpo-sm font-medium">
          {label}
        </label>
      )}
    </span>
  )
}
