import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { MENSAJES } from '@/locales/es'
import { esErrorApi } from '@/services/apiClient'
import { aE164 } from '@/utils/telefono'
import { useCrearPrimerLider } from '../hooks'
import { primerLiderSchema, type PrimerLiderValues } from '../schemas'
import { TarjetaAcceso } from './PanelMarca'
import { RequisitosContrasena } from './RequisitosContrasena'

const CAMPOS_API: Record<string, keyof PrimerLiderValues> = {
  nombre: 'nombre',
  correo: 'correo',
  celular: 'celular',
  password: 'nueva',
}

interface PrimerLiderFormProps {
  /** El panel ya tiene líder (otro lo creó mientras tanto): volver al login. */
  onLiderExistente: () => void
}

/** «Crea la cuenta del líder técnico» (artboard 01b, RQF01). El formulario no se vacía ante un error. */
export function PrimerLiderForm({ onLiderExistente }: PrimerLiderFormProps) {
  const crear = useCrearPrimerLider()
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<PrimerLiderValues>({
    resolver: zodResolver(primerLiderSchema),
    defaultValues: { nombre: '', correo: '', celular: '', nueva: '', confirmar: '' },
  })
  const contrasena = useWatch({ control, name: 'nueva' })

  const onSubmit = handleSubmit((v) =>
    crear.mutate(
      {
        nombre: v.nombre,
        correo: v.correo,
        celular: aE164(v.celular)!,
        password: v.nueva,
      },
      {
        onError: (error) => {
          if (!esErrorApi(error)) return
          if (error.codigo === 'LIDER_EXISTENTE') return onLiderExistente()
          // Duplicados: el backend marca los campos y el formulario conserva los valores.
          for (const [campo, mensaje] of Object.entries(error.campos)) {
            const nombre = CAMPOS_API[campo]
            if (nombre) setError(nombre, { message: mensaje }, { shouldFocus: true })
          }
        },
      },
    ),
  )

  const errorGeneral =
    crear.isError && !(esErrorApi(crear.error) && Object.keys(crear.error.campos).length > 0)
  const reglasId = 'pu-reglas'

  return (
    <TarjetaAcceso labelledBy="t-pu" onSubmit={onSubmit} ancha>
      <div>
        <p className="sobretitulo">Primer uso</p>
        <h1 id="t-pu" className="mt-1 titulo-display">
          Crea la cuenta del líder técnico
        </h1>
        <p className="mt-1.5 text-tinta-secundaria">
          Aún no hay cuentas en el panel. Esta primera cuenta tendrá el rol de líder técnico.
        </p>
      </div>

      {errorGeneral && (
        <Aviso tono="peligro" titulo="No se creó la cuenta.">
          {esErrorApi(crear.error) && crear.error.status
            ? crear.error.message
            : MENSAJES.errorConexionTexto}
        </Aviso>
      )}

      <RequiredLegend />

      <FormField label="Nombre completo" htmlFor="pu-nom" required error={errors.nombre?.message}>
        <Input
          id="pu-nom"
          autoComplete="name"
          invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? fieldDescriptionId('pu-nom') : undefined}
          {...register('nombre')}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Correo electrónico"
          htmlFor="pu-mail"
          required
          error={errors.correo?.message}
          hint={MENSAJES.ayudaCorreo}
        >
          <Input
            id="pu-mail"
            type="email"
            autoComplete="email"
            invalid={!!errors.correo}
            aria-describedby={fieldDescriptionId('pu-mail')}
            {...register('correo')}
          />
        </FormField>
        <FormField
          label="Celular"
          htmlFor="pu-cel"
          required
          error={errors.celular?.message}
          hint={MENSAJES.ayudaCelular}
        >
          <Input
            id="pu-cel"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            mono
            invalid={!!errors.celular}
            aria-describedby={fieldDescriptionId('pu-cel')}
            {...register('celular')}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-2">
        <FormField label="Contraseña" htmlFor="pu-pass" required error={errors.nueva?.message}>
          <PasswordInput
            id="pu-pass"
            autoComplete="new-password"
            invalid={!!errors.nueva}
            aria-describedby={`${reglasId}${errors.nueva ? ` ${fieldDescriptionId('pu-pass')}` : ''}`}
            {...register('nueva')}
          />
        </FormField>
        <RequisitosContrasena id={reglasId} valor={contrasena} />
      </div>

      <FormField
        label="Confirmar contraseña"
        htmlFor="pu-pass2"
        required
        error={errors.confirmar?.message}
      >
        <PasswordInput
          id="pu-pass2"
          autoComplete="new-password"
          invalid={!!errors.confirmar}
          aria-describedby={errors.confirmar ? fieldDescriptionId('pu-pass2') : undefined}
          {...register('confirmar')}
        />
      </FormField>

      <Button type="submit" size="lg" loading={crear.isPending}>
        Crear cuenta y entrar
      </Button>
    </TarjetaAcceso>
  )
}
