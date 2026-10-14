import type { ReactNode } from 'react'
import { EstadoCuentaBadge } from '@/components/ui/EstadoBadge'
import { controlClass } from '@/components/ui/Input'
import { RolBadge } from '@/components/ui/RolBadge'
import { Table, type Column } from '@/components/ui/Table'
import { cn } from '@/utils/cn'
import type { Cuenta, FiltrosCuentas } from '../types'

const COLUMNAS: Column<Cuenta>[] = [
  {
    key: 'nombre',
    header: 'Nombre',
    render: (c) => (
      <>
        <span className="block font-semibold">{c.nombre}</span>
        <span className="block truncate text-nota text-tinta-terciaria">{c.correo}</span>
      </>
    ),
  },
  { key: 'rol', header: 'Rol', width: '200px', render: (c) => <RolBadge rol={c.rol} /> },
  {
    key: 'estado',
    header: 'Estado',
    width: '200px',
    skeletonWidth: '90px',
    render: (c) => <EstadoCuentaBadge activo={c.activo} />,
  },
]

interface CuentasTableProps {
  cuentas: Cuenta[]
  cargando: boolean
  seleccionada: string | null
  onAbrir: (c: Cuenta) => void
  vacio: ReactNode
}

/** Tabla única de cuentas (artboard 10): líderes y técnicos juntos. */
export function CuentasTable({
  cuentas,
  cargando,
  seleccionada,
  onAbrir,
  vacio,
}: CuentasTableProps) {
  return (
    <Table
      label="Cuentas del panel"
      columns={COLUMNAS}
      rows={cuentas}
      rowKey={(c) => c.id}
      loading={cargando}
      loadingLabel="Cargando cuentas"
      skeletonRows={4}
      selectedKey={seleccionada}
      onRowOpen={onAbrir}
      rowLabel={(c) => `${c.nombre}. Ver datos`}
      empty={vacio}
    />
  )
}

const SELECTS: {
  clave: keyof FiltrosCuentas
  etiqueta: string
  todos: string
  opciones: { value: string; label: string }[]
  ancho: string
}[] = [
  {
    clave: 'rol',
    etiqueta: 'Rol',
    todos: 'Todos los roles',
    opciones: [
      { value: 'LIDER_TECNICO', label: 'Líder técnico' },
      { value: 'TECNICO', label: 'Técnico' },
    ],
    ancho: 'sm:w-40',
  },
  {
    clave: 'estado',
    etiqueta: 'Estado de la cuenta',
    todos: 'Todos los estados',
    opciones: [
      { value: 'activa', label: 'Activa' },
      { value: 'deshabilitada', label: 'Deshabilitada' },
    ],
    ancho: 'sm:w-42.5',
  },
  {
    clave: 'carga',
    etiqueta: 'Carga de casos',
    todos: 'Cualquier carga',
    opciones: [
      { value: 'pendientes', label: 'Con casos pendientes' },
      { value: 'sin', label: 'Sin casos asignados' },
    ],
    ancho: 'sm:w-47.5',
  },
]

/** Filtros en línea de cuentas: rol, estado y carga. */
export function CuentasFiltros({
  filtros,
  onCambiar,
}: {
  filtros: FiltrosCuentas
  onCambiar: (cambios: Partial<FiltrosCuentas>) => void
}) {
  return (
    <>
      {SELECTS.map((s) => (
        <select
          key={s.clave}
          aria-label={s.etiqueta}
          value={filtros[s.clave]}
          onChange={(e) => onCambiar({ [s.clave]: e.target.value })}
          className={cn(controlClass, 'h-10 w-full cursor-pointer text-cuerpo-sm', s.ancho)}
        >
          <option value="">{s.todos}</option>
          {s.opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </>
  )
}
