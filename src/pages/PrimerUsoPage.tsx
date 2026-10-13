import { Navigate, useNavigate } from 'react-router'
import { Spinner } from '@/components/ui/Spinner'
import { PantallaMarca, PasosPrimerUso, PrimerLiderForm, useEstadoAuth } from '@/features/auth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PATHS } from '@/routes/paths'

/**
 * Primer uso (diseño 01b · RQF01): solo se muestra mientras el panel no tiene líder técnico.
 * Si ya existe, la ruta lleva al login. Al crear la cuenta se entra al panel con ella.
 */
export default function PrimerUsoPage() {
  usePageTitle('Primer uso')
  const navigate = useNavigate()
  const { data, isPending } = useEstadoAuth()

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner etiqueta="Cargando" />
      </div>
    )
  }
  // Ya hay líder (o no se pudo consultar): el registro abierto no aplica.
  if (!data || data.hay_lider) return <Navigate to={PATHS.login} replace />

  return (
    <PantallaMarca lateral={<PasosPrimerUso />}>
      <PrimerLiderForm onLiderExistente={() => navigate(PATHS.login, { replace: true })} />
    </PantallaMarca>
  )
}
