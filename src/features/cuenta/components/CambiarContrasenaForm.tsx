import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { toast } from '@/components/ui/Toast'
import { MENSAJES } from '@/locales/es'
import { esErrorAuth } from '@/services/auth'
import { useCambiarContrasena } from '../hooks'
import { contrasenaSchema, type ContrasenaValues } from '../schemas'

const VACIO: ContrasenaValues = { actual: '', nueva: '', confirmar: '' }

/** Mensaje general para los errores del proveedor que no son de un campo. */
function mensajeError(error: unknown) {
  if (!esErrorAuth(error)) return MENSAJES.errorConexionTexto
  if (error.codigo === 'DEMASIADOS_INTENTOS') {
    return 'Hiciste demasiados intentos. Espera unos minutos e intenta de nuevo.'
  }
  if (error.codigo === 'RED') return MENSAJES.errorConexionTexto
  return 'Intenta de nuevo en unos minutos.'
}

/**
 * «Cambiar contraseña» (artboards 11 y 12f): exige la actual y que la nueva cumpla la
 * política. El cambio lo hace el proveedor de identidad (Cognito).
 */
export function CambiarContrasenaForm() {
  const cambiar = useCambiarContrasena()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContrasenaValues>({ resolver: zodResolver(contrasenaSchema), defaultValues: VACIO })

  const onSubmit = handleSubmit(({ actual, nueva }) =>
    cambiar.mutate(
      { actual, nueva },
      {
        onSuccess: () => {
          reset(VACIO)
          toast.exito('Contraseña actualizada', 'Úsala la próxima vez que inicies sesión.')
        },
        onError: (error) => {
          if (!esErrorAuth(error)) return
          if (error.codigo === 'CONTRASENA_ACTUAL') {
            setError(
              'actual',
              { message: 'La contraseña actual no es correcta' },
              { shouldFocus: true },
            )
          } else if (error.codigo === 'CONTRASENA_INVALIDA') {
            setError('nueva', { message: MENSAJES.contrasenaReglas }, { shouldFocus: true })
          }
        },
      },
    ),
  )
  const errorGeneral =
    cambiar.isError &&
    !(
      esErrorAuth(cambiar.error) &&
      (cambiar.error.codigo === 'CONTRASENA_ACTUAL' ||
        cambiar.error.codigo === 'CONTRASENA_INVALIDA')
    )

  return (
    <section
      aria-labelledby="t-pass"
      className="rounded-lg border border-borde bg-blanco shadow-1 lg:col-span-6"
    >
      <div className="border-b border-borde px-6 py-4">
        <h2 id="t-pass" className="titulo-h2">
          Cambiar contraseña
        </h2>
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
        <RequiredLegend />
        {errorGeneral && (
          <Aviso tono="peligro" titulo="No se cambió la contraseña.">
            {mensajeError(cambiar.error)}
          </Aviso>
        )}
        <FormField
          label="Contraseña actual"
          htmlFor="mc-p0"
          required
          error={errors.actual?.message}
        >
          <PasswordInput
            id="mc-p0"
            autoComplete="current-password"
            invalid={!!errors.actual}
            aria-describedby={fieldDescriptionId('mc-p0')}
            {...register('actual')}
          />
        </FormField>
        <FormField
          label="Nueva contraseña"
          htmlFor="mc-p1"
          required
          error={errors.nueva?.message}
          hint="Usa al menos 8 caracteres, con letras y números."
        >
          <PasswordInput
            id="mc-p1"
            autoComplete="new-password"
            invalid={!!errors.nueva}
            aria-describedby={fieldDescriptionId('mc-p1')}
            {...register('nueva')}
          />
        </FormField>
        <FormField
          label="Confirmar nueva contraseña"
          htmlFor="mc-p2"
          required
          error={errors.confirmar?.message}
        >
          <PasswordInput
            id="mc-p2"
            autoComplete="new-password"
            invalid={!!errors.confirmar}
            aria-describedby={fieldDescriptionId('mc-p2')}
            {...register('confirmar')}
          />
        </FormField>
        <div className="flex justify-end border-t border-borde pt-4">
          <Button type="submit" variant="secondary" loading={cambiar.isPending}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </section>
  )
}
