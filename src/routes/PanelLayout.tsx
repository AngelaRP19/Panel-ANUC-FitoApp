import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/features/auth'
import { useResumenNavegacion } from '@/features/navegacion'
import { Rol } from '@/types/enums'

/** Conecta el layout genérico con los datos del dominio (contadores, sesión y reintentos). */
export function PanelLayout() {
  const { usuario } = useAuth()
  const logout = useLogout()
  const queryClient = useQueryClient()
  const { data } = useResumenNavegacion()
  const esLider = usuario?.rol === Rol.LIDER_TECNICO

  const reintentar = useCallback(() => {
    void queryClient.refetchQueries({ type: 'active' })
  }, [queryClient])

  return (
    <AppLayout
      onLogout={logout}
      onReintentar={reintentar}
      badges={{
        casos: data?.casos_pendientes,
        alertas: esLider ? data?.alertas_generadas : undefined,
      }}
    />
  )
}
