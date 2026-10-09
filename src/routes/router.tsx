import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import AlertaDetallePage from '@/pages/AlertaDetallePage'
import AlertasPage from '@/pages/AlertasPage'
import CasoDetallePage from '@/pages/CasoDetallePage'
import CasosPage from '@/pages/CasosPage'
import FincasPage from '@/pages/FincasPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ParametrosEpidemiologicosPage from '@/pages/ParametrosEpidemiologicosPage'
import ProductoresPage from '@/pages/ProductoresPage'
import SetupInicialPage from '@/pages/SetupInicialPage'
import UsuariosPage from '@/pages/UsuariosPage'
import { Rol } from '@/types/enums'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/setup', element: <SetupInicialPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/casos" replace /> },
          // Líder y técnico (el técnico solo ve los suyos; lo filtra el backend)
          { path: '/casos', element: <CasosPage /> },
          { path: '/casos/:id', element: <CasoDetallePage /> },
          // Solo líder técnico
          {
            element: <RoleRoute roles={[Rol.LIDER_TECNICO]} />,
            children: [
              { path: '/productores', element: <ProductoresPage /> },
              { path: '/fincas', element: <FincasPage /> },
              { path: '/usuarios', element: <UsuariosPage /> },
              { path: '/alertas', element: <AlertasPage /> },
              { path: '/alertas/:id', element: <AlertaDetallePage /> },
              { path: '/configuracion/epidemiologia', element: <ParametrosEpidemiologicosPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
