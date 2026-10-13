import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import type { RouteHandle } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import EnConstruccionPage from '@/pages/EnConstruccionPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { Rol } from '@/types/enums'
import { IndexRedirect } from './IndexRedirect'
import { InicioPorRol } from './InicioPorRol'
import { PanelLayout } from './PanelLayout'
import { PATHS } from './paths'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { RoleRoute } from './RoleRoute'

// Catálogo de componentes: solo existe en desarrollo (no entra en el build de producción).
const DevUiPage = import.meta.env.DEV ? lazy(() => import('@/pages/DevUiPage')) : null

const titulo = (t: string): RouteHandle => ({ titulo: t })

/** Ruta aún sin desarrollar: muestra «Pantalla en construcción». */
function pendiente(path: string, nombre: string, pantalla: number): RouteObject {
  return {
    path,
    element: <EnConstruccionPage titulo={nombre} pantalla={pantalla} />,
    handle: titulo(nombre),
  }
}

function conSuspense(elemento: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {elemento}
    </Suspense>
  )
}

const LIDER = [Rol.LIDER_TECNICO]

export const router = createBrowserRouter([
  // Públicas: con sesión iniciada redirigen al panel
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: PATHS.login, element: <LoginPage /> },
      pendiente(PATHS.primerUso, 'Primer uso', 2),
      pendiente(PATHS.recuperarCuenta, 'Recuperar cuenta', 3),
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PanelLayout />,
        children: [
          { index: true, element: <IndexRedirect /> },
          { path: PATHS.inicio, element: <InicioPorRol />, handle: titulo('Inicio') },

          // Líder y técnico (el técnico solo ve lo suyo; lo filtra el backend)
          pendiente(PATHS.casos, 'Casos', 5),
          pendiente('/casos/:id', 'Detalle del caso', 6),
          pendiente(PATHS.alertas, 'Alertas epidemiológicas', 11),
          pendiente(PATHS.miCuenta, 'Mi cuenta', 15),
          pendiente(PATHS.sinAcceso, 'Sin acceso', 4),

          // Solo técnico
          {
            element: <RoleRoute roles={[Rol.TECNICO]} />,
            children: [pendiente(PATHS.consulta, 'Productores y fincas', 14)],
          },

          // Solo líder técnico
          {
            element: <RoleRoute roles={LIDER} />,
            children: [
              pendiente('/alertas/:id/mensaje', 'Mensaje a productores', 12),
              pendiente(PATHS.mapa, 'Mapa de vigilancia', 19),
              pendiente(PATHS.reportes, 'Reportes', 23),
              pendiente(PATHS.productores, 'Productores', 8),
              pendiente(PATHS.fincas, 'Fincas y cultivos', 9),
              pendiente(PATHS.tecnicos, 'Técnicos', 10),
              pendiente(PATHS.parametros, 'Parámetros epidemiológicos', 13),
              pendiente(PATHS.documentacion, 'Documentación fitosanitaria', 20),
            ],
          },
        ],
      },
    ],
  },
  ...(DevUiPage ? [{ path: PATHS.devUi, element: conSuspense(<DevUiPage />) }] : []),
  { path: '*', element: <NotFoundPage /> },
])
