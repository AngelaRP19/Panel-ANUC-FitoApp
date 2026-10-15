import { http, HttpResponse } from 'msw'
import { alertas } from '../fixtures/alertas'
import { casos } from '../fixtures/casos'
import { leidasDe, notificacionesDe } from '../fixtures/notificaciones'
import { usuarios } from '../fixtures/usuarios'
import { API, noAutenticado, usuarioActual } from './comun'

export const navegacionHandlers = [
  // Contadores de la barra lateral y de la campana. Líder: pendientes sin técnico y alertas
  // generadas sin revisar. Técnico: sus casos en revisión. `lider` sirve para indicarle al
  // técnico a quién pedir un caso.
  http.get(`${API}/resumen/navegacion`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const esLider = u.rol === 'LIDER_TECNICO'
    const lider = usuarios.find((x) => x.rol === 'LIDER_TECNICO' && x.activo)
    return HttpResponse.json({
      casos_pendientes: esLider
        ? casos.filter((c) => c.estado === 'PENDIENTE_REVISION').length
        : casos.filter((c) => c.estado === 'EN_REVISION' && c.tecnico?.id === u.id).length,
      alertas_generadas: alertas.filter((a) => a.estado === 'GENERADA').length,
      notificaciones_nuevas: notificacionesDe(u.rol).filter((n) => !leidasDe(u.id, u.rol).has(n.id))
        .length,
      lider: lider ? { nombre: lider.nombre } : null,
    })
  }),
]
