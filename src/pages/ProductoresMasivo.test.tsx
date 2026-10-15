import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { productores } from '@/mocks/fixtures/productores'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const tabla = () => screen.getByRole('table', { name: 'Productores registrados' })
const filas = () => within(tabla()).getAllByRole('row').slice(1)
const barra = () => screen.getByRole('region', { name: 'Acciones masivas' })

// jsdom no implementa URL.createObjectURL: se captura el archivo descargado.
let archivos: Blob[] = []
const originales = { crear: URL.createObjectURL, liberar: URL.revokeObjectURL }
beforeEach(() => {
  archivos = []
  URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
    archivos.push(b as Blob)
    return 'blob:prueba'
  })
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  URL.createObjectURL = originales.crear
  URL.revokeObjectURL = originales.liberar
})

describe('Acciones masivas de productores (pantalla 21)', () => {
  it('desactiva varios productores con confirmación y lista de nombres', async () => {
    const { user } = await renderApp(LIDER, '/productores')
    await waitFor(() => expect(filas()).toHaveLength(10))
    const [a, b] = [filas()[0]!, filas()[1]!]
    const nombreA = within(a).getAllByRole('cell')[1]!.textContent!
    const nombreB = within(b).getAllByRole('cell')[1]!.textContent!
    await user.click(within(a).getByRole('checkbox'))
    await user.click(within(b).getByRole('checkbox'))
    expect(within(barra()).getByText('2 seleccionados')).toBeInTheDocument()
    // Marcar la casilla no abre la ficha.
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(within(barra()).getByRole('button', { name: 'Desactivar' }))
    const dlg = await screen.findByRole('alertdialog', { name: '¿Desactivar a 2 productores?' })
    expect(
      within(dlg).getByText(
        'El chatbot dejará de atender sus números y no recibirán mensajes de alerta. Sus fincas y casos se conservan.',
      ),
    ).toBeInTheDocument()
    expect(within(dlg).getByText(nombreA)).toBeInTheDocument()
    expect(within(dlg).getByText(nombreB)).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Desactivar 2 productores' }))

    expect(await screen.findByText('2 productores quedaron deshabilitados')).toBeInTheDocument()
    expect(screen.getByText('El cambio queda en el registro de actividad.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Acciones masivas' })).toBeNull()
    expect(productores.find((p) => p.nombre === nombreA)!.activo).toBe(false)
    expect(productores.find((p) => p.nombre === nombreB)!.activo).toBe(false)
  })

  it('la selección de la página se conserva al cambiar de página', async () => {
    const { user } = await renderApp(LIDER, '/productores')
    await waitFor(() => expect(filas()).toHaveLength(10))
    await user.click(
      screen.getByRole('checkbox', { name: 'Seleccionar todos los productores de esta página' }),
    )
    expect(within(barra()).getByText('10 seleccionados')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() => expect(filas().length).toBeLessThan(10))
    await user.click(within(filas()[0]!).getByRole('checkbox'))
    expect(within(barra()).getByText('11 seleccionados')).toBeInTheDocument()
    await user.click(within(barra()).getByRole('button', { name: 'Quitar selección' }))
    expect(screen.queryByRole('region', { name: 'Acciones masivas' })).toBeNull()
  })

  it('envía un mensaje por WhatsApp solo a los productores activos', async () => {
    const { user } = await renderApp(LIDER, '/productores?estado=deshabilitado')
    await waitFor(() => expect(filas()).toHaveLength(1))
    await user.click(within(filas()[0]!).getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /^Quitar filtro Estado/ }))
    await waitFor(() => expect(filas()).toHaveLength(10))
    await user.click(within(filas()[0]!).getByRole('checkbox'))
    expect(within(barra()).getByText('2 seleccionados')).toBeInTheDocument()

    await user.click(within(barra()).getByRole('button', { name: 'Enviar mensaje por WhatsApp' }))
    const dlg = await screen.findByRole('dialog', { name: 'Enviar mensaje por WhatsApp' })
    expect(
      within(dlg).getByText(
        '1 productor seleccionado está deshabilitado y no recibirá el mensaje.',
      ),
    ).toBeInTheDocument()
    await user.click(within(dlg).getByRole('button', { name: 'Enviar a 1 productor' }))
    expect(
      await within(dlg).findByText('Escribe el mensaje para los productores.'),
    ).toBeInTheDocument()
    await user.type(
      within(dlg).getByLabelText(/^Mensaje/),
      'Reunión de la asociación el sábado a las 9:00.',
    )
    await user.click(within(dlg).getByRole('button', { name: 'Enviar a 1 productor' }))
    expect(await screen.findByText('Mensaje enviado a 1 productor')).toBeInTheDocument()
  })

  it('exporta la selección y la lista filtrada en CSV', async () => {
    const { user } = await renderApp(LIDER, '/productores?estado=deshabilitado')
    await waitFor(() => expect(filas()).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Exportar lista (CSV)' }))
    expect(await screen.findByText('Lista exportada')).toBeInTheDocument()
    const lista = await archivos[0]!.text()
    expect(lista).toContain('Nombre,WhatsApp,Vereda,Fincas,Estado,Casos activos')
    expect(lista).toContain('Jairo Niño')
    expect(lista).not.toContain('María Rojas Cárdenas')

    await user.click(within(filas()[0]!).getByRole('checkbox'))
    await user.click(within(barra()).getByRole('button', { name: 'Exportar selección (CSV)' }))
    expect(await screen.findByText('Selección exportada')).toBeInTheDocument()
    const seleccion = await archivos[1]!.text()
    expect(seleccion.trim().split(/\r?\n/)).toHaveLength(2)
  })
})
