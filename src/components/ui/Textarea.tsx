import type { Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { controlClass } from './Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ invalid, className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlClass, 'py-2', className)}
      {...props}
    />
  )
}
