import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { casos } from '@/mocks/fixtures/casos'
import { productores } from '@/mocks/fixtures/productores'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

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

const CASOS: [string, string, string, string, string][] = [
  ['casos', 'Reporte de casos', 'Recibidos', 'Casos por estado', 'F1'],
  [
    'identificacion',
    'Identificación preliminar y diagnóstico técnico',
    'Con identificación preliminar',
    'Preliminar frente a resultado técnico',
    'F1',
  ],
  [
    'alertas',
    'Reporte de alertas epidemiológicas',
    'Alertas generadas',
    'Alertas por estado',
    'F2',
  ],
  [
    'productores',
    'Reporte de productores, fincas y chatbot',
    'Conversaciones',
    'Uso del chatbot de WhatsApp',
    'F3',
  ],
  [
    'tecnicos',
    'Reporte de técnicos y carga de trabajo',
    'Casos asignados',
    'Carga por técnico',
    'F4',
  ],
]

describe('Reportes R1-R5 (pantalla 24)', () => {
  it.each(CASOS)(
    '/reportes/%s muestra título, KPI, secciones y su panel',
    async (tipo, titulo, kpi, seccion, panel) => {
      await renderApp(LIDER, `/reportes/${tipo}`)
      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeInTheDocument()
      expect(await screen.findByText(kpi)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: seccion })).toBeInTheDocument()
      const migas = screen.getByRole('navigation', { name: 'Ruta de navegación' })
      expect(within(migas).getByRole('link', { name: 'Reportes' })).toHaveAttribute(
        'href',
        '/reportes',
      )
      expect(screen.getByRole('group', { name: 'Filtros aplicados' })).toHaveTextContent(
        `Panel de filtros: ${panel}`,
      )
    },
  )

  it('las barras se pueden ver como tabla', async () => {
    const { user } = await renderApp(LIDER, '/reportes/casos')
    const seccion = await screen.findByRole('region', { name: 'Casos por estado' })
    expect(within(seccion).getByRole('img')).toHaveAccessibleName(/^Casos por estado: /)
    await user.click(within(seccion).getByRole('button', { name: 'Ver como tabla' }))
    expect(within(seccion).getByRole('table')).toBeInTheDocument()
    expect(within(seccion).getByRole('button', { name: 'Ver como gráfica' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('la tabla principal enlaza cada caso con su detalle', async () => {
    await renderApp(LIDER, '/reportes/casos')
    const tabla = await screen.findByRole('table', { name: 'Casos del periodo' })
    const enlace = within(tabla).getAllByRole('link')[0]!
    expect(enlace).toHaveAttribute('href', expect.stringMatching(/^\/casos\//))
  })

  it('el panel F2 de alertas filtra por estado y el chip se puede quitar', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes/alertas')
    await screen.findByText('Alertas generadas')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros de alertas' })
    // Solo Trips participa en las alertas: las demás categorías están deshabilitadas.
    expect(within(panel).getByRole('checkbox', { name: /Trips/ })).toBeDisabled()
    await user.click(within(panel).getByRole('checkbox', { name: 'Confirmada' }))
    await user.click(within(panel).getByRole('radio', { name: 'Solo comunicadas' }))
    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.state.location.search).toContain('estado_alerta=CONFIRMADA')
    expect(router.state.location.search).toContain('comunicada=si')

    const aplicados = screen.getByRole('group', { name: 'Filtros aplicados' })
    await user.click(within(aplicados).getByRole('button', { name: /^Quitar filtro .*Confirmada/ }))
    await waitFor(() => expect(router.state.location.search).not.toContain('estado_alerta='))
  })

  it('«Limpiar todo» vuelve al periodo de este año sin filtros', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes/tecnicos?periodo=7d&rol=TECNICO')
    await screen.findByText('Casos asignados')
    await user.click(screen.getByRole('button', { name: 'Filtros, 1 activos' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros de técnicos' })
    await user.click(within(panel).getByRole('button', { name: 'Limpiar todo' }))
    expect(within(panel).getByText('0 filtros activos')).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(router.state.location.search).not.toContain('rol='))
    expect(router.state.location.search).toContain('periodo=anio')
  })

  it('exporta el reporte en CSV con la tabla principal y en PDF', async () => {
    const { user } = await renderApp(LIDER, '/reportes/casos')
    await screen.findByText('Recibidos')
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(await screen.findByText('CSV descargado')).toBeInTheDocument()
    expect(archivos[0]!.type).toContain('text/csv')
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))
    expect(await screen.findByText('PDF descargado')).toBeInTheDocument()
    expect(archivos[1]!.type).toBe('application/pdf')
  })

  it('desde el panel se guarda la consulta con el reporte elegido', async () => {
    const { user } = await renderApp(LIDER, '/reportes/productores')
    await screen.findByText('Conversaciones')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros de productores' })
    await user.type(within(panel).getByLabelText('Casos en el periodo, desde'), '2')
    await user.click(within(panel).getByRole('button', { name: 'Guardar consulta' }))
    const modal = await screen.findByRole('dialog', { name: 'Guardar consulta' })
    expect(within(modal).getByLabelText(/^Reporte/)).toHaveValue('productores')
    await user.type(
      within(modal).getByLabelText(/Nombre de la consulta/),
      'Productores con 2 casos',
    )
    await user.click(within(modal).getByRole('button', { name: 'Guardar consulta' }))
    expect(await screen.findByText('Consulta guardada')).toBeInTheDocument()
  })

  it('F1 elige productores en una ventana con casillas (sin filtros de fotos ni conservación)', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes/casos')
    await screen.findByText('Recibidos')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros generales' })
    expect(within(panel).queryByLabelText('Vencimiento de conservación')).toBeNull()
    expect(within(panel).queryByLabelText('Fotos útiles')).toBeNull()

    await user.click(within(panel).getByRole('button', { name: 'Elegir productores' }))
    const ventana = await screen.findByRole('dialog', { name: 'Elegir productores' })
    const listaProductores = await within(ventana).findByRole('list', { name: 'Productores' })
    expect(within(listaProductores).getAllByRole('checkbox')).toHaveLength(productores.length)

    // Búsqueda sin tildes y casillas.
    const [a, b] = [
      casos[0]!.productor,
      casos.find((c) => c.productor.id !== casos[0]!.productor.id)!.productor,
    ]
    await user.type(
      within(ventana).getByRole('searchbox', { name: 'Buscar productor' }),
      a.nombre.split(' ')[0]!.normalize('NFD').replace(/[̀-ͯ]/g, ''),
    )
    await user.click(within(ventana).getByRole('checkbox', { name: new RegExp(`^${a.nombre}`) }))
    await user.clear(within(ventana).getByRole('searchbox', { name: 'Buscar productor' }))
    await user.click(within(ventana).getByRole('checkbox', { name: new RegExp(`^${b.nombre}`) }))
    expect(within(ventana).getByText('2 productores marcados')).toBeInTheDocument()
    await user.click(within(ventana).getByRole('button', { name: 'Usar selección' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Elegir productores' })).toBeNull(),
    )
    const elegidos = within(panel).getByRole('list', { name: 'Productores elegidos' })
    expect(elegidos).toHaveTextContent(a.nombre)
    expect(elegidos).toHaveTextContent(b.nombre)
    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(router.state.location.search).toContain('productor='))
    expect(decodeURIComponent(router.state.location.search)).toContain(`${a.id},${b.id}`)
    expect(screen.getByRole('group', { name: 'Filtros aplicados' })).toHaveTextContent(
      'Productores: 2 elegidos',
    )
    const tabla = await screen.findByRole('table', { name: 'Casos del periodo' })
    await waitFor(() => {
      const filas = within(tabla).getAllByRole('row').slice(1)
      for (const f of filas)
        expect([a.nombre, b.nombre].some((n) => f.textContent?.includes(n))).toBe(true)
    })
  })

  it('las fechas del periodo se eligen en el calendario (ratón y teclado)', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes/casos')
    await screen.findByText('Recibidos')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros generales' })
    const desde = within(panel).getByLabelText(/^Desde/)
    const anio = (desde as HTMLInputElement).value.slice(6)

    await user.click(within(panel).getAllByRole('button', { name: /^Elegir fecha/ })[0]!)
    const calendario = await screen.findByRole('dialog', { name: 'Calendario' })
    expect(within(calendario).getByRole('grid', { name: `enero ${anio}` })).toBeInTheDocument()
    await user.click(within(calendario).getByRole('button', { name: 'Mes siguiente' }))
    await user.click(within(calendario).getByRole('button', { name: `15 de febrero de ${anio}` }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Calendario' })).toBeNull())
    expect(desde).toHaveValue(`15/02/${anio}`)
    expect(within(panel).getByRole('button', { name: 'Personalizado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Teclado: al abrir, el foco está en el día elegido; la flecha derecha pasa al siguiente.
    await user.click(within(panel).getAllByRole('button', { name: /^Elegir fecha/ })[0]!)
    await screen.findByRole('dialog', { name: 'Calendario' })
    await waitFor(() =>
      expect(document.activeElement).toHaveAccessibleName(`15 de febrero de ${anio}`),
    )
    await user.keyboard('{ArrowRight}{Enter}')
    expect(desde).toHaveValue(`16/02/${anio}`)

    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(router.state.location.search).toContain(`desde=${anio}-02-16`))
  })

  it('un reporte que no existe muestra un aviso', async () => {
    await renderApp(LIDER, '/reportes/otro')
    expect(await screen.findByText('Ese reporte no existe')).toBeInTheDocument()
  })
})
