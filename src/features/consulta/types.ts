// Tipos del feature "consulta" (pantalla 14 · productores y fincas de los casos del técnico).
// TODO: reemplazar por los de '@/types/api' cuando exista el OpenAPI del backend.
import type { Pagina } from '@/features/casos'
import type { Especie, EstadoCaso, Vereda } from '@/types/enums'

export interface RegistroConsulta {
  /** Productor + finca. */
  id: string
  productor: { id: string; nombre: string; celular: string }
  finca: {
    id: string
    nombre: string
    vereda: Vereda
    latitud: number | null
    longitud: number | null
  }
  /** Cultivos de la finca que aparecen en los casos del técnico. */
  cultivos: { id: string; nombre: string; especies: Especie[] }[]
  /** Casos del técnico en esa finca. */
  casos: { id: string; codigo: string; estado: EstadoCaso }[]
}

export interface ListaConsulta extends Pagina<RegistroConsulta> {
  resumen: { productores: number; fincas: number; casos: number }
}

export type FiltrosConsulta = {
  q: string
  vereda: string
  especie: string
  /** 'pendientes' | 'cerrados' */
  estado_casos: string
  page: string
}
