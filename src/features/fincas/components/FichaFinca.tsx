import { Link } from 'react-router'
import { Leaf, Map, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MiniMapa } from '@/components/ui/MiniMapa'
import { Modal } from '@/components/ui/Modal'
import { TIPO_CULTIVO_LABEL, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearCoordenadas } from '@/utils/numeros'
import type { Finca } from '../types'
import { listaEspecies } from '../utils'

interface FichaFincaProps {
  finca: Finca
  onClose: () => void
  onEditar: () => void
  onAgregarCultivo: () => void
}

/**
 * Ficha de la finca en ventana (artboard 09): productor, coordenadas, mini mapa con enlace al
 * mapa de vigilancia y la lista de cultivos con su tipo y especies.
 */
export function FichaFinca({ finca: f, onClose, onEditar, onAgregarCultivo }: FichaFincaProps) {
  const coordenadas = formatearCoordenadas(f.latitud, f.longitud)
  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      title={f.nombre}
      description={`Vereda ${etiqueta(VEREDA_LABEL, f.vereda, f.vereda)}`}
      footer={
        <>
          <Button variant="text" onClick={onAgregarCultivo} disabled={!f.productor.activo}>
            <Plus aria-hidden="true" />
            Agregar cultivo
          </Button>
          <Button variant="secondary" onClick={onEditar}>
            <Pencil aria-hidden="true" />
            Editar finca
          </Button>
        </>
      }
    >
      <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
        <dt className="text-tinta-secundaria">Productor</dt>
        <dd className="m-0 font-medium">
          {f.productor.nombre}
          {!f.productor.activo && (
            <small className="block font-normal text-tinta-terciaria">
              Productor deshabilitado
            </small>
          )}
        </dd>
        <dt className="text-tinta-secundaria">Coordenadas</dt>
        <dd className="m-0 codigo">{coordenadas}</dd>
      </dl>
      <div>
        <MiniMapa
          latitud={f.latitud}
          longitud={f.longitud}
          etiqueta={`Ubicación de la finca ${f.nombre} en ${coordenadas}`}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3 text-cuerpo-sm">
          <span className="text-tinta-terciaria">
            Ubicación aproximada según las coordenadas registradas
          </span>
          <Link
            to={`${PATHS.mapa}?finca=${encodeURIComponent(f.id)}`}
            className="inline-flex items-center gap-1 enlace whitespace-nowrap"
          >
            <Map size={16} aria-hidden="true" />
            Ver en el mapa de vigilancia
          </Link>
        </div>
      </div>
      <div>
        <p className="mb-2 etiqueta">Cultivos</p>
        {f.cultivos.length === 0 && (
          <p className="text-cuerpo-sm text-tinta-terciaria">
            Esta finca aún no tiene cultivos. Agrega uno para que el chatbot lo ofrezca.
          </p>
        )}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {f.cultivos.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2.5 rounded-md border border-borde px-3 py-2.5"
            >
              <Leaf size={18} className="flex-none text-tinta-secundaria" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-cuerpo-sm font-semibold">{c.nombre}</span>
                <span className="text-cuerpo-sm text-tinta-terciaria">
                  {etiqueta(TIPO_CULTIVO_LABEL, c.tipo, c.tipo)} · {listaEspecies(c.especies)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
