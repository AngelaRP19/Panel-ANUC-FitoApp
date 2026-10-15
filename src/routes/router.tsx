import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import type { RouteHandle } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import AlertaMensajePage from '@/pages/AlertaMensajePage'
import AlertasPage from '@/pages/AlertasPage'
import CasoDetallePage from '@/pages/CasoDetallePage'
import CasosPage from '@/pages/CasosPage'
import ConsultaPage from '@/pages/ConsultaPage'
import DocumentacionPage from '@/pages/DocumentacionPage'
import EnConstruccionPage from '@/pages/EnConstruccionPage'
import FincasPage from '@/pages/FincasPage'
import LoginPage from '@/pages/LoginPage'
import MapaPage from '@/pages/MapaPage'
import MiCuentaPage from '@/pages/MiCuentaPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ParametrosPage from '@/pages/ParametrosPage'
import PrimerUsoPage from '@/pages/PrimerUsoPage'
import ProductoresPage from '@/pages/ProductoresPage'
import RecuperarCuentaPage from '@/pages/RecuperarCuentaPage'
import SinAccesoPage from '@/pages/SinAccesoPage'
import TecnicosPage from '@/pages/TecnicosPage'
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

/** Árbol de rutas (se exporta para probarlo con un router en memoria). */
export const rutas: RouteObject[] = [
  // Públicas: con sesión iniciada redirigen al panel
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: PATHS.login, element: <LoginPage /> },
      { path: PATHS.primerUso, element: <PrimerUsoPage /> },
      { path: PATHS.recuperarCuenta, element: <RecuperarCuentaPage /> },
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
          {
            path: PATHS.casos,
            element: <CasosPage />,
            handle: { titulo: 'Casos', tituloTecnico: 'Mis casos' } satisfies RouteHandle,
          },
          {
            path: '/casos/:id',
            element: <CasoDetallePage />,
            handle: { titulo: 'Casos', tituloTecnico: 'Mis casos' } satisfies RouteHandle,
          },
          { path: PATHS.alertas, element: <AlertasPage />, handle: titulo('Alertas') },
          { path: '/alertas/:id', element: <AlertasPage />, handle: titulo('Alertas') },
          { path: PATHS.miCuenta, element: <MiCuentaPage />, handle: titulo('Mi cuenta') },
          { path: PATHS.sinAcceso, element: <SinAccesoPage />, handle: titulo('Mis casos') },

          // Solo técnico
          {
            // El líder consulta y edita productores y fincas en su propia sección.
            element: <RoleRoute roles={[Rol.TECNICO]} redirigirA={PATHS.productores} />,
            children: [
              {
                path: PATHS.consulta,
                element: <ConsultaPage />,
                handle: titulo('Productores y fincas'),
              },
            ],
          },

          // Solo líder técnico
          {
            element: <RoleRoute roles={LIDER} />,
            children: [
              {
                path: '/alertas/:id/mensaje',
                element: <AlertaMensajePage />,
                handle: titulo('Alertas'),
              },
              { path: PATHS.mapa, element: <MapaPage />, handle: titulo('Mapa de vigilancia') },
              pendiente(PATHS.reportes, 'Reportes', 23),
              {
                path: PATHS.productores,
                element: <ProductoresPage />,
                handle: titulo('Productores'),
              },
              { path: PATHS.fincas, element: <FincasPage />, handle: titulo('Fincas y cultivos') },
              { path: PATHS.tecnicos, element: <TecnicosPage />, handle: titulo('Técnicos') },
              {
                path: PATHS.parametros,
                element: <ParametrosPage />,
                handle: titulo('Parámetros epidemiológicos'),
              },
              {
                path: PATHS.documentacion,
                element: <DocumentacionPage />,
                handle: titulo('Documentación'),
              },
            ],
          },
        ],
      },
    ],
  },
  ...(DevUiPage ? [{ path: PATHS.devUi, element: conSuspense(<DevUiPage />) }] : []),
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter(rutas)
