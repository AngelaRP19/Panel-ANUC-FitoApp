import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck, Inbox, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import {
  CasosFiltros,
  CasosTable,
  CasosTabs,
  CLAVES_PANEL,
  FILTROS_CASOS_VACIOS,
  FiltrosActivos,
  ResumenCasoModal,
  useCasos,
  useConteosCasos,
  useFiltrosCasos,
  type CasoResumen,
} from '@/features/casos'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'
import { Rol } from '@/types/enums'

/**
 * Bandeja de casos (diseño 03, 03b, 12b · RQF20). El líder ve todos los casos y asigna
 * técnicos; el técnico ve solo los suyos («Mis casos asignados»). Pestaña, búsqueda, filtros
 * y página viven en la URL.
 */
export default function CasosPage() {
  const { usuario } = useAuth()
  const esLider = usuario?.rol === Rol.LIDER_TECNICO
  const { filtros, setFiltros, limpiar } = useFiltrosCasos()
  const lista = useCasos(filtros)
  const conteos = useConteosCasos(filtros)
  const totales = useConteosCasos(FILTROS_CASOS_VACIOS)
  const [abierto, setAbierto] = useState<CasoResumen | null>(null)

  // Búsqueda con debounce de 300 ms. `ultimo` evita pisar lo que se escribe cuando la URL
  // cambia por la propia búsqueda; si cambia desde fuera (barra superior), se sincroniza.
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

  const hayFiltros = !!filtros.q || CLAVES_PANEL.some((k) => filtros[k])
  const limpiarTodo = () => {
    limpiar()
    setBusqueda('')
  }

  const total = totales.data?.todos
  const enRevision = totales.data?.EN_REVISION ?? 0
  const subtitulo =
    total === undefined
      ? ' '
      : esLider
        ? `${total} casos de todos los técnicos · ${enRevision} en revisión`
        : `Solo ves los ${total} casos asignados a ti · ${enRevision} en revisión`

  let vacio = (
    <EmptyState
      icon={Inbox}
      title="No hay casos en este estado"
      message="Cuando un caso llegue a este estado, aparecerá aquí."
    />
  )
  if (hayFiltros) {
    vacio = (
      <EmptyState
        icon={Search}
        title={MENSAJES.sinResultadosTitulo}
        message={
          esLider
            ? MENSAJES.sinResultadosTexto
            : 'La búsqueda solo incluye tus casos asignados. Los casos de otros técnicos no aparecen.'
        }
        action={
          <Button variant="secondary" size="sm" onClick={limpiarTodo}>
            {MENSAJES.limpiarFiltros}
          </Button>
        }
      />
    )
  } else if (!esLider && filtros.estado === 'EN_REVISION') {
    vacio = (
      <EmptyState
        icon={ClipboardCheck}
        title="No tienes casos en revisión"
        message="Cuando se te asigne un caso, aparecerá aquí en estado En revisión."
        action={
          <Button variant="text" size="sm" onClick={() => setFiltros({ estado: 'todos' })}>
            Ver todos mis casos
          </Button>
        }
      />
    )
  }

  return (
    <>
      <PageHeader
        title={esLider ? 'Bandeja de casos' : 'Mis casos asignados'}
        description={subtitulo}
      />

      <CasosTabs
        estado={filtros.estado}
        conteos={conteos.data}
        onChange={(estado) => setFiltros({ estado })}
      >
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
              aria-label="Filtrar por ID, productor o finca"
              placeholder="Filtrar por ID, productor o finca"
              className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
            />
          </div>
          <CasosFiltros
            filtros={filtros}
            esLider={esLider}
            onAplicar={(panel) => setFiltros(panel)}
          />
          <span className="text-cuerpo-sm text-tinta-terciaria sm:ml-auto">
            Orden: fecha de envío al panel, más recientes primero
          </span>
        </div>

        <FiltrosActivos
          filtros={filtros}
          onQuitar={(k) => {
            if (k === 'q') setBusqueda('')
            setFiltros({ [k]: '' })
          }}
          onLimpiar={limpiarTodo}
        />

        <Card className="overflow-hidden">
          {lista.isError && !lista.data ? (
            <ErrorState title="No se pudo cargar la bandeja" onRetry={() => lista.refetch()} />
          ) : (
            <>
              <CasosTable
                casos={lista.data?.items ?? []}
                esLider={esLider}
                cargando={lista.isPending}
                seleccionado={abierto?.id ?? null}
                onAbrir={setAbierto}
                vacio={vacio}
              />
              {lista.data && lista.data.total > 0 && (
                <Pagination
                  page={lista.data.page}
                  pageSize={lista.data.page_size}
                  total={lista.data.total}
                  noun="casos"
                  onPageChange={(p) => setFiltros({ page: String(p) })}
                />
              )}
            </>
          )}
        </Card>
      </CasosTabs>

      <ResumenCasoModal
        key={abierto?.id}
        caso={abierto}
        esLider={esLider}
        onClose={() => setAbierto(null)}
      />
    </>
  )
}
