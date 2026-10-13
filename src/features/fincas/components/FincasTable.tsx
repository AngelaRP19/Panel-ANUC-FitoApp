import type { ReactNode } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { VEREDA_LABEL, etiqueta } from '@/locales/es'
import type { Finca } from '../types'

const textoCultivos = (n: number) => (n === 1 ? '1 cultivo' : `${n} cultivos`)

const COLUMNAS: Column<Finca>[] = [
  {
    key: 'finca',
    header: 'Finca',
    render: (f) => (
      <>
        <span className="font-semibold">{f.nombre}</span>{' '}
        <span className="text-nota text-tinta-terciaria">
          · {etiqueta(VEREDA_LABEL, f.vereda, f.vereda)}
        </span>
      </>
    ),
  },
  { key: 'productor', header: 'Productor', render: (f) => f.productor.nombre },
  {
    key: 'cultivos',
    header: 'Cultivos',
    width: '160px',
    className: 'text-tinta-secundaria',
    render: (f) => textoCultivos(f.cultivos.length),
  },
]

interface FincasTableProps {
  fincas: Finca[]
  cargando: boolean
  seleccionada: string | null
  onAbrir: (f: Finca) => void
  vacio: ReactNode
}

/** Tabla de fincas (artboard 09): Finca · vereda, Productor y número de cultivos. */
export function FincasTable({ fincas, cargando, seleccionada, onAbrir, vacio }: FincasTableProps) {
  return (
    <Table
      label="Fincas registradas"
      columns={COLUMNAS}
      rows={fincas}
      rowKey={(f) => f.id}
      loading={cargando}
      loadingLabel="Cargando fincas"
      skeletonRows={10}
      selectedKey={seleccionada}
      onRowOpen={onAbrir}
      rowLabel={(f) => `Finca ${f.nombre}, ${f.productor.nombre}. Ver datos`}
      empty={vacio}
    />
  )
}
