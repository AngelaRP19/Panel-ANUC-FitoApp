import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Ban, BellOff, BellRing, Check, ClipboardList, Lock, PenLine, Undo2 } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button, buttonClass } from '@/components/ui/Button'
import { EstadoAlertaBadge } from '@/components/ui/EstadoBadge'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorApi } from '@/services/apiClient'
import { formatearFechaHora } from '@/utils/fechas'
import { useConfirmarAlerta, useSeguirAlerta } from '../hooks'
import type { Alerta } from '../types'
import { formatearKm, situacionAlerta, textoParametros, tituloDetalle, unirNombres } from '../utils'
import { CasosAlertaDialog } from './CasosAlertaDialog'
import { DescartarAlertaDialog } from './DescartarAlertaDialog'
import { MapaAlerta } from './MapaAlerta'

const PIE =
  'flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-borde bg-verde-50 px-6 py-4'

interface AlertaDetalleProps {
  alerta: Alerta
  esLider: boolean
}

/**
 * Detalle de la alerta seleccionada (diseño 06 / 12g): estado, aviso de posibilidad, mapa,
 * parámetros aplicados, casos y acciones. El líder confirma o descarta; el técnico solo
 * consulta y puede pedir que se le avise cuando cambie.
 */
export function AlertaDetalle({ alerta: a, esLider }: AlertaDetalleProps) {
  const navigate = useNavigate()
  const [ventana, setVentana] = useState<'casos' | 'descartar' | null>(null)
  const confirmar = useConfirmarAlerta()
  const seguir = useSeguirAlerta()
  const cat = CATEGORIA_LABEL[a.categoria]
  const vereda = VEREDA_LABEL[a.vereda]
  const abierta = a.estado === 'GENERADA' || a.estado === 'EN_REVISION'

  const onConfirmar = () =>
    confirmar.mutate(a.id, {
      onSuccess: () => {
        toast.exito('Alerta confirmada', 'Ahora redacta el mensaje para los productores.')
        void navigate(PATHS.mensajeAlerta(a.id))
      },
      onError: (e) =>
        toast.error(
          'No se confirmó la alerta',
          esErrorApi(e) ? e.message : MENSAJES.errorConexionTexto,
        ),
    })

  const onSeguir = () =>
    seguir.mutate(
      { id: a.id, seguir: !a.siguiendo },
      {
        onSuccess: (r) =>
          r.siguiendo
            ? toast.info(
                'Te avisaremos cuando cambie',
                `Recibirás una notificación cuando ${a.id} cambie de estado.`,
              )
            : toast.info('Ya no recibirás avisos de esta alerta', a.id),
        onError: () => toast.error('No se guardó el cambio', MENSAJES.errorConexionTexto),
      },
    )

  return (
    <section
      aria-labelledby="t-alr"
      className="rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-7"
    >
      <div className="flex flex-col gap-2 border-b border-borde px-6 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="codigo text-tinta-terciaria">{a.id}</span>
          <EstadoAlertaBadge estado={a.estado} />
          <span className="ml-auto text-cuerpo-sm text-tinta-terciaria tabular-nums">
            Detectada el {formatearFechaHora(a.generada_en)} · {situacionAlerta(a)}
          </span>
        </div>
        <h2 id="t-alr" className="titulo-h2">
          {tituloDetalle(a)}
        </h2>
        {abierta && <Aviso tono="adv">{MENSAJES.avisoAlerta}</Aviso>}
        {a.estado === 'DESCARTADA' && a.descarte && (
          <Aviso
            tono="info"
            titulo={`Descartada por ${a.descarte.por.nombre} el ${formatearFechaHora(a.descarte.en)}.`}
          >
            Motivo: {a.descarte.motivo}
          </Aviso>
        )}
        {(a.estado === 'COMUNICADA' || a.estado === 'CORREGIDA') && (
          <Aviso tono="ok">
            Mensaje enviado a {a.productores_notificados ?? 0} productores
            {a.comunicada_en ? ` el ${formatearFechaHora(a.comunicada_en)}` : ''}.
          </Aviso>
        )}
        {a.estado === 'CORREGIDA' && a.correccion && (
          <section
            aria-label="Corrección enviada"
            className="rounded-md border border-borde bg-info-suave px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-cuerpo-sm font-semibold text-info">
              <Undo2 size={16} aria-hidden="true" />
              Corrección enviada
              {a.correccion.por ? ` por ${a.correccion.por.nombre}` : ''}
              {a.correccion.en ? ` el ${formatearFechaHora(a.correccion.en)}` : ''}
            </div>
            <p className="mt-1 text-cuerpo-sm text-tinta-secundaria">{a.correccion.mensaje}</p>
            <p className="mt-1 text-nota text-tinta-terciaria">
              Se envió a los mismos productores que recibieron la alerta.
            </p>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <MapaAlerta
          casos={a.casos}
          categoria={a.categoria}
          radioKm={a.radio_km}
          etiqueta={`Radio de ${formatearKm(a.radio_km)} alrededor de ${a.num_casos} casos confirmados de ${cat} en ${vereda}`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <span className="sobretitulo">Parámetros aplicados</span>
          <span className="text-cuerpo-sm tabular-nums">{textoParametros(a)}</span>
        </div>
        <div className="flex items-center gap-4 rounded-md border border-borde bg-blanco px-4 py-3">
          <span className="grid size-10 flex-none place-items-center rounded-md bg-verde-100 text-verde-700">
            <ClipboardList size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {a.num_casos} casos confirmados de {cat}
            </div>
            <div className="text-cuerpo-sm text-tinta-terciaria">
              {a.casos.map((c) => `#${c.codigo}`).join(', ')} ·{' '}
              {unirNombres(a.casos.map((c) => c.finca_nombre))}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setVentana('casos')}>
            Ver casos
          </Button>
        </div>
      </div>

      {esLider && abierta && (
        <div className={PIE}>
          <span className="text-cuerpo-sm text-tinta-terciaria">
            Al confirmar, podrás redactar el mensaje para los productores.
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setVentana('descartar')}
              disabled={confirmar.isPending}
            >
              <Ban aria-hidden="true" />
              Descartar
            </Button>
            <Button onClick={onConfirmar} loading={confirmar.isPending}>
              <Check aria-hidden="true" />
              Confirmar alerta
            </Button>
          </div>
        </div>
      )}
      {esLider && a.estado === 'CONFIRMADA' && (
        <div className={PIE}>
          <span className="text-cuerpo-sm text-tinta-terciaria">
            {a.confirmada_por && a.confirmada_en
              ? `Confirmada por ${a.confirmada_por.nombre} el ${formatearFechaHora(a.confirmada_en)}. `
              : ''}
            Falta comunicarla a los productores.
          </span>
          <Link to={PATHS.mensajeAlerta(a.id)} className={buttonClass('primary')}>
            <PenLine aria-hidden="true" />
            Redactar mensaje
          </Link>
        </div>
      )}
      {esLider && a.estado === 'COMUNICADA' && (
        <div className={PIE}>
          <span className="text-cuerpo-sm text-tinta-terciaria">
            ¿Se envió por error? Puedes enviar una corrección a los mismos productores, una sola
            vez.
          </span>
          <Link to={PATHS.correccionAlerta(a.id)} className={buttonClass('secondary')}>
            <Undo2 aria-hidden="true" />
            Corregir alerta
          </Link>
        </div>
      )}
      {!esLider && (abierta || a.estado === 'CONFIRMADA') && (
        <div className={PIE}>
          <span className="inline-flex items-center gap-1.5 text-cuerpo-sm text-tinta-terciaria">
            <Lock size={16} aria-hidden="true" />
            {abierta
              ? 'Solo el líder técnico puede confirmar o descartar esta alerta.'
              : 'Solo el líder técnico puede comunicar esta alerta a los productores.'}
          </span>
          <Button variant="secondary" onClick={onSeguir} loading={seguir.isPending}>
            {a.siguiendo ? <BellOff aria-hidden="true" /> : <BellRing aria-hidden="true" />}
            {a.siguiendo ? 'Dejar de avisarme' : 'Avisarme cuando cambie'}
          </Button>
        </div>
      )}

      {ventana === 'casos' && <CasosAlertaDialog alerta={a} onClose={() => setVentana(null)} />}
      {ventana === 'descartar' && (
        <DescartarAlertaDialog alerta={a} onClose={() => setVentana(null)} />
      )}
    </section>
  )
}
