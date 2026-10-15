import { useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Pencil, UserMinus } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EstadoCuentaBadge } from '@/components/ui/EstadoBadge'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { toast } from '@/components/ui/Toast'
import { PATHS } from '@/routes/paths'
import { esErrorApi } from '@/services/apiClient'
import { formatearTelefono } from '@/utils/telefono'
import { useCambiarEstadoCuenta } from '../hooks'
import type { Cuenta } from '../types'

const nombreRol = (rol: string) => (rol === 'LIDER_TECNICO' ? 'líder técnico' : 'técnico')

/** «No puedes desactivar la única cuenta de … activa» (artboard 10). */
function BloqueoUnicaCuenta({ cuenta, onClose }: { cuenta: Cuenta; onClose: () => void }) {
  const rol = nombreRol(cuenta.rol)
  const extra = cuenta.rol === 'LIDER_TECNICO' ? ', asignarlos y confirmar alertas' : ''
  return (
    <Modal
      open
      onClose={onClose}
      role="alertdialog"
      icon={AlertTriangle}
      iconTone="adv"
      hideClose
      title={`No puedes desactivar la única cuenta de ${rol} activa`}
      description={`${cuenta.nombre} es la única cuenta de ${rol} activa. El panel necesita al menos una para revisar casos${extra}. Activa o registra otra cuenta de ${rol} antes de desactivar esta.`}
      footer={<Button onClick={onClose}>Entendido</Button>}
    />
  )
}

interface FichaCuentaProps {
  cuenta: Cuenta
  /** id de quien usa el panel: su propia cuenta se edita desde Mi cuenta. */
  usuarioId: string
  onClose: () => void
  onEditar: () => void
}

/**
 * Ficha de la cuenta en ventana (artboard 10): rol, correo, celular, casos activos e
 * interruptor «Cuenta activa». Desactivar pide confirmación; si es la única cuenta activa de
 * su rol, se explica por qué no se puede.
 */
export function FichaCuenta({ cuenta: c, usuarioId, onClose, onEditar }: FichaCuentaProps) {
  const estado = useCambiarEstadoCuenta()
  const [dialogo, setDialogo] = useState<'confirmar' | 'bloqueo' | null>(null)
  const esLider = c.rol === 'LIDER_TECNICO'

  const cambiar = (activo: boolean) =>
    estado.mutate(
      { id: c.id, activo },
      {
        onSuccess: () => {
          setDialogo(null)
          toast.exito(
            activo ? `${c.nombre} puede entrar al panel` : `${c.nombre} quedó deshabilitado`,
            'El cambio queda en el registro de actividad.',
          )
        },
        onError: (error) => {
          if (esErrorApi(error) && error.codigo === 'UNICA_CUENTA_ACTIVA') setDialogo('bloqueo')
        },
      },
    )

  const pedirDesactivar = () => setDialogo(c.unica_activa_del_rol ? 'bloqueo' : 'confirmar')
  const casos =
    c.casos_activos === 0
      ? 'Ninguno'
      : `${c.casos_activos} ${c.casos_activos === 1 ? 'caso' : 'casos'}`
  const textoCasos =
    c.casos_activos === 0
      ? 'No tiene casos activos.'
      : `Sus ${c.casos_activos} casos activos quedarán sin técnico asignado y aparecerán en la bandeja para reasignar.`

  return (
    <>
      <Modal
        open={dialogo === null}
        onClose={onClose}
        size="sm"
        position="top"
        title={c.nombre}
        headerExtra={<EstadoCuentaBadge activo={c.activo} />}
        description={
          esLider
            ? 'Líder técnico · administra todo el panel'
            : 'Técnico · ve solo sus casos asignados'
        }
        footer={
          esLider ? (
            c.id === usuarioId ? (
              <Link to={PATHS.miCuenta} className={buttonClass('secondary')}>
                Editar mis datos en Mi cuenta
              </Link>
            ) : undefined
          ) : (
            <Button variant="secondary" onClick={onEditar}>
              <Pencil aria-hidden="true" />
              Editar datos
            </Button>
          )
        }
      >
        <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
          <dt className="text-tinta-secundaria">Correo</dt>
          <dd className="m-0 font-medium break-all">{c.correo}</dd>
          <dt className="text-tinta-secundaria">Celular</dt>
          <dd className="m-0 codigo">{formatearTelefono(c.celular)}</dd>
          <dt className="text-tinta-secundaria">Casos activos</dt>
          <dd className="m-0 font-medium">{casos}</dd>
        </dl>
        <div className="flex items-center gap-3 rounded-md border border-borde px-3.5 py-3">
          <div className="flex-1">
            <p className="etiqueta">Cuenta activa</p>
            <p className="text-cuerpo-sm text-tinta-terciaria">
              Si la desactivas, no podrá entrar al panel.
            </p>
          </div>
          <Switch
            checked={c.activo}
            disabled={estado.isPending}
            aria-label={c.activo ? `Desactivar a ${c.nombre}` : `Activar a ${c.nombre}`}
            onCheckedChange={(v) => (v ? cambiar(true) : pedirDesactivar())}
          />
        </div>
        {estado.isError &&
          !(esErrorApi(estado.error) && estado.error.codigo === 'UNICA_CUENTA_ACTIVA') && (
            <Aviso tono="peligro" titulo="No se cambió el estado.">
              Intenta de nuevo en unos segundos.
            </Aviso>
          )}
      </Modal>

      <ConfirmDialog
        open={dialogo === 'confirmar'}
        danger
        icon={UserMinus}
        title={`¿Desactivar a ${c.nombre}?`}
        message={`No podrá entrar al panel. ${textoCasos}`}
        confirmLabel="Desactivar cuenta"
        loading={estado.isPending}
        onConfirm={() => cambiar(false)}
        onCancel={() => setDialogo(null)}
      />
      {dialogo === 'bloqueo' && <BloqueoUnicaCuenta cuenta={c} onClose={() => setDialogo(null)} />}
    </>
  )
}
