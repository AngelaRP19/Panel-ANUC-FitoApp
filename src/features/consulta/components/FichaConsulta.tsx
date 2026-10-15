import { Link } from 'react-router'
import { Map } from 'lucide-react'
import { MiniMapa } from '@/components/ui/MiniMapa'
import { Modal } from '@/components/ui/Modal'
import { VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearCoordenadas } from '@/utils/numeros'
import { formatearTelefono } from '@/utils/telefono'
import type { RegistroConsulta } from '../types'
import { unirEspecies, urlUbicacion } from '../utils'

interface FichaConsultaProps {
  registro: RegistroConsulta
  onClose: () => void
}

/**
 * Ficha de solo consulta (diseño 12d): WhatsApp, finca, coordenadas, cultivo, mis casos y
 * mini mapa. Sin acciones: si un dato está mal, se avisa al líder técnico.
 */
export function FichaConsulta({ registro: r, onClose }: FichaConsultaProps) {
  const { latitud, longitud } = r.finca
  const coordenadas = formatearCoordenadas(latitud, longitud)
  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title={r.productor.nombre}
      description="Solo consulta"
    >
      <dl className="m-0 grid grid-cols-[130px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
        <dt className="text-tinta-secundaria">WhatsApp</dt>
        <dd className="m-0 codigo">{formatearTelefono(r.productor.celular)}</dd>
        <dt className="text-tinta-secundaria">Finca</dt>
        <dd className="m-0 font-medium">
          {r.finca.nombre}
          <small className="block font-normal text-tinta-terciaria">
            Vereda {VEREDA_LABEL[r.finca.vereda]}
          </small>
        </dd>
        <dt className="text-tinta-secundaria">Coordenadas</dt>
        <dd className="m-0 codigo">{coordenadas}</dd>
        <dt className="text-tinta-secundaria">Cultivo</dt>
        <dd className="m-0 font-medium">
          {r.cultivos.map((c) => c.nombre).join(' · ')}
          <small className="block font-normal text-tinta-terciaria">
            {unirEspecies(r.cultivos.flatMap((c) => c.especies))}
          </small>
        </dd>
        <dt className="text-tinta-secundaria">Mis casos</dt>
        <dd className="m-0 flex flex-wrap gap-x-3 gap-y-1">
          {r.casos.map((c) => (
            <Link key={c.id} to={PATHS.caso(c.id)} className="codigo enlace">
              #{c.codigo}
            </Link>
          ))}
        </dd>
      </dl>
      <div>
        <MiniMapa
          latitud={latitud}
          longitud={longitud}
          etiqueta={`Ubicación de la finca ${r.finca.nombre} en ${coordenadas}`}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3 text-cuerpo-sm">
          <span className="text-tinta-terciaria">
            Ubicación aproximada según las coordenadas registradas
          </span>
          {latitud !== null && longitud !== null && (
            <a
              href={urlUbicacion(latitud, longitud)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 enlace whitespace-nowrap"
            >
              <Map size={16} aria-hidden="true" />
              Abrir ubicación en el mapa
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>
      </div>
      <p className="text-nota text-tinta-terciaria">Si un dato está mal, avisa al líder técnico.</p>
    </Modal>
  )
}
