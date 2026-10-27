import { Ban, Lock, MessageCircle, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { esErrorApi } from '@/services/apiClient'
import { formatearFecha } from '@/utils/fechas'
import { useCerrarCaso } from '../hooks'
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

/** «Cerrar caso» para quien puede cerrar sin poder diagnosticar (el líder, con el caso Registrado). */
function CerrarCasoLectura({ caso }: { caso: CasoDetalle }) {
  const cerrar = useCerrarCaso(caso.id)
  return (
    <div className="flex flex-col gap-2 border-t border-borde px-6 pt-4 pb-6">
      {cerrar.isError && (
        <Aviso tono="peligro" titulo="No se cerró el caso.">
          {esErrorApi(cerrar.error) && cerrar.error.codigo === 'RED'
            ? 'Se perdió la conexión. Intenta de nuevo.'
            : esErrorApi(cerrar.error)
              ? cerrar.error.message
              : null}
        </Aviso>
      )}
      <Button
        variant="secondary"
        loading={cerrar.isPending}
        aria-describedby="ayuda-cerrar"
        onClick={() =>
          cerrar.mutate(undefined, {
            onSuccess: (nuevo) =>
              toast.exito(
                'Caso cerrado',
                `Caso #${caso.id} · las evidencias se conservan hasta el ${formatearFecha(nuevo.vence_en)}.`,
              ),
          })
        }
      >
        <Lock aria-hidden="true" />
        Cerrar caso
      </Button>
      <p id="ayuda-cerrar" className="text-nota text-tinta-terciaria">
        Al cerrar, se fija la fecha de vencimiento de conservación en 6 meses.
      </p>
    </div>
  )
}

interface PanelDiagnosticoProps {
  caso: CasoDetalle
  usuarioNombre: string
}

/**
 * Columna «Resultado técnico · decisión humana» del detalle. Se guía por los permisos que
 * calcula el servidor (`puede_diagnosticar`, `puede_cerrar`), no por el rol:
 * - Quien puede diagnosticar (el técnico asignado, En revisión o Registrado) ve el formulario.
 * - El resto (siempre el líder, D-02) ve el diagnóstico en solo lectura si existe, con
 *   «Cerrar caso» si le corresponde; si no existe, un aviso.
 * Cerrado: solo lectura.
 */
export function PanelDiagnostico({ caso, usuarioNombre }: PanelDiagnosticoProps) {
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

  if (caso.puede_diagnosticar) {
    return (
      <FormDiagnostico
        // Al cambiar de estado (guardar o cerrar) el formulario se reinicia con lo registrado.
        key={`${caso.id}-${caso.estado}`}
        caso={caso}
        usuarioNombre={usuarioNombre}
      />
    )
  }

  if (caso.diagnostico) {
    return (
      <ResumenDiagnostico caso={caso}>
        {caso.puede_cerrar && <CerrarCasoLectura caso={caso} />}
      </ResumenDiagnostico>
    )
  }

  return (
    <SinDiagnostico
      icono={UserRound}
      titulo="Sin diagnóstico técnico"
      texto="Solo el técnico asignado registra el diagnóstico."
    />
  )
}
