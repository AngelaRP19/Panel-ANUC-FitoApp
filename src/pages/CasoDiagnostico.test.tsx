import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { adaptadorSimulado } from '@/mocks/authSimulado'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const LIDER = 'lider@anuc.test'
const TECNICO = 'tecnico@anuc.test'

const panel = () => screen.getByRole('region', { name: /diagnóstico técnico/i })

describe('Diagnóstico técnico y cierre', () => {
  it('valida el resultado y los campos condicionales sin vaciar el formulario', async () => {
    const { user } = await renderApp(TECNICO, '/casos/0241')
    await screen.findByRole('heading', { name: 'Registrar diagnóstico técnico' })
    // En revisión no hay «Cerrar caso»: primero se registra el diagnóstico (D-22).
    expect(screen.queryByRole('button', { name: /Cerrar caso/ })).toBeNull()
    expect(
      screen.getByText(
        /Al guardar, el caso pasa a Registrado: el diagnóstico ya no se puede editar/,
      ),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Descripción'), 'Moho gris en frutos.')
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))
    expect(await screen.findByText('Selecciona un resultado técnico.')).toBeInTheDocument()
    expect(screen.getByText('No se guardó el diagnóstico.')).toBeInTheDocument()
    expect(screen.getByText('Revisa el campo marcado.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Otra patología/ }))
    const categoria = screen.getByLabelText(/Categoría fitosanitaria determinada/)
    // La categoría sugerida (Botrytis) no se ofrece como «otra patología».
    expect(within(categoria).queryByRole('option', { name: 'Botrytis' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))
    expect(
      await screen.findByText('Selecciona la categoría fitosanitaria que determinaste.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Requiere visita/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))
    expect(await screen.findByText('Escribe el motivo de la visita.')).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción')).toHaveValue('Moho gris en frutos.')
  })

  it('guarda el diagnóstico (Registrado): queda en solo lectura y solo se puede cerrar (D-22)', async () => {
    const { user } = await renderApp(TECNICO, '/casos/0241')
    await user.click(await screen.findByRole('radio', { name: /Confirmado/ }))
    expect(
      screen.getByText('La identificación preliminar (Botrytis) es correcta.'),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Descripción'), 'Moho gris en el interior del fruto.')
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))

    expect(await screen.findByText('Diagnóstico guardado')).toBeInTheDocument()
    expect(screen.getByText('Caso #0241 · ya puedes cerrar el caso.')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' }),
    ).toBeInTheDocument()
    expect(within(panel()).getByText('Confirmado: Botrytis')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar diagnóstico' })).toBeNull()
    const cerrar = within(panel()).getByRole('button', { name: /Cerrar caso/ })
    expect(cerrar).toBeEnabled()
    expect(
      screen.getByText(/El diagnóstico registrado ya no se edita\. Al cerrar, se fija/),
    ).toBeInTheDocument()

    await user.click(cerrar)
    expect(await screen.findByText('Caso cerrado')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar diagnóstico' })).not.toBeInTheDocument()
    expect(screen.getByText('Moho gris en el interior del fruto.')).toBeInTheDocument()
    expect(screen.getByText(/faltan \d+ días/)).toBeInTheDocument()
    expect(screen.queryByText(/reabrir/i)).not.toBeInTheDocument()
  })

  it('D-22: el técnico ve su caso Registrado en solo lectura y solo puede cerrarlo (#0230)', async () => {
    await renderApp(TECNICO, '/casos/0230')
    expect(
      await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Registrar diagnóstico técnico' })).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar diagnóstico' })).toBeNull()
    expect(within(panel()).getByRole('button', { name: /Cerrar caso/ })).toBeEnabled()
  })

  it('D-22: el líder no puede reasignar un caso Registrado (#0230)', async () => {
    await renderApp(LIDER, '/casos/0230')
    await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' })
    expect(screen.queryByRole('button', { name: /Reasignar técnico/ })).toBeNull()
    expect(within(panel()).getByRole('button', { name: /Cerrar caso/ })).toBeEnabled()
  })

  it('D-22: la API responde 409 al volver a guardar el diagnóstico o reasignar en Registrado', async () => {
    const llamar = async (metodo: string, ruta: string, cuerpo: unknown) => {
      const r = await fetch(`/api/v1${ruta}`, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await adaptadorSimulado.obtenerToken()}`,
        },
        body: JSON.stringify(cuerpo),
      })
      return { status: r.status, cuerpo: (await r.json()) as { error: { codigo: string } } }
    }

    await renderApp(TECNICO, '/casos/0230')
    await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' })
    const diag = await llamar('POST', '/casos/0230/diagnostico', {
      resultado_tecnico: 'NO_IDENTIFICADO',
    })
    expect(diag.status).toBe(409)
    expect(diag.cuerpo.error.codigo).toBe('TRANSICION_INVALIDA')
    cleanup()

    await renderApp(LIDER, '/casos/0230')
    await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' })
    const asig = await llamar('PATCH', '/casos/0230/asignacion', { tecnico_id: 'u-jhon' })
    expect(asig.status).toBe(409)
    expect(asig.cuerpo.error.codigo).toBe('TRANSICION_INVALIDA')
  })

  it('identificación ambigua: no ofrece «Confirmado» y permite cualquier categoría (P-04)', async () => {
    const { user } = await renderApp(TECNICO, '/casos/0239')
    await screen.findByRole('heading', { name: 'Registrar diagnóstico técnico' })
    expect(screen.queryByRole('radio', { name: /Confirmado/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Otra patología/ }))
    const categoria = screen.getByLabelText(/Categoría fitosanitaria determinada/)
    expect(within(categoria).getByRole('option', { name: 'Botrytis' })).toBeInTheDocument()
    expect(within(categoria).getByRole('option', { name: 'Roña' })).toBeInTheDocument()
  })

  it('D-02: el líder no ve el formulario; sin diagnóstico ve el aviso (pendiente y en revisión)', async () => {
    for (const id of ['0240', '0241']) {
      await renderApp(LIDER, `/casos/${id}`)
      expect(
        await screen.findByText('Solo el técnico asignado registra el diagnóstico.'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Registrar diagnóstico técnico' })).toBeNull()
      expect(screen.queryByRole('radio')).toBeNull()
      expect(screen.queryByText('Técnico responsable')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Guardar diagnóstico' })).toBeNull()
      cleanup()
    }
  })

  it('D-02: el líder ve el diagnóstico registrado en solo lectura y puede cerrar el caso', async () => {
    const { user } = await renderApp(LIDER, '/casos/0230')
    expect(
      await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar diagnóstico' })).toBeNull()
    expect(within(panel()).getByText('Ana Lucía Becerra', { exact: false })).toBeInTheDocument()
    await user.click(within(panel()).getByRole('button', { name: /Cerrar caso/ }))
    expect(await screen.findByText('Caso cerrado')).toBeInTheDocument()
    await waitFor(() => expect(within(panel()).queryByRole('button')).toBeNull())
  })

  it('D-02: si el líder intenta registrar un diagnóstico, la API responde 403', async () => {
    await renderApp(LIDER, '/casos/0241')
    await screen.findByText('Solo el técnico asignado registra el diagnóstico.')
    const r = await fetch('/api/v1/casos/0241/diagnostico', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await adaptadorSimulado.obtenerToken()}`,
      },
      body: JSON.stringify({ resultado_tecnico: 'NO_IDENTIFICADO' }),
    })
    expect(r.status).toBe(403)
  })

  it('el técnico ve el responsable fijo, sin selector, y puede guardar su diagnóstico', async () => {
    const { user } = await renderApp(TECNICO, '/casos/0241')
    expect(
      await screen.findByText('Ana Lucía Becerra (tú)', { selector: 'div' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Solo el líder técnico puede reasignar el caso.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Técnico responsable/ })).toBeNull()
    await user.click(screen.getByRole('radio', { name: /No identificado/ }))
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))
    expect(await screen.findByText('Diagnóstico guardado')).toBeInTheDocument()
  })

  it('sin conexión conserva lo escrito y permite reintentar', async () => {
    server.use(http.post('/api/v1/casos/:id/diagnostico', () => HttpResponse.error()))
    const { user } = await renderApp(TECNICO, '/casos/0241')
    await user.click(await screen.findByRole('radio', { name: /No identificado/ }))
    await user.type(screen.getByLabelText('Descripción'), 'Texto que no se debe perder.')
    await user.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }))
    expect(await screen.findByText('Se perdió la conexión.')).toBeInTheDocument()
    expect(screen.getByText(/Tu diagnóstico escrito no se ha perdido/)).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción')).toHaveValue('Texto que no se debe perder.')
    expect(sessionStorage.getItem('anuc.borrador-diagnostico.0241')).toContain(
      'Texto que no se debe perder.',
    )
    expect(within(panel()).getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
  })

  it('recupera el borrador al volver a abrir el caso', async () => {
    sessionStorage.setItem(
      'anuc.borrador-diagnostico.0241',
      JSON.stringify({
        resultado: 'REQUIERE_VISITA',
        categoria: '',
        motivo: 'Revisar el interior del fruto.',
        descripcion: 'Borrador anterior.',
        observaciones: '',
        responsable: 'u-ana',
        eligeResponsable: false,
      }),
    )
    await renderApp(TECNICO, '/casos/0241')
    expect(await screen.findByLabelText(/Motivo de la visita/)).toHaveValue(
      'Revisar el interior del fruto.',
    )
    expect(screen.getByLabelText('Descripción')).toHaveValue('Borrador anterior.')
  })

  it('un caso cerrado muestra el diagnóstico en solo lectura (04c)', async () => {
    await renderApp(LIDER, '/casos/0226')
    expect(
      await screen.findByRole('heading', { name: 'Diagnóstico técnico registrado' }),
    ).toBeInTheDocument()
    expect(within(panel()).getByText('No identificado')).toBeInTheDocument()
    expect(within(panel()).getByText(/Se descarta Fusarium/)).toBeInTheDocument()
    expect(within(panel()).getByText('22 sep 2026 · 09:58')).toBeInTheDocument()
    expect(within(panel()).queryByRole('button')).not.toBeInTheDocument()
  })
})
