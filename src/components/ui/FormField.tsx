import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}

/** Etiqueta + control + ayuda o error. Para enlazar el control usa `fieldDescriptionId(htmlFor)`. */
export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  const descId = fieldDescriptionId(htmlFor)
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="etiqueta">
        {label}
        {required && (
          <span className="text-peligro" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <span
          id={descId}
          role="alert"
          className="flex items-start gap-1.5 text-nota font-medium text-peligro"
        >
          <AlertCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </span>
      ) : (
        hint && (
          <span id={descId} className="text-nota text-tinta-terciaria">
            {hint}
          </span>
        )
      )}
    </div>
  )
}

/** Leyenda "* Campo obligatorio" que acompaña a los formularios. */
export function RequiredLegend() {
  return (
    <p className="m-0 text-nota text-tinta-terciaria">
      <span className="font-semibold text-peligro" aria-hidden="true">
        *
      </span>{' '}
      Campo obligatorio
    </p>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function fieldDescriptionId(htmlFor: string) {
  return `${htmlFor}-desc`
}
