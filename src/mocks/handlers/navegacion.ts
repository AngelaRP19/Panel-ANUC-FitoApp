import { http, HttpResponse } from 'msw'
import { casos } from '../fixtures/casos'
import { API, noAutenticado, usuarioActual } from './comun'

export const navegacionHandlers = [
  // Contadores de la barra lateral. Líder: pendientes sin técnico y alertas generadas sin
  // revisar. Técnico: sus casos en revisión.
  http.get(`${API}/resumen/navegacion`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const esLider = u.rol === 'LIDER_TECNICO'
    return HttpResponse.json({
      casos_pendientes: esLider
        ? casos.filter((c) => c.estado === 'PENDIENTE_REVISION').length
        : casos.filter((c) => c.estado === 'EN_REVISION' && c.tecnico?.id === u.id).length,
      alertas_generadas: 1,
    })
  }),
]
