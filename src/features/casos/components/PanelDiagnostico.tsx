import { Ban, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CasoDetalle } from '../types'
import { FormDiagnostico } from './FormDiagnostico'
import { ResumenDiagnostico } from './ResumenDiagnostico'

function SinDiagnostico({
  icono: Icono,
  titulo,
  texto,
}: {
  icono: LucideIcon
  titulo: string
  texto: string
}) {
  return (
    <section aria-labelledby="t-diag" className="rounded-lg border border-borde bg-blanco shadow-1">
      <div className="px-6 pt-5">
        <p className="sobretitulo">Resultado técnico · decisión humana</p>
        <h2 id="t-diag" className="mt-1 titulo-h2">
          Diagnóstico técnico
        </h2>
      </div>
      <div className="flex items-start gap-3 px-6 pt-4 pb-6">
        <span className="grid size-10 flex-none place-items-center rounded-md bg-neutro-suave text-neutro">
          <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">{titulo}</p>
          <p className="text-cuerpo-sm text-tinta-terciaria">{texto}</p>
        </div>
      </div>
    </section>
  )
}

interface PanelDiagnosticoProps {
  caso: CasoDetalle
  esLider: boolean
  usuarioId: string
  usuarioNombre: string
}

/**
 * Columna «Resultado técnico · decisión humana» del detalle. El formulario está activo mientras
 * el caso no esté cerrado: En revisión o Registrado (técnico asignado o líder) y, para el líder,
 * también Pendiente de revisión (eligiendo el técnico responsable). Cerrado: solo lectura.
 */
export function PanelDiagnostico({
  caso,
  esLider,
  usuarioId,
  usuarioNombre,
}: PanelDiagnosticoProps) {
  if (caso.estado === 'CERRADO') return <ResumenDiagnostico caso={caso} />

  if (caso.estado === 'DESCARTADO') {
    return (
      <SinDiagnostico
        icono={Ban}
        titulo="Caso descartado"
        texto="Este caso se descartó y no admite diagnóstico técnico."
      />
    )
  }
  if (caso.estado === 'CREADO' || caso.estado === 'EN_ANALISIS') {
    return (
      <SinDiagnostico
        icono={MessageCircle}
        titulo="El caso aún no llega al panel"
        texto="El chatbot sigue con el productor. Podrás registrar el diagnóstico cuando el caso se envíe a revisión."
      />
    )
  }

  const responsable = caso.tecnico?.id === usuarioId
  if (!esLider && !responsable) {
    return (
      <SinDiagnostico
        icono={Ban}
        titulo="No eres el técnico responsable"
        texto="Solo el técnico asignado o el líder técnico pueden registrar el diagnóstico de este caso."
      />
    )
  }

  return (
    <FormDiagnostico
      // Al cambiar de estado (guardar o cerrar) el formulario se reinicia con lo registrado.
      key={`${caso.id}-${caso.estado}`}
      caso={caso}
      esLider={esLider}
      usuarioId={usuarioId}
      usuarioNombre={usuarioNombre}
    />
  )
}
