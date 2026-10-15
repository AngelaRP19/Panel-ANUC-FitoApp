import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consultas } from '@/mocks/fixtures/consultas'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

const seccionConsultas = () => screen.getByRole('region', { name: 'Consultas guardadas' })

// jsdom no implementa URL.createObjectURL: se captura el archivo descargado.
let archivos: Blob[] = []
const originales = {
  crear: URL.createObjectURL,
  liberar: URL.revokeObjectURL,
  imprimir: window.print,
}
beforeEach(() => {
  archivos = []
  window.print = vi.fn()
  URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
    archivos.push(b as Blob)
    return 'blob:prueba'
  })
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  URL.createObjectURL = originales.crear
  URL.revokeObjectURL = originales.liberar
  window.print = originales.imprimir
})

describe('Reportes · resumen (pantalla 23)', () => {
  it('muestra KPI, los cinco reportes, las secciones y las consultas guardadas', async () => {
    await renderApp(LIDER, '/reportes')
    expect(await screen.findByRole('heading', { level: 1, name: 'Reportes' })).toBeInTheDocument()
    expect(await screen.findByText('Casos recibidos')).toBeInTheDocument()
    for (const k of ['Confirmados', 'Tiempo medio de revisión', 'Alertas del periodo']) {
      expect(screen.getAllByText(k).length).toBeGreaterThan(0)
    }
    const aplicados = screen.getByRole('group', { name: 'Filtros aplicados' })
    expect(aplicados).toHaveTextContent('Periodo:')
    expect(aplicados).toHaveTextContent('Panel de filtros: F1 · filtros generales')

    const enlaces = screen.getAllByRole('link', { name: /^Ver reporte/ })
    expect(enlaces).toHaveLength(5)
    expect(screen.queryByText(/Evidencias y conservación/)).toBeNull()
    expect(screen.getByRole('link', { name: /^Ver reporte\s+Casos y estados$/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/reportes\/casos/),
    )
    for (const t of [
      'Casos por categoría fitosanitaria',
      'Casos recibidos por semana',
      'Casos por vereda',
      'Carga por técnico',
    ]) {
      expect(screen.getByRole('heading', { name: t })).toBeInTheDocument()
    }

    await waitFor(() =>
      expect(
        within(seccionConsultas()).getAllByRole('link', { name: /^Ver resultado/ }),
      ).toHaveLength(consultas.length),
    )
  })

  it('«Ver reporte» abre el reporte con el periodo del resumen', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes?periodo=30d')
    await user.click(
      await screen.findByRole('link', { name: /^Ver reporte\s+Alertas epidemiológicas$/ }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/reportes/alertas'))
    expect(router.state.location.search).toContain('periodo=30d')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Reporte de alertas epidemiológicas' }),
    ).toBeInTheDocument()
  })

  it('el panel F1 aplica filtros a la URL, muestra chips quitables y valida el periodo', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes')
    await screen.findByText('Casos recibidos')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const panel = await screen.findByRole('dialog', { name: 'Filtros generales' })
    expect(await within(panel).findByText(/coinciden con los filtros/)).toBeInTheDocument()

    await user.click(within(panel).getByRole('checkbox', { name: /Trips/ }))
    await user.selectOptions(within(panel).getByLabelText('Resultado técnico'), 'CONFIRMADO')
    expect(within(panel).getByText('2 filtros activos')).toBeInTheDocument()

    // Fechas inválidas: no aplica y avisa.
    const desde = within(panel).getByLabelText(/^Desde/)
    await user.clear(desde)
    await user.type(desde, '31/02/2026')
    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))
    expect(within(panel).getByRole('alert')).toHaveTextContent('dd/mm/aaaa')
    await user.click(within(panel).getByRole('button', { name: 'Últimos 30 días' }))
    await user.click(within(panel).getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.state.location.search).toContain('categoria=TRIPS')
    expect(router.state.location.search).toContain('resultado=CONFIRMADO')
    const aplicados = screen.getByRole('group', { name: 'Filtros aplicados' })
    expect(
      within(aplicados).getByRole('button', { name: 'Filtros, 2 activos' }),
    ).toBeInTheDocument()

    await user.click(within(aplicados).getByRole('button', { name: /^Quitar filtro .*Trips/ }))
    await waitFor(() => expect(router.state.location.search).not.toContain('categoria='))
    expect(router.state.location.search).toContain('resultado=CONFIRMADO')
  })

  it('exporta el resumen en CSV para Excel (punto y coma, tildes) y en PDF (impresión)', async () => {
    const { user } = await renderApp(
      LIDER,
      '/reportes?periodo=personalizado&desde=2026-09-01&hasta=2026-09-30',
    )
    await screen.findByText('Casos recibidos')
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    expect(await screen.findByText('CSV descargado')).toBeInTheDocument()
    const bytes = new Uint8Array(await archivos[0]!.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]) // BOM: Excel lee bien las tildes
    const csv = await archivos[0]!.text()
    expect(csv).toContain('Resumen de reportes\r\n')
    expect(csv).toContain('Periodo;01/09/2026 – 30/09/2026')
    expect(csv).toContain('Indicador;Valor;Detalle')
    expect(csv).toContain('Vereda;Casos;Confirmados')
    expect(csv).toContain('Casos por vereda')

    const tituloAnterior = document.title
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))
    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    const documento = screen.getByRole('document', {
      name: 'Documento para imprimir: Resumen de reportes',
      hidden: true,
    })
    expect(document.title).toBe('Reportes_resumen_septiembre_2026')
    expect(documento).toHaveTextContent('Periodo del 01/09/2026 al 30/09/2026')
    expect(documento).toHaveTextContent('Generado el')
    expect(documento).toHaveTextContent('por Wilmar Torres · líder técnico')
    expect(documento).toHaveTextContent('Casos recibidos')
    expect(documento).toHaveTextContent('Reportes del periodo')
    // Al cerrar el diálogo de impresión se quita el documento y vuelve el título.
    window.dispatchEvent(new Event('afterprint'))
    await waitFor(() => expect(screen.queryByRole('document', { hidden: true })).toBeNull())
    expect(document.title).toBe(tituloAnterior)
  })

  it('guarda los filtros actuales como consulta (F5) y la elimina', async () => {
    const { user } = await renderApp(LIDER, '/reportes?periodo=7d')
    await screen.findByText('Casos recibidos')
    await user.click(screen.getByRole('button', { name: 'Guardar filtros actuales' }))
    const modal = await screen.findByRole('dialog', { name: 'Guardar consulta' })

    await user.click(within(modal).getByRole('button', { name: 'Guardar consulta' }))
    expect(within(modal).getByText('Escribe un nombre de 5 a 60 caracteres.')).toBeInTheDocument()
    await user.type(within(modal).getByLabelText(/Nombre de la consulta/), 'Casos de la semana')
    await user.click(within(modal).getByRole('radio', { name: 'Cada semana' }))
    await user.type(within(modal).getByLabelText(/Enviar a/), 'correo-malo')
    await user.click(within(modal).getByRole('button', { name: 'Guardar consulta' }))
    expect(
      within(modal).getByText('Escribe uno o más correos válidos separados por coma.'),
    ).toBeInTheDocument()
    await user.clear(within(modal).getByLabelText(/Enviar a/))
    await user.type(within(modal).getByLabelText(/Enviar a/), 'lider@anuc.org')
    await user.click(within(modal).getByRole('button', { name: 'Guardar consulta' }))

    expect(await screen.findByText('Consulta guardada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await within(seccionConsultas()).findByText('Casos de la semana')).toBeInTheDocument()

    await user.click(
      within(seccionConsultas()).getByRole('button', { name: 'Eliminar Casos de la semana' }),
    )
    const confirmar = await screen.findByRole('alertdialog')
    await user.click(within(confirmar).getByRole('button', { name: 'Eliminar consulta' }))
    await waitFor(() =>
      expect(within(seccionConsultas()).queryByText('Casos de la semana')).toBeNull(),
    )
  })

  it('«Ver resultado» abre el reporte de la consulta con sus filtros y «CSV» la descarga', async () => {
    const { user, router } = await renderApp(LIDER, '/reportes')
    const nombre = 'Productores con 3 o más casos en el año'
    await screen.findByRole('region', { name: 'Consultas guardadas' })
    await user.click(
      await within(seccionConsultas()).findByRole('button', { name: `Descargar CSV de ${nombre}` }),
    )
    await waitFor(() => expect(archivos).toHaveLength(1))
    expect(await archivos[0]!.text()).toContain('Productores con más casos')

    await user.click(
      within(seccionConsultas()).getByRole('link', { name: `Ver resultado de ${nombre}` }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/reportes/productores'))
    expect(router.state.location.search).toContain('casos_desde=3')
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Reporte de productores, fincas y chatbot',
      }),
    ).toBeInTheDocument()
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/reportes')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
