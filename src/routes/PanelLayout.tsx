import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { useResumenNavegacion } from '@/features/navegacion'
import { ListaNotificaciones, MarcarLeidas } from '@/features/notificaciones'
import { registrarCasoInaccesible } from '@/services/apiClient'
import { Rol } from '@/types/enums'
import { PATHS } from './paths'

/** Conecta el layout genérico con los datos del dominio (contadores, accesos y reintentos). */
export function PanelLayout() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useResumenNavegacion()
  const esLider = usuario?.rol === Rol.LIDER_TECNICO

  // Caso de otro técnico (403, o 404 para el técnico) → «No tienes acceso a este caso».
  // Para el líder, un 404 es un caso inexistente y lo resuelve la pantalla del detalle.
  useEffect(() => {
    registrarCasoInaccesible((idCaso, status) => {
      if (status === 403 || !esLider) {
        navigate(`${PATHS.sinAcceso}?caso=${encodeURIComponent(idCaso)}`, { replace: true })
      }
    })
    return () => registrarCasoInaccesible(null)
  }, [esLider, navigate])

  const reintentar = useCallback(() => {
    void queryClient.refetchQueries({ type: 'active' })
  }, [queryClient])

  return (
    <AppLayout
      onReintentar={reintentar}
      notificacionesNuevas={data?.notificaciones_nuevas}
      notificaciones={<ListaNotificaciones />}
      notificacionesAcciones={<MarcarLeidas />}
      badges={{
        casos: data?.casos_pendientes,
        alertas: esLider ? data?.alertas_generadas : undefined,
      }}
    />
  )
}
