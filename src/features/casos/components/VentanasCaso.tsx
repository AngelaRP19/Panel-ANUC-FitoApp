import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Button, buttonClass } from '@/components/ui/Button'
import { MiniMapa } from '@/components/ui/MiniMapa'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import { ESPECIE_LABEL, MENSAJES, TIPO_CULTIVO_LABEL, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaCorta, formatearHora } from '@/utils/fechas'
import { formatearCoordenadas } from '@/utils/numeros'
import { formatearTelefono } from '@/utils/telefono'
import { useCuestionario, useHistorial } from '../hooks'
import type { CasoDetalle } from '../types'
import { AsignarTecnicoPanel } from './AsignarTecnicoPanel'
import { Timeline } from './Timeline'

function ErrorCarga({ que, onRetry }: { que: string; onRetry: () => void }) {
  return (
    <Aviso tono="peligro" titulo={`No se pudo cargar ${que}.`}>
      <Button variant="text" size="sm" onClick={onRetry}>
        {MENSAJES.reintentar}
      </Button>
    </Aviso>
  )
}

/** «Cuestionario del chatbot»: preguntas y respuestas numeradas. */
export function CuestionarioDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useCuestionario(caso.id)
  const r = caso.cuestionario_resumen
  const rango =
    r.desde && r.hasta
      ? `${r.respuestas} respuestas por WhatsApp · ${formatearFechaCorta(r.desde)}, ${formatearHora(r.desde)}–${formatearHora(r.hasta)}`
      : `${r.respuestas} respuestas por WhatsApp`
  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title="Cuestionario del chatbot"
      description={rango}
    >
      {isPending && <Skeleton style={{ height: 160 }} />}
      {isError && <ErrorCarga que="el cuestionario" onRetry={() => refetch()} />}
      {data && (
        <ol className="m-0 list-none p-0">
          {data.respuestas.map((x, i) => (
            <li
              key={i}
              className="grid grid-cols-[28px_1fr] gap-3 border-t border-borde py-3 first:border-t-0"
            >
              <span className="codigo text-tinta-terciaria" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-cuerpo-sm text-tinta-secundaria">{x.pregunta}</p>
                <p className="font-medium">{x.respuesta}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}

/** «Historial y trazabilidad» (artboard 04f). */
export function HistorialDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useHistorial(caso.id)
  return (
    <Modal open onClose={onClose} position="top" title="Historial y trazabilidad">
      {isPending && <Skeleton style={{ height: 200 }} />}
      {isError && <ErrorCarga que="el historial" onRetry={() => refetch()} />}
      {data && <Timeline eventos={data} />}
    </Modal>
  )
}

function Dato({
  termino,
  children,
  nota,
  mono,
}: {
  termino: string
  children: ReactNode
  nota?: ReactNode
  mono?: boolean
}) {
  return (
    <>
      <dt className="text-tinta-secundaria">{termino}</dt>
      <dd className={mono ? 'm-0 codigo' : 'm-0 min-w-0 font-medium'}>
        {children}
        {nota && (
          <small className="block font-texto text-nota font-normal text-tinta-terciaria">
            {nota}
          </small>
        )}
      </dd>
    </>
  )
}

/** «Productor, finca y cultivo» en solo lectura (botón «Productor y finca» del encabezado). */
export function ProductorFincaDialog({
  caso,
  esLider,
  onClose,
}: {
  caso: CasoDetalle
  esLider: boolean
  onClose: () => void
}) {
  const especies = caso.cultivo.especies.map((e) => etiqueta(ESPECIE_LABEL, e, e).toLowerCase())
  const casosAnio = caso.productor.casos_ultimo_anio
  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title="Productor, finca y cultivo"
      footer={
        <>
          {esLider && (
            <Link
              to={`${PATHS.mapa}?finca=${encodeURIComponent(caso.finca.id)}`}
              className={buttonClass('text')}
            >
              Abrir mapa
            </Link>
          )}
          <Link
            to={
              esLider
                ? `${PATHS.productores}?productor=${encodeURIComponent(caso.productor.id)}`
                : PATHS.consulta
            }
            className={buttonClass('secondary')}
          >
            Ver productor
          </Link>
        </>
      }
    >
      <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
        <Dato
          termino="Productor"
          nota={`${casosAnio} ${casosAnio === 1 ? 'caso' : 'casos'} en el último año`}
        >
          {caso.productor.nombre}
        </Dato>
        <Dato termino="WhatsApp" mono>
          {formatearTelefono(caso.productor.celular)}
        </Dato>
        <Dato
          termino="Finca"
          nota={`Vereda ${etiqueta(VEREDA_LABEL, caso.finca.vereda, caso.finca.vereda)} · Zetaquirá`}
        >
          {caso.finca.nombre}
        </Dato>
        <Dato termino="Coordenadas" mono>
          {formatearCoordenadas(caso.finca.latitud, caso.finca.longitud)}
        </Dato>
        <Dato
          termino="Cultivo"
          nota={`${etiqueta(TIPO_CULTIVO_LABEL, caso.cultivo.tipo, caso.cultivo.tipo)} · especies: ${especies.join(' y ')}`}
        >
          {caso.cultivo.nombre}
        </Dato>
        <Dato termino="Especie afectada" nota={`Zona afectada: ${caso.zona_afectada}`}>
          {etiqueta(ESPECIE_LABEL, caso.especie, caso.especie)}
        </Dato>
      </dl>
      <MiniMapa
        latitud={caso.finca.latitud}
        longitud={caso.finca.longitud}
        etiqueta={`Ubicación aproximada de la finca ${caso.finca.nombre}, vereda ${etiqueta(VEREDA_LABEL, caso.finca.vereda, caso.finca.vereda)}`}
        className="h-35"
      />
    </Modal>
  )
}

/** «Reasignar técnico» desde el detalle (solo líder). */
export function ReasignarDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      position="top"
      title={caso.tecnico ? 'Reasignar técnico' : 'Asignar técnico'}
      description={`Caso #${caso.id} · ${caso.tecnico ? `ahora lo atiende ${caso.tecnico.nombre}` : 'sin técnico asignado'}`}
    >
      <AsignarTecnicoPanel
        caso={caso}
        onCancelar={onClose}
        onAsignado={(t) => {
          toast.exito('Técnico asignado', `Caso #${caso.id} · ${t.nombre}`)
          onClose()
        }}
      />
    </Modal>
  )
}
