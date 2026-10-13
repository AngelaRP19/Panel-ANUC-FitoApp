import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const filas = () =>
  within(screen.getByRole('table', { name: 'Fincas registradas' }))
    .getAllByRole('row')
    .slice(1)

describe('Fincas y cultivos', () => {
  it('lista las fincas con el resumen del diseño y paginación', async () => {
    await renderApp(LIDER, '/fincas')
    expect(
      await screen.findByText('14 fincas · 19 cultivos · veredas Juracambita, Centro y San Luis'),
    ).toBeInTheDocument()
    await waitFor(() => expect(filas()).toHaveLength(10))
    expect(filas()[0]).toHaveTextContent('Buenavista · Juracambita')
    expect(filas()[0]).toHaveTextContent('Gloria Patiño')
    expect(filas()[0]).toHaveTextContent('1 cultivo')
    expect(screen.getByText('1–10 de 14 fincas · 10 por página')).toBeInTheDocument()
  })

  it('filtra por vereda, tipo de cultivo y búsqueda', async () => {
    const { router, user } = await renderApp(LIDER, '/fincas')
    await waitFor(() => expect(filas()).toHaveLength(10))
    await user.selectOptions(screen.getByLabelText('Vereda'), 'CENTRO')
    await waitFor(() => expect(filas()).toHaveLength(4))
    expect(router.state.location.search).toBe('?vereda=CENTRO')

    await user.selectOptions(screen.getByLabelText('Vereda'), '')
    await user.selectOptions(screen.getByLabelText('Tipo de cultivo'), 'INVERNADERO')
    await waitFor(() => expect(filas()).toHaveLength(2))

    await user.selectOptions(screen.getByLabelText('Tipo de cultivo'), '')
    await user.type(screen.getByRole('searchbox', { name: 'Buscar finca o productor' }), 'Rojas')
    await waitFor(() => expect(filas()[0]).toHaveTextContent('El Porvenir'))
    expect(filas()).toHaveLength(1)
  })

  it('muestra la ficha con coordenadas, mapa y cultivos', async () => {
    const { user } = await renderApp(LIDER, '/fincas?vereda=JURACAMBITA')
    await waitFor(() => expect(filas().length).toBeGreaterThan(0))
    await user.click(
      screen.getByRole('button', { name: 'Finca El Porvenir, María Rojas Cárdenas. Ver datos' }),
    )
    const ficha = await screen.findByRole('dialog', { name: 'El Porvenir' })
    expect(within(ficha).getByText('Vereda Juracambita')).toBeInTheDocument()
    expect(within(ficha).getByText('5.2481, -73.1702')).toBeInTheDocument()
    expect(
      within(ficha).getByRole('img', {
        name: 'Ubicación de la finca El Porvenir en 5.2481, -73.1702',
      }),
    ).toBeInTheDocument()
    expect(within(ficha).getByText('Invernadero · gulupa y granadilla')).toBeInTheDocument()
    expect(within(ficha).getByText('Campo abierto · gulupa')).toBeInTheDocument()
    expect(
      within(ficha).getByRole('link', { name: /Ver en el mapa de vigilancia/ }),
    ).toHaveAttribute('href', '/mapa?finca=f-el-porvenir')
  })

  it('al quitar una especie en uso avisa y permite guardar de todas formas (09b)', async () => {
    const { user } = await renderApp(LIDER, '/fincas?finca=f-el-porvenir')
    const ficha = await screen.findByRole('dialog', { name: 'El Porvenir' })
    await user.click(within(ficha).getByRole('button', { name: 'Editar finca' }))
    const form = await screen.findByRole('dialog', { name: /Editar finca/ })
    expect(within(form).getByLabelText(/^Latitud/)).toHaveValue('5.2481')

    const especies = within(form).getByRole('group', { name: 'Especies de «Invernadero norte»' })
    await user.click(within(especies).getByRole('checkbox', { name: 'Granadilla' }))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await within(form).findByText('Granadilla se usa en el caso activo #0230.'),
    ).toBeInTheDocument()
    expect(
      within(form).getByText(/el chatbot ya no la ofrecerá para este cultivo/),
    ).toBeInTheDocument()

    await user.click(within(form).getByRole('button', { name: 'Guardar de todas formas' }))
    expect(await screen.findByText('Finca actualizada')).toBeInTheDocument()
    const fichaNueva = await screen.findByRole('dialog', { name: 'El Porvenir' })
    expect(within(fichaNueva).getByText('Invernadero · gulupa')).toBeInTheDocument()
  })

  it('valida especies, longitud y advierte la latitud fuera de rango', async () => {
    const { user } = await renderApp(LIDER, '/fincas?finca=f-buenavista')
    const ficha = await screen.findByRole('dialog', { name: 'Buenavista' })
    await user.click(within(ficha).getByRole('button', { name: 'Editar finca' }))
    const form = await screen.findByRole('dialog', { name: /Editar finca/ })

    const lat = within(form).getByLabelText(/^Latitud/)
    await user.clear(lat)
    await user.type(lat, '4.9001')
    expect(within(form).getByText('Revisa la latitud.')).toBeInTheDocument()

    const lng = within(form).getByLabelText(/^Longitud/)
    await user.clear(lng)
    await user.type(lng, '73.1745')
    await user.click(within(form).getByRole('checkbox', { name: 'Maracuyá' }))
    await user.click(within(form).getByRole('button', { name: 'Guardar cambios' }))
    expect(
      await within(form).findByText('La longitud lleva signo menos · ej. -73.1702'),
    ).toBeInTheDocument()
    expect(within(form).getByText('Selecciona al menos una especie')).toBeInTheDocument()
  })

  it('registra una finca para un productor activo y le agrega un cultivo', async () => {
    const { user } = await renderApp(LIDER, '/fincas')
    await user.click(await screen.findByRole('button', { name: 'Registrar finca' }))
    const form = await screen.findByRole('dialog', { name: /Registrar finca/ })
    const productor = within(form).getByLabelText(/^Productor/)
    await within(productor).findByRole('option', { name: 'María Rojas Cárdenas' })
    // Jairo Niño está deshabilitado: no aparece.
    expect(within(productor).queryByRole('option', { name: 'Jairo Niño' })).not.toBeInTheDocument()

    await user.click(within(form).getByRole('button', { name: 'Registrar finca' }))
    expect(await within(form).findByText('Selecciona el productor.')).toBeInTheDocument()

    await user.selectOptions(productor, 'p-ernesto-gomez')
    await user.type(within(form).getByLabelText(/^Nombre de la finca/), 'La Esmeralda')
    await user.selectOptions(within(form).getByLabelText(/^Vereda/), 'JURACAMBITA')
    await user.type(within(form).getByLabelText(/^Latitud/), '5.2501')
    await user.type(within(form).getByLabelText(/^Longitud/), '-73.1720')
    await user.click(within(form).getByRole('button', { name: 'Registrar finca' }))
    expect(await screen.findByText('Finca registrada')).toBeInTheDocument()

    const ficha = await screen.findByRole('dialog', { name: 'La Esmeralda' })
    expect(within(ficha).getByText(/aún no tiene cultivos/)).toBeInTheDocument()
    await user.click(within(ficha).getByRole('button', { name: 'Agregar cultivo' }))
    const cultivo = await screen.findByRole('dialog', { name: 'Agregar cultivo' })
    await user.click(within(cultivo).getByRole('button', { name: 'Agregar cultivo' }))
    expect(await within(cultivo).findByText('Escribe el nombre del cultivo.')).toBeInTheDocument()
    expect(within(cultivo).getByText('Selecciona al menos una especie')).toBeInTheDocument()

    await user.type(within(cultivo).getByLabelText(/^Nombre del cultivo/), 'Lote alto')
    await user.click(within(cultivo).getByRole('radio', { name: 'Campo abierto' }))
    await user.click(within(cultivo).getByRole('checkbox', { name: 'Gulupa' }))
    await user.click(within(cultivo).getByRole('button', { name: 'Agregar cultivo' }))
    expect(await screen.findByText('Cultivo agregado')).toBeInTheDocument()
    const fichaFinal = await screen.findByRole('dialog', { name: 'La Esmeralda' })
    expect(await within(fichaFinal).findByText('Campo abierto · gulupa')).toBeInTheDocument()
  })

  it('filtra por productor desde la ficha del productor (?productor=)', async () => {
    const { user } = await renderApp(LIDER, '/fincas?productor=p-maria-rojas')
    await waitFor(() => expect(filas()).toHaveLength(1))
    expect(await screen.findByText('Productor: María Rojas Cárdenas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtro de productor' }))
    await waitFor(() => expect(filas()).toHaveLength(10))
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/fincas')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
