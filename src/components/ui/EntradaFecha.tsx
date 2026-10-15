import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { fechaCalendario, parsearFechaEntrada, sumarDias } from '@/utils/fechas'
import { controlClass } from './Input'

// Fechas de calendario «aaaa-mm-dd» (sin hora): se calculan en UTC para no depender de la zona.
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const DIAS_SEMANA = [
  ['lu', 'lunes'],
  ['ma', 'martes'],
  ['mi', 'miércoles'],
  ['ju', 'jueves'],
  ['vi', 'viernes'],
  ['sá', 'sábado'],
  ['do', 'domingo'],
] as const

const aFecha = (f: string) => new Date(`${f}T00:00:00Z`)
const aTexto = (d: Date) => d.toISOString().slice(0, 10)
const sumarMesesFoco = (f: string, n: number) => {
  const d = aFecha(f)
  const dia = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(dia, ultimo))
  return aTexto(d)
}
const nombreDia = (f: string) => {
  const d = aFecha(f)
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

/** Las 6 semanas (lunes a domingo) que muestran el mes de `foco`. */
function semanasDelMes(foco: string): string[][] {
  const d = aFecha(foco)
  const primero = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const desplazamiento = (primero.getUTCDay() + 6) % 7 // lunes = 0
  const inicio = sumarDias(aTexto(primero), -desplazamiento)
  return Array.from({ length: 6 }, (_, s) =>
    Array.from({ length: 7 }, (_, i) => sumarDias(inicio, s * 7 + i)),
  )
}

interface CalendarioProps {
  seleccionada: string | null
  hoy: string
  minimo?: string
  maximo?: string
  onElegir: (fecha: string) => void
}

/** Calendario de un mes (cuadrícula navegable con flechas, Re Pág / Av Pág e Inicio / Fin). */
function Calendario({ seleccionada, hoy, minimo, maximo, onElegir }: CalendarioProps) {
  const [foco, setFoco] = useState(seleccionada ?? hoy)
  const [conTeclado, setConTeclado] = useState(false)
  const rejilla = useRef<HTMLTableElement>(null)
  const d = aFecha(foco)
  const mes = d.getUTCMonth()
  const fuera = (f: string) => (!!minimo && f < minimo) || (!!maximo && f > maximo)

  useEffect(() => {
    if (!conTeclado) return
    rejilla.current?.querySelector<HTMLButtonElement>(`[data-fecha="${foco}"]`)?.focus()
  }, [foco, conTeclado])

  const mover = (e: KeyboardEvent) => {
    const pasos: Record<string, () => string> = {
      ArrowLeft: () => sumarDias(foco, -1),
      ArrowRight: () => sumarDias(foco, 1),
      ArrowUp: () => sumarDias(foco, -7),
      ArrowDown: () => sumarDias(foco, 7),
      PageUp: () => sumarMesesFoco(foco, -1),
      PageDown: () => sumarMesesFoco(foco, 1),
      Home: () => sumarDias(foco, -((aFecha(foco).getUTCDay() + 6) % 7)),
      End: () => sumarDias(foco, 6 - ((aFecha(foco).getUTCDay() + 6) % 7)),
    }
    const paso = pasos[e.key]
    if (!paso) return
    e.preventDefault()
    setConTeclado(true)
    setFoco(paso())
  }

  const titulo = `${MESES[mes]} ${d.getUTCFullYear()}`
  return (
    <div className="flex w-70 flex-col gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setFoco(sumarMesesFoco(foco, -1))}
          className="grid size-8 cursor-pointer place-items-center rounded-sm text-tinta-secundaria hover:bg-verde-100 focus-visible:outline-2 focus-visible:outline-verde-600"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="flex-1 text-center text-cuerpo-sm font-semibold first-letter:uppercase"
        >
          {titulo}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setFoco(sumarMesesFoco(foco, 1))}
          className="grid size-8 cursor-pointer place-items-center rounded-sm text-tinta-secundaria hover:bg-verde-100 focus-visible:outline-2 focus-visible:outline-verde-600"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <table ref={rejilla} role="grid" aria-label={titulo} className="w-full border-collapse">
        <thead>
          <tr>
            {DIAS_SEMANA.map(([corto, largo]) => (
              <th
                key={corto}
                scope="col"
                abbr={largo}
                className="h-7 text-center text-nota font-semibold text-tinta-terciaria"
              >
                {corto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody onKeyDown={mover}>
          {semanasDelMes(foco).map((semana) => (
            <tr key={semana[0]}>
              {semana.map((f) => {
                const delMes = aFecha(f).getUTCMonth() === mes
                const elegida = f === seleccionada
                const deshabilitada = fuera(f)
                return (
                  <td key={f} className="p-0.5 text-center">
                    <button
                      type="button"
                      data-fecha={f}
                      tabIndex={f === foco ? 0 : -1}
                      disabled={deshabilitada}
                      aria-label={nombreDia(f)}
                      aria-pressed={elegida}
                      aria-current={f === hoy ? 'date' : undefined}
                      onClick={() => onElegir(f)}
                      className={cn(
                        'size-9 cursor-pointer rounded-sm text-cuerpo-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-verde-600 disabled:cursor-not-allowed disabled:text-inactivo disabled:line-through',
                        delMes ? 'text-tinta' : 'text-tinta-terciaria',
                        elegida
                          ? 'bg-verde-700 font-semibold text-blanco hover:bg-verde-800'
                          : 'hover:bg-verde-100',
                        f === hoy && !elegida && 'font-semibold ring-1 ring-verde-600 ring-inset',
                      )}
                    >
                      {aFecha(f).getUTCDate()}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between border-t border-borde pt-2">
        <button
          type="button"
          disabled={fuera(hoy)}
          onClick={() => onElegir(hoy)}
          className="h-8 cursor-pointer rounded-sm px-2 text-cuerpo-sm font-semibold text-verde-700 hover:bg-verde-100 disabled:cursor-not-allowed disabled:text-inactivo"
        >
          Hoy
        </button>
        <span className="self-center text-nota text-tinta-terciaria">
          Flechas para moverse · Enter elige
        </span>
      </div>
    </div>
  )
}

interface EntradaFechaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'min' | 'max'> {
  invalid?: boolean
  /** Se llama al elegir un día en el calendario, con la fecha «aaaa-mm-dd». */
  onElegirFecha: (fecha: string) => void
  /** Primer y último día que se pueden elegir («aaaa-mm-dd»). */
  minimo?: string
  maximo?: string
  /** Clases del campo de texto. */
  className?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de fecha «dd/mm/aaaa» con selector de calendario. Se puede escribir la fecha o
 * elegirla en el calendario (botón con el icono). El valor del campo lo controla quien lo usa.
 */
export function EntradaFecha({
  invalid,
  onElegirFecha,
  minimo,
  maximo,
  className,
  value,
  readOnly,
  disabled,
  ...props
}: EntradaFechaProps) {
  const [abierto, setAbierto] = useState(false)
  const [hoy] = useState(() => fechaCalendario(new Date().toISOString()))
  const seleccionada = typeof value === 'string' ? parsearFechaEntrada(value) : null
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        autoComplete="off"
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
        className={cn(controlClass, 'h-10 pr-10 tabular-nums', className)}
      />
      {!readOnly && !disabled && (
        <Popover.Root open={abierto} onOpenChange={setAbierto}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label={
                seleccionada ? `Elegir fecha, ${nombreDia(seleccionada)}` : 'Elegir fecha'
              }
              className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-sm text-tinta-secundaria hover:bg-verde-100 hover:text-verde-700 focus-visible:outline-2 focus-visible:outline-verde-600"
            >
              <CalendarDays size={18} aria-hidden="true" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={6}
              collisionPadding={16}
              aria-label="Calendario"
              role="dialog"
              className="z-[70] rounded-md border border-borde bg-blanco p-3 shadow-2"
              onOpenAutoFocus={(e) => {
                // El foco va al día elegido (o a hoy), no al botón «Mes anterior».
                e.preventDefault()
                const contenido = e.currentTarget as HTMLElement | null
                contenido
                  ?.querySelector<HTMLButtonElement>('button[data-fecha][tabindex="0"]')
                  ?.focus()
              }}
            >
              <Calendario
                seleccionada={seleccionada}
                hoy={hoy}
                minimo={minimo}
                maximo={maximo}
                onElegir={(f) => {
                  onElegirFecha(f)
                  setAbierto(false)
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  )
}
