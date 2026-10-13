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

interface ProductoresTableProps {
  productores: Productor[]
  cargando: boolean
  seleccionado: string | null
  onAbrir: (p: Productor) => void
  vacio: ReactNode
}

/** Tabla de productores (artboard 08): Nombre, WhatsApp, Vereda, Finca y Estado. */
export function ProductoresTable({
  productores,
  cargando,
  seleccionado,
  onAbrir,
  vacio,
}: ProductoresTableProps) {
  return (
    <Table
      label="Productores registrados"
      columns={COLUMNAS}
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
