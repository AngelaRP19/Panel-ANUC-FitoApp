import type { ReactNode } from 'react'
import { EstadoCuentaBadge } from '@/components/ui/EstadoBadge'
import { Table, type Column } from '@/components/ui/Table'
import { VEREDA_LABEL, etiqueta } from '@/locales/es'
import { formatearTelefono } from '@/utils/telefono'
import type { Productor } from '../types'

const COLUMNAS: Column<Productor>[] = [
  { key: 'nombre', header: 'Nombre', className: 'font-medium', render: (p) => p.nombre },
  {
    key: 'whatsapp',
    header: 'WhatsApp',
    width: '160px',
    render: (p) => <span className="codigo">{formatearTelefono(p.celular)}</span>,
  },
  {
    key: 'vereda',
    header: 'Vereda',
    render: (p) => (p.vereda ? etiqueta(VEREDA_LABEL, p.vereda, p.vereda) : '—'),
  },
  {
    key: 'finca',
    header: 'Finca',
    render: (p) =>
      p.fincas.length === 0 ? (
        <span className="text-tinta-terciaria">Sin fincas</span>
      ) : p.fincas.length === 1 ? (
        p.fincas[0]!.nombre
      ) : (
        `${p.fincas[0]!.nombre} y ${p.fincas.length - 1} más`
      ),
  },
  {
    key: 'estado',
    header: 'Estado',
    width: '150px',
    skeletonWidth: '90px',
    render: (p) => <EstadoCuentaBadge activo={p.activo} />,
  },
]

const CASILLA = 'm-0 size-4.5 cursor-pointer accent-verde-700'

/** Selección para las acciones masivas (pantalla 21). Persiste entre páginas. */
export interface SeleccionProductores {
  ids: ReadonlySet<string>
  onCambiar: (p: Productor, marcado: boolean) => void
  onCambiarPagina: (productores: Productor[], marcado: boolean) => void
}

interface ProductoresTableProps {
  productores: Productor[]
  cargando: boolean
  seleccionado: string | null
  onAbrir: (p: Productor) => void
  vacio: ReactNode
  seleccion?: SeleccionProductores
}

/**
 * Tabla de productores (artboards 08, 08c): Nombre, WhatsApp, Vereda, Finca y Estado. Con
 * `seleccion`, cada fila lleva una casilla (y el encabezado, la de toda la página).
 */
export function ProductoresTable({
  productores,
  cargando,
  seleccionado,
  onAbrir,
  vacio,
  seleccion,
}: ProductoresTableProps) {
  const todos = productores.length > 0 && productores.every((p) => seleccion?.ids.has(p.id))
  const algunos = productores.some((p) => seleccion?.ids.has(p.id))
  const columnas: Column<Productor>[] = seleccion
    ? [
        {
          key: 'sel',
          width: '52px',
          skeletonWidth: '18px',
          header: (
            <input
              type="checkbox"
              className={CASILLA}
              aria-label="Seleccionar todos los productores de esta página"
              checked={todos}
              ref={(el) => {
                if (el) el.indeterminate = algunos && !todos
              }}
              onChange={(e) => seleccion.onCambiarPagina(productores, e.target.checked)}
            />
          ),
          render: (p) => (
            <input
              type="checkbox"
              className={CASILLA}
              aria-label={`Seleccionar a ${p.nombre}`}
              checked={seleccion.ids.has(p.id)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => seleccion.onCambiar(p, e.target.checked)}
            />
          ),
        },
        ...COLUMNAS,
      ]
    : COLUMNAS

  return (
    <Table
      label="Productores registrados"
      columns={columnas}
      rows={productores}
      rowKey={(p) => p.id}
      loading={cargando}
      loadingLabel="Cargando productores"
      skeletonRows={10}
      selectedKey={seleccionado}
      onRowOpen={onAbrir}
      rowLabel={(p) => `${p.nombre}, ${p.activo ? 'activo' : 'deshabilitado'}. Ver datos`}
      empty={vacio}
    />
  )
}
