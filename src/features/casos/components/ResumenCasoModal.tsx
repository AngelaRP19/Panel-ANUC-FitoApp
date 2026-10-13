import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Clock, UserPlus } from 'lucide-react'
import { Button, buttonClass } from '@/components/ui/Button'
import { EstadoCasoBadge } from '@/components/ui/EstadoBadge'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, ESPECIE_LABEL, MENSAJES, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFechaHora } from '@/utils/fechas'
import { formatearPorcentaje } from '@/utils/numeros'
import { formatearTelefono } from '@/utils/telefono'
import type { CasoResumen } from '../types'
import { AsignarTecnicoPanel } from './AsignarTecnicoPanel'
import { ESTADOS_ACTIVOS } from '../utils'
import { Preliminar } from './CasosTable'

function Dato({
  termino,
  children,
  nota,
}: {
  termino: string
  children: ReactNode
  nota?: ReactNode
}) {
  return (
    <>
      <dt className="text-tinta-secundaria">{termino}</dt>
      <dd className="m-0 min-w-0 font-medium text-tinta">
        {children}
        {nota && <small className="block text-nota font-normal text-tinta-terciaria">{nota}</small>}
      </dd>
    </>
  )
}

interface ResumenCasoModalProps {
  caso: CasoResumen | null
  esLider: boolean
  onClose: () => void
}

/**
 * Resumen del caso en ventana (artboard 03b): datos clave, «Abrir caso» y, para el líder,
 * asignar o reasignar el técnico. Un caso cerrado solo ofrece abrir el detalle.
 */
export function ResumenCasoModal({ caso, esLider, onClose }: ResumenCasoModalProps) {
  const [asignando, setAsignando] = useState(false)
  if (!caso) return null

  const cerrar = () => {
    setAsignando(false)
    onClose()
  }
  const activo = ESTADOS_ACTIVOS.includes(caso.estado)
  const p = caso.preliminar
  const notaPreliminar = !p
    ? undefined
    : p.resultado === 'AMBIGUO' && p.alternativa
      ? `Ambigua · ${etiqueta(CATEGORIA_LABEL, p.alternativa.categoria)} ${formatearPorcentaje(p.alternativa.porcentaje)}`
      : p.categoria
        ? MENSAJES.porcentajeCoincidencia
        : undefined
  const revisar = !esLider && activo

  return (
    <Modal
      open
      onClose={cerrar}
      size="sm"
      position="top"
      title={
        <>
          Caso <span className="font-mono">#{caso.id}</span>
        </>
      }
      headerExtra={<EstadoCasoBadge estado={caso.estado} />}
      description={
        caso.enviado_a_panel_en
          ? `Enviado al panel el ${formatearFechaHora(caso.enviado_a_panel_en)}`
          : 'Aún no se envía al panel: el chatbot sigue con el productor'
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div>
            {esLider && activo && !asignando && (
              <Button variant="secondary" onClick={() => setAsignando(true)}>
                <UserPlus aria-hidden="true" />
                {caso.tecnico ? 'Reasignar técnico' : 'Asignar técnico'}
              </Button>
            )}
          </div>
          <Link
            to={PATHS.caso(caso.id)}
            className={buttonClass(asignando ? 'secondary' : 'primary')}
          >
            {revisar ? 'Revisar caso' : 'Abrir caso'}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
        <Dato
          termino="Productor"
          nota={<span className="codigo">{formatearTelefono(caso.productor.celular)}</span>}
        >
          {caso.productor.nombre}
        </Dato>
        <Dato
          termino="Finca"
          nota={`Vereda ${etiqueta(VEREDA_LABEL, caso.finca.vereda, caso.finca.vereda)}`}
        >
          {caso.finca.nombre}
        </Dato>
        <Dato termino="Cultivo" nota={etiqueta(ESPECIE_LABEL, caso.especie, caso.especie)}>
          {caso.cultivo.nombre}
        </Dato>
        <Dato termino="Identificación preliminar" nota={notaPreliminar}>
          {p ? (
            <Preliminar caso={caso} />
          ) : (
            <span className="font-normal text-tinta-terciaria">
              El chatbot aún no termina el análisis
            </span>
          )}
        </Dato>
        <Dato termino="Técnico asignado">
          {caso.tecnico ? (
            caso.tecnico.nombre
          ) : (
            <span className="inline-flex items-center gap-1.5 text-nota font-semibold text-advertencia">
              <Clock size={14} strokeWidth={2} aria-hidden="true" />
              Sin asignar
            </span>
          )}
        </Dato>
      </dl>

      {asignando && (
        <AsignarTecnicoPanel
          caso={caso}
          onCancelar={() => setAsignando(false)}
          onAsignado={(t) => {
            toast.exito('Técnico asignado', `Caso #${caso.id} · ${t.nombre}`)
            cerrar()
          }}
        />
      )}
    </Modal>
  )
}
