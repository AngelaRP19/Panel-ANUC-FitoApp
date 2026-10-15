import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAlerta, useAlertas } from '@/features/alertas'
import {
  AlertaMapa,
  CapaConcentracion,
  FiltrosMapa,
  MapaVigilancia,
  TablaCasosMapa,
  leerOcultas,
  useCasosMapa,
  useFiltrosMapa,
} from '@/features/mapa'
import { formatearFecha } from '@/utils/fechas'

/**
 * Mapa de vigilancia (diseño 05 · pantalla 19 · líder): casos con resultado técnico
 * Confirmado u Otra patología por categoría (forma + color), filtros, capa de concentración,
 * radio de la alerta generada y la tabla de casos. Filtros y capas en la URL.
 */
export default function MapaPage() {
  const { filtros, setFiltros } = useFiltrosMapa()
  const { data, isPending, isError, refetch } = useCasosMapa(filtros)
  const ocultas = leerOcultas(filtros.ocultas)
  const visibles = (data?.casos ?? []).filter((c) => !ocultas.has(c.categoria))
  const calor = filtros.calor !== '0' && !ocultas.has('TRIPS')

  // «Ver en el mapa de vigilancia» (ficha de la finca): se elige el caso más reciente de la finca.
  const deFinca = filtros.finca
    ? [...visibles].reverse().find((c) => c.finca_id === filtros.finca)
    : undefined
  const [elegido, setElegido] = useState<string | null>(null)
  const seleccionado = elegido ?? deFinca?.id ?? null

  // Alerta generada más reciente: su tarjeta y el círculo del radio.
  const generadas = useAlertas({ estado: 'GENERADA', page: '1' })
  const ultima = generadas.data?.items[0] ?? null
  const detalle = useAlerta(ultima?.id ?? null)
  const conUbicacion = detalle.data?.casos.filter((c) => c.latitud !== null) ?? []
  const circulo =
    detalle.data && conUbicacion.length
      ? {
          centro: {
            lat: conUbicacion.reduce((s, c) => s + c.latitud!, 0) / conUbicacion.length,
            lng: conUbicacion.reduce((s, c) => s + c.longitud!, 0) / conUbicacion.length,
          },
          radioKm: detalle.data.radio_km,
        }
      : null

  const fechas = visibles.map((c) => c.fecha).sort()
  const rango = fechas.length
    ? ` · ${formatearFecha(fechas[0])} – ${formatearFecha(fechas.at(-1))}`
    : ''

  return (
    <>
      <PageHeader
        title="Mapa de vigilancia"
        description={
          data
            ? `${visibles.length} ${visibles.length === 1 ? 'caso confirmado' : 'casos confirmados'}${rango} · Zetaquirá, Boyacá · solo casos con resultado técnico Confirmado u Otra patología`
            : undefined
        }
      />
      <FiltrosMapa filtros={filtros} conteos={data?.conteos} onCambiar={setFiltros} />

      {isError && !data ? (
        <Card>
          <ErrorState title="No se pudieron cargar los casos del mapa" onRetry={() => refetch()} />
        </Card>
      ) : isPending ? (
        <Skeleton style={{ height: 480 }} />
      ) : (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <MapaVigilancia
                casos={visibles}
                calor={calor}
                alerta={circulo}
                seleccionado={seleccionado}
                onSeleccionar={setElegido}
              />
            </div>
            <aside aria-label="Capas y resumen" className="flex flex-col gap-4 lg:col-span-4">
              <CapaConcentracion
                activa={filtros.calor !== '0'}
                categoria="TRIPS"
                onCambiar={(activa) => setFiltros({ calor: activa ? '' : '0' })}
              />
              {ultima && (
                <AlertaMapa
                  alerta={{
                    id: ultima.id,
                    generada_en: ultima.generada_en,
                    categoria: ultima.categoria,
                    vereda: ultima.vereda,
                    num_casos: ultima.num_casos,
                    radio_km: ultima.radio_km,
                    intervalo_dias: ultima.parametros.intervalo_dias,
                  }}
                />
              )}
            </aside>
          </div>
          <Card labelledBy="t-tabla" className="overflow-hidden">
            <CardHeader
              id="t-tabla"
              title="Casos en el mapa"
              subtitle="Elige un caso para ubicarlo en el mapa. Límites veredales aproximados."
            />
            <TablaCasosMapa
              casos={visibles}
              seleccionado={seleccionado}
              onAbrir={(c) => setElegido(c.id)}
            />
          </Card>
        </>
      )}
    </>
  )
}
