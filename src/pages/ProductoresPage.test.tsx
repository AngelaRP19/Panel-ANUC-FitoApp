import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const filas = () =>
  within(screen.getByRole('table', { name: 'Productores registrados' }))
    .getAllByRole('row')
    .slice(1)

describe('Productores', () => {
  it('lista los productores con resumen, orden alfabético y filas por página', async () => {
    const { user } = await renderApp(LIDER, '/productores')
    expect(
      await screen.findByRole('heading', { name: 'Productores', level: 1 }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(
        '14 productores · 13 activos · el chatbot los reconoce por su número de WhatsApp',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(10))
    expect(filas()[0]).toHaveTextContent('Ana Beatriz Vargas')
    expect(filas()[0]).toHaveTextContent('317 145 8803')
    expect(screen.getByText('1–10 de 14 productores · 10 por página')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filas por página'), '25')
    await waitFor(() => expect(filas()).toHaveLength(14))
  })

  it('busca por nombre o celular y filtra por estado con chips', async () => {
    const { router, user } = await renderApp(LIDER, '/productores')
    await waitFor(() => expect(filas()).toHaveLength(10))
    const buscar = screen.getByRole('searchbox', { name: 'Buscar productor' })
    await user.type(buscar, 'Rojas')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(router.state.location.search).toBe('?q=Rojas')

    await user.clear(buscar)
    await user.type(buscar, '322 518')
    // La fila anterior (búsqueda «Rojas») sigue visible mientras corre el debounce.
    await waitFor(() => expect(filas()[0]).toHaveTextContent('Ernesto Gómez Ruiz'))
    expect(filas()).toHaveLength(1)
    await user.clear(buscar)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Estado del productor'), 'deshabilitado')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(filas()[0]).toHaveTextContent('Jairo Niño')
    expect(filas()[0]).toHaveTextContent('Deshabilitado')
    expect(screen.getByText('Estado: Deshabilitado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtros, 1 activo' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Vereda'), 'SAN_LUIS')
    expect(await screen.findByText('Ningún productor coincide con los filtros')).toBeInTheDocument()
    const vacio = screen
      .getByText('Ningún productor coincide con los filtros')
      .closest('[role=status]')!
    await user.click(within(vacio as HTMLElement).getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(filas()).toHaveLength(10))
  })

  it('abre la ficha y desactiva con confirmación (cancelar no cambia nada)', async () => {
    const { user } = await renderApp(LIDER, '/productores')
    await waitFor(() => expect(filas()).toHaveLength(10))
    await user.click(
      screen.getByRole('button', { name: 'María Rojas Cárdenas, activo. Ver datos' }),
    )

    const ficha = await screen.findByRole('dialog', { name: /María Rojas Cárdenas/ })
    expect(within(ficha).getByText('310 482 1937')).toBeInTheDocument()
    expect(within(ficha).getByText('El Porvenir')).toBeInTheDocument()
    expect(within(ficha).getByText('3 casos en el último año')).toBeInTheDocument()
    expect(within(ficha).getByText('Productor desde mar 2026')).toBeInTheDocument()
    expect(within(ficha).getByRole('link', { name: 'Ver fincas' })).toHaveAttribute(
      'href',
      '/fincas?productor=p-maria-rojas',
    )

    await user.click(
      within(ficha).getByRole('switch', { name: 'Desactivar a María Rojas Cárdenas' }),
    )
    const confirmar = await screen.findByRole('alertdialog', {
      name: '¿Desactivar a María Rojas Cárdenas?',
    })
    expect(
      within(confirmar).getByText(/El chatbot dejará de atender el número/),
    ).toBeInTheDocument()
    await user.click(within(confirmar).getByRole('button', { name: 'Cancelar' }))
    const fichaDeNuevo = await screen.findByRole('dialog', { name: /María Rojas Cárdenas/ })
    expect(within(fichaDeNuevo).getByRole('switch')).toBeChecked()

    await user.click(within(fichaDeNuevo).getByRole('switch'))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Desactivar productor',
      }),
    )
    expect(await screen.findByText('María Rojas Cárdenas quedó deshabilitado')).toBeInTheDocument()
    expect(screen.getByText('El cambio queda en el registro de actividad.')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(screen.getByRole('dialog')).getByRole('switch')).not.toBeChecked(),
    )
  })

  it('registra un productor y valida el celular duplicado', async () => {
    const { user } = await renderApp(LIDER, '/productores')
    await user.click(await screen.findByRole('button', { name: 'Registrar productor' }))
    const form = await screen.findByRole('dialog', { name: 'Registrar productor' })
    await user.click(within(form).getByRole('button', { name: 'Registrar productor' }))
    expect(
      await within(form).findByText('Escribe el nombre completo del productor.'),
    ).toBeInTheDocument()

    await user.type(within(form).getByLabelText(/^Nombre completo/), 'Camilo Torres')
    await user.type(within(form).getByLabelText(/^Teléfono de WhatsApp/), '310 482 1937')
    await user.click(within(form).getByRole('button', { name: 'Registrar productor' }))
    expect(
      await within(form).findByText('Este número de celular ya está registrado'),
    ).toBeInTheDocument()
    expect(within(form).getByLabelText(/^Nombre completo/)).toHaveValue('Camilo Torres')

    const tel = within(form).getByLabelText(/^Teléfono de WhatsApp/)
    await user.clear(tel)
    await user.type(tel, '3220001111')
    await user.click(within(form).getByRole('button', { name: 'Registrar productor' }))
    expect(await screen.findByText('Productor registrado')).toBeInTheDocument()
    expect(screen.getByText('El chatbot ya reconoce el número 322 000 1111.')).toBeInTheDocument()
    expect(await screen.findByText(/^15 productores · 14 activos/)).toBeInTheDocument()
  })

  it('edita desde la ficha y pide confirmar si se deshabilita', async () => {
    const { user } = await renderApp(LIDER, '/productores?productor=p-hernan-fonseca')
    const ficha = await screen.findByRole('dialog', { name: /Hernán Fonseca/ })
    await user.click(within(ficha).getByRole('button', { name: 'Editar datos' }))
    const form = await screen.findByRole('dialog', { name: 'Editar productor' })
    expect(within(form).getByLabelText(/^Teléfono de WhatsApp/)).toHaveValue('315 802 3360')

    await user.click(within(form).getByRole('switch', { name: 'Productor activo' }))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await screen.findByRole('alertdialog', { name: '¿Desactivar a Hernán Fonseca?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desactivar productor' }))
    expect(await screen.findByText('Datos del productor actualizados')).toBeInTheDocument()
  })

  it('abre la ficha desde un enlace (?productor=) para un productor sin casos', async () => {
    await renderApp(LIDER, '/productores?productor=p-ernesto-gomez')
    const ficha = await screen.findByRole('dialog', { name: /Ernesto Gómez Ruiz/ })
    expect(within(ficha).getByText('Aún sin casos')).toBeInTheDocument()
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/productores')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
