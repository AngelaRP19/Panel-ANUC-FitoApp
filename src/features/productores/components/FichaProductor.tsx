import { useState } from 'react'
import { Link } from 'react-router'
import { Pencil, UserMinus } from 'lucide-react'
import { Aviso } from '@/components/ui/Aviso'
import { Button, buttonClass } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EstadoCuentaBadge } from '@/components/ui/EstadoBadge'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { toast } from '@/components/ui/Toast'
import { VEREDA_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearTelefono } from '@/utils/telefono'
import { useCambiarEstadoProductor } from '../hooks'
import type { Productor } from '../types'

/** «mar 2026» */
function mesAnio(iso: string) {
  const t = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
  return t.replace('.', '').replace(' de ', ' ')
}

interface DesactivarProductorDialogProps {
  productor: Productor
  open: boolean
  cargando?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmación para desactivar (acción que cambia el acceso del productor al chatbot). */
export function DesactivarProductorDialog({
  productor,
  open,
  cargando,
  onConfirm,
  onCancel,
}: DesactivarProductorDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      danger
      icon={UserMinus}
      title={`¿Desactivar a ${productor.nombre}?`}
      message={
        <>
          El chatbot dejará de atender el número{' '}
          <span className="codigo">{formatearTelefono(productor.celular)}</span> y no recibirá
          mensajes de alerta. Sus fincas y casos se conservan. Puedes activarlo de nuevo cuando
          quieras.
        </>
      }
      confirmLabel="Desactivar productor"
      loading={cargando}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface FichaProductorProps {
  productor: Productor
  onClose: () => void
  onEditar: () => void
}

/**
 * Ficha del productor en ventana (artboard 08): datos, fincas, casos e interruptor «Puede
 * consultar por WhatsApp». Desactivar pide confirmación; activar es inmediato.
 */
export function FichaProductor({ productor: p, onClose, onEditar }: FichaProductorProps) {
  const estado = useCambiarEstadoProductor()
  const [confirmar, setConfirmar] = useState(false)

  const cambiar = (activo: boolean) =>
    estado.mutate(
      { id: p.id, activo },
      {
        onSuccess: () => {
          setConfirmar(false)
          toast.exito(
            activo ? `${p.nombre} está activo` : `${p.nombre} quedó deshabilitado`,
            'El cambio queda en el registro de actividad.',
          )
        },
      },
    )

  const casos =
    p.casos_ultimo_anio === 0
      ? 'Aún sin casos'
      : `${p.casos_ultimo_anio} ${p.casos_ultimo_anio === 1 ? 'caso' : 'casos'} en el último año`

  return (
    <>
      <Modal
        open={!confirmar}
        onClose={onClose}
        size="sm"
        position="top"
        title={p.nombre}
        headerExtra={<EstadoCuentaBadge activo={p.activo} />}
        description={`Productor desde ${mesAnio(p.registrado_en)}`}
        footer={
          <>
            <Link
              to={`${PATHS.fincas}?productor=${encodeURIComponent(p.id)}`}
              className={buttonClass('text')}
            >
              Ver fincas
            </Link>
            <Button variant="secondary" onClick={onEditar}>
              <Pencil aria-hidden="true" />
              Editar datos
            </Button>
          </>
        }
      >
        <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
          <dt className="text-tinta-secundaria">WhatsApp</dt>
          <dd className="m-0 codigo">{formatearTelefono(p.celular)}</dd>
          <dt className="text-tinta-secundaria">Vereda</dt>
          <dd className="m-0 font-medium">
            {p.vereda ? etiqueta(VEREDA_LABEL, p.vereda, p.vereda) : '—'}
          </dd>
          <dt className="text-tinta-secundaria">Fincas</dt>
          <dd className="m-0 font-medium">
            {p.fincas.length ? p.fincas.map((f) => f.nombre).join(', ') : 'Sin fincas registradas'}
          </dd>
          <dt className="text-tinta-secundaria">Casos</dt>
          <dd className="m-0 font-medium">{casos}</dd>
        </dl>
        <div className="flex items-center gap-3 rounded-md border border-borde px-3.5 py-3">
          <div className="flex-1">
            <p className="etiqueta">Puede consultar por WhatsApp</p>
            <p className="text-cuerpo-sm text-tinta-terciaria">
              Si lo desactivas, el chatbot no lo atiende.
            </p>
          </div>
          <Switch
            checked={p.activo}
            disabled={estado.isPending}
            aria-label={p.activo ? `Desactivar a ${p.nombre}` : `Activar a ${p.nombre}`}
            onCheckedChange={(v) => (v ? cambiar(true) : setConfirmar(true))}
          />
        </div>
        {estado.isError && (
          <Aviso tono="peligro" titulo="No se cambió el estado.">
            Intenta de nuevo en unos segundos.
          </Aviso>
        )}
      </Modal>
      <DesactivarProductorDialog
        productor={p}
        open={confirmar}
        cargando={estado.isPending}
        onConfirm={() => cambiar(false)}
        onCancel={() => setConfirmar(false)}
      />
    </>
  )
}
