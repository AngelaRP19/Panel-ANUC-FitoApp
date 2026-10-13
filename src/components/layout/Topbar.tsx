import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-dialog'
import { Bell, ChevronDown, LogOut, Menu, Search, UserRound } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import { Rol } from '@/types/enums'

interface TopbarProps {
  titulo: string
  onMenu: () => void
  onLogout: () => void
  /** Notificaciones nuevas (contador de la campana). */
  notificacionesNuevas?: number
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/** Barra superior (pf-top): título, búsqueda por rol, campana y chip de usuario. */
export function Topbar({ titulo, onMenu, onLogout, notificacionesNuevas = 0 }: TopbarProps) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  if (!usuario) return null
  const esLider = usuario.rol === Rol.LIDER_TECNICO
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

      {/* TODO(pantalla 18): lista de notificaciones. Por ahora solo el contador. */}
      <Popover.Root modal={false}>
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
            <div className="border-b border-borde px-4 py-3.5">
              <Popover.Title className="font-titulos text-base font-semibold">
                Notificaciones
              </Popover.Title>
            </div>
            <p className="px-4 py-6 text-center text-cuerpo-sm text-tinta-terciaria">
              No tienes notificaciones nuevas.
            </p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* TODO(pantalla 4): el diseño lleva el chip directo a Mi cuenta; «Cerrar sesión» vive allí. */}
      <Dropdown.Root>
        <Dropdown.Trigger className="flex cursor-pointer items-center gap-3 rounded-md py-1 pr-2 pl-1 text-left hover:bg-verde-50">
          <span
            aria-hidden="true"
            className="size-9 flex-none rounded-full bg-verde-100 text-center font-titulos text-sm leading-9 font-bold text-verde-800"
          >
            {iniciales(usuario.nombre)}
          </span>
          <span className="hidden flex-col sm:flex">
            <span className="text-cuerpo-sm leading-[18px] font-semibold">{usuario.nombre}</span>
            <span className="text-xs leading-4 text-tinta-terciaria">
              {esLider ? 'Líder técnico' : 'Técnico'}
            </span>
          </span>
          <span className="sr-only sm:hidden">{usuario.nombre}</span>
          <ChevronDown size={16} aria-hidden="true" className="text-tinta-terciaria" />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={8}
            className="z-40 min-w-56 rounded-md border border-borde bg-blanco p-1.5 shadow-2"
          >
            <Dropdown.Item asChild>
              <Link
                to={PATHS.miCuenta}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-cuerpo-sm font-medium text-tinta no-underline outline-none data-[highlighted]:bg-verde-50"
              >
                <UserRound size={16} aria-hidden="true" /> Mi cuenta
              </Link>
            </Dropdown.Item>
            <Dropdown.Item
              onSelect={onLogout}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-cuerpo-sm font-medium text-tinta outline-none data-[highlighted]:bg-verde-50"
            >
              <LogOut size={16} aria-hidden="true" /> Cerrar sesión
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </header>
  )
}
