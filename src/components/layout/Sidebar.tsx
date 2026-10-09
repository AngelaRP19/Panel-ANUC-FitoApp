import { NavLink } from 'react-router'
import {
  AlertTriangle,
  ClipboardList,
  Settings,
  Sprout,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Rol } from '@/types/enums'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles: Rol[]
}

const NAV: NavItem[] = [
  { to: '/casos', label: 'Casos', icon: ClipboardList, roles: [Rol.LIDER_TECNICO, Rol.TECNICO] },
  { to: '/productores', label: 'Productores', icon: Users, roles: [Rol.LIDER_TECNICO] },
  { to: '/fincas', label: 'Fincas', icon: Sprout, roles: [Rol.LIDER_TECNICO] },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: [Rol.LIDER_TECNICO] },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle, roles: [Rol.LIDER_TECNICO] },
  {
    to: '/configuracion/epidemiologia',
    label: 'Parámetros',
    icon: Settings,
    roles: [Rol.LIDER_TECNICO],
  },
]

export function Sidebar() {
  const { usuario } = useAuth()
  const items = NAV.filter((i) => usuario && i.roles.includes(usuario.rol))

  return (
    <aside className="w-60 shrink-0 border-r border-borde bg-blanco">
      <div className="px-5 py-4 text-lg font-semibold text-verde-800">ANUC Zetaquirá</div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                isActive
                  ? 'bg-verde-100 font-medium text-verde-800'
                  : 'text-tinta-secundaria hover:bg-verde-50',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
