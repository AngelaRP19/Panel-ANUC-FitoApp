import { useEffect, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  DocumentacionContenido,
  SubirDocumentoModal,
  TIPO_DOCUMENTO_LABEL,
  useDocumentos,
  useFiltrosDocumentos,
} from '@/features/documentos'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'

/**
 * Documentación fitosanitaria (diseño 07b · pantalla 20 · líder): manual principal y una
 * tarjeta por categoría con su propagación y sus PDF. Búsqueda y filtro por tipo en la URL.
 */
export default function DocumentacionPage() {
  const { filtros, setFiltros, limpiar } = useFiltrosDocumentos()
  const { data, isPending, isError, refetch } = useDocumentos(filtros)
  const [subir, setSubir] = useState(false)

  const [busqueda, setBusqueda] = useState(filtros.q)
  const conRetraso = useDebounce(busqueda, 300)
  const ultimo = useRef(filtros.q)
  useEffect(() => {
    if (conRetraso === ultimo.current) return
    ultimo.current = conRetraso
    setFiltros({ q: conRetraso.trim() })
  }, [conRetraso, setFiltros])

  const hayFiltros = !!filtros.q || !!filtros.tipo
  const vacio = data && !data.manual && data.generales.length === 0 && data.categorias.length === 0

  return (
    <>
      <PageHeader
        title="Documentación fitosanitaria"
        description="Síntomas, propagación y manejo de cada categoría fitosanitaria. Base para ajustar los parámetros de alerta."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Parámetros epidemiológicos', to: PATHS.parametros },
              { label: 'Documentación' },
            ]}
          />
        }
        actions={
          <Button onClick={() => setSubir(true)}>
            <Plus aria-hidden="true" />
            Subir documento
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
            aria-label="Buscar en la documentación"
            placeholder="Buscar síntoma, categoría o documento"
            className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
          />
        </div>
        <Select
          aria-label="Tipo de documento"
          value={filtros.tipo}
          onChange={(e) => setFiltros({ tipo: e.target.value })}
          placeholder="Todos los tipos"
          options={Object.entries(TIPO_DOCUMENTO_LABEL).map(([value, label]) => ({
            value,
            label,
          }))}
          className="w-full text-cuerpo-sm sm:w-50"
        />
        {hayFiltros && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              limpiar()
              setBusqueda('')
              ultimo.current = ''
            }}
          >
            {MENSAJES.limpiarFiltros}
          </Button>
        )}
      </div>

      {isError && !data ? (
        <Card>
          <ErrorState title="No se pudo cargar la documentación" onRetry={() => refetch()} />
        </Card>
      ) : isPending ? (
        <Skeleton style={{ height: 420 }} />
      ) : vacio ? (
        <Card>
          <EmptyState
            icon={Search}
            title="Ningún documento coincide con la búsqueda"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  limpiar()
                  setBusqueda('')
                  ultimo.current = ''
                }}
              >
                {MENSAJES.limpiarFiltros}
              </Button>
            }
          />
        </Card>
      ) : (
        <DocumentacionContenido datos={data} />
      )}

      <p className="text-cuerpo-sm text-tinta-terciaria">
        Los documentos se abren en una pestaña nueva. Solo el líder técnico puede subir o reemplazar
        documentos.
      </p>

      {subir && <SubirDocumentoModal onClose={() => setSubir(false)} />}
    </>
  )
}
