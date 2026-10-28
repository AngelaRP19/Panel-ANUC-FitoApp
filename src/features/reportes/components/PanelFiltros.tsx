import { useState, type ReactNode } from 'react'
import { Save, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormaCategoria } from '@/components/ui/CategoriaMarca'
import { Chip } from '@/components/ui/Chip'
import { Drawer } from '@/components/ui/Drawer'
import { EntradaFecha } from '@/components/ui/EntradaFecha'
import { RequiredLegend } from '@/components/ui/FormField'
import { controlClass } from '@/components/ui/Input'
import { useOpcionesFiltroCasos, useTecnicosAsignables } from '@/features/casos'
import { useCuentas } from '@/features/usuarios'
import { useDebounce } from '@/hooks/useDebounce'
import { CATEGORIA_LABEL, ESPECIE_LABEL, VEREDA_LABEL } from '@/locales/es'
import type { Categoria } from '@/types/enums'
import { cn } from '@/utils/cn'
import { formatearFechaEntrada, parsearFechaEntrada } from '@/utils/fechas'
import { useReporte } from '../hooks'
import type { FiltrosReporte, PanelFiltros as Panel, TipoReporte } from '../types'
import { CLAVES_PANEL, lista, PANELES, PERIODOS, rangoPeriodo } from '../utils'
import { SelectorProductores } from './SelectorProductores'

const ESTADOS_CASO = [
  ['CREADO', 'Caso creado'],
  ['EN_ANALISIS', 'En análisis'],
  ['PENDIENTE_REVISION', 'Pendiente de revisión'],
  ['EN_REVISION', 'En revisión'],
  ['REGISTRADO', 'Registrado'],
  ['CERRADO', 'Cerrado'],
  ['DESCARTADO', 'Descartado'],
] as const
const ESTADOS_ALERTA = [
  ['GENERADA', 'Generada'],
  ['EN_REVISION', 'En revisión'],
  ['CONFIRMADA', 'Confirmada'],
  ['COMUNICADA', 'Comunicada'],
  ['DESCARTADA', 'Descartada'],
] as const
const CATEGORIAS: Categoria[] = ['TRIPS', 'BOTRYTIS', 'RONA', 'FUSARIUM', 'DEFICIENCIA_MAGNESIO']

type Borrador = FiltrosReporte
type Cambiar = (cambios: Borrador) => void

function Grupo({
  titulo,
  extra,
  children,
}: {
  titulo: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 border-b border-borde p-0 pb-4 last:border-b-0">
      <legend className="mb-1 flex w-full justify-between p-0 sobretitulo">
        <span>{titulo}</span>
        {extra}
      </legend>
      {children}
    </fieldset>
  )
}

function Campo({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: ReactNode
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="etiqueta">
        {label}
      </label>
      {children}
      {hint && (
        <span id={`${id}-h`} className="text-nota text-tinta-terciaria">
          {hint}
        </span>
      )}
    </div>
  )
}

function Seleccion({
  id,
  label,
  valor,
  opciones,
  todos,
  onCambiar,
}: {
  id: string
  label: string
  valor: string
  opciones: { valor: string; etiqueta: string }[]
  todos: string
  onCambiar: (v: string) => void
}) {
  return (
    <Campo id={id} label={label}>
      <select
        id={id}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        className={cn(controlClass, 'h-9.5 cursor-pointer text-cuerpo-sm')}
      >
        <option value="">{todos}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  )
}

function Texto({
  id,
  label,
  valor,
  hint,
  placeholder,
  onCambiar,
}: {
  id: string
  label: ReactNode
  valor: string
  hint?: string
  placeholder?: string
  onCambiar: (v: string) => void
}) {
  return (
    <Campo id={id} label={label} hint={hint}>
      <input
        id={id}
        value={valor}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-h` : undefined}
        onChange={(e) => onCambiar(e.target.value)}
        className={cn(controlClass, 'h-9.5 text-cuerpo-sm tabular-nums')}
      />
    </Campo>
  )
}

/** Fecha «dd/mm/aaaa» que se escribe o se elige en el calendario. */
function Fecha({
  id,
  label,
  valor,
  onCambiar,
}: {
  id: string
  label: ReactNode
  valor: string
  onCambiar: (texto: string) => void
}) {
  return (
    <Campo id={id} label={label}>
      <EntradaFecha
        id={id}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        onElegirFecha={(f) => onCambiar(formatearFechaEntrada(f))}
        className="h-9.5 text-cuerpo-sm"
      />
    </Campo>
  )
}

/** Casillas de una lista (valor guardado separado por comas). */
function Casillas({
  clave,
  opciones,
  borrador,
  onCambiar,
}: {
  clave: string
  opciones: { valor: string; etiqueta: ReactNode; deshabilitada?: boolean; nota?: string }[]
  borrador: Borrador
  onCambiar: Cambiar
}) {
  const elegidos = lista(borrador[clave])
  const alternar = (v: string, marcado: boolean) =>
    onCambiar({
      [clave]: (marcado ? [...elegidos, v] : elegidos.filter((x) => x !== v)).join(','),
    })
  return (
    <div className="flex flex-col">
      {opciones.map((o) => (
        <label
          key={o.valor}
          className={cn(
            'flex min-h-8 items-center gap-2.5 text-cuerpo-sm',
            o.deshabilitada ? 'text-tinta-terciaria' : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            disabled={o.deshabilitada}
            checked={elegidos.includes(o.valor)}
            onChange={(e) => alternar(o.valor, e.target.checked)}
            className="m-0 size-4.5 flex-none accent-verde-700"
          />
          <span className="flex flex-1 items-center gap-2">{o.etiqueta}</span>
          {o.nota && <span className="text-nota">{o.nota}</span>}
        </label>
      ))}
    </div>
  )
}

/** Chips conmutables (varios a la vez) guardados separados por comas. */
function Chips({
  clave,
  opciones,
  borrador,
  onCambiar,
  etiqueta,
}: {
  clave: string
  opciones: { valor: string; etiqueta: string }[]
  borrador: Borrador
  onCambiar: Cambiar
  etiqueta: string
}) {
  const elegidos = lista(borrador[clave])
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
      {opciones.map((o) => {
        const on = elegidos.includes(o.valor)
        return (
          <Chip
            key={o.valor}
            pressed={on}
            className="h-7.5 text-nota"
            onClick={() =>
              onCambiar({
                [clave]: (on ? elegidos.filter((x) => x !== o.valor) : [...elegidos, o.valor]).join(
                  ',',
                ),
              })
            }
          >
            {o.etiqueta}
          </Chip>
        )
      })}
    </div>
  )
}

function Radios({
  clave,
  opciones,
  borrador,
  onCambiar,
  etiqueta,
}: {
  clave: string
  opciones: { valor: string; etiqueta: string }[]
  borrador: Borrador
  onCambiar: Cambiar
  etiqueta: string
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex flex-col">
      {opciones.map((o) => (
        <label
          key={o.valor}
          className="flex min-h-8 cursor-pointer items-center gap-2.5 text-cuerpo-sm"
        >
          <input
            type="radio"
            name={`r-${clave}`}
            checked={(borrador[clave] ?? '') === o.valor}
            onChange={() => onCambiar({ [clave]: o.valor })}
            className="m-0 size-4.5 flex-none accent-verde-700"
          />
          {o.etiqueta}
        </label>
      ))}
    </div>
  )
}

const opciones = (m: Record<string, string>) =>
  Object.entries(m).map(([valor, etiqueta]) => ({ valor, etiqueta }))

/** Periodo: chips rápidos y Desde/Hasta (al escribir una fecha pasa a «Personalizado»). */
function Periodo({
  borrador,
  error,
  onCambiar,
}: {
  borrador: Borrador
  error: string | null
  onCambiar: Cambiar
}) {
  const r = rangoPeriodo(borrador)
  const [textos, setTextos] = useState({
    desde: formatearFechaEntrada(r.desde),
    hasta: formatearFechaEntrada(r.hasta),
  })
  const elegir = (periodo: string) => {
    if (periodo === 'personalizado') {
      onCambiar({ periodo, desde: r.desde, hasta: r.hasta })
      return
    }
    const nuevo = rangoPeriodo({ periodo })
    setTextos({
      desde: formatearFechaEntrada(nuevo.desde),
      hasta: formatearFechaEntrada(nuevo.hasta),
    })
    onCambiar({ periodo, desde: '', hasta: '' })
  }
  const escribir = (k: 'desde' | 'hasta', texto: string) => {
    const n = { ...textos, [k]: texto }
    setTextos(n)
    onCambiar({
      periodo: 'personalizado',
      desde: parsearFechaEntrada(n.desde) ?? (n.desde ? 'invalida' : ''),
      hasta: parsearFechaEntrada(n.hasta) ?? (n.hasta ? 'invalida' : ''),
    })
  }
  return (
    <Grupo titulo="Periodo">
      <div role="group" aria-label="Periodo rápido" className="flex flex-wrap gap-1.5">
        {PERIODOS.map((p) => (
          <Chip
            key={p.valor}
            pressed={r.periodo === p.valor}
            className="h-7.5 text-nota"
            onClick={() => elegir(p.valor)}
          >
            {p.etiqueta}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['desde', 'hasta'] as const).map((k) => (
          <Fecha
            key={k}
            id={`fr-${k}`}
            label={
              <>
                {k === 'desde' ? 'Desde' : 'Hasta'}{' '}
                <span aria-hidden="true" className="font-semibold text-peligro">
                  *
                </span>{' '}
                <span className="font-normal text-tinta-terciaria">(dd/mm/aaaa)</span>
              </>
            }
            valor={textos[k]}
            onCambiar={(v) => escribir(k, v)}
          />
        ))}
      </div>
      {error ? (
        <span role="alert" className="text-nota font-medium text-peligro">
          {error}
        </span>
      ) : (
        <span className="text-nota text-tinta-terciaria">El rango máximo es de 12 meses.</span>
      )}
    </Grupo>
  )
}

/** Valida el periodo del borrador: fechas válidas, Desde ≤ Hasta y máximo 12 meses. */
function errorPeriodo(b: Borrador) {
  if (b.desde === 'invalida' || b.hasta === 'invalida')
    return 'Escribe las fechas con el formato dd/mm/aaaa.'
  if (b.periodo === 'personalizado' && (!b.desde || !b.hasta))
    return 'Escribe las fechas Desde y Hasta.'
  const r = rangoPeriodo(b)
  if (r.desde > r.hasta) return 'La fecha «Desde» no puede ser posterior a «Hasta».'
  const dias =
    (Date.parse(`${r.hasta}T12:00:00Z`) - Date.parse(`${r.desde}T12:00:00Z`)) / 86_400_000
  if (dias > 366) return 'El rango máximo es de 12 meses.'
  return null
}

/** Campos propios de cada panel. */
function CamposPanel({
  panel,
  borrador,
  onCambiar,
}: {
  panel: Panel
  borrador: Borrador
  onCambiar: Cambiar
}) {
  const opcionesCasos = useOpcionesFiltroCasos()
  const tecnicos = useTecnicosAsignables({ enabled: panel === 'general' })
  const cuentas = useCuentas({ q: '', rol: '', estado: '', carga: '', page: '1' })
  const set = (k: string) => (v: string) => onCambiar({ [k]: v })
  const veredas = opciones(VEREDA_LABEL)
  const especies = opciones(ESPECIE_LABEL)
  const tiposCultivo = [
    { valor: 'CAMPO_ABIERTO', etiqueta: 'Campo abierto' },
    { valor: 'INVERNADERO', etiqueta: 'Invernadero' },
  ]
  const contador = (k: string, total: number) => {
    const n = lista(borrador[k]).length
    return n ? (
      <span className="font-medium tracking-normal text-verde-700 normal-case tabular-nums">
        {n} de {total}
      </span>
    ) : undefined
  }

  if (panel === 'general') {
    return (
      <>
        <Grupo titulo="Ubicación">
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              id="fr-vereda"
              label="Vereda"
              valor={borrador.vereda ?? ''}
              todos="Todas"
              opciones={veredas}
              onCambiar={set('vereda')}
            />
            <Seleccion
              id="fr-finca"
              label="Finca"
              valor={borrador.finca ?? ''}
              todos="Todas"
              opciones={(opcionesCasos.data?.fincas ?? []).map((f) => ({
                valor: f.id,
                etiqueta: f.nombre,
              }))}
              onCambiar={set('finca')}
            />
          </div>
          <SelectorProductores valor={borrador.productor ?? ''} onCambiar={set('productor')} />
        </Grupo>
        <Grupo titulo="Cultivo">
          <span className="etiqueta">Especie</span>
          <Chips
            clave="especie"
            etiqueta="Especie"
            opciones={especies}
            borrador={borrador}
            onCambiar={onCambiar}
          />
          <span className="mt-1 etiqueta">Tipo de cultivo</span>
          <Chips
            clave="tipo_cultivo"
            etiqueta="Tipo de cultivo"
            opciones={tiposCultivo}
            borrador={borrador}
            onCambiar={onCambiar}
          />
        </Grupo>
        <Grupo titulo="Estado del caso" extra={contador('estado', ESTADOS_CASO.length)}>
          <Casillas
            clave="estado"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={ESTADOS_CASO.map(([valor, etiqueta]) => ({ valor, etiqueta }))}
          />
        </Grupo>
        <Grupo titulo="Identificación preliminar" extra={contador('categoria', 6)}>
          <span className="etiqueta">Categoría fitosanitaria</span>
          <Casillas
            clave="categoria"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={[
              ...CATEGORIAS.map((c) => ({
                valor: c,
                etiqueta: (
                  <>
                    <FormaCategoria categoria={c} />
                    {CATEGORIA_LABEL[c]}
                  </>
                ),
              })),
              {
                valor: 'NO_IDENTIFICADA',
                etiqueta: (
                  <>
                    <FormaCategoria categoria={null} />
                    No identificada
                  </>
                ),
              },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Texto
              id="fr-cmin"
              label="Coincidencia mínima"
              valor={borrador.coincidencia_min ?? ''}
              placeholder="0"
              hint="Entero de 0 a 100 · %"
              onCambiar={set('coincidencia_min')}
            />
            <Texto
              id="fr-cmax"
              label="Coincidencia máxima"
              valor={borrador.coincidencia_max ?? ''}
              placeholder="100"
              hint="Entero de 0 a 100 · %"
              onCambiar={set('coincidencia_max')}
            />
          </div>
        </Grupo>
        <Grupo titulo="Diagnóstico y seguimiento">
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              id="fr-res"
              label="Resultado técnico"
              valor={borrador.resultado ?? ''}
              todos="Todos"
              opciones={[
                { valor: 'CONFIRMADO', etiqueta: 'Confirmado' },
                { valor: 'OTRA_PATOLOGIA', etiqueta: 'Otra patología' },
                { valor: 'NO_IDENTIFICADO', etiqueta: 'No identificado' },
                { valor: 'REQUIERE_VISITA', etiqueta: 'Requiere visita' },
                { valor: 'SIN_DIAGNOSTICO', etiqueta: 'Sin diagnóstico aún' },
              ]}
              onCambiar={set('resultado')}
            />
            <Seleccion
              id="fr-tec"
              label="Técnico"
              valor={borrador.tecnico ?? ''}
              todos="Todos"
              opciones={[
                ...(tecnicos.data ?? []).map((t) => ({ valor: t.id, etiqueta: t.nombre })),
                { valor: 'sin', etiqueta: 'Sin técnico' },
              ]}
              onCambiar={set('tecnico')}
            />
          </div>
        </Grupo>
      </>
    )
  }

  if (panel === 'alertas') {
    return (
      <>
        <Grupo
          titulo="Estado de la alerta"
          extra={contador('estado_alerta', ESTADOS_ALERTA.length)}
        >
          <Casillas
            clave="estado_alerta"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={ESTADOS_ALERTA.map(([valor, etiqueta]) => ({ valor, etiqueta }))}
          />
        </Grupo>
        <Grupo titulo="Ubicación">
          <Seleccion
            id="fr-vereda"
            label="Vereda"
            valor={borrador.vereda ?? ''}
            todos="Todas"
            opciones={veredas}
            onCambiar={set('vereda')}
          />
        </Grupo>
        <Grupo titulo="Categoría fitosanitaria">
          <Casillas
            clave="_categoria_fija"
            borrador={{ _categoria_fija: 'TRIPS' }}
            onCambiar={() => {}}
            opciones={CATEGORIAS.map((c) => ({
              valor: c,
              deshabilitada: true,
              nota: c === 'TRIPS' ? undefined : 'No participa',
              etiqueta: (
                <>
                  <FormaCategoria categoria={c} />
                  {CATEGORIA_LABEL[c]}
                  {c === 'TRIPS' && ' · participa en alertas'}
                </>
              ),
            }))}
          />
        </Grupo>
        <Grupo titulo="Decisión y aviso">
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              id="fr-dec"
              label="Decidida por"
              valor={borrador.decidida ?? ''}
              todos="Cualquiera"
              opciones={[
                ...(cuentas.data?.items ?? [])
                  .filter((c) => c.rol === 'LIDER_TECNICO')
                  .map((c) => ({ valor: c.id, etiqueta: c.nombre })),
                { valor: 'sin', etiqueta: 'Sin decisión' },
              ]}
              onCambiar={set('decidida')}
            />
            <Texto
              id="fr-cmin-al"
              label="Casos involucrados mínimos"
              valor={borrador.casos_min ?? ''}
              placeholder="3"
              hint="Entero, mínimo 3"
              onCambiar={set('casos_min')}
            />
          </div>
          <span className="etiqueta">Comunicada a productores</span>
          <Radios
            clave="comunicada"
            etiqueta="Comunicada a productores"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={[
              { valor: '', etiqueta: 'Todas' },
              { valor: 'si', etiqueta: 'Solo comunicadas' },
              { valor: 'sin_comunicar', etiqueta: 'Confirmadas sin comunicar' },
            ]}
          />
        </Grupo>
      </>
    )
  }

  if (panel === 'productores') {
    return (
      <>
        <Grupo titulo="Productor">
          <span className="etiqueta">Estado del productor</span>
          <Casillas
            clave="estado_productor"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={[
              { valor: 'activo', etiqueta: 'Activo' },
              { valor: 'deshabilitado', etiqueta: 'Deshabilitado' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Fecha
              id="fr-rdesde"
              label="Registrado desde (dd/mm/aaaa)"
              valor={borrador._rdesde ?? formatearFechaEntrada(borrador.registrado_desde)}
              onCambiar={(v) =>
                onCambiar({ _rdesde: v, registrado_desde: parsearFechaEntrada(v) ?? '' })
              }
            />
            <Fecha
              id="fr-rhasta"
              label="Registrado hasta (dd/mm/aaaa)"
              valor={borrador._rhasta ?? formatearFechaEntrada(borrador.registrado_hasta)}
              onCambiar={(v) =>
                onCambiar({ _rhasta: v, registrado_hasta: parsearFechaEntrada(v) ?? '' })
              }
            />
          </div>
        </Grupo>
        <Grupo titulo="Ubicación y cultivo">
          <div className="grid grid-cols-2 gap-3">
            <Seleccion
              id="fr-vereda"
              label="Vereda"
              valor={borrador.vereda ?? ''}
              todos="Todas"
              opciones={veredas}
              onCambiar={set('vereda')}
            />
            <Seleccion
              id="fr-tipo"
              label="Tipo de cultivo"
              valor={borrador.tipo_cultivo ?? ''}
              todos="Todos"
              opciones={tiposCultivo}
              onCambiar={set('tipo_cultivo')}
            />
          </div>
          <span className="etiqueta">Especie</span>
          <Chips
            clave="especie"
            etiqueta="Especie"
            opciones={especies}
            borrador={borrador}
            onCambiar={onCambiar}
          />
        </Grupo>
        <Grupo titulo="Casos">
          <div className="grid grid-cols-2 gap-3">
            <Texto
              id="fr-cdesde"
              label="Casos en el periodo, desde"
              valor={borrador.casos_desde ?? ''}
              hint="Entero · ej. 3"
              onCambiar={set('casos_desde')}
            />
            <Texto
              id="fr-chasta"
              label="hasta"
              valor={borrador.casos_hasta ?? ''}
              hint="Entero, vacío = sin límite"
              onCambiar={set('casos_hasta')}
            />
          </div>
          <Casillas
            clave="con_activos"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={[{ valor: '1', etiqueta: 'Solo productores con casos activos' }]}
          />
        </Grupo>
        <Grupo titulo="Chatbot de WhatsApp">
          <Radios
            clave="chatbot"
            etiqueta="Chatbot de WhatsApp"
            borrador={borrador}
            onCambiar={onCambiar}
            opciones={[
              { valor: '', etiqueta: 'Cualquier uso' },
              { valor: '30', etiqueta: 'Consultó en los últimos 30 días' },
              { valor: '90', etiqueta: 'Sin consultas en 90 días' },
              { valor: 'abandono', etiqueta: 'Abandonó una conversación' },
            ]}
          />
        </Grupo>
      </>
    )
  }

  const todas = cuentas.data?.items ?? []
  return (
    <>
      <Grupo titulo="Técnicos" extra={contador('tecnicos', todas.length)}>
        <Casillas
          clave="tecnicos"
          borrador={borrador}
          onCambiar={onCambiar}
          opciones={todas.map((c) => ({
            valor: c.id,
            etiqueta: `${c.nombre}${c.rol === 'LIDER_TECNICO' ? ' · líder técnico' : ''}${c.activo ? '' : ' · deshabilitada'}`,
          }))}
        />
      </Grupo>
      <Grupo titulo="Cuenta">
        <div className="grid grid-cols-2 gap-3">
          <Seleccion
            id="fr-rol"
            label="Rol"
            valor={borrador.rol ?? ''}
            todos="Todos"
            opciones={[
              { valor: 'TECNICO', etiqueta: 'Técnico' },
              { valor: 'LIDER_TECNICO', etiqueta: 'Líder técnico' },
            ]}
            onCambiar={set('rol')}
          />
          <Seleccion
            id="fr-cuenta"
            label="Estado de la cuenta"
            valor={borrador.estado_cuenta ?? ''}
            todos="Todas"
            opciones={[
              { valor: 'activa', etiqueta: 'Activa' },
              { valor: 'deshabilitada', etiqueta: 'Deshabilitada' },
            ]}
            onCambiar={set('estado_cuenta')}
          />
        </div>
      </Grupo>
      <Grupo titulo="Desempeño">
        <div className="grid grid-cols-2 gap-3">
          <Texto
            id="fr-ddesde"
            label="Días de revisión, desde"
            valor={borrador.dias_desde ?? ''}
            hint="Decimal con coma · ej. 1,5"
            onCambiar={set('dias_desde')}
          />
          <Texto
            id="fr-dhasta"
            label="hasta"
            valor={borrador.dias_hasta ?? ''}
            hint="Decimal con coma · ej. 3,0"
            onCambiar={set('dias_hasta')}
          />
        </div>
        <Casillas
          clave="con_pendientes"
          borrador={borrador}
          onCambiar={onCambiar}
          opciones={[{ valor: '1', etiqueta: 'Con casos pendientes sin revisar' }]}
        />
      </Grupo>
    </>
  )
}

/** Quita las claves auxiliares del borrador (texto de fechas a medio escribir). */
const limpiarAuxiliares = (b: Borrador) =>
  Object.fromEntries(Object.entries(b).filter(([k]) => !k.startsWith('_'))) as Borrador

interface PanelFiltrosProps {
  panel: Panel
  /** Reporte que da el conteo «N coinciden» (el resumen usa el de casos). */
  tipoConteo: TipoReporte
  filtros: FiltrosReporte
  onAplicar: (filtros: FiltrosReporte) => void
  onGuardar: (filtros: FiltrosReporte) => void
  onClose: () => void
}

/**
 * Panel lateral de filtros (artboards F1-F4): periodo y los filtros propios del reporte, con
 * el número de elementos que coinciden. «Aplicar filtros» los lleva a la URL.
 */
export function PanelFiltros({
  panel,
  tipoConteo,
  filtros,
  onAplicar,
  onGuardar,
  onClose,
}: PanelFiltrosProps) {
  const [borrador, setBorrador] = useState<Borrador>(filtros)
  const [intentado, setIntentado] = useState(false)
  const cambiar: Cambiar = (c) => setBorrador((b) => ({ ...b, ...c }))
  const error = errorPeriodo(borrador)
  const limpio = limpiarAuxiliares(borrador)
  const conRetraso = useDebounce(JSON.stringify(limpio), 300)
  const conteo = useReporte(tipoConteo, JSON.parse(conRetraso) as Borrador, !error)
  const meta = PANELES[panel]
  const activos = CLAVES_PANEL[panel].filter((k) => limpio[k]).length

  const aplicar = () => {
    setIntentado(true)
    if (error) return
    const salida: FiltrosReporte = { periodo: '', desde: '', hasta: '' }
    for (const k of CLAVES_PANEL[panel]) salida[k] = limpio[k] ?? ''
    const r = rangoPeriodo(limpio)
    if (r.periodo === 'personalizado')
      Object.assign(salida, { periodo: 'personalizado', desde: r.desde, hasta: r.hasta })
    else salida.periodo = r.periodo
    onAplicar(salida)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={meta.titulo}
      description={meta.aplica}
      headerExtra={<span className="sobretitulo">{meta.codigo}</span>}
      footer={
        <div className="flex w-full flex-col gap-2.5">
          <div className="flex items-center gap-2 text-cuerpo-sm" aria-live="polite">
            <span className="flex-1 text-tinta-secundaria">
              {conteo.data && !error ? (
                <>
                  <b className="text-tinta tabular-nums">
                    {conteo.data.total} {conteo.data.sustantivo}
                  </b>{' '}
                  coinciden con los filtros
                </>
              ) : (
                'Calculando…'
              )}
            </span>
            <span className="text-tinta-terciaria">
              {activos === 1 ? '1 filtro activo' : `${activos} filtros activos`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="text" onClick={() => setBorrador({ periodo: 'anio' })}>
              Limpiar todo
            </Button>
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => {
                setIntentado(true)
                if (!error) onGuardar(limpio)
              }}
            >
              <Save aria-hidden="true" />
              Guardar consulta
            </Button>
            <Button onClick={aplicar}>
              <SlidersHorizontal aria-hidden="true" />
              Aplicar filtros
            </Button>
          </div>
        </div>
      }
    >
      <RequiredLegend />
      <Periodo
        key={borrador.periodo === 'anio' && !borrador.desde ? 'reinicio' : 'periodo'}
        borrador={borrador}
        error={intentado ? error : null}
        onCambiar={cambiar}
      />
      <CamposPanel panel={panel} borrador={borrador} onCambiar={cambiar} />
    </Drawer>
  )
}
