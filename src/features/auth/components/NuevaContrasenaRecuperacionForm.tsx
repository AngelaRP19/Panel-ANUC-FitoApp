import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Aviso } from '@/components/ui/Aviso'
import { Button } from '@/components/ui/Button'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { MENSAJES } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { esErrorAuth } from '@/services/auth'
import { useConfirmarRecuperacion, useSolicitarCodigo } from '../hooks'
import { recuperacionSchema, type RecuperacionValues } from '../schemas'
import { TarjetaAcceso } from './PanelMarca'

const ESPERA_REENVIO_S = 30

interface NuevaContrasenaRecuperacionFormProps {
  correo: string
  /** La contraseña cambió: volver al login (diseño 01e). */
  onCambiada: () => void
}

/** Recuperar cuenta · paso 2 de 2: código y nueva contraseña (artboard 01d, RQF06). */
export function NuevaContrasenaRecuperacionForm({
  correo,
  onCambiada,
}: NuevaContrasenaRecuperacionFormProps) {
  const confirmar = useConfirmarRecuperacion()
  const reenviar = useSolicitarCodigo()
  const [espera, setEspera] = useState(ESPERA_REENVIO_S)
  const [reenviado, setReenviado] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<RecuperacionValues>({
    resolver: zodResolver(recuperacionSchema),
    defaultValues: { codigo: '', nueva: '', confirmar: '' },
  })

  useEffect(() => setFocus('codigo'), [setFocus])

  // Cuenta regresiva del reenvío. No se anuncia segundo a segundo: solo cuando ya se puede.
  useEffect(() => {
    if (espera <= 0) return
    const id = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [espera])

  const onSubmit = handleSubmit(({ codigo, nueva }) =>
    confirmar.mutate(
      { correo, codigo, nueva },
      {
        onSuccess: onCambiada,
        onError: (error) => {
          const c = esErrorAuth(error) ? error.codigo : null
          if (c === 'CODIGO_INVALIDO') {
            setError('codigo', { message: MENSAJES.codigoInvalido }, { shouldFocus: true })
          } else if (c === 'CONTRASENA_INVALIDA') {
            setError('nueva', { message: MENSAJES.contrasenaReglas }, { shouldFocus: true })
          }
        },
      },
    ),
  )

  const pedirOtroCodigo = () =>
    reenviar.mutate(correo, {
      onSuccess: () => {
        setReenviado(true)
        setEspera(ESPERA_REENVIO_S)
      },
    })

  const codigoError = esErrorAuth(confirmar.error) ? confirmar.error.codigo : null
  const errorGeneral =
    confirmar.isError && codigoError !== 'CODIGO_INVALIDO' && codigoError !== 'CONTRASENA_INVALIDA'

  return (
    <TarjetaAcceso labelledBy="t-cod" onSubmit={onSubmit}>
      <div>
        <p className="sobretitulo">Paso 2 de 2</p>
        <h1 id="t-cod" className="mt-1 titulo-display">
          Crea una nueva contraseña
        </h1>
      </div>

      <Aviso tono="info" rol="status">
        {reenviado ? 'Te enviamos un código nuevo a ' : 'Te enviamos un código de verificación a '}
        <b className="font-semibold [overflow-wrap:anywhere]">{correo}</b>. Escríbelo aquí; vence en
        10 minutos.
      </Aviso>

      {errorGeneral &&
        (codigoError === 'DEMASIADOS_INTENTOS' ? (
          <Aviso tono="peligro" titulo={MENSAJES.demasiadosIntentosTitulo}>
            {MENSAJES.demasiadosIntentosTexto}
          </Aviso>
        ) : (
          <Aviso tono="peligro" titulo="No se cambió la contraseña.">
            {MENSAJES.errorConexionTexto}
          </Aviso>
        ))}
      {reenviar.isError && (
        <Aviso tono="peligro" titulo="No pudimos reenviar el código.">
          {esErrorAuth(reenviar.error) && reenviar.error.codigo === 'DEMASIADOS_INTENTOS'
            ? MENSAJES.demasiadosIntentosTexto
            : MENSAJES.errorConexionTexto}
        </Aviso>
      )}

      <RequiredLegend />

      <FormField
        label="Código de verificación"
        htmlFor="c-cod"
        required
        error={errors.codigo?.message}
        hint="6 dígitos"
      >
        <Input
          id="c-cod"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          mono
          className="text-xl tracking-[6px]"
          invalid={!!errors.codigo}
          aria-describedby={fieldDescriptionId('c-cod')}
          {...register('codigo')}
        />
      </FormField>

      <FormField
        label="Nueva contraseña"
        htmlFor="c-new"
        required
        error={errors.nueva?.message}
        hint="Mínimo 8 caracteres, con letras y números"
      >
        <PasswordInput
          id="c-new"
          autoComplete="new-password"
          invalid={!!errors.nueva}
          aria-describedby={fieldDescriptionId('c-new')}
          {...register('nueva')}
        />
      </FormField>

      <FormField
        label="Confirma la nueva contraseña"
        htmlFor="c-rep"
        required
        error={errors.confirmar?.message}
      >
        <PasswordInput
          id="c-rep"
          autoComplete="new-password"
          invalid={!!errors.confirmar}
          aria-describedby={errors.confirmar ? fieldDescriptionId('c-rep') : undefined}
          {...register('confirmar')}
        />
      </FormField>

      <Button type="submit" size="lg" loading={confirmar.isPending}>
        Cambiar contraseña
      </Button>

      <div className="flex flex-col items-center gap-1 text-cuerpo-sm text-tinta-terciaria">
        <p className="flex flex-wrap items-center justify-center gap-1">
          ¿No te llegó el código?
          <Button
            variant="text"
            size="sm"
            disabled={espera > 0}
            loading={reenviar.isPending}
            onClick={pedirOtroCodigo}
            className="disabled:border-transparent disabled:bg-transparent"
          >
            {espera > 0 ? (
              // Un solo elemento: el botón es flex y separaría los fragmentos de texto.
              <span>
                Reenviar código en <span className="tabular-nums">{espera}</span> s
              </span>
            ) : (
              'Reenviar código'
            )}
          </Button>
        </p>
        <span aria-live="polite" className="sr-only">
          {espera === 0 ? 'Ya puedes pedir un código nuevo.' : ''}
        </span>
        <Link to={PATHS.login} className="enlace">
          Volver a iniciar sesión
        </Link>
      </div>
    </TarjetaAcceso>
  )
}
