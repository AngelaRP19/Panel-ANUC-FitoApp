// Alertas epidemiológicas tomadas del diseño (artboard 06). Datos ficticios: solo mocks (P-16).
// La forma es el contrato propuesto de GET /alertas (guía, pantalla 11); se ajusta al llegar el OpenAPI.
import type { Categoria, EstadoAlerta, Vereda } from '@/types/enums'

interface Persona {
  id: string
  nombre: string
}

export interface AlertaFixture {
  /** «ALR-012»: el código también es el id en la API. */
  id: string
  estado: EstadoAlerta
  categoria: Categoria
  vereda: Vereda
  generada_en: string
  /** Parámetros con que se generó (no cambian si luego se editan los parámetros). */
  parametros: { num_casos: number; distancia_km: number; intervalo_dias: number }
  /** Distancia máxima real entre los casos de la alerta (km). */
  radio_km: number
  /** Casos con resultado técnico confirmado que forman la alerta. */
  casos: string[]
  /** Casos de la misma categoría en la zona que aún no tienen diagnóstico técnico. */
  sin_diagnostico: string[]
  revisa: Persona | null
  confirmada_por: Persona | null
  confirmada_en: string | null
  productores_notificados: number | null
  comunicada_en: string | null
  descarte: { motivo: string; por: Persona; en: string } | null
  /** Mensaje a productores guardado como borrador (pantalla 12). */
  borrador: { mensaje: string; veredas: Vereda[]; guardado_en: string } | null
  /** Cuentas que pidieron «Avisarme cuando cambie». */
  seguidores: string[]
}

const WILMAR = { id: 'u-wilmar', nombre: 'Wilmar Torres' }
const JHON = { id: 'u-jhon', nombre: 'Jhon Fredy Sanabria' }
const PARAMETROS = { num_casos: 3, distancia_km: 3.5, intervalo_dias: 30 }

/** «2026-09-28 06:00» en Bogotá (UTC-5) → ISO en UTC. */
const bogota = (f: string) => new Date(`${f.replace(' ', 'T')}:00-05:00`).toISOString()

function alerta(
  id: string,
  estado: EstadoAlerta,
  vereda: Vereda,
  generada: string,
  casos: string[],
  extra: Partial<AlertaFixture> = {},
): AlertaFixture {
  return {
    id,
    estado,
    categoria: 'TRIPS',
    vereda,
    generada_en: bogota(generada),
    parametros: PARAMETROS,
    radio_km: PARAMETROS.distancia_km,
    casos,
    sin_diagnostico: [],
    revisa: null,
    confirmada_por: null,
    confirmada_en: null,
    productores_notificados: null,
    comunicada_en: null,
    descarte: null,
    borrador: null,
    seguidores: [],
    ...extra,
  }
}

function crear(): AlertaFixture[] {
  return [
    alerta(
      'ALR-012',
      'GENERADA',
      'JURACAMBITA',
      '2026-09-28 06:00',
      ['0229', '0228', '0219', '0216'],
      {
        sin_diagnostico: ['0240', '0236', '0227'],
      },
    ),
    alerta('ALR-011', 'EN_REVISION', 'SAN_LUIS', '2026-09-26 06:00', ['0221', '0209', '0207'], {
      revisa: JHON,
      radio_km: 3.1,
    }),
    alerta('ALR-010', 'CONFIRMADA', 'CENTRO', '2026-09-19 06:00', ['0231', '0210', '0206'], {
      confirmada_por: WILMAR,
      confirmada_en: bogota('2026-09-19 10:42'),
    }),
    alerta('ALR-009', 'COMUNICADA', 'JURACAMBITA', '2026-09-02 06:00', ['0205', '0203', '0201'], {
      confirmada_por: WILMAR,
      confirmada_en: bogota('2026-09-02 09:15'),
      productores_notificados: 14,
      comunicada_en: bogota('2026-09-02 11:30'),
    }),
    alerta('ALR-008', 'DESCARTADA', 'SAN_LUIS', '2026-08-20 06:00', ['0198', '0197', '0195'], {
      descarte: {
        motivo: 'Dos casos eran de la misma finca',
        por: WILMAR,
        en: bogota('2026-08-20 15:05'),
      },
    }),
    alerta('ALR-007', 'COMUNICADA', 'CENTRO', '2026-07-28 06:00', ['0188', '0186', '0184'], {
      confirmada_por: WILMAR,
      confirmada_en: bogota('2026-07-28 08:50'),
      productores_notificados: 9,
      comunicada_en: bogota('2026-07-28 10:10'),
    }),
  ]
}

/**
 * Casos de alertas antiguas que ya no están en los datos de la bandeja (se conservan como
 * referencia en la alerta). Sin enlace: el caso no se puede abrir.
 */
export const CASOS_HISTORICOS: Record<
  string,
  { productor: string; finca: string; vereda: Vereda; enviado: string }
> = {
  '0210': {
    productor: 'Blanca Parra',
    finca: 'San Isidro',
    vereda: 'CENTRO',
    enviado: '2026-09-12 10:04',
  },
  '0209': {
    productor: 'Ana Vargas',
    finca: 'Santa Rita',
    vereda: 'SAN_LUIS',
    enviado: '2026-09-11 08:30',
  },
  '0207': {
    productor: 'José Ávila',
    finca: 'La Esperanza',
    vereda: 'SAN_LUIS',
    enviado: '2026-09-08 15:12',
  },
  '0206': {
    productor: 'Luz Pérez',
    finca: 'Villa Nueva',
    vereda: 'CENTRO',
    enviado: '2026-09-05 09:41',
  },
  '0205': {
    productor: 'María Rojas Cárdenas',
    finca: 'El Porvenir',
    vereda: 'JURACAMBITA',
    enviado: '2026-08-28 11:20',
  },
  '0203': {
    productor: 'Gloria Patiño',
    finca: 'Buenavista',
    vereda: 'JURACAMBITA',
    enviado: '2026-08-21 16:45',
  },
  '0201': {
    productor: 'Pedro Nel Suárez',
    finca: 'La Cabaña',
    vereda: 'JURACAMBITA',
    enviado: '2026-08-14 07:58',
  },
  '0198': {
    productor: 'José Ávila',
    finca: 'La Esperanza',
    vereda: 'SAN_LUIS',
    enviado: '2026-08-12 09:15',
  },
  '0197': {
    productor: 'José Ávila',
    finca: 'La Esperanza',
    vereda: 'SAN_LUIS',
    enviado: '2026-08-10 14:02',
  },
  '0195': {
    productor: 'Ana Vargas',
    finca: 'Santa Rita',
    vereda: 'SAN_LUIS',
    enviado: '2026-08-04 10:37',
  },
  '0188': {
    productor: 'Luz Pérez',
    finca: 'Villa Nueva',
    vereda: 'CENTRO',
    enviado: '2026-07-20 08:22',
  },
  '0186': {
    productor: 'Blanca Parra',
    finca: 'San Isidro',
    vereda: 'CENTRO',
    enviado: '2026-07-14 13:40',
  },
  '0184': {
    productor: 'Orlando Barrera',
    finca: 'La Palma',
    vereda: 'CENTRO',
    enviado: '2026-07-06 17:05',
  },
}

export const alertas: AlertaFixture[] = crear()

export interface ParametroFixture {
  categoria: Categoria
  /** Participa en la detección de concentraciones (hoy solo Trips). */
  habilitada: boolean
  num_casos: number
  distancia_km: number
  intervalo_dias: number
  /** Explicación extra de por qué no participa. */
  nota: string | null
  actualizado_por: Persona | null
  actualizado_en: string | null
}

function crearParametros(): ParametroFixture[] {
  const base = { ...PARAMETROS, nota: null, actualizado_por: null, actualizado_en: null }
  return [
    {
      ...base,
      categoria: 'TRIPS',
      habilitada: true,
      actualizado_por: WILMAR,
      actualizado_en: bogota('2026-09-02 10:20'),
    },
    { ...base, categoria: 'BOTRYTIS', habilitada: false },
    { ...base, categoria: 'RONA', habilitada: false },
    { ...base, categoria: 'FUSARIUM', habilitada: false },
    {
      ...base,
      categoria: 'DEFICIENCIA_MAGNESIO',
      habilitada: false,
      nota: 'Es un problema nutricional, no se transmite entre fincas.',
    },
  ]
}

/** Parámetros epidemiológicos por categoría (pantalla 13). */
export const parametros: ParametroFixture[] = crearParametros()

/** Restaura las alertas y los parámetros del diseño (pruebas). */
export function reiniciarAlertas() {
  alertas.splice(0, alertas.length, ...crear())
  parametros.splice(0, parametros.length, ...crearParametros())
}
