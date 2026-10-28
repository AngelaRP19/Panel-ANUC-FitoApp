import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Undo2, Users } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldDescriptionId, FormField } from '@/components/ui/FormField'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { CATEGORIA_LABEL, MENSAJES, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorApi } from '@/services/apiClient'
import { cn } from '@/utils/cn'
import { fechaCalendario, formatearFechaEntrada, formatearFechaHora } from '@/utils/fechas'
import { useCorregirAlerta } from '../hooks'
import type { Alerta } from '../types'
import { MAX_RECOMENDACION, PLANTILLA_CORRECCION, textoProductores } from '../utils'
import { HuecoPlantilla, VistaPreviaWhatsApp } from './VistaPreviaWhatsApp'

const PILDORA =
  'inline-flex h-5.5 items-center rounded-pill border border-verde-700 bg-verde-100 px-2 text-nota font-semibold text-verde-800'

/** «dd/mm/aaaa» del día en que se comunicó la alerta (la API puede mandar fecha o instante). */
function diaComunicada(a: Alerta) {
  if (!a.comunicada_en) return ''
  const dia = a.comunicada_en.length > 10 ? fechaCalendario(a.comunicada_en) : a.comunicada_en
  return formatearFechaEntrada(dia)
}

/**
 * Corregir una alerta comunicada por error (D-17 · solo líder): plantilla fija de solo lectura +
 * explicación obligatoria, vista previa, destinatarios (los mismos que recibieron la alerta) y
 * envío con confirmación. Se hace una sola vez; la alerta pasa a Corregida.
 */
export function CorreccionAlerta({ alerta }: { alerta: Alerta }) {
  const navigate = useNavigate()
  const corregir = useCorregirAlerta(alerta.id)
  const cat = CATEGORIA_LABEL[alerta.categoria]
  const fecha = diaComunicada(alerta)
  const total = alerta.productores_notificados ?? 0

  const [mensaje, setMensaje] = useState('')
  const [tocado, setTocado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const vacia = !mensaje.trim()
  const errorCampo = esErrorApi(corregir.error) ? corregir.error.campos.mensaje : undefined
  const errorMensaje =
    tocado && vacia ? 'Escribe la explicación de la corrección.' : (errorCampo ?? undefined)
  const errorGeneral = corregir.isError && !errorCampo
  const puedeEnviar = !vacia && total > 0

  const onEnviar = () =>
    corregir.mutate(mensaje.trim(), {
      onSuccess: () => {
        toast.exito(
          'Corrección enviada',
          `${textoProductores(total)} ${total === 1 ? 'recibirá' : 'recibirán'} la corrección de ${alerta.id}.`,
        )
        void navigate(`${PATHS.alertas}/${encodeURIComponent(alerta.id)}`)
      },
      onError: () => setConfirmando(false),
    })

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <section
          aria-labelledby="t-corr"
          className="rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-7"
        >
          <div className="border-b border-borde px-6 py-4">
            <h2 id="t-corr" className="titulo-h2">
              Explicar la corrección
            </h2>
          </div>
          <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
            {errorGeneral && (
              <Aviso tono="peligro" titulo="No se envió la corrección.">
                {esErrorApi(corregir.error) && corregir.error.status
                  ? corregir.error.message
                  : `${MENSAJES.errorConexionTexto} Lo escrito no se perdió.`}
              </Aviso>
            )}
            <Aviso tono="info">
              Usa esta opción solo si la alerta se envió por error. La corrección llega a los mismos
              productores que recibieron la alerta y se puede enviar una sola vez.
            </Aviso>
            <div>
              <div className="mb-1.5 etiqueta">Plantilla fija de corrección</div>
              <p className="rounded-[10px] border border-borde bg-verde-50 px-4 py-3.5 leading-[26px] text-tinta-secundaria">
                {PLANTILLA_CORRECCION.inicio}
                {PLANTILLA_CORRECCION.antesCategoria}
                <span className={PILDORA}>{cat}</span>
                {PLANTILLA_CORRECCION.antesFecha}
                <span className={PILDORA}>{fecha || '[fecha]'}</span>
                {PLANTILLA_CORRECCION.antesMensaje}
                <span className={PILDORA}>[explicación]</span>
              </p>
              <p className="mt-1.5 text-nota text-tinta-terciaria">
                El texto fijo no se puede cambiar. Tú completas la explicación.
              </p>
            </div>

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
                label="Explicación"
                htmlFor="corr"
                required
                error={errorMensaje}
                hint="Explica por qué el aviso no aplica, con frases cortas y claras."
              >
                <Textarea
                  id="corr"
                  rows={5}
                  className="min-h-33"
                  maxLength={MAX_RECOMENDACION}
                  value={mensaje}
                  invalid={!!errorMensaje}
                  aria-required="true"
                  aria-describedby={fieldDescriptionId('corr')}
                  onChange={(e) => {
                    setMensaje(e.target.value)
                    if (corregir.isError) corregir.reset()
                  }}
                  onBlur={() => setTocado(true)}
                />
              </FormField>
            </div>

            <Aviso tono="adv">
              La explicación no debe incluir productos, dosis ni tratamientos: solo la aclaración y
              la invitación a escribir por el chat (RQF45).
            </Aviso>
          </div>
        </section>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <VistaPreviaWhatsApp>
            <b className="font-bold">{PLANTILLA_CORRECCION.inicio}</b>
            {PLANTILLA_CORRECCION.antesCategoria}
            <b className="font-bold">{cat}</b>
            {PLANTILLA_CORRECCION.antesFecha}
            {fecha || <HuecoPlantilla>[fecha]</HuecoPlantilla>}
            {PLANTILLA_CORRECCION.antesMensaje}
            {mensaje.trim() ? mensaje : <HuecoPlantilla>[explicación]</HuecoPlantilla>}
          </VistaPreviaWhatsApp>

          <section
            aria-labelledby="t-dest-corr"
            className="rounded-lg border border-borde bg-blanco px-6 py-5 shadow-1"
          >
            <h2 id="t-dest-corr" className="mb-3 titulo-h3">
              Destinatarios
            </h2>
            <div className="flex items-start gap-3">
              <span className="grid size-10 flex-none place-items-center rounded-md bg-verde-100 text-verde-700">
                <Users size={22} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 text-cuerpo-sm">
                <div className="font-semibold">
                  Los mismos {textoProductores(total)} que recibieron la alerta
                </div>
                <div className="text-tinta-terciaria">
                  Zona de {VEREDA_LABEL[alerta.vereda]}
                  {alerta.comunicada_en
                    ? ` · alerta enviada el ${formatearFechaHora(alerta.comunicada_en)}`
                    : ''}
                  . No se pueden agregar ni quitar productores.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-borde bg-blanco px-6 py-4 shadow-1">
        <p className="min-w-0 flex-1 text-cuerpo-sm text-tinta-secundaria">
          <b className="font-semibold text-tinta">{textoProductores(total)}</b>{' '}
          {total === 1 ? 'recibirá' : 'recibirán'} la corrección por WhatsApp. Al enviarla, la
          alerta pasa a Corregida.
        </p>
        <Button
          variant="secondary"
          onClick={() => navigate(`${PATHS.alertas}/${encodeURIComponent(alerta.id)}`)}
          disabled={corregir.isPending}
        >
          Cancelar
        </Button>
        <Button
          disabled={!puedeEnviar}
          onClick={() => {
            setTocado(true)
            setConfirmando(true)
          }}
        >
          <Undo2 aria-hidden="true" />
          Enviar corrección
        </Button>
      </div>

      <ConfirmDialog
        open={confirmando}
        icon={Undo2}
        title={`¿Enviar la corrección a ${textoProductores(total)}?`}
        message={`La corrección de ${alerta.id} llegará por WhatsApp a quienes recibieron la alerta. Solo se puede enviar una vez y después no se puede editar ni cancelar.`}
        confirmLabel="Enviar corrección"
        loading={corregir.isPending}
        onConfirm={onEnviar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  )
}
