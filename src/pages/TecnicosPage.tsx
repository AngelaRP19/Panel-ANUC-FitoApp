import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import {
  CuentaFormModal,
  CuentasFiltros,
  CuentasTable,
  FichaCuenta,
  useCuenta,
  useCuentas,
  useFiltrosCuentas,
  type Cuenta,
} from '@/features/usuarios'
import { useDebounce } from '@/hooks/useDebounce'
import { MENSAJES } from '@/locales/es'

type Formulario = { cuenta: Cuenta | null } | null

/**
 * Técnicos (diseño 10 · RQF01, 03, 05, 11-13, solo líder técnico): cuentas del panel (líderes
 * y técnicos), ficha con «Cuenta activa», registro con contraseña temporal y edición. La única
 * cuenta activa de un rol no se puede desactivar. La ficha abierta vive en `?cuenta=`.
 */
export default function TecnicosPage() {
  const { usuario } = useAuth()
  const { filtros, setFiltros, limpiar } = useFiltrosCuentas()
  const [params, setParams] = useSearchParams()
  const lista = useCuentas(filtros)
  const [formulario, setFormulario] = useState<Formulario>(null)

  const idFicha = params.get('cuenta')
  const ficha = useCuenta(idFicha)
  const abrirFicha = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set('cuenta', id)
        else n.delete('cuenta')
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

  return (
    <>
      <PageHeader
        title="Técnicos"
        description="Cuentas que usan el panel. Los técnicos solo ven los casos que tienen asignados."
        actions={
          <Button onClick={() => setFormulario({ cuenta: null })}>
            <UserPlus aria-hidden="true" />
            Registrar técnico
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-2.5 left-3 text-tinta-terciaria"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar técnico"
            placeholder="Nombre o correo"
            className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
          />
        </div>
        <CuentasFiltros filtros={filtros} onCambiar={setFiltros} />
        {hayFiltros && (
          <Button variant="text" size="sm" onClick={limpiarTodo}>
            {MENSAJES.limpiarFiltros}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {lista.isError && !lista.data ? (
          <ErrorState
            title="No se pudo cargar la lista de cuentas"
            onRetry={() => lista.refetch()}
          />
        ) : (
          <>
            <CuentasTable
              cuentas={lista.data?.items ?? []}
              cargando={lista.isPending}
              seleccionada={idFicha}
              onAbrir={(c) => abrirFicha(c.id)}
              vacio={
                <EmptyState
                  icon={hayFiltros ? Search : Users}
                  title={
                    hayFiltros ? 'Ninguna cuenta coincide con los filtros' : 'Aún no hay cuentas'
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
                noun="cuentas"
                onPageChange={(p) => setFiltros({ page: String(p) })}
              />
            )}
          </>
        )}
      </Card>

      {idFicha && ficha.data && !formulario && (
        <FichaCuenta
          cuenta={ficha.data}
          usuarioId={usuario?.id ?? ''}
          onClose={() => abrirFicha(null)}
          onEditar={() => setFormulario({ cuenta: ficha.data })}
        />
      )}
      {formulario && (
        <CuentaFormModal cuenta={formulario.cuenta} onClose={() => setFormulario(null)} />
      )}
    </>
  )
}
