import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { MENSAJES } from '@/locales/es'
import { esErrorAuth } from '@/services/auth'
import { useConfirmarNuevaContrasena } from '../hooks'
import { nuevaContrasenaSchema, type NuevaContrasenaValues } from '../schemas'
import { TarjetaAcceso } from './PanelMarca'
import { RequisitosContrasena } from './RequisitosContrasena'

interface NuevaContrasenaFormProps {
  /** Vuelve al formulario de inicio de sesión (descarta el reto). */
  onCancelar: () => void
  onSuccess?: () => void
}

function errorDeCambio(error: unknown): { titulo: string; texto: string } {
  const codigo = esErrorAuth(error) ? error.codigo : 'DESCONOCIDO'
  if (codigo === 'CONTRASENA_INVALIDA') {
    return { titulo: 'No se guardó la contraseña.', texto: MENSAJES.contrasenaReglas }
  }
  if (codigo === 'DEMASIADOS_INTENTOS') {
    return { titulo: 'Demasiados intentos.', texto: 'Espera unos minutos e inténtalo de nuevo.' }
  }
  return { titulo: 'No se guardó la contraseña.', texto: MENSAJES.errorConexionTexto }
}

/**
 * «Crea tu nueva contraseña» (RQF11): aparece en el mismo panel del login cuando la cuenta
 * entra con la contraseña temporal que recibió por correo.
 */
export function NuevaContrasenaForm({ onCancelar, onSuccess }: NuevaContrasenaFormProps) {
  const confirmar = useConfirmarNuevaContrasena()
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors },
  } = useForm<NuevaContrasenaValues>({
    resolver: zodResolver(nuevaContrasenaSchema),
    defaultValues: { nueva: '', confirmar: '' },
  })

  // El foco pasa al primer campo al cambiar de paso.
  useEffect(() => setFocus('nueva'), [setFocus])

  const nueva = useWatch({ control, name: 'nueva' })
  const onSubmit = handleSubmit(({ nueva }) => confirmar.mutate(nueva, { onSuccess }))
  const error = confirmar.isError ? errorDeCambio(confirmar.error) : null
  const reglasId = 'nc-reglas'

  return (
    <TarjetaAcceso labelledBy="t-nueva" onSubmit={onSubmit}>
      <div>
        <h1 id="t-nueva" className="titulo-display">
          Crea tu nueva contraseña
        </h1>
        <p className="mt-1.5 text-tinta-secundaria">
          Entraste con una contraseña temporal. Crea una propia para continuar.
        </p>
      </div>

      {error && (
        <Aviso tono="peligro" titulo={error.titulo}>
          {error.texto}
        </Aviso>
      )}

      <RequiredLegend />

      <div className="flex flex-col gap-2">
        <FormField
          label="Nueva contraseña"
          htmlFor="nc-nueva"
          required
          error={errors.nueva?.message}
        >
          <PasswordInput
            id="nc-nueva"
            autoComplete="new-password"
            invalid={!!errors.nueva}
            aria-describedby={`${reglasId}${errors.nueva ? ` ${fieldDescriptionId('nc-nueva')}` : ''}`}
            {...register('nueva')}
          />
        </FormField>
        <RequisitosContrasena id={reglasId} valor={nueva} />
      </div>

      <FormField
        label="Confirma la nueva contraseña"
        htmlFor="nc-conf"
        required
        error={errors.confirmar?.message}
      >
        <PasswordInput
          id="nc-conf"
          autoComplete="new-password"
          invalid={!!errors.confirmar}
          aria-describedby={errors.confirmar ? fieldDescriptionId('nc-conf') : undefined}
          {...register('confirmar')}
        />
      </FormField>

      <Button type="submit" size="lg" loading={confirmar.isPending}>
        Guardar y entrar
      </Button>

      <p className="text-center text-cuerpo-sm">
        <Button variant="text" size="sm" onClick={onCancelar} disabled={confirmar.isPending}>
          Volver a iniciar sesión
        </Button>
      </p>
    </TarjetaAcceso>
  )
}
