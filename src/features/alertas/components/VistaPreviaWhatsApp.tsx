import { formatearHora } from '@/utils/fechas'
import { PLANTILLA_MENSAJE } from '../utils'

interface VistaPreviaWhatsAppProps {
  categoria: string
  recomendacion: string
}

/** «Vista previa en WhatsApp» (pf-wa): burbuja del chatbot con la plantilla y la hora. */
export function VistaPreviaWhatsApp({ categoria, recomendacion }: VistaPreviaWhatsAppProps) {
  const hora = formatearHora(new Date().toISOString())
  return (
    <section
      aria-labelledby="t-prev"
      className="rounded-lg border border-borde bg-blanco px-6 py-5 shadow-1"
    >
      <h2 id="t-prev" className="mb-3 titulo-h3">
        Vista previa en WhatsApp
      </h2>
      <div className="flex flex-col gap-2 rounded-lg bg-neutro-suave p-4">
        <div className="flex items-center gap-2.5 border-b border-borde pb-2">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-verde-100 font-titulos text-[12px] font-bold text-verde-800"
          >
            AZ
          </span>
          <div>
            <div className="text-cuerpo-sm font-semibold">ANUC Zetaquira</div>
            <div className="text-[12px] leading-4 text-tinta-terciaria">Chatbot fitosanitario</div>
          </div>
        </div>
        <div className="max-w-[92%] self-start rounded-[4px_12px_12px_12px] bg-blanco px-3 py-2.5 text-cuerpo-sm break-words whitespace-pre-line shadow-1">
          <b className="font-bold">{PLANTILLA_MENSAJE.inicio}</b>
          {PLANTILLA_MENSAJE.antesCategoria}
          <b className="font-bold">{categoria}</b>
          {PLANTILLA_MENSAJE.antesMensaje}
          {recomendacion.trim() ? (
            recomendacion
          ) : (
            <span className="text-tinta-terciaria">[mensaje]</span>
          )}
          <div className="mt-1 text-right text-[11px] text-tinta-terciaria tabular-nums">
            {hora}
          </div>
        </div>
      </div>
    </section>
  )
}
