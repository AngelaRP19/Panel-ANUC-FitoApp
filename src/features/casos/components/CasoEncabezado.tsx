import type { ReactNode } from 'react'
import { Leaf, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EstadoCasoBadge } from '@/components/ui/EstadoBadge'
import { ESPECIE_LABEL, MENSAJES, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { cn } from '@/utils/cn'
import { formatearFecha, formatearFechaHora, textoFaltan, tiempoEspera } from '@/utils/fechas'
import type { CasoDetalle } from '../types'
import { ESTADOS_ACTIVOS } from '../utils'

function Celda({
  termino,
  children,
  destacada,
}: {
  termino: string
  children: ReactNode
  destacada?: boolean
}) {
  return (
    <div
      className={cn(
        'border-borde px-6 py-3.5 sm:border-r sm:last:border-r-0',
        destacada && 'bg-verde-50',
      )}
    >
      <dt className="sobretitulo">{termino}</dt>
      <dd className="m-0 mt-1 font-medium tabular-nums">{children}</dd>
    </div>
  )
}

interface CasoEncabezadoProps {
  caso: CasoDetalle
  esLider: boolean
  /** id del usuario: el técnico ve «(tú)» en su caso. */
  usuarioId: string
  onProductorFinca: () => void
  onReasignar: () => void
}

/**
 * Encabezado del detalle (artboards 04, 04c, 12c): título, estado, datos del productor y la
 * franja Enviado / Técnico / Vencimiento de conservación (Técnico / Cerrado / Vencimiento si
 * el caso está cerrado).
 */
export function CasoEncabezado({
  caso,
  esLider,
  usuarioId,
  onProductorFinca,
  onReasignar,
}: CasoEncabezadoProps) {
  const activo = ESTADOS_ACTIVOS.includes(caso.estado)
  const cerrado = caso.estado === 'CERRADO'
  const especie = etiqueta(ESPECIE_LABEL, caso.especie, caso.especie)
  const lugar = caso.cultivo.tipo === 'INVERNADERO' ? 'en invernadero' : 'a campo abierto'
  const esMio = caso.tecnico?.id === usuarioId

  const tecnico = caso.tecnico ? (
    `${caso.tecnico.nombre}${esMio && !esLider ? ' (tú)' : ''}`
  ) : (
    <span className="text-advertencia">Sin asignar</span>
  )

  return (
    <section
      aria-labelledby="titulo-caso"
      className="rounded-lg border border-borde bg-blanco shadow-1"
    >
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 px-6 pt-6 pb-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="titulo-caso" className="titulo-h1">
              Caso <span className="font-mono font-semibold">#{caso.id}</span> · Finca{' '}
              {caso.finca.nombre}
            </h1>
            <EstadoCasoBadge estado={caso.estado} />
          </div>
          <p className="text-cuerpo-sm text-tinta-secundaria">
            {caso.productor.nombre} · Vereda{' '}
            {etiqueta(VEREDA_LABEL, caso.finca.vereda, caso.finca.vereda)} · {especie} {lugar} ·
            zona afectada: {caso.zona_afectada}
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <Button variant="text" onClick={onProductorFinca}>
            <Leaf aria-hidden="true" />
            Productor y finca
          </Button>
          {esLider && activo && (
            <Button variant="secondary" onClick={onReasignar}>
              <UserPlus aria-hidden="true" />
              {caso.tecnico ? 'Reasignar técnico' : 'Asignar técnico'}
            </Button>
          )}
          {!esLider && esMio && (
            <span className="inline-flex h-7 items-center rounded-sm border border-verde-300 bg-verde-100 px-2 text-xs leading-4 font-semibold text-verde-800">
              Caso asignado a ti
            </span>
          )}
        </div>
      </div>

      <dl className="m-0 grid border-t border-borde sm:grid-cols-3">
        {cerrado ? (
          <>
            <Celda termino="Técnico asignado">{tecnico}</Celda>
            <Celda termino="Cerrado">{formatearFechaHora(caso.cerrado_en)}</Celda>
            <Celda termino={MENSAJES.vencimientoConservacion} destacada>
              <span className="font-semibold">{formatearFecha(caso.vence_en)}</span>
              {caso.vence_en && (
                <span className="text-cuerpo-sm font-normal text-tinta-terciaria">
                  {' '}
                  · {textoFaltan(caso.vence_en)}
                  {caso.conservacion_extendida && ' · extendida'}
                </span>
              )}
            </Celda>
          </>
        ) : (
          <>
            <Celda termino="Enviado al panel">
              {caso.enviado_a_panel_en ? (
                <>
                  {formatearFechaHora(caso.enviado_a_panel_en)}
                  {activo && (
                    <span className="text-cuerpo-sm font-semibold text-advertencia">
                      {' '}
                      · {tiempoEspera(caso.enviado_a_panel_en)}
                    </span>
                  )}
                </>
              ) : (
                'Sin enviar'
              )}
            </Celda>
            <Celda termino="Técnico asignado">{tecnico}</Celda>
            <Celda termino={MENSAJES.vencimientoConservacion}>
              Se fija al cerrar el caso{' '}
              <span className="text-cuerpo-sm font-normal text-tinta-terciaria">· 6 meses</span>
            </Celda>
          </>
        )}
      </dl>
    </section>
  )
}
