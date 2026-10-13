import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ESTADO_CASO_LABEL } from '@/locales/es'
import type { EstadoCaso } from '@/types/enums'
import { cn } from '@/utils/cn'
import type { ConteosCasos } from '../types'

const PRINCIPALES: { valor: string; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'PENDIENTE_REVISION', etiqueta: ESTADO_CASO_LABEL.PENDIENTE_REVISION },
  { valor: 'EN_REVISION', etiqueta: ESTADO_CASO_LABEL.EN_REVISION },
  { valor: 'CERRADO', etiqueta: ESTADO_CASO_LABEL.CERRADO },
]

/** Estados del menú «Más estados»; solo aparecen los que tienen casos. */
const OTROS: EstadoCaso[] = ['REGISTRADO', 'EN_ANALISIS', 'CREADO', 'DESCARTADO']

const TONO_OTROS = {
  REGISTRADO: 'neutral',
  EN_ANALISIS: 'info',
  CREADO: 'neutral',
  DESCARTADO: 'inactive',
} as const

interface CasosTabsProps {
  estado: string
  conteos: ConteosCasos | undefined
  onChange: (estado: string) => void
  /** Contenido del panel de la pestaña activa (filtros y tabla). */
  children: ReactNode
}

/** Pestañas por estado con contador + «Más estados» (artboard 03). */
export function CasosTabs({ estado, conteos, onChange, children }: CasosTabsProps) {
  const n = (valor: string) =>
    (valor === 'todos' ? conteos?.todos : conteos?.[valor as EstadoCaso]) ?? 0
  const otros = OTROS.filter((e) => n(e) > 0 || e === estado)
  const otroActivo = OTROS.includes(estado as EstadoCaso) ? (estado as EstadoCaso) : null

  return (
    <Tabs value={estado} onValueChange={onChange} className="flex flex-col gap-4">
      <div className="flex items-end gap-1 shadow-[inset_0_-1px_0_var(--color-borde)]">
        <TabsList aria-label="Estados del caso" className="min-w-0 shadow-none">
          {PRINCIPALES.map((t) => (
            <TabsTrigger key={t.valor} value={t.valor} count={conteos ? n(t.valor) : undefined}>
              {t.etiqueta}
            </TabsTrigger>
          ))}
        </TabsList>

        {otros.length > 0 && (
          <Dropdown.Root>
            <Dropdown.Trigger
              className={cn(
                'inline-flex h-11 cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-3 text-cuerpo-sm font-semibold whitespace-nowrap text-tinta-secundaria hover:text-tinta',
                otroActivo && 'border-verde-700 text-verde-700',
              )}
            >
              {otroActivo ? ESTADO_CASO_LABEL[otroActivo] : 'Más estados'}
              <ChevronDown size={16} aria-hidden="true" />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                align="start"
                sideOffset={4}
                className="z-40 min-w-56 rounded-md border border-borde bg-blanco p-1.5 shadow-2"
              >
                {otros.map((e) => (
                  <Dropdown.Item
                    key={e}
                    onSelect={() => onChange(e)}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 outline-none data-[highlighted]:bg-verde-50"
                  >
                    <Badge tone={TONO_OTROS[e as keyof typeof TONO_OTROS]}>
                      {ESTADO_CASO_LABEL[e]}
                    </Badge>
                    <span className="ml-auto text-cuerpo-sm text-tinta-terciaria tabular-nums">
                      {n(e)}
                    </span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        )}
      </div>
      <TabsContent value={estado} className="flex flex-col gap-4 focus:outline-none">
        {children}
      </TabsContent>
    </Tabs>
  )
}
