import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorAuth } from '@/services/auth'
import { useSolicitarCodigo } from '../hooks'
import { solicitarCodigoSchema, type SolicitarCodigoValues } from '../schemas'
import { TarjetaAcceso } from './PanelMarca'

interface SolicitarCodigoFormProps {
  correoInicial?: string
  /** El código se envió: pasar al paso 2 con este correo. */
  onEnviado: (correo: string) => void
}

/** Recuperar cuenta · paso 1 de 2 (artboard 01c, RQF06). */
export function SolicitarCodigoForm({ correoInicial = '', onEnviado }: SolicitarCodigoFormProps) {
  const solicitar = useSolicitarCodigo()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<SolicitarCodigoValues>({
    resolver: zodResolver(solicitarCodigoSchema),
    defaultValues: { correo: correoInicial },
  })

  useEffect(() => setFocus('correo'), [setFocus])

  const onSubmit = handleSubmit(({ correo }) =>
    solicitar.mutate(correo, {
      onSuccess: () => onEnviado(correo),
      onError: (error) => {
        // RQF06: el correo sin cuenta se marca en el campo y no se avanza al paso 2.
        if (esErrorAuth(error) && error.codigo === 'CUENTA_INEXISTENTE') {
          setError('correo', { message: MENSAJES.cuentaInexistente }, { shouldFocus: true })
        }
      },
    }),
  )

  const codigo = esErrorAuth(solicitar.error) ? solicitar.error.codigo : null
  const errorGeneral = solicitar.isError && codigo !== 'CUENTA_INEXISTENTE'

  return (
    <TarjetaAcceso labelledBy="t-rec" onSubmit={onSubmit}>
      <div>
        <p className="sobretitulo">Paso 1 de 2</p>
        <h1 id="t-rec" className="mt-1 titulo-display">
          Recupera tu cuenta
        </h1>
        <p className="mt-1.5 text-tinta-secundaria">
          Escribe el correo de tu cuenta y te enviaremos un código de verificación.
        </p>
      </div>

      {errorGeneral &&
        (codigo === 'DEMASIADOS_INTENTOS' ? (
          <Aviso tono="peligro" titulo={MENSAJES.demasiadosIntentosTitulo}>
            {MENSAJES.demasiadosIntentosTexto}
          </Aviso>
        ) : (
          <Aviso tono="peligro" titulo="No pudimos enviar el código.">
            {MENSAJES.errorConexionTexto}
          </Aviso>
        ))}

      <RequiredLegend />

      <FormField
        label="Correo electrónico"
        htmlFor="r-mail"
        required
        error={errors.correo?.message}
      >
        <Input
          id="r-mail"
          type="email"
          autoComplete="username"
          invalid={!!errors.correo}
          aria-describedby={errors.correo ? fieldDescriptionId('r-mail') : undefined}
          {...register('correo')}
        />
      </FormField>

      <Button type="submit" size="lg" loading={solicitar.isPending}>
        Enviar código
      </Button>

      <p className="text-center text-cuerpo-sm">
        <Link to={PATHS.login} className="enlace">
          Volver a iniciar sesión
        </Link>
      </p>
    </TarjetaAcceso>
  )
}
