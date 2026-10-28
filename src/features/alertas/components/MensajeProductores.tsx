import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Lock, Send } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorApi } from '@/services/apiClient'
import type { Vereda } from '@/types/enums'
import { cn } from '@/utils/cn'
import { useComunicarAlerta, useDestinatarios, useGuardarBorradorMensaje } from '../hooks'
import type { Alerta, BorradorMensaje } from '../types'
import {
  guardarBorradorLocal,
  leerBorradorLocal,
  MAX_RECOMENDACION,
  PLANTILLA_MENSAJE,
  textoProductores,
} from '../utils'
import { DestinatariosVeredas } from './DestinatariosVeredas'
import { HuecoPlantilla, VistaPreviaWhatsApp } from './VistaPreviaWhatsApp'

/** «Juracambita», «Juracambita y Centro», «Juracambita, Centro y San Luis». */
function unirVeredas(v: Vereda[]) {
  const n = v.map((x) => VEREDA_LABEL[x])
  return n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} y ${n.at(-1)}`
}

/**
 * Redactar y comunicar el mensaje de una alerta confirmada (diseño 06b · RQF26, RQF45):
 * plantilla fija + recomendación del técnico, vista previa, destinatarios por vereda y envío
 * con confirmación. Lo escrito se conserva en sessionStorage ante recargas o caídas de conexión.
 */
export function MensajeProductores({ alerta }: { alerta: Alerta }) {
  const navigate = useNavigate()
  const destinatarios = useDestinatarios(alerta.id)
  const guardar = useGuardarBorradorMensaje(alerta.id)
  const comunicar = useComunicarAlerta(alerta.id)
  const cat = CATEGORIA_LABEL[alerta.categoria]

  // Un borrador local sin guardar tiene prioridad sobre el guardado en el servidor.
  const [inicial] = useState<BorradorMensaje>(
    () =>
      leerBorradorLocal(alerta.id) ?? alerta.borrador ?? { mensaje: '', veredas: [alerta.vereda] },
  )
  const [mensaje, setMensaje] = useState(inicial.mensaje)
  const [veredas, setVeredas] = useState<Vereda[]>(inicial.veredas)
  const [tocado, setTocado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const cambiar = (b: BorradorMensaje) => {
    setMensaje(b.mensaje)
    setVeredas(b.veredas)
    guardarBorradorLocal(alerta.id, b)
  }

  const vacia = !mensaje.trim()
  const errorMensaje =
    tocado && vacia ? 'Escribe la recomendación para los productores.' : undefined
  const total = (destinatarios.data ?? [])
    .filter((d) => veredas.includes(d.vereda))
    .reduce((s, d) => s + d.productores.length, 0)
  const elegidas = (destinatarios.data ?? [])
    .map((d) => d.vereda)
    .filter((v) => veredas.includes(v))
  const puedeEnviar = !vacia && total > 0

  const onGuardar = () =>
    guardar.mutate(
      { mensaje, veredas },
      {
        onSuccess: () => {
          guardarBorradorLocal(alerta.id, null)
          toast.exito('Borrador guardado', 'Puedes terminar el mensaje más tarde.')
        },
        onError: () =>
          toast.error(
            'No se guardó el borrador',
            'Lo escrito se conserva en esta pestaña. Intenta de nuevo.',
          ),
      },
    )

  const onEnviar = () =>
    comunicar.mutate(
      { mensaje: mensaje.trim(), veredas: elegidas },
      {
        onSuccess: (a) => {
          guardarBorradorLocal(alerta.id, null)
          toast.exito(
            'Alerta comunicada',
            `Mensaje enviado a ${textoProductores(a.productores_notificados ?? total)} de ${unirVeredas(elegidas)}.`,
          )
          void navigate(`${PATHS.alertas}/${encodeURIComponent(alerta.id)}`)
        },
        onError: () => setConfirmando(false),
      },
    )

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <section
          aria-labelledby="t-red"
          className="rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-7"
        >
          <div className="border-b border-borde px-6 py-4">
            <h2 id="t-red" className="titulo-h2">
              Redactar mensaje
            </h2>
          </div>
          <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
            {comunicar.isError && (
              <Aviso tono="peligro" titulo="No se envió el mensaje.">
                {esErrorApi(comunicar.error) && comunicar.error.status
                  ? comunicar.error.message
                  : `${MENSAJES.errorConexionTexto} Lo escrito no se perdió.`}
              </Aviso>
            )}
            <div>
              <div className="mb-1.5 etiqueta">Plantilla fija</div>
              <p className="rounded-[10px] border border-borde bg-verde-50 px-4 py-3.5 leading-[26px] text-tinta-secundaria">
                {PLANTILLA_MENSAJE.inicio}
                {PLANTILLA_MENSAJE.antesCategoria}
                <span className="inline-flex h-5.5 items-center rounded-pill border border-verde-700 bg-verde-100 px-2 text-nota font-semibold text-verde-800">
                  [categoría]
                </span>
                {PLANTILLA_MENSAJE.antesMensaje}
                <span className="inline-flex h-5.5 items-center rounded-pill border border-verde-700 bg-verde-100 px-2 text-nota font-semibold text-verde-800">
                  [mensaje]
                </span>
              </p>
              <p className="mt-1.5 text-nota text-tinta-terciaria">
                El texto fijo no se puede cambiar. Tú completas la recomendación.
              </p>
            </div>

            <FormField
              label="Categoría fitosanitaria"
              htmlFor="cat-m"
              hint="Se toma de la alerta confirmada."
            >
              <div className="relative">
                <Lock
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-3 left-3 text-inactivo"
                />
                <Input
                  id="cat-m"
                  value={cat}
                  disabled
                  readOnly
                  className="pl-9"
                  aria-describedby={fieldDescriptionId('cat-m')}
                />
              </div>
            </FormField>

            <div className="relative">
              <span
                aria-live="polite"
                className={cn(
                  'absolute top-0 right-0 text-cuerpo-sm tabular-nums',
                  mensaje.length > MAX_RECOMENDACION - 20
                    ? 'font-semibold text-peligro'
                    : 'text-tinta-terciaria',
                )}
              >
                {mensaje.length}/{MAX_RECOMENDACION}
              </span>
              <FormField
                label="Recomendación del técnico"
                htmlFor="rec"
                required
                error={errorMensaje}
                hint="Usa frases cortas y claras. No incluyas nombres de productores ni de fincas: el mensaje llega a toda la zona."
              >
                <Textarea
                  id="rec"
                  rows={5}
                  className="min-h-33"
                  maxLength={MAX_RECOMENDACION}
                  value={mensaje}
                  invalid={!!errorMensaje}
                  aria-required="true"
                  aria-describedby={fieldDescriptionId('rec')}
                  onChange={(e) => cambiar({ mensaje: e.target.value, veredas })}
                  onBlur={() => setTocado(true)}
                />
              </FormField>
            </div>

            <Aviso tono="adv">
              El mensaje no debe incluir productos, dosis ni tratamientos: solo orientaciones
              generales y la invitación a escribir por el chat (RQF45).
            </Aviso>
          </div>
        </section>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <VistaPreviaWhatsApp>
            <b className="font-bold">{PLANTILLA_MENSAJE.inicio}</b>
            {PLANTILLA_MENSAJE.antesCategoria}
            <b className="font-bold">{cat}</b>
            {PLANTILLA_MENSAJE.antesMensaje}
            {mensaje.trim() ? mensaje : <HuecoPlantilla>[mensaje]</HuecoPlantilla>}
          </VistaPreviaWhatsApp>
          <DestinatariosVeredas
            datos={destinatarios.data}
            cargando={destinatarios.isPending}
            error={destinatarios.isError}
            onReintentar={() => destinatarios.refetch()}
            seleccion={veredas}
            onCambiar={(v) => cambiar({ mensaje, veredas: v })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-borde bg-blanco px-6 py-4 shadow-1">
        <p className="min-w-0 flex-1 text-cuerpo-sm text-tinta-secundaria">
          <b className="font-semibold text-tinta">{textoProductores(total)}</b>{' '}
          {total === 1 ? 'recibirá' : 'recibirán'} el mensaje por WhatsApp. Al enviarlo, la alerta
          pasa a Comunicada.
        </p>
        <Button variant="secondary" onClick={onGuardar} loading={guardar.isPending}>
          Guardar borrador
        </Button>
        <Button
          disabled={!puedeEnviar}
          onClick={() => {
            setTocado(true)
            setConfirmando(true)
          }}
        >
          <Send aria-hidden="true" />
          Enviar a {textoProductores(total)}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmando}
        icon={Send}
        title={`¿Enviar la alerta a ${textoProductores(total)}?`}
        message={`El mensaje llegará por WhatsApp a los productores activos de ${unirVeredas(elegidas)}. Después de enviarlo no se puede editar ni cancelar.`}
        confirmLabel="Enviar mensaje"
        loading={comunicar.isPending}
        onConfirm={onEnviar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  )
}
