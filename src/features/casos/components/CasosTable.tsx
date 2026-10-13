import type { ReactNode } from 'react'
import { ArrowDown, Clock } from 'lucide-react'
import { CategoriaMarca } from '@/components/ui/CategoriaMarca'
import { EstadoCasoBadge } from '@/components/ui/EstadoBadge'
import { Table, type Column } from '@/components/ui/Table'
import { formatearFechaHora, tiempoEspera } from '@/utils/fechas'
import { iniciales } from '@/utils/texto'
import type { CasoResumen } from '../types'
import { ESTADOS_ACTIVOS, etiquetaFila, nombreCorto } from '../utils'

/** Identificación preliminar en una línea: forma + categoría + % o «No identificada» o «—». */
export function Preliminar({ caso }: { caso: CasoResumen }) {
  const p = caso.preliminar
  if (!p) return <span className="text-tinta-terciaria">—</span>
  if (p.resultado === 'NO_IDENTIFICADO' || !p.categoria) return <CategoriaMarca categoria={null} />
  return <CategoriaMarca categoria={p.categoria} porcentaje={p.porcentaje} />
}

/** Técnico asignado: iniciales + nombre corto, o «Sin asignar» con el tiempo de espera. */
function Tecnico({ caso }: { caso: CasoResumen }) {
  if (caso.tecnico) {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span
          aria-hidden="true"
          className="size-6.5 flex-none rounded-full bg-verde-100 text-center font-titulos text-[11px] leading-6.5 font-bold text-verde-800"
        >
          {iniciales(caso.tecnico.nombre)}
        </span>
        {nombreCorto(caso.tecnico.nombre)}
      </span>
    )
  }
  if (!ESTADOS_ACTIVOS.includes(caso.estado)) return <span className="text-tinta-terciaria">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-nota font-semibold whitespace-nowrap text-advertencia">
      <Clock size={14} strokeWidth={2} aria-hidden="true" />
      Sin asignar
      {caso.enviado_a_panel_en && (
        <span className="font-normal">· {tiempoEspera(caso.enviado_a_panel_en)}</span>
      )}
    </span>
  )
}

interface CasosTableProps {
  casos: CasoResumen[]
  esLider: boolean
  cargando: boolean
  seleccionado: string | null
  onAbrir: (caso: CasoResumen) => void
  vacio: ReactNode
}

/** Tabla de la bandeja (artboard 03 / 12b). El técnico no ve la columna de técnico. */
export function CasosTable({
  casos,
  esLider,
  cargando,
  seleccionado,
  onAbrir,
  vacio,
}: CasosTableProps) {
  const columnas: Column<CasoResumen>[] = [
    {
      key: 'caso',
      header: 'Caso',
      width: '96px',
      skeletonWidth: '44px',
      render: (c) => <span className="codigo font-semibold text-verde-700">#{c.id}</span>,
    },
    { key: 'productor', header: 'Productor', render: (c) => c.productor.nombre },
    { key: 'preliminar', header: 'Preliminar', render: (c) => <Preliminar caso={c} /> },
    {
      key: 'estado',
      header: 'Estado',
      width: '200px',
      skeletonWidth: '120px',
      render: (c) => <EstadoCasoBadge estado={c.estado} />,
    },
    ...(esLider
      ? [
          {
            key: 'tecnico',
            header: 'Técnico',
            render: (c: CasoResumen) => <Tecnico caso={c} />,
          },
        ]
      : []),
    {
      key: 'envio',
      header: (
        <span className="inline-flex items-center gap-1 text-verde-700">
          Enviado al panel
          <ArrowDown size={14} aria-hidden="true" />
          <span className="sr-only">(más recientes primero)</span>
        </span>
      ),
      width: '170px',
      className: 'whitespace-nowrap text-tinta-secundaria',
      render: (c) =>
        c.enviado_a_panel_en ? formatearFechaHora(c.enviado_a_panel_en) : 'Sin enviar',
    },
  ]

  return (
    <Table
      label="Casos"
      columns={columnas}
      rows={casos}
      rowKey={(c) => c.id}
      loading={cargando}
      loadingLabel="Cargando casos"
      skeletonRows={8}
      selectedKey={seleccionado}
      onRowOpen={onAbrir}
      rowLabel={etiquetaFila}
      empty={vacio}
    />
  )
}
