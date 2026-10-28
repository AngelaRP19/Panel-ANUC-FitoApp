import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import * as Popover from '@radix-ui/react-dialog'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROL_LABEL, etiqueta } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { Rol } from '@/types/enums'
import { iniciales } from '@/utils/texto'

interface TopbarProps {
  titulo: string
  onMenu: () => void
  /** Notificaciones nuevas (contador de la campana). */
  notificacionesNuevas?: number
  /** Lista de avisos del panel de la campana (la provee el dominio). */
  notificaciones?: ReactNode
  /** Acción del encabezado del panel («Marcar como leídas»). */
  notificacionesAcciones?: ReactNode
}

/**
 * Barra superior (pf-top, componente «Barra superior»): título de la sección, búsqueda según
 * el rol, campana con contador y chip de usuario que lleva a Mi cuenta.
 */
export function Topbar({
  titulo,
  onMenu,
  notificacionesNuevas = 0,
  notificaciones,
  notificacionesAcciones,
}: TopbarProps) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [busqueda, setBusqueda] = useState('')
  // El panel queda abierto solo en la URL en que se abrió: al seguir un aviso (o cambiar de
  // pantalla) se cierra.
  const aqui = pathname + search
  const [campanaEn, setCampanaEn] = useState<string | null>(null)
  const campana = campanaEn === aqui
  const setCampana = (abierta: boolean) => setCampanaEn(abierta ? aqui : null)

  if (!usuario) return null
  const esLider = usuario.rol === Rol.LIDER_TECNICO
  // El técnico solo busca en sus casos asignados (el backend filtra por asignación).
  const placeholder = esLider ? 'Buscar caso, productor o finca' : 'Buscar en mis casos'

  const buscar = (e: FormEvent) => {
    e.preventDefault()
    const q = busqueda.trim()
    if (q) navigate(`${PATHS.casos}?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="relative z-30 flex h-16 flex-none items-center gap-4 border-b border-borde bg-blanco px-4 lg:px-8">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
        className="grid size-10 cursor-pointer place-items-center rounded-md text-tinta-secundaria hover:bg-verde-50 lg:hidden"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1 truncate font-titulos text-lg leading-6 font-semibold">
        {titulo}
      </div>

      <form role="search" onSubmit={buscar} className="relative hidden w-85 flex-none md:block">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-3 text-tinta-terciaria"
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label={placeholder}
          placeholder={placeholder}
          className="h-10 w-full rounded-sm border border-borde-control bg-blanco pr-3 pl-9.5 text-cuerpo-sm placeholder:text-tinta-terciaria focus:border-verde-600"
        />
      </form>

      {/* Campana (pantalla 18): la lista y «Marcar como leídas» llegan del dominio. */}
      <Popover.Root modal={false} open={campana} onOpenChange={setCampana}>
        <Popover.Trigger
          aria-label={`Notificaciones: ${notificacionesNuevas} nuevas`}
          className="relative grid size-10 cursor-pointer place-items-center rounded-md border border-borde bg-blanco text-tinta-secundaria hover:bg-verde-50"
        >
          <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
          {notificacionesNuevas > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-pill border border-advertencia bg-advertencia-suave px-1.5 text-center text-xs leading-[18px] font-bold text-advertencia"
            >
              {notificacionesNuevas}
            </span>
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            aria-describedby={undefined}
            className="fixed top-16 right-4 z-40 w-100 max-w-[calc(100vw-32px)] rounded-lg border border-borde bg-blanco shadow-2 lg:right-8"
          >
            <div className="flex items-center gap-2 border-b border-borde px-4 py-3.5">
              <Popover.Title className="flex-1 font-titulos text-base font-semibold">
                Notificaciones
              </Popover.Title>
              {notificacionesAcciones}
            </div>
            {notificaciones ?? (
              <p className="px-4 py-6 text-center text-cuerpo-sm text-tinta-terciaria">
                No hay notificaciones.
              </p>
            )}
            <div className="flex justify-end border-t border-borde px-4 py-2.5 text-cuerpo-sm">
              <span className="text-tinta-terciaria">Últimos 7 días</span>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Link
        to={PATHS.miCuenta}
        aria-label={`Mi cuenta: ${usuario.nombre}, ${etiqueta(ROL_LABEL, usuario.rol)}`}
        className="flex items-center gap-3 rounded-md py-1 pr-2 pl-1 text-left text-tinta no-underline hover:bg-verde-50"
      >
        <span
          aria-hidden="true"
          className="size-9 flex-none rounded-full bg-verde-100 text-center font-titulos text-sm leading-9 font-bold text-verde-800"
        >
          {iniciales(usuario.nombre)}
        </span>
        <span className="hidden flex-col sm:flex">
          <span className="text-cuerpo-sm leading-[18px] font-semibold">{usuario.nombre}</span>
          <span className="text-xs leading-4 text-tinta-terciaria">
            {etiqueta(ROL_LABEL, usuario.rol)}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="text-tinta-terciaria" />
      </Link>
    </header>
  )
}
