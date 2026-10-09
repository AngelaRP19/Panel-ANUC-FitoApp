import { http, HttpResponse } from 'msw'

const API = '/api/v1'

/** Credenciales de demostración que acepta el mock de login (solo pruebas/desarrollo). */
export const LIDER_DEMO = {
  correo: 'lider@anuc.test',
  password: 'demo1234',
  usuario: {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Líder de demostración',
    correo: 'lider@anuc.test',
    rol: 'LIDER_TECNICO',
  },
}

// Handlers de MSW: permiten avanzar el front mientras no exista cada endpoint.
export const handlers = [
  http.get(`${API}/auth/estado`, () => HttpResponse.json({ existe_lider: true })),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { correo: string; password: string }
    if (body.correo === LIDER_DEMO.correo && body.password === LIDER_DEMO.password) {
      return HttpResponse.json({ access_token: 'token-demo' })
    }
    return HttpResponse.json(
      {
        error: {
          codigo: 'CREDENCIALES_INCORRECTAS',
          mensaje: 'Credenciales incorrectas',
          campos: {},
        },
      },
      { status: 401 },
    )
  }),

  http.get(`${API}/auth/me`, () => HttpResponse.json(LIDER_DEMO.usuario)),
]
