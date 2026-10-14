import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Eye, Leaf, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import {
  ConsultaFiltros,
  ConsultaTabla,
  FichaConsulta,
  useConsulta,
  useFiltrosConsulta,
  useRegistroConsulta,
} from '@/features/consulta'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/**
 * Productores y fincas de mis casos (diseño 12d · RQF10, 14, 17 · solo técnico): solo
 * consulta de los productores, fincas y cultivos relacionados con sus casos asignados.
 * Sin crear, editar ni activar. La ficha abierta vive en `?ficha=`.
 */
export default function ConsultaPage() {
  const { filtros, setFiltros, limpiar } = useFiltrosConsulta()
  const [params, setParams] = useSearchParams()
  const lista = useConsulta(filtros)
  const idFicha = params.get('ficha')
  const ficha = useRegistroConsulta(idFicha)
  const abrirFicha = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set('ficha', id)
        else n.delete('ficha')
        return n
      },
      { replace: true },
    )

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

  const hayFiltros = Object.entries(filtros).some(([k, v]) => k !== 'page' && v)
  const limpiarTodo = () => {
    limpiar()
    setBusqueda('')
  }
  const r = lista.data?.resumen

  return (
    <>
      <PageHeader
        title="Productores y fincas de mis casos"
        description={
          r
            ? `${plural(r.productores, 'productor', 'productores')} · ${plural(r.fincas, 'finca', 'fincas')} · relacionados con tus ${plural(r.casos, 'caso asignado', 'casos asignados')}`
            : undefined
        }
        actions={
          <span className="inline-flex h-6 items-center gap-1 rounded-sm border border-borde bg-neutro-suave px-2 text-xs font-semibold text-neutro">
            <Eye size={14} aria-hidden="true" />
            Solo consulta
          </span>
        }
      />

      <Aviso tono="info">
        Solo ves los productores, fincas y cultivos de los casos que te asignaron. Si un dato está
        mal, avisa al líder técnico: él registra y corrige productores, fincas y cultivos.
      </Aviso>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1 sm:w-80">
          <label htmlFor="cf-q" className="etiqueta">
            Buscar
          </label>
          <div className="relative">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-2.5 left-3 text-tinta-terciaria"
            />
            <input
              id="cf-q"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Productor, finca o número"
              className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
            />
          </div>
        </div>
        <ConsultaFiltros filtros={filtros} onCambiar={setFiltros} />
        {hayFiltros && (
          <Button variant="text" size="sm" onClick={limpiarTodo}>
            {MENSAJES.limpiarFiltros}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {lista.isError && !lista.data ? (
          <ErrorState
            title="No se pudo cargar la lista de productores y fincas"
            onRetry={() => lista.refetch()}
          />
        ) : (
          <>
            <ConsultaTabla
              registros={lista.data?.items ?? []}
              cargando={lista.isPending}
              seleccionado={idFicha}
              onAbrir={(x) => abrirFicha(x.id)}
              vacio={
                <EmptyState
                  icon={hayFiltros ? Search : Leaf}
                  title={
                    hayFiltros
                      ? 'Ningún productor coincide con los filtros'
                      : 'Aún no tienes casos asignados'
                  }
                  message={
                    hayFiltros
                      ? undefined
                      : 'Aquí aparecerán los productores y fincas de los casos que te asignen.'
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
              />
            )}
          </>
        )}
      </Card>

      {idFicha && ficha.data && (
        <FichaConsulta registro={ficha.data} onClose={() => abrirFicha(null)} />
      )}
    </>
  )
}
