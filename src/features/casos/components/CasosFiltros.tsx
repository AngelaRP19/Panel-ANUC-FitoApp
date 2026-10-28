import { useState, type ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AlertCircle, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/Chip'
import { EntradaFecha } from '@/components/ui/EntradaFecha'
import { controlClass } from '@/components/ui/Input'
import { CATEGORIA_LABEL, ESPECIE_LABEL, MENSAJES } from '@/locales/es'
import { cn } from '@/utils/cn'
import { formatearFechaEntrada, parsearFechaEntrada } from '@/utils/fechas'
import { useOpcionesFiltroCasos, useTecnicosAsignables } from '../hooks'
import type { FiltrosCasos } from '../types'
import { CLAVES_PANEL, type FiltrosPanel } from '../utils'

const VACIO: FiltrosPanel = {
  vereda: '',
  finca: '',
  cultivo: '',
  especie: '',
  categoria: '',
  tecnico: '',
  coincidencia: '',
  vencimiento: '',
  desde: '',
  hasta: '',
}

const COINCIDENCIA = [
  { value: '50', label: 'Desde 50 %' },
  { value: '70', label: 'Desde 70 %' },
  { value: '85', label: 'Desde 85 %' },
]
const VENCIMIENTO = [
  { value: '15', label: 'Vence en 15 días o menos' },
  { value: '30', label: 'Vence en 30 días o menos' },
]
const CATEGORIAS = [
  ...Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({ value, label })),
  { value: 'NO_IDENTIFICADA', label: 'No identificada' },
]
const ESPECIES = Object.entries(ESPECIE_LABEL).map(([value, label]) => ({ value, label }))

interface Opcion {
  value: string
  label: string
}

/** Campo compacto del panel de filtros (pf-filtro: etiqueta de 12 px, control de 36 px). */
function CampoFiltro({
  id,
  label,
  children,
  error,
}: {
  id: string
  label: ReactNode
  children: ReactNode
  error?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs leading-4 font-semibold text-tinta-secundaria">
        {label}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} role="alert" className="flex gap-1 text-nota text-peligro">
          <AlertCircle size={14} className="mt-0.5 flex-none" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  )
}

function SelectFiltro({
  id,
  value,
  onChange,
  todos,
  opciones,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  todos: string
  opciones: Opcion[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(controlClass, 'h-9 cursor-pointer text-cuerpo-sm')}
    >
      <option value="">{todos}</option>
      {opciones.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface CasosFiltrosProps {
  filtros: FiltrosCasos
  onAplicar: (f: FiltrosPanel) => void
  /** El técnico no filtra por técnico: solo ve sus casos. */
  esLider: boolean
}

/** Botón «Filtros» con su panel (artboard 03). Los cambios se aplican con «Aplicar filtros». */
export function CasosFiltros({ filtros, onAplicar, esLider }: CasosFiltrosProps) {
  const [abierto, setAbierto] = useState(false)
  const [borrador, setBorrador] = useState<FiltrosPanel>(VACIO)
  const [fechas, setFechas] = useState({ desde: '', hasta: '' })
  const [errores, setErrores] = useState<{ desde?: string; hasta?: string }>({})
  const { data: opciones } = useOpcionesFiltroCasos()
  const { data: tecnicos } = useTecnicosAsignables({ enabled: esLider })
  const activos = CLAVES_PANEL.filter((k) => filtros[k]).length

  const abrir = (siguiente: boolean) => {
    if (siguiente) {
      // Al abrir, el borrador parte de los filtros vigentes (los de la URL).
      const actual = Object.fromEntries(CLAVES_PANEL.map((k) => [k, filtros[k]])) as FiltrosPanel
      setBorrador(actual)
      setFechas({
        desde: formatearFechaEntrada(actual.desde),
        hasta: formatearFechaEntrada(actual.hasta),
      })
      setErrores({})
    }
    setAbierto(siguiente)
  }

  const cambiar = (k: keyof FiltrosPanel, v: string) =>
    setBorrador((b) => {
      const n = { ...b, [k]: v }
      // Finca y cultivo dependen de la vereda y la finca elegidas.
      if (k === 'vereda') {
        n.finca = ''
        n.cultivo = ''
      }
      if (k === 'finca') n.cultivo = ''
      return n
    })

  const aplicar = () => {
    const desde = fechas.desde.trim() ? parsearFechaEntrada(fechas.desde) : ''
    const hasta = fechas.hasta.trim() ? parsearFechaEntrada(fechas.hasta) : ''
    const e: typeof errores = {}
    if (desde === null) e.desde = 'Escribe la fecha como dd/mm/aaaa'
    if (hasta === null) e.hasta = 'Escribe la fecha como dd/mm/aaaa'
    if (desde && hasta && desde > hasta) e.hasta = 'Debe ser igual o posterior a «desde»'
    setErrores(e)
    if (Object.keys(e).length > 0) return
    onAplicar({ ...borrador, desde: desde ?? '', hasta: hasta ?? '' })
    setAbierto(false)
  }

  const fincas = (opciones?.fincas ?? []).filter(
    (f) => !borrador.vereda || f.vereda === borrador.vereda,
  )
  const cultivos = (opciones?.cultivos ?? []).filter(
    (c) =>
      (!borrador.finca && fincas.some((f) => f.id === c.finca_id)) || c.finca_id === borrador.finca,
  )

  return (
    <Popover.Root open={abierto} onOpenChange={abrir}>
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-9"
          aria-label={
            activos > 0 ? `Filtros, ${activos} ${activos === 1 ? 'activo' : 'activos'}` : 'Filtros'
          }
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtros
          {activos > 0 && (
            <span className="inline-grid h-4.5 min-w-4.5 place-items-center rounded-full bg-verde-700 px-1.25 text-[11px] leading-none font-semibold text-blanco">
              {activos}
            </span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          aria-label="Filtros de la bandeja"
          className="z-40 grid w-145 max-w-[calc(100vw-32px)] grid-cols-1 gap-x-4 gap-y-3 rounded-md border border-borde bg-blanco p-4 shadow-2 sm:grid-cols-2"
        >
          <CampoFiltro id="f-vereda" label="Vereda">
            <SelectFiltro
              id="f-vereda"
              value={borrador.vereda}
              onChange={(v) => cambiar('vereda', v)}
              todos="Todas"
              opciones={(opciones?.veredas ?? []).map((v) => ({ value: v.id, label: v.nombre }))}
            />
          </CampoFiltro>
          <CampoFiltro id="f-finca" label="Finca">
            <SelectFiltro
              id="f-finca"
              value={borrador.finca}
              onChange={(v) => cambiar('finca', v)}
              todos="Todas"
              opciones={fincas.map((f) => ({ value: f.id, label: f.nombre }))}
            />
          </CampoFiltro>
          <CampoFiltro id="f-cultivo" label="Cultivo">
            <SelectFiltro
              id="f-cultivo"
              value={borrador.cultivo}
              onChange={(v) => cambiar('cultivo', v)}
              todos="Todos"
              opciones={cultivos.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          </CampoFiltro>
          <CampoFiltro id="f-especie" label="Especie">
            <SelectFiltro
              id="f-especie"
              value={borrador.especie}
              onChange={(v) => cambiar('especie', v)}
              todos="Todas"
              opciones={ESPECIES}
            />
          </CampoFiltro>
          <CampoFiltro id="f-cat" label="Categoría preliminar">
            <SelectFiltro
              id="f-cat"
              value={borrador.categoria}
              onChange={(v) => cambiar('categoria', v)}
              todos="Todas"
              opciones={CATEGORIAS}
            />
          </CampoFiltro>
          {esLider && (
            <CampoFiltro id="f-tec" label="Técnico">
              <SelectFiltro
                id="f-tec"
                value={borrador.tecnico}
                onChange={(v) => cambiar('tecnico', v)}
                todos="Todos"
                opciones={[
                  { value: 'sin_asignar', label: 'Sin asignar' },
                  ...(tecnicos ?? []).map((t) => ({ value: t.id, label: t.nombre })),
                ]}
              />
            </CampoFiltro>
          )}
          <CampoFiltro id="f-coin" label="Coincidencia de síntomas mínima">
            <SelectFiltro
              id="f-coin"
              value={borrador.coincidencia}
              onChange={(v) => cambiar('coincidencia', v)}
              todos="Cualquiera"
              opciones={COINCIDENCIA}
            />
          </CampoFiltro>
          <CampoFiltro id="f-venc" label="Vencimiento de conservación">
            <SelectFiltro
              id="f-venc"
              value={borrador.vencimiento}
              onChange={(v) => cambiar('vencimiento', v)}
              todos="Cualquiera"
              opciones={VENCIMIENTO}
            />
          </CampoFiltro>
          {(['desde', 'hasta'] as const).map((k) => (
            <CampoFiltro
              key={k}
              id={`f-${k}`}
              error={errores[k]}
              label={
                <>
                  Recibido {k}{' '}
                  <span className="font-normal text-tinta-terciaria">(dd/mm/aaaa)</span>
                </>
              }
            >
              <EntradaFecha
                id={`f-${k}`}
                value={fechas[k]}
                onChange={(e) => setFechas((f) => ({ ...f, [k]: e.target.value }))}
                onElegirFecha={(fecha) => {
                  setFechas((f) => ({ ...f, [k]: formatearFechaEntrada(fecha) }))
                  setErrores((e) => ({ ...e, [k]: undefined }))
                }}
                invalid={!!errores[k]}
                aria-describedby={errores[k] ? `f-${k}-error` : undefined}
                className="h-9 text-cuerpo-sm"
              />
            </CampoFiltro>
          ))}
          <div className="flex justify-end gap-2 pt-1 sm:col-span-2">
            <Button
              variant="text"
              size="sm"
              onClick={() => {
                setBorrador(VACIO)
                setFechas({ desde: '', hasta: '' })
                setErrores({})
              }}
            >
              Limpiar
            </Button>
            <Button variant="secondary" size="sm" onClick={aplicar}>
              Aplicar filtros
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface FiltrosActivosProps {
  filtros: FiltrosCasos
  onQuitar: (clave: keyof FiltrosPanel | 'q') => void
  onLimpiar: () => void
}

/** Chips con los filtros activos y «Limpiar filtros» (guía 7.3). */
export function FiltrosActivos({ filtros, onQuitar, onLimpiar }: FiltrosActivosProps) {
  const { data: opciones } = useOpcionesFiltroCasos()
  const { data: tecnicos } = useTecnicosAsignables({ enabled: !!filtros.tecnico })

  const texto: Record<keyof FiltrosPanel | 'q', (v: string) => string> = {
    q: (v) => `Búsqueda: ${v}`,
    vereda: (v) => `Vereda: ${opciones?.veredas.find((x) => x.id === v)?.nombre ?? v}`,
    finca: (v) => `Finca: ${opciones?.fincas.find((x) => x.id === v)?.nombre ?? v}`,
    cultivo: (v) => `Cultivo: ${opciones?.cultivos.find((x) => x.id === v)?.nombre ?? v}`,
    especie: (v) => `Especie: ${ESPECIE_LABEL[v as keyof typeof ESPECIE_LABEL] ?? v}`,
    categoria: (v) => `Categoría: ${CATEGORIAS.find((x) => x.value === v)?.label ?? v}`,
    tecnico: (v) =>
      v === 'sin_asignar'
        ? 'Técnico: sin asignar'
        : `Técnico: ${tecnicos?.find((x) => x.id === v)?.nombre ?? v}`,
    coincidencia: (v) => `Coincidencia desde ${v} %`,
    vencimiento: (v) => VENCIMIENTO.find((x) => x.value === v)?.label ?? v,
    desde: (v) => `Recibido desde ${formatearFechaEntrada(v)}`,
    hasta: (v) => `Recibido hasta ${formatearFechaEntrada(v)}`,
  }
  const activos = (['q', ...CLAVES_PANEL] as const).filter((k) => filtros[k])
  if (activos.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtros activos" role="group">
      {activos.map((k) => {
        const etiqueta = texto[k](filtros[k])
        return (
          <FilterChip
            key={k}
            onRemove={() => onQuitar(k)}
            removeLabel={`Quitar filtro ${etiqueta}`}
          >
            {etiqueta}
          </FilterChip>
        )
      })}
      <Button variant="text" size="sm" onClick={onLimpiar}>
        {MENSAJES.limpiarFiltros}
      </Button>
    </div>
  )
}
