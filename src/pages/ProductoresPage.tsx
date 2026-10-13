import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search, SlidersHorizontal, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import {
  CLAVES_FILTRO_PRODUCTORES,
  FichaProductor,
  FiltrosActivosProductores,
  ProductoresFiltros,
  ProductoresTable,
  ProductorFormModal,
  useFiltrosProductores,
  useProductor,
  useProductores,
  useResumenProductores,
  type Productor,
} from '@/features/productores'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'

type Formulario = { productor: Productor | null } | null

/**
 * Productores (diseño 08, 08b · RQF07-10, solo líder técnico): lista con búsqueda, filtros y
 * paginación (10/25/50), ficha en ventana con el interruptor «Puede consultar por WhatsApp» y
 * registro/edición. La ficha abierta vive en la URL (`?productor=`) para poder enlazarla.
 */
export default function ProductoresPage() {
  const { filtros, setFiltros, limpiar } = useFiltrosProductores()
  const [params, setParams] = useSearchParams()
  const lista = useProductores(filtros)
  const resumen = useResumenProductores()
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [formulario, setFormulario] = useState<Formulario>(null)

  const idFicha = params.get('productor')
  const ficha = useProductor(idFicha)
  const abrirFicha = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set('productor', id)
        else n.delete('productor')
        return n
      },
      { replace: true },
    )

  // Búsqueda con debounce de 300 ms (mismo patrón que la bandeja de casos).
  const [busqueda, setBusqueda] = useState(filtros.q)
  const conRetraso = useDebounce(busqueda, 300)
  const ultimo = useRef(filtros.q)
  useEffect(() => {
    if (conRetraso === ultimo.current) return
    ultimo.current = conRetraso
    setFiltros({ q: conRetraso.trim() })
  }, [conRetraso, setFiltros])
  useEffect(() => {
    if (filtros.q === ultimo.current) return
    ultimo.current = filtros.q
    setBusqueda(filtros.q)
  }, [filtros.q])

  const nFiltros = CLAVES_FILTRO_PRODUCTORES.filter((k) => filtros[k]).length
  const hayFiltros = nFiltros > 0 || !!filtros.q
  const limpiarTodo = () => {
    limpiar()
    setBusqueda('')
  }

  const subtitulo = resumen.data
    ? `${resumen.data.total} productores · ${resumen.data.activos} activos · el chatbot los reconoce por su número de WhatsApp`
    : ' '

  return (
    <>
      <PageHeader
        title="Productores"
        description={subtitulo}
        actions={
          <Button onClick={() => setFormulario({ productor: null })}>
            <UserPlus aria-hidden="true" />
            Registrar productor
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-90">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-2.5 left-3 text-tinta-terciaria"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productor"
            placeholder="Nombre o número de celular"
            className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-9"
          aria-expanded={panelAbierto}
          aria-controls="p-filtros"
          aria-label={
            nFiltros ? `Filtros, ${nFiltros} ${nFiltros === 1 ? 'activo' : 'activos'}` : 'Filtros'
          }
          onClick={() => setPanelAbierto((v) => !v)}
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtros
          {nFiltros > 0 && (
            <span className="inline-grid h-4.5 min-w-4.5 place-items-center rounded-full bg-verde-700 px-1.25 text-[11px] leading-none font-semibold text-blanco">
              {nFiltros}
            </span>
          )}
        </Button>
        <FiltrosActivosProductores
          filtros={filtros}
          onQuitar={(k) => {
            if (k === 'q') setBusqueda('')
            setFiltros({ [k]: '' })
          }}
          onLimpiar={limpiarTodo}
        />
      </div>

      <Card className="overflow-hidden">
        {panelAbierto && (
          <ProductoresFiltros
            // Se reinicia al limpiar, para no conservar textos de finca o fechas.
            key={`${filtros.finca}|${filtros.desde}|${filtros.hasta}`}
            filtros={filtros}
            onCambiar={setFiltros}
          />
        )}
        {lista.isError && !lista.data ? (
          <ErrorState
            title="No se pudo cargar la lista de productores"
            onRetry={() => lista.refetch()}
          />
        ) : (
          <>
            <ProductoresTable
              productores={lista.data?.items ?? []}
              cargando={lista.isPending}
              seleccionado={idFicha}
              onAbrir={(p) => abrirFicha(p.id)}
              vacio={
                <EmptyState
                  icon={hayFiltros ? Search : Users}
                  title={
                    hayFiltros
                      ? 'Ningún productor coincide con los filtros'
                      : 'Aún no hay productores registrados'
                  }
                  message={
                    hayFiltros
                      ? undefined
                      : 'Registra el primero para que el chatbot lo reconozca por su número.'
                  }
                  action={
                    hayFiltros ? (
                      <Button variant="secondary" size="sm" onClick={limpiarTodo}>
                        {MENSAJES.limpiarFiltros}
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
            {lista.data && lista.data.total > 0 && (
              <Pagination
                page={lista.data.page}
                pageSize={lista.data.page_size}
                total={lista.data.total}
                noun="productores"
                onPageChange={(p) => setFiltros({ page: String(p) })}
                pageSizeOptions={[10, 25, 50]}
                onPageSizeChange={(n) => setFiltros({ filas: String(n) })}
              />
            )}
          </>
        )}
      </Card>

      {idFicha && ficha.data && !formulario && (
        <FichaProductor
          productor={ficha.data}
          onClose={() => abrirFicha(null)}
          onEditar={() => setFormulario({ productor: ficha.data })}
        />
      )}
      {formulario && (
        <ProductorFormModal productor={formulario.productor} onClose={() => setFormulario(null)} />
      )}
    </>
  )
}
