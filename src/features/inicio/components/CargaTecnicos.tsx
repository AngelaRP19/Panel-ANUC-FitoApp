import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Card, CardHeader } from '@/components/ui/Card'
import type { CargaTecnico } from '../types'

interface CargaTecnicosProps {
  carga: CargaTecnico[]
  sinTecnico: number
}

export function CargaTecnicos({ carga, sinTecnico }: CargaTecnicosProps) {
  const max = Math.max(1, ...carga.map((t) => t.activos))
  return (
    <Card labelledBy="t-carga" className="lg:col-span-5">
      <CardHeader
        id="t-carga"
        title="Carga por técnico"
        subtitle="Casos activos: pendientes y en análisis técnico"
      />
      <div className="flex flex-col gap-4.5 px-6 py-5">
        {carga.length === 0 ? (
          <p className="text-cuerpo-sm text-tinta-terciaria">
            No hay técnicos activos.{' '}
            <Link to="/tecnicos" className="enlace">
              Registrar técnico
            </Link>
          </p>
        ) : (
          carga.map((t) => (
            <div key={t.tecnico_id}>
              <div className="flex justify-between gap-3 text-cuerpo-sm">
                <span className="truncate font-semibold">{t.nombre}</span>
                <span className="flex-none tabular-nums">
                  {t.activos} {t.activos === 1 ? 'activo' : 'activos'}
                  {t.pendientes > 0 && ` · ${t.pendientes} pendientes`}
                </span>
              </div>
              <div
                className="mt-1.5 h-2.5 rounded-pill bg-verde-100"
                role="meter"
                aria-label={`Casos activos de ${t.nombre}`}
                aria-valuenow={t.activos}
                aria-valuemin={0}
                aria-valuemax={max}
              >
                <div
                  className="h-2.5 rounded-pill bg-verde-600"
                  style={{ width: `${(t.activos / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}

        {sinTecnico > 0 && (
          <Aviso
            tono="adv"
            titulo={`${sinTecnico} ${sinTecnico === 1 ? 'caso pendiente' : 'casos pendientes'} sin técnico.`}
          >
            <Link to="/casos?sin_tecnico=true" className="enlace">
              Asignar ahora
            </Link>
          </Aviso>
        )}
      </div>
    </Card>
  )
}
