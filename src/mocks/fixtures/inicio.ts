// Datos de demostración del inicio (tomados del diseño). Las fechas son relativas a "ahora".
import type { CasosPorCategoria, PeriodoCategorias, ResumenPanel } from '@/features/inicio/types'

const HORA = 3_600_000
const DIA = 24 * HORA
const hace = (ms: number) => new Date(Date.now() - ms).toISOString()

export function resumenDemo(): ResumenPanel {
  return {
    generado_en: new Date().toISOString(),
    kpis: {
      pendientes_revision: 7,
      pendientes_mas_48h: 3,
      en_analisis_tecnico: 4,
      cerrados_mes: {
        total: 14,
        confirmados: 11,
        otra_patologia: 2,
        no_identificado: 1,
        requiere_visita: 0,
      },
      proximos_a_vencer: 2,
      dias_aviso_vencimiento: 15,
    },
    pendientes_antiguos: [
      {
        id: 'c-0227',
        numero: 227,
        productor_nombre: 'Pedro Suárez',
        enviado_a_panel_en: hace(8 * DIA + HORA),
        tecnico_asignado_id: 't-1',
      },
      {
        id: 'c-0233',
        numero: 233,
        productor_nombre: 'Orlando Barrera',
        enviado_a_panel_en: hace(3 * DIA + HORA),
        tecnico_asignado_id: 't-2',
      },
      {
        id: 'c-0234',
        numero: 234,
        productor_nombre: 'Hernán Fonseca',
        enviado_a_panel_en: hace(2 * DIA + HORA),
        tecnico_asignado_id: 't-1',
      },
      {
        id: 'c-0236',
        numero: 236,
        productor_nombre: 'Gloria Patiño',
        enviado_a_panel_en: hace(2 * DIA + 2 * HORA),
        tecnico_asignado_id: null,
      },
      {
        id: 'c-0237',
        numero: 237,
        productor_nombre: 'Rosa Moreno',
        enviado_a_panel_en: hace(DIA + HORA),
        tecnico_asignado_id: 't-2',
      },
    ],
    pendientes_sin_tecnico: 2,
    alertas: {
      generadas_sin_revisar: 1,
      destacada: { categoria: 'TRIPS', vereda: 'Juracambita' },
      recientes: [
        {
          id: 'ALR-012',
          estado: 'GENERADA',
          categoria: 'TRIPS',
          vereda: 'Juracambita',
          num_casos: 4,
          productores_notificados: null,
          generada_en: hace(4 * HORA),
        },
        {
          id: 'ALR-011',
          estado: 'EN_REVISION',
          categoria: 'TRIPS',
          vereda: 'San Luis',
          num_casos: 3,
          productores_notificados: null,
          generada_en: hace(2 * DIA),
        },
        {
          id: 'ALR-010',
          estado: 'CONFIRMADA',
          categoria: 'TRIPS',
          vereda: 'Centro',
          num_casos: 3,
          productores_notificados: null,
          generada_en: hace(9 * DIA),
        },
        {
          id: 'ALR-009',
          estado: 'COMUNICADA',
          categoria: 'TRIPS',
          vereda: 'Juracambita',
          num_casos: 5,
          productores_notificados: 14,
          generada_en: hace(26 * DIA),
        },
      ],
    },
    carga_tecnicos: [
      { tecnico_id: 't-1', nombre: 'Ana Lucía Becerra', activos: 5, pendientes: 3 },
      { tecnico_id: 't-2', nombre: 'Jhon Fredy Sanabria', activos: 5, pendientes: 2 },
      { tecnico_id: 't-3', nombre: 'Wilmar Torres', activos: 0, pendientes: 0 },
    ],
  }
}

const CATEGORIAS: Record<PeriodoCategorias, CasosPorCategoria['items']> = {
  '90d': [
    { categoria: 'TRIPS', total: 9 },
    { categoria: 'BOTRYTIS', total: 5 },
    { categoria: 'RONA', total: 5 },
    { categoria: 'DEFICIENCIA_MAGNESIO', total: 3 },
    { categoria: 'FUSARIUM', total: 3 },
  ],
  '30d': [
    { categoria: 'TRIPS', total: 4 },
    { categoria: 'BOTRYTIS', total: 2 },
    { categoria: 'RONA', total: 1 },
    { categoria: 'DEFICIENCIA_MAGNESIO', total: 1 },
    { categoria: 'FUSARIUM', total: 0 },
  ],
  anio: [
    { categoria: 'TRIPS', total: 21 },
    { categoria: 'BOTRYTIS', total: 14 },
    { categoria: 'RONA', total: 11 },
    { categoria: 'DEFICIENCIA_MAGNESIO', total: 7 },
    { categoria: 'FUSARIUM', total: 6 },
  ],
}

export function categoriasDemo(periodo: PeriodoCategorias): CasosPorCategoria {
  const items = CATEGORIAS[periodo]
  return { periodo, items, total: items.reduce((s, i) => s + i.total, 0) }
}
