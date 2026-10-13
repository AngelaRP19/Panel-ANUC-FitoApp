import type { Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { controlClass } from './Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

/** Área de texto (pf-textarea): 15/22, mínimo 88 px, redimensionable en vertical. */
export function Textarea({ invalid, className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlClass, 'min-h-22 resize-y py-2.5 text-[15px] leading-[22px]', className)}
      {...props}
    />
  )
}
