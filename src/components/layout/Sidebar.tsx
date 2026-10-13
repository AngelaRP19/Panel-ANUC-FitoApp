import { NavLink } from 'react-router'
import {
  BarChart3,
  ClipboardList,
  Home,
  Leaf,
  Map,
  SlidersHorizontal,
  TriangleAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import { Rol } from '@/types/enums'
import { cn } from '@/utils/cn'

/** Contadores junto a los ítems de navegación (los aporta quien monta el layout). */
export interface NavBadges {
  /** Líder: casos pendientes de revisión (sin técnico). Técnico: sus casos en revisión. */
  casos?: number
  /** Líder: alertas generadas sin revisar. */
  alertas?: number
}

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: keyof NavBadges
  badgeTitle?: string
  /** Etiqueta fija neutra («ver» = solo consulta). */
  tag?: { texto: string; title: string }
}

interface NavGroup {
  titulo?: string
  items: NavItem[]
}

// Barra lateral por rol (guía 6.3, artboard «Componente · Navegación lateral»).
const NAV: Record<Rol, NavGroup[]> = {
  LIDER_TECNICO: [
    {
      items: [
        { to: PATHS.inicio, label: 'Inicio', icon: Home },
        {
          to: PATHS.casos,
          label: 'Casos',
          icon: ClipboardList,
          badge: 'casos',
          badgeTitle: 'Casos pendientes de revisión',
        },
        {
          to: PATHS.alertas,
          label: 'Alertas',
          icon: TriangleAlert,
          badge: 'alertas',
          badgeTitle: 'Alertas generadas sin revisar',
        },
        { to: PATHS.mapa, label: 'Mapa de vigilancia', icon: Map },
        { to: PATHS.reportes, label: 'Reportes', icon: BarChart3 },
      ],
    },
    {
      titulo: 'Registros',
      items: [
        { to: PATHS.productores, label: 'Productores', icon: UserPlus },
        { to: PATHS.fincas, label: 'Fincas y cultivos', icon: Leaf },
      ],
    },
    {
      titulo: 'Líder técnico',
      items: [
        { to: PATHS.tecnicos, label: 'Técnicos', icon: Users },
        { to: PATHS.parametros, label: 'Parámetros epidemiológicos', icon: SlidersHorizontal },
      ],
    },
  ],
  TECNICO: [
    {
      items: [
        { to: PATHS.inicio, label: 'Inicio', icon: Home },
        {
          to: PATHS.casos,
          label: 'Mis casos',
          icon: ClipboardList,
          badge: 'casos',
          badgeTitle: 'Casos en revisión',
        },
      ],
    },
    {
      titulo: 'Consulta',
      items: [
        {
          to: PATHS.alertas,
          label: 'Alertas',
          icon: TriangleAlert,
          tag: { texto: 'ver', title: 'Solo consulta' },
        },
        { to: PATHS.consulta, label: 'Productores y fincas', icon: Leaf },
      ],
    },
  ],
}

const ROL_INFO: Record<Rol, { titulo: string; ayuda: string }> = {
  LIDER_TECNICO: {
    titulo: 'Líder técnico',
    ayuda: 'Administras todo el panel y asignas casos.',
  },
  TECNICO: { titulo: 'Técnico', ayuda: 'Ves y gestionas solo los casos que te asignaron.' },
}

interface SidebarProps {
  badges?: NavBadges
  /** Se llama al elegir un destino (cierra el menú en pantallas pequeñas). */
  onNavigate?: () => void
}

/** Navegación lateral (af-nav / pf-nav): 256 px sobre verde-950. */
export function Sidebar({ badges = {}, onNavigate }: SidebarProps) {
  const { usuario } = useAuth()
  if (!usuario) return null
  const grupos = NAV[usuario.rol] ?? NAV.TECNICO
  const info = ROL_INFO[usuario.rol] ?? ROL_INFO.TECNICO

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-64 flex-col overflow-y-auto bg-verde-950 px-3 py-4 text-verde-100"
    >
      <div className="px-3 pt-2 pb-5 font-titulos text-[17px] leading-6 font-bold text-blanco">
        ANUC Zetaquirá
        <small className="block font-texto text-xs leading-4 font-medium text-verde-300">
          Panel fitosanitario
        </small>
      </div>

      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className="flex flex-col">
          {grupo.titulo && (
            <div className="px-3 pt-4 pb-1 text-[11px] leading-4 font-semibold tracking-[0.08em] text-verde-300 uppercase">
              {grupo.titulo}
            </div>
          )}
          {grupo.items.map((it) => {
            const Icon = it.icon
            const count = it.badge ? badges[it.badge] : undefined
            return (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-md px-3 text-cuerpo-sm no-underline transition-colors',
                    isActive
                      ? 'bg-verde-900 font-semibold text-blanco ring-1 ring-verde-800 ring-inset'
                      : 'font-medium text-verde-100 hover:bg-verde-900 hover:text-blanco',
                  )
                }
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" className="flex-none" />
                {it.label}
                {!!count && (
                  <span
                    title={it.badgeTitle}
                    className="ml-auto rounded-pill bg-advertencia-suave px-2 text-xs leading-5 font-bold text-advertencia"
                  >
                    {count}
                    <span className="sr-only"> {it.badgeTitle?.toLowerCase()}</span>
                  </span>
                )}
                {it.tag && (
                  <span
                    title={it.tag.title}
                    className="ml-auto rounded-pill border border-verde-800 bg-verde-900 px-2 text-xs leading-5 font-bold text-verde-100"
                  >
                    {it.tag.texto}
                    <span className="sr-only"> ({it.tag.title.toLowerCase()})</span>
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}

      <div className="mx-3 mt-6 rounded-md bg-verde-900 p-3 text-xs leading-4 font-medium text-verde-300">
        <b className="block text-[13px] leading-[18px] font-semibold text-blanco">{info.titulo}</b>
        {info.ayuda}
      </div>
    </nav>
  )
}
