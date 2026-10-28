import { Link } from 'react-router'
import { Lock } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { EstadoAlertaBadge } from '@/components/ui/EstadoBadge'
import { Switch } from '@/components/ui/Switch'
import { Table, type Column } from '@/components/ui/Table'
import { CategoriaMarca } from '@/components/ui/CategoriaMarca'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { CATEGORIA_LABEL, ESPECIE_LABEL, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import type { Categoria, Vereda } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearFecha, formatearFechaCorta, formatearHora } from '@/utils/fechas'
import type { CasoMapa } from '../api'
import { NIVEL_CONCENTRACION, numeroCaso } from '../utils'

const CALOR = ['', 'bg-calor-1 border border-borde', 'bg-calor-2', 'bg-calor-3', 'bg-calor-4']

/** «Capa de concentración» con interruptor, categoría fija y la escala 1-4. */
export function CapaConcentracion({
  activa,
  categoria,
  onCambiar,
}: {
  activa: boolean
  /** Categoría que participa en alertas (hoy Trips). */
  categoria: Categoria
  onCambiar: (activa: boolean) => void
}) {
  return (
    <section
      aria-labelledby="t-capa"
      className="flex flex-col gap-3 rounded-lg border border-borde bg-blanco px-4.5 py-4 shadow-1"
    >
      <div className="flex items-center gap-2">
        <h2 id="t-capa" className="flex-1 titulo-h3">
          Capa de concentración
        </h2>
        <Switch
          checked={activa}
          onCheckedChange={onCambiar}
          aria-label="Mostrar capa de concentración"
        />
      </div>
      <span className="inline-flex h-7 items-center gap-1.5 self-start rounded-pill border border-borde bg-inactivo-suave px-2.5 text-nota font-medium text-inactivo">
        <Lock size={13} aria-hidden="true" />
        Categoría fija: {CATEGORIA_LABEL[categoria]}
      </span>
      <p className="text-cuerpo-sm text-tinta-terciaria">
        {CATEGORIA_LABEL[categoria]} es la única categoría que participa en la detección de
        concentraciones.
      </p>
      <ul className="m-0 grid list-none grid-cols-[22px_1fr] items-center gap-x-2.5 gap-y-1.5 p-0 text-nota">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="contents">
            <span aria-hidden="true" className={cn('h-3.5 w-5.5 rounded-[3px]', CALOR[n])} />
            <span>
              {n} · {NIVEL_CONCENTRACION[n]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Tarjeta de la alerta generada más reciente con «Revisar alerta». */
export function AlertaMapa({
  alerta,
}: {
  alerta: {
    id: string
    generada_en: string
    categoria: Categoria
    vereda: Vereda
    num_casos: number
    radio_km: number
    intervalo_dias: number
  }
}) {
  return (
    <section
      aria-label={`Alerta ${alerta.id}`}
      className="flex flex-col gap-2.5 rounded-lg border border-borde bg-blanco px-4.5 py-4 shadow-1"
    >
      <div className="flex items-center gap-2">
        <EstadoAlertaBadge estado="GENERADA" />
        <span className="text-cuerpo-sm text-tinta-terciaria tabular-nums">
          {formatearFechaCorta(alerta.generada_en)} · {formatearHora(alerta.generada_en)}
        </span>
      </div>
      <div className="font-titulos text-[15px] leading-[22px] font-semibold">
        Posible concentración de {CATEGORIA_LABEL[alerta.categoria]}
      </div>
      <p className="text-cuerpo-sm text-tinta-secundaria">
        {alerta.num_casos} casos confirmados en {String(alerta.radio_km).replace('.', ',')} km ·
        últimos {alerta.intervalo_dias} días · {VEREDA_LABEL[alerta.vereda]}
      </p>
      <Link
        to={`${PATHS.alertas}/${encodeURIComponent(alerta.id)}`}
        className={cn(buttonClass('secondary', 'sm'), 'self-start')}
      >
        Revisar alerta
      </Link>
    </section>
  )
}

/** Tabla de los casos del mapa (alternativa accesible y vista sin clave de Google Maps). */
export function TablaCasosMapa({
  casos,
  seleccionado,
  onAbrir,
}: {
  casos: CasoMapa[]
  seleccionado: string | null
  onAbrir: (c: CasoMapa) => void
}) {
  const columnas: Column<CasoMapa>[] = [
    {
      key: 'caso',
      header: 'Caso',
      width: '88px',
      render: (c) => (
        <Link
          to={PATHS.caso(c.id)}
          onClick={(e) => e.stopPropagation()}
          className="codigo font-semibold text-verde-700"
        >
          {numeroCaso(c)}
        </Link>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (c) => <CategoriaMarca categoria={c.categoria} nombrarForma />,
    },
    {
      key: 'resultado',
      header: 'Resultado',
      render: (c) => <ResultadoTecnicoBadge resultado={c.resultado_tecnico} />,
    },
    { key: 'especie', header: 'Especie', render: (c) => ESPECIE_LABEL[c.especie] },
    {
      key: 'finca',
      header: 'Finca · vereda',
      render: (c) => (
        <>
          {c.finca_nombre}{' '}
          <span className="text-nota text-tinta-terciaria">
            · {VEREDA_LABEL[c.vereda] ?? c.vereda}
          </span>
        </>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      width: '120px',
      render: (c) => formatearFecha(c.fecha),
    },
    {
      key: 'conc',
      header: 'Concentración',
      width: '150px',
      render: (c) =>
        c.concentracion === null ? (
          <span className="text-tinta-terciaria">No participa</span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('h-3 w-4.5 rounded-[3px]', CALOR[c.concentracion])}
            />
            {c.concentracion} · {NIVEL_CONCENTRACION[c.concentracion]}
          </span>
        ),
    },
  ]
  return (
    <Table
      label="Casos del mapa de vigilancia"
      columns={columnas}
      rows={casos}
      rowKey={(c) => c.id}
      selectedKey={seleccionado}
      onRowOpen={onAbrir}
      rowLabel={(c) =>
        `Caso ${numeroCaso(c)}, ${CATEGORIA_LABEL[c.categoria]}, ${c.finca_nombre}. Ubicar en el mapa`
      }
      empty={
        <p className="px-6 py-8 text-center text-cuerpo-sm text-tinta-terciaria">
          No hay casos con estos filtros.
        </p>
      }
    />
  )
}
