import { useState } from 'react'
import { Outlet, useMatches } from 'react-router'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Sidebar, type NavBadges } from './Sidebar'
import { SkipLink } from './SkipLink'
import { Topbar } from './Topbar'

/** Metadatos de ruta: `handle: { titulo: 'Casos' }` define el título de la barra superior y de la pestaña. */
export interface RouteHandle {
  titulo?: string
  /** Título para el técnico, si cambia («Mis casos»). */
  tituloTecnico?: string
}

interface AppLayoutProps {
  badges?: NavBadges
  notificacionesNuevas?: number
  /** Reintento periódico mientras no hay conexión (p. ej. refrescar las consultas). */
  onReintentar?: () => void
}

/** Layout del panel: barra lateral de 256 px + barra superior de 64 px + contenido. */
export function AppLayout({ badges, notificacionesNuevas, onReintentar }: AppLayoutProps) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const matches = useMatches()
  const { usuario } = useAuth()
  const esTecnico = usuario?.rol === 'TECNICO'
  const titulo =
    [...matches]
      .reverse()
      .map((m) => {
        const h = m.handle as RouteHandle | undefined
        return (esTecnico && h?.tituloTecnico) || h?.titulo
      })
      .find(Boolean) ?? ''
  usePageTitle(titulo)

  return (
    <div className="flex min-h-screen bg-verde-50">
      <SkipLink />

      {/* Barra lateral fija en escritorio */}
      <aside className="sticky top-0 hidden h-screen flex-none lg:block">
        <Sidebar badges={badges} />
      </aside>

      {/* Barra lateral como panel deslizante en pantallas pequeñas */}
      <Dialog.Root open={menuAbierto} onOpenChange={setMenuAbierto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-verde-950/48 lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-64 focus:outline-none lg:hidden"
          >
            <Dialog.Title className="sr-only">Menú</Dialog.Title>
            <Sidebar badges={badges} onNavigate={() => setMenuAbierto(false)} />
            <Dialog.Close
              aria-label="Cerrar menú"
              className="absolute top-3 -right-12 grid size-10 cursor-pointer place-items-center rounded-md bg-blanco text-tinta"
            >
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          titulo={titulo}
          onMenu={() => setMenuAbierto(true)}
          notificacionesNuevas={notificacionesNuevas}
        />
        <OfflineBanner onRetry={onReintentar} />
        <main
          id="contenido"
          tabIndex={-1}
          className="flex flex-col gap-6 p-4 focus:outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
