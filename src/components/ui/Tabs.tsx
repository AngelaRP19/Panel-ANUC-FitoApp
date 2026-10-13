import type { ComponentProps, ReactNode } from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/utils/cn'

/** Pestañas (pf-tabs) sobre Radix: flechas para moverse, `aria-selected` y paneles enlazados. */
export const Tabs = RadixTabs.Root

export function TabsList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      // La línea inferior es una sombra interior: así el desplazamiento horizontal no recorta
      // el subrayado de la pestaña activa.
      className={cn(
        'flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-borde)]',
        className,
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends ComponentProps<typeof RadixTabs.Trigger> {
  /** Contador al lado de la etiqueta («En revisión 9»). */
  count?: number
  children: ReactNode
}

export function TabsTrigger({ count, children, className, ...props }: TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'group inline-flex h-11 cursor-pointer items-center gap-2 border-b-2 border-transparent px-3 text-cuerpo-sm font-semibold whitespace-nowrap text-tinta-secundaria hover:text-tinta',
        'data-[state=active]:border-verde-700 data-[state=active]:text-verde-700',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="rounded-pill bg-neutro-suave px-1.75 text-xs leading-[18px] font-semibold text-neutro tabular-nums group-data-[state=active]:bg-verde-100 group-data-[state=active]:text-verde-700">
          {count}
        </span>
      )}
    </RadixTabs.Trigger>
  )
}

export const TabsContent = RadixTabs.Content
