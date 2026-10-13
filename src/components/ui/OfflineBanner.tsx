import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { MENSAJES } from '@/locales/es'

const INTERVALO_S = 10

interface OfflineBannerProps {
  /** Se llama cada 10 s mientras no hay conexión (p. ej. reintentar las consultas). */
  onRetry?: () => void
}

/**
 * Barra «Sin conexión. Los datos pueden no estar actualizados. Reintentando en 10 s.»
 * Solo aparece sin conexión. La cuenta regresiva no se anuncia segundo a segundo.
 */
export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const enLinea = useOnlineStatus()
  const [segundos, setSegundos] = useState(INTERVALO_S)

  useEffect(() => {
    if (enLinea) return
    const id = setInterval(() => {
      setSegundos((s) => {
        if (s > 1) return s - 1
        onRetry?.()
        return INTERVALO_S
      })
    }, 1000)
    return () => {
      clearInterval(id)
      setSegundos(INTERVALO_S)
    }
  }, [enLinea, onRetry])

  if (enLinea) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-peligro-suave px-4 py-3 text-cuerpo-sm text-tinta lg:px-8"
    >
      <WifiOff size={20} strokeWidth={1.75} className="shrink-0 text-peligro" aria-hidden="true" />
      <p>
        <b className="font-semibold">{MENSAJES.sinConexion}</b> Los datos pueden no estar
        actualizados. <span aria-hidden="true">Reintentando en {segundos} s.</span>
      </p>
    </div>
  )
}
