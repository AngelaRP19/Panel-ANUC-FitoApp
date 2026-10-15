import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { cn } from '@/utils/cn'
import { aE164, formatearTelefono } from '@/utils/telefono'
import { useEditarCuenta, useRegistrarCuenta } from '../hooks'
import { cuentaSchema, type CuentaValues } from '../schemas'
import type { Cuenta } from '../types'

const ROLES = [
  { value: 'TECNICO', label: 'Técnico' },
  { value: 'LIDER_TECNICO', label: 'Líder técnico' },
] as const

interface CuentaFormModalProps {
  /** Sin cuenta: registrar una nueva. */
  cuenta?: Cuenta | null
  onClose: () => void
}

/**
 * Registrar técnico / editar datos (artboard 10): nombre, correo, celular y rol. La cuenta
 * nueva recibe una contraseña temporal por correo y la cambia al entrar por primera vez.
 */
export function CuentaFormModal({ cuenta, onClose }: CuentaFormModalProps) {
  const editar = !!cuenta
  const registrar = useRegistrarCuenta()
  const actualizar = useEditarCuenta(cuenta?.id ?? '')
  const mutacion = editar ? actualizar : registrar
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CuentaValues>({
    resolver: zodResolver(cuentaSchema),
    defaultValues: {
      nombre: cuenta?.nombre ?? '',
      correo: cuenta?.correo ?? '',
      celular: cuenta ? formatearTelefono(cuenta.celular) : '',
      rol: cuenta?.rol ?? 'TECNICO',
    },
  })
  const rol = useWatch({ control, name: 'rol' })

  const onSubmit = handleSubmit((v) =>
    mutacion.mutate(
      { nombre: v.nombre.trim(), correo: v.correo.trim(), celular: aE164(v.celular)!, rol: v.rol },
      {
        onSuccess: (c) => {
          toast.exito(
            editar ? 'Datos actualizados' : 'Técnico registrado',
            editar
              ? 'El cambio queda en el registro de actividad.'
              : `${c.nombre} recibirá una contraseña temporal en ${c.correo}.`,
          )
          onClose()
        },
        onError: (error) => {
          if (!esErrorApi(error)) return
          for (const [campo, mensaje] of Object.entries(error.campos)) {
            if (
              campo === 'nombre' ||
              campo === 'correo' ||
              campo === 'celular' ||
              campo === 'rol'
            ) {
              setError(campo, { message: mensaje }, { shouldFocus: true })
            }
          }
        },
      },
    ),
  )
  const errorGeneral =
    mutacion.isError && !(esErrorApi(mutacion.error) && Object.keys(mutacion.error.campos).length)

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      position="top"
      title={editar ? 'Editar datos' : 'Registrar técnico'}
      description={editar ? cuenta!.nombre : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutacion.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cuenta" loading={mutacion.isPending}>
            {editar ? 'Guardar cambios' : 'Registrar técnico'}
          </Button>
        </>
      }
    >
      <form id="form-cuenta" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se guardó la cuenta.">
            {esErrorApi(mutacion.error) && mutacion.error.status === 403
              ? mutacion.error.message
              : MENSAJES.errorConexionTexto}
          </Aviso>
        )}
        <FormField
          label="Nombre completo"
          htmlFor="t-n"
          required
          error={errors.nombre?.message}
          hint="Nombre y apellidos"
        >
          <Input
            id="t-n"
            autoComplete="off"
            placeholder="Ej.: Camila Rodríguez"
            invalid={!!errors.nombre}
            aria-describedby={fieldDescriptionId('t-n')}
            {...register('nombre')}
          />
        </FormField>
        <FormField
          label="Correo electrónico"
          htmlFor="t-c"
          required
          error={errors.correo?.message}
          hint="Formato nombre@dominio · ej. camila.rodriguez@anuc.org"
        >
          <Input
            id="t-c"
            type="email"
            autoComplete="off"
            placeholder="nombre@anuc.org"
            invalid={!!errors.correo}
            aria-describedby={fieldDescriptionId('t-c')}
            {...register('correo')}
          />
        </FormField>
        <FormField
          label="Celular"
          htmlFor="t-t"
          required
          error={errors.celular?.message}
          hint="10 dígitos, empieza por 3 · ej. 312 345 6789"
        >
          <Input
            id="t-t"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            mono
            placeholder="3xx xxx xxxx"
            invalid={!!errors.celular}
            aria-describedby={fieldDescriptionId('t-t')}
            {...register('celular')}
          />
        </FormField>
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-1.5 p-0 etiqueta">Rol</legend>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-pill border px-3 text-cuerpo-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-verde-600',
                  rol === r.value
                    ? 'border-verde-700 bg-verde-100 font-semibold text-verde-800'
                    : 'border-borde-control bg-blanco',
                )}
              >
                <input
                  type="radio"
                  value={r.value}
                  className="m-0 accent-verde-700 focus-visible:outline-none"
                  {...register('rol')}
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        {!editar && (
          <p className="text-nota text-tinta-terciaria">
            Recibirá una contraseña temporal en su correo y la cambiará al entrar por primera vez.
          </p>
        )}
      </form>
    </Modal>
  )
}
