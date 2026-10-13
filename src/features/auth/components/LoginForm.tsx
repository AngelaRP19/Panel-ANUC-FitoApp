import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso, type TonoAviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorAuth } from '@/services/auth'
import { useLogin } from '../hooks'
import { loginSchema, type LoginValues } from '../schemas'
import { TarjetaAcceso } from './PanelMarca'

/** Aviso informativo sobre el formulario (sesión expirada, contraseña actualizada). */
export interface AvisoLogin {
  tono: TonoAviso
  titulo: string
  texto?: string
}

interface LoginFormProps {
  /** Aviso que trae la ruta (`?expirada=1`, vuelta de recuperar cuenta). */
  aviso?: AvisoLogin | null
  /** Correo ya escrito (al volver de recuperar la cuenta). */
  correoInicial?: string
  /** Cognito pidió cambiar la contraseña temporal (RQF11). */
  onNuevaContrasena: () => void
  /** Entró al panel. Las rutas públicas redirigen solas; útil para pruebas. */
  onSuccess?: () => void
}

/** Error de inicio de sesión. Credenciales incorrectas y cuenta deshabilitada dan el mismo (RQF02). */
function errorDeInicio(error: unknown): { titulo: string; texto: string } {
  const codigo = esErrorAuth(error) ? error.codigo : 'DESCONOCIDO'
  if (codigo === 'CREDENCIALES') {
    return { titulo: 'No pudimos iniciar sesión.', texto: MENSAJES.credencialesIncorrectas }
  }
  if (codigo === 'DEMASIADOS_INTENTOS') {
    return {
      titulo: 'Demasiados intentos.',
      texto: 'Espera unos minutos e inténtalo de nuevo.',
    }
  }
  return { titulo: 'No pudimos iniciar sesión.', texto: MENSAJES.errorConexionTexto }
}

/** Formulario «Inicia sesión» (artboard 01). Los valores se conservan ante un error. */
export function LoginForm({
  aviso,
  correoInicial = '',
  onNuevaContrasena,
  onSuccess,
}: LoginFormProps) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: correoInicial, password: '' },
  })

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: (r) => (r.paso === 'NUEVA_CONTRASENA' ? onNuevaContrasena() : onSuccess?.()),
    }),
  )
  const error = login.isError ? errorDeInicio(login.error) : null

  return (
    <TarjetaAcceso labelledBy="t-login" onSubmit={onSubmit}>
      <div>
        <h1 id="t-login" className="titulo-display">
          Inicia sesión
        </h1>
        <p className="mt-1.5 text-tinta-secundaria">Ingresa con tu correo y contraseña.</p>
      </div>

      {error ? (
        <Aviso tono="peligro" titulo={error.titulo}>
          {error.texto}
        </Aviso>
      ) : (
        aviso && (
          <Aviso tono={aviso.tono} titulo={aviso.titulo} rol="status">
            {aviso.texto}
          </Aviso>
        )
      )}

      <RequiredLegend />

      <FormField
        label="Correo electrónico"
        htmlFor="l-mail"
        required
        error={errors.correo?.message}
        hint={MENSAJES.ayudaCorreo}
      >
        <Input
          id="l-mail"
          type="email"
          autoComplete="username"
          invalid={!!errors.correo}
          aria-describedby={fieldDescriptionId('l-mail')}
          {...register('correo')}
        />
      </FormField>

      <FormField label="Contraseña" htmlFor="l-pass" required error={errors.password?.message}>
        <PasswordInput
          id="l-pass"
          autoComplete="current-password"
          autoFocus={!!correoInicial}
          invalid={!!errors.password}
          aria-describedby={errors.password ? fieldDescriptionId('l-pass') : undefined}
          {...register('password')}
        />
      </FormField>

      <Button type="submit" size="lg" loading={login.isPending}>
        Ingresar
      </Button>

      <p className="text-center text-cuerpo-sm text-tinta-terciaria">
        ¿Olvidaste tu contraseña?{' '}
        <Link to={PATHS.recuperarCuenta} className="enlace">
          Recupérala
        </Link>
      </p>
    </TarjetaAcceso>
  )
}
