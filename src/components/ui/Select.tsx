import type { Ref, SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { controlClass } from './Input'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  invalid?: boolean
  ref?: Ref<HTMLSelectElement>
}

export function Select({ options, placeholder, invalid, className, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(controlClass, 'h-10', className)}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
