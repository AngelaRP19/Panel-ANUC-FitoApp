import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useLogin } from '../hooks'
import { loginSchema, type LoginValues } from '../schemas'

interface LoginFormProps {
  onSuccess: () => void
}

function mensajeDeError(error: unknown): string {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  // Mensaje genérico: no se revela qué dato falló (RQNF03)
  if (status === 401 || status === 403)
    return 'El correo o la contraseña no son correctos. Revisa los datos e intenta de nuevo.'
  if (status === 429) return 'Demasiados intentos. Espera un momento antes de volver a intentarlo.'
  return 'No fue posible conectar con el servidor. Intenta de nuevo en unos minutos.'
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', password: '' },
  })

  const onSubmit = handleSubmit((values) => loginMutation.mutate(values, { onSuccess }))

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="t-login"
      className="flex w-full max-w-110 flex-col gap-5 rounded-lg border border-borde bg-blanco p-6 shadow-1 sm:p-10"
    >
      <div>
        <h1 id="t-login" className="titulo-display">
          Inicia sesión
        </h1>
        <p className="mt-1.5 text-tinta-secundaria">Ingresa con tu correo y contraseña.</p>
      </div>

      {loginMutation.isError && (
        <Alert tone="danger" title="No pudimos iniciar sesión.">
          {mensajeDeError(loginMutation.error)}
        </Alert>
      )}

      <RequiredLegend />

      <FormField
        label="Correo electrónico"
        htmlFor="l-mail"
        required
        error={errors.correo?.message}
        hint="Formato nombre@dominio"
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
        <div className="relative">
          <Input
            id="l-pass"
            type={mostrarPassword ? 'text' : 'password'}
            autoComplete="current-password"
            invalid={!!errors.password}
            aria-describedby={errors.password ? fieldDescriptionId('l-pass') : undefined}
            className="pr-22"
            {...register('password')}
          />
          <Button
            variant="text"
            size="sm"
            className="absolute top-1 right-1"
            aria-pressed={mostrarPassword}
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setMostrarPassword((v) => !v)}
          >
            {mostrarPassword ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </FormField>

      <Button type="submit" size="lg" loading={loginMutation.isPending}>
        Ingresar
      </Button>

      <p className="text-center text-cuerpo-sm text-tinta-terciaria">
        ¿Olvidaste tu contraseña? Pide al líder técnico que la restablezca.
      </p>
    </form>
  )
}
