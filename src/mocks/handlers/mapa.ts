import { http, HttpResponse } from 'msw'
import type { Categoria } from '@/types/enums'
import { parametros } from '../fixtures/alertas'
import { casos } from '../fixtures/casos'
import { diagnosticoDe } from '../fixtures/detalle'
import { fincas } from '../fixtures/fincas'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const DIA = 86_400_000
const CATEGORIAS: Categoria[] = ['TRIPS', 'BOTRYTIS', 'RONA', 'FUSARIUM', 'DEFICIENCIA_MAGNESIO']

/** Distancia en km entre dos puntos (fórmula del haversine). */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (g: number) => (g * Math.PI) / 180
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * Casos del mapa de vigilancia (pantalla 19): solo con resultado técnico Confirmado u Otra
 * patología, con la categoría determinada, la ubicación de la finca y, para las categorías que
 * participan en alertas, el nivel de concentración (1 a 4) según los parámetros vigentes.
 */
function casosDelMapa() {
  const lista = casos.flatMap((c) => {
    const d = diagnosticoDe(c)
    if (!d || !c.enviado_a_panel_en) return []
    const categoria =
      d.resultado_tecnico === 'CONFIRMADO'
        ? (c.preliminar?.categoria ?? null)
        : d.resultado_tecnico === 'OTRA_PATOLOGIA'
          ? d.categoria_determinada
          : null
    if (!categoria) return []
    const finca = fincas.find((f) => f.id === c.finca.id)
    if (!finca) return []
    return [
      {
        id: c.id,
        codigo: c.codigo,
        categoria,
        resultado_tecnico: d.resultado_tecnico,
        especie: c.especie,
        productor_nombre: c.productor.nombre,
        finca_id: finca.id,
        finca_nombre: finca.nombre,
        vereda: finca.vereda,
        fecha: c.enviado_a_panel_en,
        latitud: finca.latitud,
        longitud: finca.longitud,
      },
    ]
  })
  return lista.map((c) => {
    const p = parametros.find((x) => x.categoria === c.categoria && x.habilitada)
    if (!p) return { ...c, concentracion: null }
    // Casos de la misma categoría a no más de la distancia y dentro del intervalo.
    const vecinos = lista.filter(
      (o) =>
        o.categoria === c.categoria &&
        km({ lat: o.latitud, lng: o.longitud }, { lat: c.latitud, lng: c.longitud }) <=
          p.distancia_km &&
        Math.abs(new Date(o.fecha).getTime() - new Date(c.fecha).getTime()) <=
          p.intervalo_dias * DIA,
    ).length
    const nivel =
      vecinos >= p.num_casos ? 4 : vecinos === p.num_casos - 1 ? 3 : vecinos >= 2 ? 2 : 1
    return { ...c, concentracion: nivel }
  })
}

export const mapaHandlers = [
  http.get(`${API}/mapa/casos`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    if (u.rol !== 'LIDER_TECNICO') {
      return errorApi(403, 'SOLO_LIDER', 'El mapa de vigilancia es del líder técnico.')
    }
    const p = new URL(request.url).searchParams
    const especie = p.get('especie')
    const desde = p.get('desde')
    const hasta = p.get('hasta')
    const dia = (iso: string) =>
      new Date(new Date(iso).getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
    const lista = casosDelMapa().filter(
      (c) =>
        (!especie || c.especie === especie) &&
        (!desde || dia(c.fecha) >= desde) &&
        (!hasta || dia(c.fecha) <= hasta),
    )
    const conteos = Object.fromEntries(
      CATEGORIAS.map((cat) => [cat, lista.filter((c) => c.categoria === cat).length]),
    )
    return HttpResponse.json({ casos: lista, conteos })
  }),
]
