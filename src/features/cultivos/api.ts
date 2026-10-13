// Llamadas HTTP del feature "cultivos" (RQF17-18). Único lugar del feature que usa `api`.
// Endpoints: POST /fincas/{id}/cultivos
import { api } from '@/services/apiClient'
import type { Especie, TipoCultivo } from '@/types/enums'

export interface DatosCultivo {
  nombre: string
  tipo: TipoCultivo
  especies: Especie[]
}

/** Agrega un cultivo a la finca. Responde con la finca actualizada. */
export async function agregarCultivo(fincaId: string, datos: DatosCultivo): Promise<unknown> {
  const { data } = await api.post(`/fincas/${encodeURIComponent(fincaId)}/cultivos`, datos)
  return data
}
