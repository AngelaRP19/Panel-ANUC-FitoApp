import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { adaptadorSimulado } from '@/mocks/authSimulado'
import { CONTRASENA_DEMO } from '@/mocks/fixtures/usuarios'
import { api } from '@/services/apiClient'
import { rutas } from './router'

/** Monta la app real (árbol de rutas completo) con una sesión ya iniciada. */
async function renderComo(correo: string | null, ruta: string) {
  if (correo) await adaptadorSimulado.iniciarSesion(correo, CONTRASENA_DEMO)
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] })
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { router, user: userEvent.setup() }
}

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

describe('navegación por rol', () => {
  it('el líder ve su menú, la sección activa y su recuadro de rol', async () => {
    await renderComo(LIDER, '/productores')
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' })
    for (const enlace of ['Casos', 'Alertas', 'Mapa de vigilancia', 'Reportes', 'Técnicos']) {
      expect(within(nav).getByRole('link', { name: new RegExp(enlace) })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: 'Productores' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByText('Administras todo el panel y asignas casos.')).toBeInTheDocument()
    expect(
      await within(nav).findByText('casos pendientes de revisión', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar caso, productor o finca' }))
  })

  it('el técnico ve «Mis casos», el grupo Consulta y su búsqueda', async () => {
    await renderComo(TECNICO, '/casos')
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: /Mis casos/ })).toBeInTheDocument()
    expect(within(nav).getByText('Consulta')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Alertas.*solo consulta/ })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Técnicos' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Mapa de vigilancia' })).not.toBeInTheDocument()
    expect(
      within(nav).getByText('Ves y gestionas solo los casos que te asignaron.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar en mis casos' })).toBeInTheDocument()
  })

  it('un técnico en una sección del líder ve «Esta sección es solo para el líder técnico»', async () => {
    await renderComo(TECNICO, '/parametros')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/inicio',
    )
  })

  it('el líder que abre la consulta del técnico va a Productores', async () => {
    const { router } = await renderComo(LIDER, '/consulta')
    expect(await screen.findByRole('heading', { name: 'Productores' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/productores')
  })

  it('un técnico que abre un caso ajeno ve «No tienes acceso a este caso»', async () => {
    const { router } = await renderComo(TECNICO, '/casos')
    await screen.findByRole('navigation', { name: 'Navegación principal' })
    // #0237 está asignado a Jhon Fredy Sanabria: la API responde 404.
    await act(() => api.get('/casos/0237').catch(() => undefined))
    expect(
      await screen.findByRole('heading', { name: 'No tienes acceso a este caso' }),
    ).toBeInTheDocument()
    expect(router.state.location.search).toBe('?caso=0237')
    expect(screen.getByText('#0237')).toBeInTheDocument()
    expect(
      await screen.findByText(
        '¿Crees que deberías atenderlo? Pídele a Wilmar Torres, líder técnico, que te lo asigne.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a mis casos' })).toHaveAttribute('href', '/casos')
  })

  it('el chip de usuario lleva a Mi cuenta y «Cerrar sesión» vuelve al login', async () => {
    const { router, user } = await renderComo(LIDER, '/casos')
    await user.click(await screen.findByRole('link', { name: /Mi cuenta: Wilmar Torres/ }))
    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(await adaptadorSimulado.obtenerToken()).toBeNull()
  })

  it('tiene «Saltar al contenido» hacia el main', async () => {
    await renderComo(LIDER, '/casos')
    const salto = await screen.findByRole('link', { name: 'Saltar al contenido' })
    expect(salto).toHaveAttribute('href', '#contenido')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido')
  })

  it('sin sesión, una ruta del panel lleva al login', async () => {
    const { router } = await renderComo(null, '/tecnicos')
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
