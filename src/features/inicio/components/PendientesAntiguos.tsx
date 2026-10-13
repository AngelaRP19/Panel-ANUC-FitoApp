import { Link } from 'react-router'
import { ChevronRight, Clock } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { diasDesde, textoDias } from '@/utils/fechas'
import type { CasoPendiente } from '../types'

/** A partir de este tiempo en espera (o si no hay técnico) el caso se resalta. */
const DIAS_ALERTA = 2

export function PendientesAntiguos({ pendientes }: { pendientes: CasoPendiente[] }) {
  const ahora = new Date()
  return (
    <Card labelledBy="t-ant" className="lg:col-span-7">
      <CardHeader
        id="t-ant"
        title="Pendientes más antiguos"
        actions={
          <>
            <span className="text-cuerpo-sm text-tinta-terciaria">En espera de revisión</span>
            <Link to="/casos?estado=PENDIENTE_REVISION" className="text-cuerpo-sm enlace">
              Ver casos
            </Link>
          </>
        }
      />
      {pendientes.length === 0 ? (
        <div className="p-6">
          <EmptyState message="No hay casos pendientes de revisión." />
        </div>
      ) : (
        <ul className="text-cuerpo-sm">
          {pendientes.map((c, i) => {
            const dias = diasDesde(c.enviado_a_panel_en, ahora)
            const sinTecnico = c.tecnico_asignado_id === null
            const resaltar = dias >= DIAS_ALERTA || sinTecnico
            const espera = textoDias(dias) + (sinTecnico ? ' · sin técnico' : '')
            const numero = `#${String(c.numero).padStart(4, '0')}`
            return (
              <li key={c.id} className={i < pendientes.length - 1 ? 'border-b border-borde' : ''}>
                <Link
                  to={`/casos/${c.id}`}
                  aria-label={`Caso ${numero}, ${c.productor_nombre}, ${espera} en espera`}
                  className="grid min-h-12 grid-cols-[88px_1fr_auto_40px] items-center text-tinta no-underline hover:bg-verde-100 sm:grid-cols-[96px_1fr_180px_44px]"
                >
                  <span className="pl-6 codigo font-semibold text-verde-700">{numero}</span>
                  <span className="truncate px-3 py-2.5">{c.productor_nombre}</span>
                  <span className="px-3 py-2.5">
                    {resaltar ? (
                      <span className="inline-flex items-center gap-1.5 text-nota font-semibold text-advertencia">
                        <Clock size={14} strokeWidth={2} aria-hidden="true" />
                        {espera}
                      </span>
                    ) : (
                      <span className="text-tinta-secundaria">{espera}</span>
                    )}
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="mr-4 justify-self-end text-tinta-terciaria"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
