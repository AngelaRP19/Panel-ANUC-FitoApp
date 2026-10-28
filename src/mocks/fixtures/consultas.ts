// Consultas guardadas de reportes (artboards R0 y F5). Datos ficticios: solo mocks.
import type { ConsultaGuardada } from '@/features/reportes/types'

export type ConsultaFixture = Omit<ConsultaGuardada, 'resultado'>

function crear(): ConsultaFixture[] {
  const base = { visibilidad: 'equipo' as const, envio: null, creada_por: 'Wilmar Torres' }
  return [
    {
      ...base,
      id: 'cg-1',
      nombre: 'Casos confirmados de Trips por vereda',
      tipo: 'identificacion',
      descripcion: 'Base de las alertas epidemiológicas',
      filtros: { periodo: '30d', categoria: 'TRIPS', resultado: 'CONFIRMADO' },
    },
    {
      ...base,
      id: 'cg-2',
      nombre: 'Pendientes de revisión con más de 48 h',
      tipo: 'casos',
      descripcion: 'Para repartir la carga entre técnicos',
      filtros: { periodo: 'anio', estado: 'PENDIENTE_REVISION', espera: '2' },
    },
    {
      ...base,
      id: 'cg-3',
      nombre: 'Productores con 3 o más casos en el año',
      tipo: 'productores',
      descripcion: 'Candidatos a visita de campo',
      filtros: { periodo: 'anio', casos_desde: '3' },
    },
    {
      ...base,
      id: 'cg-4',
      nombre: 'Coincidencia de síntomas menor a 70 %',
      tipo: 'identificacion',
      descripcion: 'Identificación preliminar poco clara · revisar el cuestionario',
      filtros: { periodo: 'anio', coincidencia_max: '69' },
    },
    {
      ...base,
      id: 'cg-5',
      nombre: 'Alertas confirmadas sin comunicar',
      tipo: 'alertas',
      descripcion: 'Falta enviar el mensaje a los productores',
      filtros: { periodo: 'anio', comunicada: 'sin_comunicar' },
    },
  ]
}

export const consultas: ConsultaFixture[] = crear()

/** Restaura las consultas del diseño (pruebas). */
export function reiniciarConsultas() {
  consultas.splice(0, consultas.length, ...crear())
}
