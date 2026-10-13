import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Rol } from '@/types/enums'
import { RoleRoute } from './RoleRoute'

const useAuthMock = vi.fn()
vi.mock('@/context/AuthContext', () => ({ useAuth: () => useAuthMock() }))

function renderEn(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/casos', element: <p>casos</p> },
      {
        element: <RoleRoute roles={[Rol.LIDER_TECNICO]} />,
        children: [{ path: '/productores', element: <p>productores</p> }],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
}

describe('RoleRoute', () => {
  it('deja pasar al líder técnico', () => {
    useAuthMock.mockReturnValue({ usuario: { rol: Rol.LIDER_TECNICO } })
    renderEn('/productores')
    expect(screen.getByText('productores')).toBeInTheDocument()
  })

  it('muestra al técnico que la sección es solo para el líder', () => {
    useAuthMock.mockReturnValue({ usuario: { rol: Rol.TECNICO } })
    renderEn('/productores')
    expect(
      screen.getByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('productores')).not.toBeInTheDocument()
  })
})
