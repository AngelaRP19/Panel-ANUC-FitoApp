import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { controlClass } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { toast } from '@/components/ui/Toast'
import { MENSAJES, VEREDA_LABEL } from '@/locales/es'
import type { Vereda } from '@/types/enums'
import { cn } from '@/utils/cn'
import { useGuardarNotificaciones, useNotificaciones } from '../hooks'
import type { Canal, PreferenciaAviso } from '../types'
import { AVISOS } from '../utils'

const CANALES: { clave: Canal; label: string }[] = [
  { clave: 'panel', label: 'Panel' },
  { clave: 'whatsapp', label: 'WhatsApp' },
  { clave: 'correo', label: 'Correo' },
]

const FILA = 'grid gap-4 px-6 md:grid-cols-[1fr_280px_56px] md:items-center'

/** Tabla de avisos editable. Se monta con los datos ya cargados. */
function TablaAvisos({ inicial }: { inicial: PreferenciaAviso[] }) {
  const guardar = useGuardarNotificaciones()
  const [avisos, setAvisos] = useState(inicial)
  const [intentado, setIntentado] = useState(false)

  const cambiar = (clave: string, cambio: Partial<PreferenciaAviso>) =>
    setAvisos((lista) => lista.map((a) => (a.clave === clave ? { ...a, ...cambio } : a)))
  const sinCanal = (a: PreferenciaAviso) => a.activo && !Object.values(a.canales).some(Boolean)
  const hayErrores = avisos.some(sinCanal)

  const onGuardar = () => {
    setIntentado(true)
    if (hayErrores) return
    guardar.mutate(avisos, {
      onSuccess: () =>
        toast.exito('Preferencias guardadas', 'Los avisos llegarán por los canales elegidos.'),
      onError: () => toast.error('No se guardaron las preferencias', MENSAJES.errorConexionTexto),
    })
  }

  return (
    <>
      <div className={cn(FILA, 'bg-verde-50 py-2.5 sobretitulo max-md:hidden')} aria-hidden="true">
        <span>Aviso</span>
        <span>Canales</span>
        <span>Activo</span>
      </div>
      <ul className="m-0 list-none p-0">
        {avisos.map((a) => {
          const texto = AVISOS[a.clave] ?? { titulo: a.clave, descripcion: '' }
          const error = intentado && sinCanal(a)
          return (
            <li key={a.clave} className={cn(FILA, 'border-t border-borde py-3.5')}>
              <div>
                <div className="etiqueta">{texto.titulo}</div>
                <div className="text-cuerpo-sm text-tinta-terciaria">{texto.descripcion}</div>
                {a.vereda !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <label
                      htmlFor={`nt-ver-${a.clave}`}
                      className="text-cuerpo-sm text-tinta-secundaria"
                    >
                      Solo de la vereda
                    </label>
                    <select
                      id={`nt-ver-${a.clave}`}
                      value={a.vereda ?? ''}
                      onChange={(e) =>
                        cambiar(a.clave, { vereda: (e.target.value || null) as Vereda | null })
                      }
                      className={cn(controlClass, 'h-8 w-45 cursor-pointer text-nota')}
                    >
                      <option value="">Todas las veredas</option>
                      {Object.entries(VEREDA_LABEL).map(([v, nombre]) => (
                        <option key={v} value={v}>
                          {nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <div
                  role="group"
                  aria-label={`Canales para ${texto.titulo}`}
                  className="flex flex-wrap gap-3.5"
                >
                  {CANALES.map((c) => (
                    <label
                      key={c.clave}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-cuerpo-sm"
                    >
                      <input
                        type="checkbox"
                        checked={a.canales[c.clave]}
                        onChange={(e) =>
                          cambiar(a.clave, {
                            canales: { ...a.canales, [c.clave]: e.target.checked },
                          })
                        }
                        className="m-0 size-4 accent-verde-700"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
                {error && (
                  <p role="alert" className="mt-1 flex items-center gap-1 text-nota text-peligro">
                    <AlertCircle size={14} aria-hidden="true" />
                    Elige al menos un canal.
                  </p>
                )}
              </div>
              <Switch
                checked={a.activo}
                onCheckedChange={(activo) => cambiar(a.clave, { activo })}
                aria-label={texto.titulo}
              />
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end border-t border-borde px-6 py-4">
        <Button onClick={onGuardar} loading={guardar.isPending}>
          Guardar preferencias
        </Button>
      </div>
    </>
  )
}

/**
 * «Notificaciones» (artboards 11 y 12f): cada aviso con su interruptor y sus canales
 * (Panel, WhatsApp, Correo). La API define qué avisos tiene cada rol.
 */
export function NotificacionesForm() {
  const { data, isPending, isError, refetch } = useNotificaciones()
  return (
    <section
      aria-labelledby="t-notif"
      className="overflow-hidden rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-12"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-borde px-6 py-4">
        <h2 id="t-notif" className="flex-1 titulo-h2">
          Notificaciones
        </h2>
        <span className="text-cuerpo-sm text-tinta-terciaria">
          Llegan a la campana del panel y, si lo eliges, por WhatsApp o correo
        </span>
      </div>
      {isPending && <Skeleton className="m-6" style={{ height: 200 }} />}
      {isError && (
        <div className="p-6">
          <Aviso tono="peligro" titulo="No se pudieron cargar tus preferencias.">
            <Button variant="text" size="sm" onClick={() => refetch()}>
              {MENSAJES.reintentar}
            </Button>
          </Aviso>
        </div>
      )}
      {data && <TablaAvisos inicial={data} />}
    </section>
  )
}
