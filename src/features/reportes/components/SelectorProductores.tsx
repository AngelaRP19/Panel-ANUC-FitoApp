import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { FilterChip } from '@/components/ui/Chip'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTodosProductores } from '@/features/productores'
import { MENSAJES, VEREDA_LABEL, etiqueta } from '@/locales/es'
import { lista } from '../utils'

/** Sin tildes ni mayúsculas, para buscar «garcia» y encontrar «García». */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Celular E.164 → «310 482 1937». */
const celularLegible = (c: string) => c.replace(/^\+57(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3')

interface VentanaProps {
  elegidos: string[]
  onAceptar: (ids: string[]) => void
  onClose: () => void
}

/** Ventana con todos los productores y una casilla por cada uno (con búsqueda). */
function VentanaProductores({ elegidos, onAceptar, onClose }: VentanaProps) {
  const { data, isPending, isError, refetch } = useTodosProductores()
  const [seleccion, setSeleccion] = useState(() => new Set(elegidos))
  const [busqueda, setBusqueda] = useState('')
  const q = normalizar(busqueda.trim())
  const qDig = busqueda.replace(/\D/g, '')
  const visibles = (data ?? []).filter(
    (p) =>
      !q ||
      normalizar(p.nombre).includes(q) ||
      normalizar(etiqueta(VEREDA_LABEL, p.vereda ?? '', '')).includes(q) ||
      (qDig.length >= 3 && p.celular.includes(qDig)),
  )
  const marcadosVisibles = visibles.filter((p) => seleccion.has(p.id)).length
  const todosVisibles =
    visibles.length > 0 && marcadosVisibles === visibles.length
      ? true
      : marcadosVisibles > 0
        ? 'indeterminate'
        : false

  const alternar = (id: string, marcado: boolean) =>
    setSeleccion((s) => {
      const n = new Set(s)
      if (marcado) n.add(id)
      else n.delete(id)
      return n
    })
  const alternarVisibles = (marcado: boolean) =>
    setSeleccion((s) => {
      const n = new Set(s)
      for (const p of visibles) {
        if (marcado) n.add(p.id)
        else n.delete(p.id)
      }
      return n
    })

  const total = seleccion.size
  return (
    <Modal
      open
      onClose={onClose}
      icon={Users}
      iconTone="ok"
      size="md"
      position="top"
      title="Elegir productores"
      description="Marca los productores cuyos casos quieres ver en el reporte. Sin ninguno marcado, se incluyen todos."
      footer={
        <>
          <span
            className="mr-auto self-center text-cuerpo-sm text-tinta-secundaria"
            aria-live="polite"
          >
            {total === 0
              ? 'Ningún productor marcado'
              : total === 1
                ? '1 productor marcado'
                : `${total} productores marcados`}
          </span>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onAceptar([...seleccion])}>Usar selección</Button>
        </>
      }
    >
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-tinta-terciaria"
        />
        <Input
          type="search"
          aria-label="Buscar productor"
          placeholder="Buscar por nombre, vereda o celular"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>
      {isPending ? (
        <Skeleton style={{ height: 280 }} />
      ) : isError ? (
        <Aviso tono="peligro" titulo="No se pudieron cargar los productores.">
          <Button variant="text" size="sm" onClick={() => refetch()}>
            {MENSAJES.reintentar}
          </Button>
        </Aviso>
      ) : (
        <div className="overflow-hidden rounded-md border border-borde">
          <div className="flex items-center gap-3 border-b border-borde bg-verde-50 px-3 py-2">
            <Checkbox
              checked={todosVisibles}
              onCheckedChange={alternarVisibles}
              disabled={visibles.length === 0}
              label={
                <span className="text-cuerpo-sm font-semibold">
                  {q ? `Todos los resultados (${visibles.length})` : `Todos (${visibles.length})`}
                </span>
              }
            />
            {total > 0 && (
              <Button
                variant="text"
                size="sm"
                className="ml-auto h-7"
                onClick={() => setSeleccion(new Set())}
              >
                Quitar selección
              </Button>
            )}
          </div>
          {visibles.length === 0 ? (
            <p className="px-3 py-6 text-center text-cuerpo-sm text-tinta-terciaria">
              Ningún productor coincide con «{busqueda.trim()}».
            </p>
          ) : (
            <ul
              aria-label="Productores"
              className="m-0 max-h-[min(380px,50vh)] list-none overflow-y-auto p-0"
            >
              {visibles.map((p) => (
                <li key={p.id} className="border-b border-borde px-3 py-2 last:border-b-0">
                  <Checkbox
                    checked={seleccion.has(p.id)}
                    onCheckedChange={(v) => alternar(p.id, v)}
                    className="w-full"
                    label={
                      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                        <span className="text-cuerpo-sm font-medium">{p.nombre}</span>
                        <span className="text-nota text-tinta-terciaria tabular-nums">
                          {etiqueta(VEREDA_LABEL, p.vereda ?? '', 'Sin vereda')} ·{' '}
                          {celularLegible(p.celular)}
                          {!p.activo && ' · deshabilitado'}
                        </span>
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

interface SelectorProductoresProps {
  /** Ids separados por coma ('' = todos). */
  valor: string
  onCambiar: (valor: string) => void
}

/** Campo «Productores» del panel F1: botón que abre la ventana y los elegidos como chips. */
export function SelectorProductores({ valor, onCambiar }: SelectorProductoresProps) {
  const [abierta, setAbierta] = useState(false)
  const elegidos = lista(valor)
  const { data } = useTodosProductores(elegidos.length > 0)
  const nombre = (id: string) => data?.find((p) => p.id === id)?.nombre ?? id
  return (
    <div className="flex flex-col gap-1.5">
      <span id="fr-prod-l" className="etiqueta">
        Productores
      </span>
      <Button
        variant="secondary"
        size="sm"
        className="self-start"
        aria-describedby="fr-prod-l fr-prod-h"
        onClick={() => setAbierta(true)}
      >
        <Users aria-hidden="true" />
        {elegidos.length === 0 ? 'Elegir productores' : `Cambiar productores (${elegidos.length})`}
      </Button>
      <span id="fr-prod-h" className="text-nota text-tinta-terciaria">
        {elegidos.length === 0
          ? 'Todos los productores.'
          : 'Solo los casos de los productores elegidos.'}
      </span>
      {elegidos.length > 0 && (
        <ul aria-label="Productores elegidos" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {elegidos.map((id) => (
            <li key={id}>
              <FilterChip
                removeLabel={`Quitar a ${nombre(id)}`}
                onRemove={() => onCambiar(elegidos.filter((x) => x !== id).join(','))}
              >
                {nombre(id)}
              </FilterChip>
            </li>
          ))}
        </ul>
      )}
      {abierta && (
        <VentanaProductores
          elegidos={elegidos}
          onClose={() => setAbierta(false)}
          onAceptar={(ids) => {
            onCambiar(ids.join(','))
            setAbierta(false)
          }}
        />
      )}
    </div>
  )
}
