import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ChevronRight,
  ClipboardList,
  Construction,
  History,
  MessageCircle,
  SearchX,
} from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import {
  CasoEncabezado,
  CuestionarioDialog,
  GaleriaEvidencias,
  HistorialDialog,
  ProductorFincaDialog,
  ReasignarDialog,
  ResultadoPreliminar,
  esCasoNoEncontrado,
  useCaso,
} from '@/features/casos'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Rol } from '@/types/enums'
import { formatearFechaCorta, formatearHora } from '@/utils/fechas'
import { PATHS } from '@/routes/paths'

type Ventana = 'datos' | 'reasignar' | 'cuestionario' | 'historial' | null

/** Botón-resumen que abre una ventana (pf-resumen): cuestionario e historial. */
function Resumen({
  icono: Icono,
  titulo,
  texto,
  onClick,
}: {
  icono: typeof History
  titulo: string
  texto: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-borde bg-blanco px-5 py-4 text-left shadow-1 hover:border-verde-300"
    >
      <span className="grid size-10 flex-none place-items-center rounded-md bg-verde-100 text-verde-700">
        <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-titulos text-cuerpo font-semibold">{titulo}</span>
        <span className="text-cuerpo-sm text-tinta-terciaria">{texto}</span>
      </span>
      <ChevronRight size={18} className="text-tinta-terciaria" aria-hidden="true" />
    </button>
  )
}

/**
 * Detalle del caso (diseño 04, 04b, 04c, 04e, 04f, 12c · RQF21, RQF24): lectura del caso,
 * resultado preliminar, evidencias con visor, cuestionario e historial. El diagnóstico técnico
 * llega con la pantalla 7. Un caso de otro técnico lleva a «No tienes acceso a este caso».
 */
export default function CasoDetallePage() {
  const { id = '' } = useParams()
  const { usuario } = useAuth()
  const esLider = usuario?.rol === Rol.LIDER_TECNICO
  const { data: caso, isPending, isError, error, refetch } = useCaso(id)
  const [ventana, setVentana] = useState<Ventana>(null)
  usePageTitle(caso ? `Caso #${caso.id}` : 'Detalle del caso')

  const migas = (
    <Breadcrumb
      items={[
        { label: esLider ? 'Bandeja de casos' : 'Mis casos asignados', to: PATHS.casos },
        { label: `Caso #${id}` },
      ]}
    />
  )

  if (isPending) {
    return (
      <>
        {migas}
        <div role="status" aria-busy="true" className="flex flex-col gap-6">
          <span className="sr-only">Cargando el caso</span>
          <Skeleton style={{ height: 150 }} className="rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton style={{ height: 320 }} className="rounded-lg lg:col-span-7" />
            <Skeleton style={{ height: 320 }} className="rounded-lg lg:col-span-5" />
          </div>
        </div>
      </>
    )
  }

  if (isError || !caso) {
    // 404 para el líder: el caso no existe o se eliminó al vencer su conservación.
    // (Para el técnico, el interceptor ya lo llevó a «No tienes acceso a este caso».)
    const noExiste = esCasoNoEncontrado(error)
    return (
      <>
        {migas}
        <Card>
          {noExiste ? (
            <EmptyState
              icon={SearchX}
              title="No encontramos este caso"
              message={`El caso #${id} no existe o se eliminó al vencer su fecha de conservación.`}
              action={
                <Link to={PATHS.casos} className={buttonClass('primary')}>
                  Volver a la bandeja
                </Link>
              }
            />
          ) : (
            <ErrorState title="No se pudo cargar el caso" onRetry={() => refetch()} />
          )}
        </Card>
      </>
    )
  }

  const cuest = caso.cuestionario_resumen
  const textoCuestionario =
    cuest.desde && cuest.hasta
      ? `${cuest.respuestas} respuestas · ${formatearFechaCorta(cuest.desde)}, ${formatearHora(cuest.desde)}–${formatearHora(cuest.hasta)}`
      : `${cuest.respuestas} respuestas`
  const ultimo = caso.historial_ultimo
  const textoHistorial = ultimo
    ? `Último: ${ultimo.titulo.charAt(0).toLowerCase()}${ultimo.titulo.slice(1)} · ${formatearHora(ultimo.en)}`
    : 'Sin movimientos'

  return (
    <>
      {migas}
      <CasoEncabezado
        caso={caso}
        esLider={esLider}
        usuarioId={usuario?.id ?? ''}
        onProductorFinca={() => setVentana('datos')}
        onReasignar={() => setVentana('reasignar')}
      />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <ResultadoPreliminar caso={caso} />
          <GaleriaEvidencias caso={caso} />
          <div className="grid gap-6 sm:grid-cols-2">
            <Resumen
              icono={MessageCircle}
              titulo="Cuestionario del chatbot"
              texto={textoCuestionario}
              onClick={() => setVentana('cuestionario')}
            />
            <Resumen
              icono={History}
              titulo="Historial y trazabilidad"
              texto={textoHistorial}
              onClick={() => setVentana('historial')}
            />
          </div>
        </div>

        <section
          aria-labelledby="t-diag"
          className="rounded-lg border border-verde-300 bg-blanco shadow-1 lg:col-span-5"
        >
          <div className="px-6 pt-5">
            <p className="sobretitulo">Resultado técnico · decisión humana</p>
            <h2 id="t-diag" className="mt-1 titulo-h2">
              {caso.estado === 'CERRADO'
                ? 'Diagnóstico técnico registrado'
                : 'Registrar diagnóstico técnico'}
            </h2>
          </div>
          {/* TODO(pantalla 7): formulario de diagnóstico, cierre y lectura del caso cerrado. */}
          <EmptyState
            icon={caso.estado === 'CERRADO' ? ClipboardList : Construction}
            title="Disponible en la siguiente entrega"
            message="El registro del diagnóstico técnico y el cierre del caso llegan con la pantalla 7."
          />
        </section>
      </div>

      {ventana === 'datos' && (
        <ProductorFincaDialog caso={caso} esLider={esLider} onClose={() => setVentana(null)} />
      )}
      {ventana === 'reasignar' && <ReasignarDialog caso={caso} onClose={() => setVentana(null)} />}
      {ventana === 'cuestionario' && (
        <CuestionarioDialog caso={caso} onClose={() => setVentana(null)} />
      )}
      {ventana === 'historial' && <HistorialDialog caso={caso} onClose={() => setVentana(null)} />}
    </>
  )
}
