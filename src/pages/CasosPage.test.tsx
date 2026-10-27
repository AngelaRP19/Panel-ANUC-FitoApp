import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

const filas = () =>
  within(screen.getByRole('table', { name: 'Casos' }))
    .getAllByRole('row')
    .slice(1)
const tab = (nombre: RegExp) => screen.getByRole('tab', { name: nombre })

describe('Bandeja de casos · líder técnico', () => {
  it('muestra todos los casos ordenados por envío, con conteos y técnico', async () => {
    await renderApp(LIDER, '/casos')
    expect(await screen.findByRole('heading', { name: 'Bandeja de casos' })).toBeInTheDocument()
    expect(
      await screen.findByText('32 casos de todos los técnicos · 9 en revisión'),
    ).toBeInTheDocument()
    expect(tab(/Todos/)).toHaveTextContent('32')
    expect(tab(/Pendiente de revisión/)).toHaveTextContent('2')
    expect(tab(/En revisión/)).toHaveTextContent('9')
    expect(tab(/Cerrado/)).toHaveTextContent('14')

    await waitFor(() => expect(filas()).toHaveLength(15))
    expect(filas()[0]).toHaveTextContent('#0241')
    expect(filas()[1]).toHaveTextContent('#0240')
    expect(filas()[1]).toHaveTextContent('Sin asignar')
    expect(screen.getByRole('columnheader', { name: 'Técnico' })).toBeInTheDocument()
    expect(screen.getByText('1–15 de 32 casos · 15 por página')).toBeInTheDocument()
  })

  it('filtra por pestaña, búsqueda y filtros, y lo guarda en la URL', async () => {
    const { router, user } = await renderApp(LIDER, '/casos')
    await waitFor(() => expect(filas()).toHaveLength(15))

    await user.click(tab(/Pendiente de revisión/))
    await waitFor(() => expect(filas()).toHaveLength(2))
    expect(router.state.location.search).toBe('?estado=PENDIENTE_REVISION')

    await user.click(tab(/Todos/))
    await user.type(
      screen.getByRole('searchbox', { name: 'Filtrar por ID, productor o finca' }),
      'Rojas',
    )
    await waitFor(() => expect(filas()).toHaveLength(3))
    expect(router.state.location.search).toBe('?q=Rojas')
    expect(screen.getByText('Búsqueda: Rojas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quitar filtro Búsqueda: Rojas' }))
    await user.click(screen.getByRole('button', { name: /^Filtros/ }))
    await user.selectOptions(await screen.findByLabelText('Vereda'), 'CENTRO')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(filas()).toHaveLength(10))
    expect(router.state.location.search).toBe('?vereda=CENTRO')
    expect(screen.getByText('Vereda: Centro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtros, 1 activo' })).toBeInTheDocument()
  })

  it('valida las fechas del filtro', async () => {
    const { user } = await renderApp(LIDER, '/casos')
    await user.click(await screen.findByRole('button', { name: /^Filtros/ }))
    await user.type(await screen.findByLabelText(/Recibido desde/), '31/02/2026')
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(await screen.findByText('Escribe la fecha como dd/mm/aaaa')).toBeInTheDocument()
  })

  it('muestra el vacío de búsqueda y «Limpiar filtros» lo restablece', async () => {
    const { router, user } = await renderApp(LIDER, '/casos?q=Buenavsta')
    expect(await screen.findByText('No hay resultados para esta búsqueda')).toBeInTheDocument()
    const vacio = screen.getByText('No hay resultados para esta búsqueda').closest('[role=status]')!
    await user.click(within(vacio as HTMLElement).getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(filas()).toHaveLength(15))
    expect(router.state.location.search).toBe('')
  })

  it('pagina desde el servidor', async () => {
    const { router, user } = await renderApp(LIDER, '/casos')
    await waitFor(() => expect(filas()).toHaveLength(15))
    await user.click(screen.getByRole('button', { name: 'Página 3' }))
    await waitFor(() => expect(filas()).toHaveLength(2))
    expect(router.state.location.search).toBe('?page=3')
    expect(screen.getByText('31–32 de 32 casos · 15 por página')).toBeInTheDocument()
  })

  it('asigna un técnico desde el resumen y el caso pasa a En revisión', async () => {
    const { user } = await renderApp(LIDER, '/casos?estado=PENDIENTE_REVISION')
    await waitFor(() => expect(filas()).toHaveLength(2))
    await user.click(
      screen.getByRole('button', { name: /Caso #0240, Pedro Nel Suárez, Pendiente de revisión/ }),
    )

    const dialogo = await screen.findByRole('dialog', { name: /Caso #0240/ })
    expect(within(dialogo).getByText('Pedro Nel Suárez')).toBeInTheDocument()
    expect(within(dialogo).getByText('320 451 7732')).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Asignar técnico' }))

    // Solo cuentas de rol técnico activas: Diana Rincón está deshabilitada y el rol líder no
    // aparece. La cuenta de técnico del líder (D-02) es un técnico más.
    const opciones = await within(dialogo).findAllByRole('radio')
    expect(opciones).toHaveLength(3)
    expect(within(dialogo).queryByText(/Diana/)).not.toBeInTheDocument()
    expect(within(dialogo).queryByText(/líder técnico/i)).not.toBeInTheDocument()
    expect(within(dialogo).getByRole('radio', { name: /Wilmar Torres/ })).toBeInTheDocument()
    expect(
      within(dialogo).getByText('Técnico · 5 casos activos, 5 en revisión'),
    ).toBeInTheDocument()

    await user.click(within(dialogo).getByRole('button', { name: 'Guardar asignación' }))
    expect(
      await within(dialogo).findByText('Elige el técnico que atenderá el caso.'),
    ).toBeInTheDocument()

    await user.click(within(dialogo).getByRole('radio', { name: /Jhon Fredy Sanabria/ }))
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar asignación' }))

    expect(await screen.findByText('Técnico asignado')).toBeInTheDocument()
    expect(screen.getByText('Caso #0240 · Jhon Fredy Sanabria')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(tab(/En revisión/)).toHaveTextContent('10')
  })

  it('el resumen de un caso cerrado solo ofrece abrir el detalle y se cierra con Esc', async () => {
    const { user } = await renderApp(LIDER, '/casos?estado=CERRADO')
    await waitFor(() => expect(filas().length).toBeGreaterThan(0))
    await user.click(screen.getByRole('button', { name: /Caso #0235/ }))
    const dialogo = await screen.findByRole('dialog', { name: /Caso #0235/ })
    expect(within(dialogo).getByRole('link', { name: 'Abrir caso' })).toHaveAttribute(
      'href',
      '/casos/0235',
    )
    expect(
      within(dialogo).queryByRole('button', { name: /signar técnico/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/reabr/i)).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('muestra el error de carga con «Reintentar»', async () => {
    server.use(http.get('/api/v1/casos', () => HttpResponse.json({}, { status: 500 })))
    await renderApp(LIDER, '/casos')
    expect(await screen.findByText('No se pudo cargar la bandeja')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('Bandeja de casos · técnico (12b)', () => {
  it('ve solo sus casos, sin columna de técnico ni asignación', async () => {
    const { user } = await renderApp(TECNICO, '/casos')
    expect(await screen.findByRole('heading', { name: 'Mis casos asignados' })).toBeInTheDocument()
    expect(
      await screen.findByText('Solo ves los 14 casos asignados a ti · 4 en revisión'),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(14))
    expect(screen.queryByRole('columnheader', { name: 'Técnico' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Caso #0241/ }))
    const dialogo = await screen.findByRole('dialog', { name: /Caso #0241/ })
    expect(within(dialogo).getByRole('link', { name: 'Revisar caso' })).toBeInTheDocument()
    expect(
      within(dialogo).queryByRole('button', { name: /signar técnico/ }),
    ).not.toBeInTheDocument()
  })

  it('sin casos en revisión muestra el vacío del técnico', async () => {
    server.use(
      http.get('/api/v1/casos', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, page_size: 15 }),
      ),
    )
    const { user } = await renderApp(TECNICO, '/casos?estado=EN_REVISION')
    expect(await screen.findByText('No tienes casos en revisión')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver todos mis casos' }))
    expect(tab(/Todos/)).toHaveAttribute('aria-selected', 'true')
  })

  it('la búsqueda aclara que solo incluye sus casos', async () => {
    await renderApp(TECNICO, '/casos?q=El%20Recreo')
    expect(
      await screen.findByText(
        'La búsqueda solo incluye tus casos asignados. Los casos de otros técnicos no aparecen.',
      ),
    ).toBeInTheDocument()
  })
})
