import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CategoriaNoParticipa, ParametrosForm, useParametros } from '@/features/alertas'

/**
 * Parámetros epidemiológicos (diseño 07 · RQF25 · solo líder): una tarjeta editable por cada
 * categoría que participa en las alertas (hoy Trips) y la lista de las que no participan.
 * Todo sale de la API: habilitar otra categoría no requiere cambiar código.
 * «Ir a documentación» se agrega con la pantalla 20.
 */
export default function ParametrosPage() {
  const { data, isPending, isError, refetch } = useParametros()
  const participan = data?.filter((p) => p.habilitada) ?? []
  const noParticipan = data?.filter((p) => !p.habilitada) ?? []

  return (
    <>
      <PageHeader
        title="Parámetros epidemiológicos"
        description="Definen cuándo el sistema genera una alerta de posible concentración de casos confirmados. Solo el líder técnico puede cambiarlos."
      />
      {isError ? (
        <Card>
          <ErrorState title="No se pudieron cargar los parámetros" onRetry={() => refetch()} />
        </Card>
      ) : isPending ? (
        <Skeleton style={{ height: 420 }} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-7">
            {participan.map((p) => (
              <ParametrosForm key={p.categoria} parametro={p} />
            ))}
            {participan.length === 0 && (
              <Card className="p-6 text-cuerpo-sm text-tinta-terciaria">
                Ninguna categoría participa en las alertas.
              </Card>
            )}
          </div>
          {noParticipan.length > 0 && (
            <div className="flex flex-col gap-3 lg:col-span-5">
              <p className="sobretitulo">Categorías que no participan</p>
              {noParticipan.map((p) => (
                <CategoriaNoParticipa key={p.categoria} parametro={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
