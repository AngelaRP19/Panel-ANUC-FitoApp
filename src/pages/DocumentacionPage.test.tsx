import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { documentos } from '@/mocks/fixtures/documentos'
import { API } from '@/mocks/handlers/comun'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'

// jsdom no abre pestañas ni crea URL de objetos: se simulan.
const pestana = { location: { href: '' }, close: vi.fn() }
const originales = { crear: URL.createObjectURL, abrir: window.open }
beforeEach(() => {
  pestana.location.href = ''
  URL.createObjectURL = vi.fn(() => 'blob:pdf')
  window.open = vi.fn(() => pestana as unknown as Window)
})
afterEach(() => {
  URL.createObjectURL = originales.crear
  window.open = originales.abrir
})

describe('Documentación fitosanitaria (pantalla 20)', () => {
  it('muestra el manual y una tarjeta por categoría con su propagación', async () => {
    await renderApp(LIDER, '/parametros/documentacion')
    expect(
      await screen.findByRole('heading', { name: 'Documentación fitosanitaria' }),
    ).toBeInTheDocument()
    const migas = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    expect(within(migas).getByRole('link', { name: 'Parámetros epidemiológicos' })).toHaveAttribute(
      'href',
      '/parametros',
    )
    const manual = await screen.findByRole('region', {
      name: 'Manual fitosanitario de pasifloras',
    })
    expect(within(manual).getByText('Libro de referencia')).toBeInTheDocument()
    expect(within(manual).getByRole('link', { name: 'Trips' })).toHaveAttribute(
      'href',
      '#doc-TRIPS',
    )

    const trips = screen.getByRole('article', { name: 'Trips' })
    expect(within(trips).getByText('Participa en alertas')).toBeInTheDocument()
    expect(trips).toHaveTextContent(/Propagación: insecto que pasa de planta en planta/)
    expect(
      within(trips).getByRole('button', { name: /Ficha de Trips: síntomas y propagación · PDF/ }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('article', { name: 'Deficiencia de magnesio' })).getByText(
        'No participa · no se propaga',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('article', { name: 'Botrytis' })).getByText('No participa'),
    ).toBeInTheDocument()
  })

  it('abre los PDF en una pestaña nueva', async () => {
    const { user } = await renderApp(LIDER, '/parametros/documentacion')
    await user.click(await screen.findByRole('button', { name: 'Abrir manual completo (PDF)' }))
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    await waitFor(() => expect(pestana.location.href).toBe('blob:pdf'))
  })

  it('busca y filtra por tipo', async () => {
    const { user } = await renderApp(LIDER, '/parametros/documentacion')
    await screen.findByRole('article', { name: 'Trips' })
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), 'GUIA_MANEJO')
    await waitFor(() => expect(screen.queryByRole('button', { name: /Ficha de Trips/ })).toBeNull())
    expect(
      screen.getByRole('button', { name: /Guía de monitoreo con trampas/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Manual fitosanitario/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en la documentación' }), 'suelo')
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Trips' })).toBeNull())
    expect(screen.getByRole('article', { name: 'Fusarium' })).toBeInTheDocument()
  })

  it('el líder sube un PDF y aparece en su categoría', async () => {
    // jsdom no serializa el FormData multipart hacia MSW: aquí el servidor registra el
    // documento sin leer el cuerpo (en el navegador, el mock sí lee el archivo).
    server.use(
      http.post(`${API}/documentos`, () => {
        const d = {
          id: 'doc-nuevo',
          titulo: 'Protocolo de trampas azules',
          tipo: 'GUIA_MANEJO' as const,
          categoria: 'TRIPS' as const,
          subido_por: 'Wilmar Torres',
          subido_en: new Date().toISOString(),
        }
        documentos.push(d)
        return HttpResponse.json(d, { status: 201 })
      }),
    )
    const { user } = await renderApp(LIDER, '/parametros/documentacion')
    await user.click(await screen.findByRole('button', { name: 'Subir documento' }))
    const dlg = await screen.findByRole('dialog', { name: 'Subir documento' })
    await user.click(within(dlg).getByRole('button', { name: 'Subir documento' }))
    expect(await within(dlg).findByText('Escribe el título del documento.')).toBeInTheDocument()
    expect(within(dlg).getByText('Elige el tipo de documento.')).toBeInTheDocument()
    expect(within(dlg).getByText('Elige el archivo PDF.')).toBeInTheDocument()

    await user.type(within(dlg).getByLabelText(/^Título/), 'Protocolo de trampas azules')
    await user.selectOptions(within(dlg).getByLabelText(/^Tipo de documento/), 'GUIA_MANEJO')
    await user.selectOptions(within(dlg).getByLabelText(/^Categoría fitosanitaria/), 'TRIPS')
    const pdf = new File(['%PDF-1.4'], 'trampas.pdf', { type: 'application/pdf' })
    await user.upload(within(dlg).getByLabelText(/^Archivo/), pdf)
    await user.click(within(dlg).getByRole('button', { name: 'Subir documento' }))

    expect(await screen.findByText('Documento subido')).toBeInTheDocument()
    const trips = screen.getByRole('article', { name: 'Trips' })
    expect(
      await within(trips).findByRole('button', { name: /Protocolo de trampas azules · PDF/ }),
    ).toBeInTheDocument()
    expect(documentos.some((d) => d.titulo === 'Protocolo de trampas azules')).toBe(true)
  })

  it('Parámetros enlaza a la documentación', async () => {
    await renderApp(LIDER, '/parametros')
    expect(await screen.findByRole('link', { name: 'Ir a documentación' })).toHaveAttribute(
      'href',
      '/parametros/documentacion',
    )
  })

  it('el técnico ve «Esta sección es solo para el líder técnico»', async () => {
    await renderApp('tecnico@anuc.test', '/parametros/documentacion')
    expect(
      await screen.findByRole('heading', { name: 'Esta sección es solo para el líder técnico' }),
    ).toBeInTheDocument()
  })
})
