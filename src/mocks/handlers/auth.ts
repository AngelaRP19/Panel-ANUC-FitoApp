import { http, HttpResponse } from 'msw'
import { escenarioActual, fijarEscenario } from '../escenario'
import { aUsuarioMe, usuarios } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'
import { validar } from './usuarios'

const hayLider = () =>
  escenarioActual() !== 'sin-lider' && usuarios.some((u) => u.rol === 'LIDER_TECNICO')

interface CuerpoPrimerLider {
  nombre: string
  correo: string
  celular: string
  password: string
}

export const authHandlers = [
  // ¿Existe ya un líder técnico? Si no, el login lleva a /primer-uso (RQF01).
  http.get(`${API}/auth/estado`, () => HttpResponse.json({ hay_lider: hayLider() })),

  // Registro del primer líder técnico (RQF01). Solo se permite si aún no hay líder.
  http.post(`${API}/auth/primer-lider`, async ({ request }) => {
    if (hayLider()) {
      return errorApi(409, 'LIDER_EXISTENTE', 'El panel ya tiene un líder técnico.')
    }
    const cuerpo = (await request.json()) as CuerpoPrimerLider
    const campos: Record<string, string> = {}
    if (usuarios.some((u) => u.correo.toLowerCase() === cuerpo.correo.toLowerCase())) {
      campos.correo = 'Este correo ya está registrado'
    }
    if (usuarios.some((u) => u.celular === cuerpo.celular)) {
      campos.celular = 'Este número de celular ya está registrado'
    }
    if (Object.keys(campos).length > 0) {
      return errorApi(409, 'DUPLICADO', 'Hay datos que ya están registrados.', campos)
    }
    const nuevo = {
      id: `u-${Date.now()}`,
      nombre: cuerpo.nombre,
      correo: cuerpo.correo,
      celular: cuerpo.celular,
      rol: 'LIDER_TECNICO' as const,
      activo: true,
      contrasena: cuerpo.password,
    }
    usuarios.push(nuevo)
    fijarEscenario('normal')
    return HttpResponse.json(aUsuarioMe(nuevo), { status: 201 })
  }),

  // Usuario de la sesión: define el rol en el panel.
  http.get(`${API}/me`, ({ request }) => {
    const u = usuarioActual(request)
    return u ? HttpResponse.json(aUsuarioMe(u)) : noAutenticado()
  }),

  // Mi cuenta (RQF04): cada usuario edita solo sus datos. El rol no se cambia aquí.
  http.patch(`${API}/me`, async ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const b = (await request.json()) as { nombre?: string; correo?: string; celular?: string }
    const campos = validar({ ...b, rol: u.rol }, u.id)
    if (Object.keys(campos).length) {
      return errorApi(409, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    u.nombre = b.nombre!.trim()
    u.correo = b.correo!.trim().toLowerCase()
    u.celular = b.celular!
    return HttpResponse.json(aUsuarioMe(u))
  }),
]
