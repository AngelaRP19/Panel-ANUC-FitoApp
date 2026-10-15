import type { ReactNode } from 'react'
import { Table, type Column } from '@/components/ui/Table'
import { VEREDA_LABEL } from '@/locales/es'
import type { RegistroConsulta } from '../types'
import { textoCasos } from '../utils'

const COLUMNAS: Column<RegistroConsulta>[] = [
  {
    key: 'productor',
    header: 'Productor',
    className: 'font-semibold',
    render: (r) => r.productor.nombre,
  },
  {
    key: 'finca',
    header: 'Finca',
    render: (r) => (
      <>
        {r.finca.nombre}{' '}
        <span className="text-nota text-tinta-terciaria">· {VEREDA_LABEL[r.finca.vereda]}</span>
      </>
    ),
  },
  {
    key: 'casos',
    header: 'Mis casos',
    className: 'text-tinta-secundaria tabular-nums',
    render: (r) => textoCasos(r.casos.length),
  },
]

interface ConsultaTablaProps {
  registros: RegistroConsulta[]
  cargando: boolean
  seleccionado: string | null
  onAbrir: (r: RegistroConsulta) => void
  vacio: ReactNode
}

/** Productor · Finca · vereda · Mis casos. Cada fila abre la ficha de solo consulta. */
export function ConsultaTabla({
  registros,
  cargando,
  seleccionado,
  onAbrir,
  vacio,
}: ConsultaTablaProps) {
  return (
    <Table
      label="Productores y fincas"
      columns={COLUMNAS}
      rows={registros}
      rowKey={(r) => r.id}
      onRowOpen={onAbrir}
      rowLabel={(r) => `${r.productor.nombre}, finca ${r.finca.nombre}. Ver datos`}
      selectedKey={seleccionado}
      loading={cargando}
      empty={vacio}
    />
  )
}
