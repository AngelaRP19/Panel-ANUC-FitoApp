import { http, HttpResponse } from 'msw'
import { casos } from '../fixtures/casos'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

export const casosHandlers = [
  // Detalle de un caso. Al técnico solo le responde sus casos asignados: el resto da 404
  // para no revelar que existe (guía 6.4). La ficha completa llega con la pantalla 6.
  http.get(`${API}/casos/:id`, ({ request, params }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const caso = casos.find((c) => c.id === params.id)
    const visible = caso && (u.rol === 'LIDER_TECNICO' || caso.tecnico?.id === u.id)
    if (!visible) return errorApi(404, 'CASO_NO_ENCONTRADO', 'El caso no existe.')
    return HttpResponse.json(caso)
  }),
]
