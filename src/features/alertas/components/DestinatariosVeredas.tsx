import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { MENSAJES, VEREDA_LABEL } from '@/locales/es'
import type { Vereda } from '@/types/enums'
import { formatearTelefono } from '@/utils/telefono'
import type { DestinatariosVereda } from '../types'
import { textoProductores } from '../utils'

function detalle(d: DestinatariosVereda) {
  const activos = `${textoProductores(d.productores.length)} ${d.productores.length === 1 ? 'activo' : 'activos'}`
  const partes = [d.zona_alerta ? `Zona de la alerta · ${activos}` : activos]
  if (d.deshabilitados > 0) {
    partes.push(
      `${d.deshabilitados} ${d.deshabilitados === 1 ? 'deshabilitado' : 'deshabilitados'}`,
    )
  }
  return partes.join(' · ')
}

interface DestinatariosVeredasProps {
  datos: DestinatariosVereda[] | undefined
  cargando: boolean
  error: boolean
  onReintentar: () => void
  seleccion: Vereda[]
  onCambiar: (veredas: Vereda[]) => void
}

/** «Destinatarios por vereda»: casillas con su detalle y la lista de productores elegidos. */
export function DestinatariosVeredas({
  datos,
  cargando,
  error,
  onReintentar,
  seleccion,
  onCambiar,
}: DestinatariosVeredasProps) {
  const alternar = (v: Vereda, marcar: boolean) =>
    onCambiar(marcar ? [...seleccion, v] : seleccion.filter((x) => x !== v))

  return (
    <section
      aria-labelledby="t-dest"
      className="flex flex-col gap-3 rounded-lg border border-borde bg-blanco px-6 py-5 shadow-1"
    >
      <h2 id="t-dest" className="titulo-h3">
        Destinatarios por vereda
      </h2>
      {cargando && <Skeleton style={{ height: 160 }} />}
      {error && (
        <Aviso tono="peligro" titulo="No se pudieron cargar los destinatarios.">
          <Button variant="text" size="sm" onClick={onReintentar}>
            {MENSAJES.reintentar}
          </Button>
        </Aviso>
      )}
      {datos && (
        <>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="sr-only">Veredas que recibirán el mensaje</legend>
            {datos.map((d) => (
              <label
                key={d.vereda}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-borde-control bg-blanco p-3 hover:bg-verde-50 has-[:checked]:border-2 has-[:checked]:border-verde-700 has-[:checked]:bg-verde-50 has-[:checked]:p-[11px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600"
              >
                <input
                  type="checkbox"
                  checked={seleccion.includes(d.vereda)}
                  onChange={(e) => alternar(d.vereda, e.target.checked)}
                  className="m-0 size-4.5 flex-none accent-verde-700 focus-visible:outline-none"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-cuerpo-sm font-semibold">{VEREDA_LABEL[d.vereda]}</span>
                  <span className="text-nota text-tinta-terciaria">{detalle(d)}</span>
                </span>
                {d.zona_alerta && (
                  <span className="inline-flex h-6 items-center rounded-pill border border-peligro bg-peligro-suave px-2 text-[12px] font-semibold text-peligro">
                    Zona de la alerta
                  </span>
                )}
              </label>
            ))}
          </fieldset>
          {datos
            .filter((d) => seleccion.includes(d.vereda) && d.productores.length > 0)
            .map((d) => (
              <details key={d.vereda} className="text-cuerpo-sm">
                <summary className="cursor-pointer font-semibold text-verde-700">
                  Ver productores de {VEREDA_LABEL[d.vereda]} ({d.productores.length})
                </summary>
                <ul className="m-0 mt-2 grid list-none grid-cols-[1fr_auto] gap-x-3 gap-y-1 p-0">
                  {d.productores.map((p) => (
                    <li key={p.id} className="contents">
                      <span>{p.nombre}</span>
                      <span className="font-mono tabular-nums">{formatearTelefono(p.celular)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          <p className="text-nota text-tinta-terciaria">
            Los productores deshabilitados no reciben mensajes.
          </p>
        </>
      )}
    </section>
  )
}
