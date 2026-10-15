import { useState } from 'react'
import { Download, MessageCircle, UserCheck, UserX } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { nombreConFecha } from '@/utils/descarga'
import {
  useCambiarEstadoProductores,
  useEnviarMensajeProductores,
  useExportarProductores,
} from '../hooks'
import type { Productor } from '../types'

const MAX_MENSAJE = 500
const REGISTRO = 'El cambio queda en el registro de actividad.'

const plural = (n: number) => (n === 1 ? '1 productor' : `${n} productores`)

/** Lista de nombres de la confirmación (hasta 8; el resto se resume). */
function Nombres({ productores }: { productores: Productor[] }) {
  const visibles = productores.slice(0, 8)
  return (
    <ul className="m-0 mt-2 flex list-disc flex-col gap-0.5 pl-4.5 text-cuerpo-sm">
      {visibles.map((p) => (
        <li key={p.id}>{p.nombre}</li>
      ))}
      {productores.length > visibles.length && (
        <li className="list-none text-tinta-terciaria">
          y {productores.length - visibles.length} más
        </li>
      )}
    </ul>
  )
}

/** «Enviar mensaje por WhatsApp» a los seleccionados (solo a los activos). */
function MensajeDialog({
  productores,
  onClose,
}: {
  productores: Productor[]
  onClose: () => void
}) {
  const enviar = useEnviarMensajeProductores()
  const [mensaje, setMensaje] = useState('')
  const [intentado, setIntentado] = useState(false)
  const activos = productores.filter((p) => p.activo)
  const omitidos = productores.length - activos.length
  const error =
    intentado && !mensaje.trim() ? 'Escribe el mensaje para los productores.' : undefined

  const onEnviar = () => {
    setIntentado(true)
    if (!mensaje.trim() || activos.length === 0) return
    enviar.mutate(
      { ids: productores.map((p) => p.id), mensaje: mensaje.trim() },
      {
        onSuccess: (r) => {
          toast.exito(`Mensaje enviado a ${plural(r.enviados)}`, REGISTRO)
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      icon={MessageCircle}
      iconTone="ok"
      title="Enviar mensaje por WhatsApp"
      description={`Lo recibirán ${plural(activos.length)} por el chatbot de la asociación.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviar.isPending}>
            Cancelar
          </Button>
          <Button onClick={onEnviar} loading={enviar.isPending} disabled={activos.length === 0}>
            Enviar a {plural(activos.length)}
          </Button>
        </>
      }
    >
      {enviar.isError && (
        <Aviso tono="peligro" titulo="No se envió el mensaje.">
          {esErrorApi(enviar.error) ? enviar.error.message : MENSAJES.errorConexionTexto}
        </Aviso>
      )}
      {omitidos > 0 && (
        <Aviso tono="adv">
          {omitidos === 1
            ? '1 productor seleccionado está deshabilitado y no recibirá el mensaje.'
            : `${omitidos} productores seleccionados están deshabilitados y no recibirán el mensaje.`}
        </Aviso>
      )}
      <div className="relative">
        <span
          aria-live="polite"
          className="absolute top-0 right-0 text-cuerpo-sm text-tinta-terciaria tabular-nums"
        >
          {mensaje.length}/{MAX_MENSAJE}
        </span>
        <FormField
          label="Mensaje"
          htmlFor="m-msj"
          required
          error={error}
          hint="Usa frases cortas y claras. No incluyas productos, dosis ni tratamientos."
        >
          <Textarea
            id="m-msj"
            rows={5}
            maxLength={MAX_MENSAJE}
            value={mensaje}
            invalid={!!error}
            aria-describedby={fieldDescriptionId('m-msj')}
            onChange={(e) => setMensaje(e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  )
}

interface AccionesMasivasProps {
  seleccionados: Productor[]
  onQuitarSeleccion: () => void
}

/**
 * Barra «N seleccionados» (artboard 08c · pantalla 21): Activar, Desactivar, Enviar mensaje
 * por WhatsApp, Exportar selección (CSV) y Quitar selección. Cada cambio pide confirmación.
 */
export function AccionesMasivas({ seleccionados, onQuitarSeleccion }: AccionesMasivasProps) {
  const [accion, setAccion] = useState<'activar' | 'desactivar' | 'mensaje' | null>(null)
  const estado = useCambiarEstadoProductores()
  const exportar = useExportarProductores()
  const n = seleccionados.length
  const desactivar = accion === 'desactivar'

  const aplicarEstado = () =>
    estado.mutate(
      { ids: seleccionados.map((p) => p.id), activo: !desactivar },
      {
        onSuccess: () => {
          toast.exito(
            `${plural(n)} ${desactivar ? (n === 1 ? 'quedó deshabilitado' : 'quedaron deshabilitados') : n === 1 ? 'quedó activo' : 'quedaron activos'}`,
            REGISTRO,
          )
          setAccion(null)
          onQuitarSeleccion()
        },
        onError: (e) => {
          setAccion(null)
          toast.error(
            'No se aplicó el cambio',
            esErrorApi(e) ? e.message : MENSAJES.errorConexionTexto,
          )
        },
      },
    )

  const exportarSeleccion = () =>
    exportar.mutate(
      {
        origen: { ids: seleccionados.map((p) => p.id) },
        archivo: nombreConFecha('productores-seleccion', 'csv'),
      },
      {
        onSuccess: () => toast.exito('Selección exportada', `${plural(n)} en el archivo CSV.`),
        onError: () => toast.error('No se exportó la selección', MENSAJES.errorConexionTexto),
      },
    )

  return (
    <>
      <div
        role="region"
        aria-label="Acciones masivas"
        className="flex flex-wrap items-center gap-2 border-b border-verde-300 bg-verde-100 px-6 py-2.5"
      >
        <b className="font-semibold tabular-nums">
          {n} {n === 1 ? 'seleccionado' : 'seleccionados'}
        </b>
        <span className="min-w-0 flex-1 text-cuerpo-sm text-tinta-terciaria">
          Acciones para todos los seleccionados
        </span>
        <Button variant="secondary" size="sm" onClick={() => setAccion('activar')}>
          <UserCheck aria-hidden="true" />
          Activar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setAccion('desactivar')}>
          <UserX aria-hidden="true" />
          Desactivar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setAccion('mensaje')}>
          <MessageCircle aria-hidden="true" />
          Enviar mensaje por WhatsApp
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportarSeleccion}
          loading={exportar.isPending}
        >
          <Download aria-hidden="true" />
          Exportar selección (CSV)
        </Button>
        <Button variant="text" size="sm" onClick={onQuitarSeleccion}>
          Quitar selección
        </Button>
      </div>

      <ConfirmDialog
        open={accion === 'activar' || accion === 'desactivar'}
        danger={desactivar}
        icon={desactivar ? UserX : UserCheck}
        title={`¿${desactivar ? 'Desactivar' : 'Activar'} a ${plural(n)}?`}
        message={
          desactivar
            ? 'El chatbot dejará de atender sus números y no recibirán mensajes de alerta. Sus fincas y casos se conservan.'
            : 'El chatbot volverá a atender sus números y recibirán los mensajes de alerta.'
        }
        confirmLabel={`${desactivar ? 'Desactivar' : 'Activar'} ${plural(n)}`}
        loading={estado.isPending}
        onConfirm={aplicarEstado}
        onCancel={() => setAccion(null)}
      >
        <Nombres productores={seleccionados} />
      </ConfirmDialog>

      {accion === 'mensaje' && (
        <MensajeDialog productores={seleccionados} onClose={() => setAccion(null)} />
      )}
    </>
  )
}
