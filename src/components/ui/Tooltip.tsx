import type { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

/** Proveedor de tooltips; va una vez en la app. */
export const TooltipProvider = RadixTooltip.Provider

interface TooltipProps {
  /** Texto de ayuda. No sustituye a un nombre accesible: el control debe tener el suyo. */
  content: ReactNode
  /** Un único elemento enfocable (botón, enlace). */
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/** Ayuda breve al pasar el cursor o enfocar (Radix): Esc la cierra. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={300}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-70 rounded-sm bg-tinta px-2.5 py-1.5 text-nota text-blanco shadow-2"
        >
          {content}
          <RadixTooltip.Arrow className="fill-tinta" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
