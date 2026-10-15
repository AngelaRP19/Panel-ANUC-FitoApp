import { http, HttpResponse } from 'msw'
import { leidasDe, notificacionesDe } from '../fixtures/notificaciones'
import { API, noAutenticado, usuarioActual } from './comun'

const HORA = 3_600_000

export const notificacionesHandlers = [
  // Avisos de los últimos 7 días del usuario de la sesión (cada rol ve los suyos).
  http.get(`${API}/notificaciones`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const leidas = leidasDe(u.id, u.rol)
    const ahora = Date.now()
    const items = notificacionesDe(u.rol).map(({ hace_horas, ...n }) => ({
      ...n,
      en: new Date(ahora - hace_horas * HORA).toISOString(),
      leida: leidas.has(n.id),
    }))
    return HttpResponse.json({ items, nuevas: items.filter((n) => !n.leida).length })
  }),

  // «Marcar como leídas»: todas las del usuario.
  http.post(`${API}/notificaciones/leidas`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const leidas = leidasDe(u.id, u.rol)
    for (const n of notificacionesDe(u.rol)) leidas.add(n.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
