import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Leaf, Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FilterChip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { AgregarCultivoModal } from '@/features/cultivos'
import {
  FichaFinca,
  FincaFormModal,
  FincasFiltros,
  FincasTable,
  useFiltrosFincas,
  useFinca,
  useFincas,
  useResumenFincas,
  type Finca,
} from '@/features/fincas'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'

type Ventana =
  { tipo: 'formulario'; finca: Finca | null } | { tipo: 'cultivo'; finca: Finca } | null

/** «veredas Juracambita, Centro y San Luis» */
function textoVeredas(v: string[]) {
  if (v.length === 0) return ''
  const lista = v.length > 1 ? `${v.slice(0, -1).join(', ')} y ${v[v.length - 1]}` : v[0]
  return ` · ${v.length === 1 ? 'vereda' : 'veredas'} ${lista}`
}

/**
 * Fincas y cultivos (diseño 09, 09b · RQF14-19, solo líder técnico): lista con búsqueda y
 * filtros, ficha con mini mapa y cultivos, registro y edición de fincas, especies por cultivo
 * y agregar cultivo. La ficha abierta vive en la URL (`?finca=`).
 */
export default function FincasPage() {
  const { filtros, setFiltros, limpiar } = useFiltrosFincas()
  const [params, setParams] = useSearchParams()
  const lista = useFincas(filtros)
  const resumen = useResumenFincas()
  const [ventana, setVentana] = useState<Ventana>(null)

  const idFicha = params.get('finca')
  const ficha = useFinca(idFicha)
  const abrirFicha = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set('finca', id)
        else n.delete('finca')
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
  const nombreProductor = lista.data?.items[0]?.productor.nombre

  const subtitulo = resumen.data
    ? `${resumen.data.fincas} fincas · ${resumen.data.cultivos} cultivos${textoVeredas(resumen.data.veredas)}`
    : ' '

  return (
    <>
      <PageHeader
        title="Fincas y cultivos"
        description={subtitulo}
        actions={
          <Button onClick={() => setVentana({ tipo: 'formulario', finca: null })}>
            <Plus aria-hidden="true" />
            Registrar finca
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
            aria-label="Buscar finca o productor"
            placeholder="Finca o productor"
            className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
          />
        </div>
        <FincasFiltros filtros={filtros} onCambiar={setFiltros} />
      </div>

      {(filtros.productor || hayFiltros) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filtros.productor && (
            <FilterChip
              onRemove={() => setFiltros({ productor: '' })}
              removeLabel="Quitar filtro de productor"
            >
              Productor: {nombreProductor ?? 'seleccionado'}
            </FilterChip>
          )}
          <Button variant="text" size="sm" onClick={limpiarTodo}>
            {MENSAJES.limpiarFiltros}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        {lista.isError && !lista.data ? (
          <ErrorState
            title="No se pudo cargar la lista de fincas"
            onRetry={() => lista.refetch()}
          />
        ) : (
          <>
            <FincasTable
              fincas={lista.data?.items ?? []}
              cargando={lista.isPending}
              seleccionada={idFicha}
              onAbrir={(f) => abrirFicha(f.id)}
              vacio={
                <EmptyState
                  icon={hayFiltros ? Search : Leaf}
                  title={
                    hayFiltros ? MENSAJES.sinResultadosTitulo : 'Aún no hay fincas registradas'
                  }
                  message={
                    hayFiltros
                      ? 'Revisa el nombre de la finca o del productor, o limpia los filtros.'
                      : 'Registra la primera finca de un productor activo.'
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
                noun="fincas"
                onPageChange={(p) => setFiltros({ page: String(p) })}
              />
            )}
          </>
        )}
      </Card>

      {idFicha && ficha.data && !ventana && (
        <FichaFinca
          finca={ficha.data}
          onClose={() => abrirFicha(null)}
          onEditar={() => setVentana({ tipo: 'formulario', finca: ficha.data })}
          onAgregarCultivo={() => setVentana({ tipo: 'cultivo', finca: ficha.data })}
        />
      )}
      {ventana?.tipo === 'formulario' && (
        <FincaFormModal
          finca={ventana.finca}
          onClose={() => setVentana(null)}
          onGuardada={(f) => abrirFicha(f.id)}
        />
      )}
      {ventana?.tipo === 'cultivo' && (
        <AgregarCultivoModal finca={ventana.finca} onClose={() => setVentana(null)} />
      )}
    </>
  )
}
