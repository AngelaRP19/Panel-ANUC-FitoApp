// Casos de la bandeja tomados del diseño (artboard 03). Datos ficticios: solo mocks (P-16).
// La forma es el contrato propuesto de GET /casos (guía, pantalla 5); se ajusta al llegar el OpenAPI.
import type { Categoria, EstadoCaso, Especie, ResultadoAnalisis, Vereda } from '@/types/enums'

export interface CasoFixture {
  /** Supuesto: el id del caso en la API es su código de 4 dígitos (`/casos/0241`). */
  id: string
  /** «0241» (se muestra como «#0241») */
  codigo: string
  estado: EstadoCaso
  productor: { id: string; nombre: string; celular: string }
  finca: { id: string; nombre: string; vereda: Vereda }
  cultivo: { id: string; nombre: string }
  especie: Especie
  /** null mientras el chatbot no termina el análisis. */
  preliminar: {
    resultado: ResultadoAnalisis
    categoria: Categoria | null
    porcentaje: number | null
  } | null
  tecnico: { id: string; nombre: string } | null
  /** null: «Sin enviar» (el chatbot aún no envía el caso al panel). */
  enviado_a_panel_en: string | null
}

/** «2026-09-28 09:14» en Bogotá (UTC-5) → ISO en UTC. */
function bogota(fechaHora: string): string {
  return new Date(`${fechaHora.replace(' ', 'T')}:00-05:00`).toISOString()
}

const PRODUCTORES: Record<string, { nombre: string; celular: string }> = {
  'María Rojas': { nombre: 'María Rojas Cárdenas', celular: '+573104821937' },
  'Pedro Suárez': { nombre: 'Pedro Nel Suárez', celular: '+573204517732' },
  'Luis Cárdenas': { nombre: 'Luis Alberto Cárdenas', celular: '+573116402275' },
  'José Ávila': { nombre: 'José Ávila Mesa', celular: '+573129054418' },
  'Rosa Moreno': { nombre: 'Rosa Elvira Moreno', celular: '+573137189054' },
  'Gloria Patiño': { nombre: 'Gloria Patiño', celular: '+573162745591' },
  'Blanca Parra': { nombre: 'Blanca Nieves Parra', celular: '+573213901846' },
  'Hernán Fonseca': { nombre: 'Hernán Fonseca', celular: '+573158023360' },
  'Orlando Barrera': { nombre: 'Orlando Barrera', celular: '+573189360427' },
  'Ana Vargas': { nombre: 'Ana Beatriz Vargas', celular: '+573171458803' },
  'Luz Pérez': { nombre: 'Luz Marina Pérez', celular: '+573142276081' },
  'Jairo Niño': { nombre: 'Jairo Niño', celular: '+573196632018' },
}

const VEREDA_FINCA: Record<string, Vereda> = {
  'El Porvenir': 'JURACAMBITA',
  'La Cabaña': 'JURACAMBITA',
  'Los Naranjos': 'JURACAMBITA',
  Buenavista: 'JURACAMBITA',
  'La Esperanza': 'SAN_LUIS',
  'El Recreo': 'SAN_LUIS',
  'El Mirador': 'SAN_LUIS',
  'Santa Rita': 'SAN_LUIS',
  'San Isidro': 'CENTRO',
  'La Palma': 'CENTRO',
  'Villa Nueva': 'CENTRO',
  'El Diviso': 'CENTRO',
}

const TECNICOS = {
  ana: { id: 'u-ana', nombre: 'Ana Lucía Becerra' },
  jhon: { id: 'u-jhon', nombre: 'Jhon Fredy Sanabria' },
} as const

type CategoriaDiseno = Categoria | 'NO_IDENTIFICADA' | null

// [código, productor, finca, cultivo, especie, categoría, %, estado, técnico, enviado al panel]
type Fila = [
  string,
  string,
  string,
  string,
  Especie,
  CategoriaDiseno,
  number,
  EstadoCaso,
  keyof typeof TECNICOS | null,
  string | null,
]

const FILAS: Fila[] = [
  [
    '0241',
    'María Rojas',
    'El Porvenir',
    'Invernadero norte',
    'GULUPA',
    'BOTRYTIS',
    86,
    'EN_REVISION',
    'ana',
    '2026-09-28 09:14',
  ],
  [
    '0240',
    'Pedro Suárez',
    'La Cabaña',
    'Lote principal',
    'GRANADILLA',
    'TRIPS',
    77,
    'PENDIENTE_REVISION',
    null,
    '2026-09-28 07:52',
  ],
  [
    '0239',
    'Luis Cárdenas',
    'Los Naranjos',
    'Lote bajo',
    'GULUPA',
    'BOTRYTIS',
    58,
    'EN_REVISION',
    'ana',
    '2026-09-27 18:05',
  ],
  [
    '0238',
    'José Ávila',
    'La Esperanza',
    'Lote 2',
    'GRANADILLA',
    'DEFICIENCIA_MAGNESIO',
    81,
    'EN_REVISION',
    'jhon',
    '2026-09-27 16:40',
  ],
  [
    '0237',
    'Rosa Moreno',
    'El Recreo',
    'Lote de maracuyá',
    'MARACUYA',
    'FUSARIUM',
    69,
    'EN_REVISION',
    'jhon',
    '2026-09-27 11:21',
  ],
  [
    '0236',
    'Gloria Patiño',
    'Buenavista',
    'Lote 1',
    'MARACUYA',
    'TRIPS',
    72,
    'PENDIENTE_REVISION',
    null,
    '2026-09-26 15:08',
  ],
  [
    '0235',
    'Blanca Parra',
    'San Isidro',
    'Lote central',
    'GULUPA',
    'BOTRYTIS',
    79,
    'CERRADO',
    'ana',
    '2026-09-26 10:47',
  ],
  [
    '0234',
    'Hernán Fonseca',
    'El Mirador',
    'Lote granadilla',
    'GRANADILLA',
    'RONA',
    64,
    'EN_REVISION',
    'ana',
    '2026-09-25 17:33',
  ],
  [
    '0233',
    'Orlando Barrera',
    'La Palma',
    'Lote 1',
    'GRANADILLA',
    'NO_IDENTIFICADA',
    0,
    'EN_REVISION',
    'jhon',
    '2026-09-25 08:19',
  ],
  [
    '0232',
    'Ana Vargas',
    'Santa Rita',
    'Invernadero',
    'GULUPA',
    'TRIPS',
    81,
    'EN_REVISION',
    'jhon',
    '2026-09-24 14:02',
  ],
  [
    '0231',
    'Luz Pérez',
    'Villa Nueva',
    'Lote maracuyá',
    'MARACUYA',
    'TRIPS',
    74,
    'CERRADO',
    'ana',
    '2026-09-23 11:02',
  ],
  [
    '0230',
    'María Rojas',
    'El Porvenir',
    'Invernadero norte',
    'GRANADILLA',
    'RONA',
    71,
    'REGISTRADO',
    'ana',
    '2026-09-23 09:40',
  ],
  [
    '0229',
    'Luis Cárdenas',
    'Los Naranjos',
    'Lote bajo',
    'GULUPA',
    'TRIPS',
    83,
    'CERRADO',
    'ana',
    '2026-09-22 16:15',
  ],
  [
    '0228',
    'Gloria Patiño',
    'Buenavista',
    'Lote 1',
    'MARACUYA',
    'TRIPS',
    79,
    'CERRADO',
    'jhon',
    '2026-09-21 10:30',
  ],
  [
    '0227',
    'Pedro Suárez',
    'La Cabaña',
    'Lote principal',
    'GRANADILLA',
    'TRIPS',
    68,
    'EN_REVISION',
    'ana',
    '2026-09-20 13:12',
  ],
  [
    '0226',
    'Rosa Moreno',
    'El Recreo',
    'Lote alto',
    'GULUPA',
    'NO_IDENTIFICADA',
    0,
    'CERRADO',
    'jhon',
    '2026-09-19 08:55',
  ],
  [
    '0225',
    'Hernán Fonseca',
    'El Mirador',
    'Lote gulupa',
    'GULUPA',
    'BOTRYTIS',
    74,
    'CERRADO',
    'ana',
    '2026-09-18 15:47',
  ],
  [
    '0224',
    'Blanca Parra',
    'San Isidro',
    'Lote central',
    'GULUPA',
    'DEFICIENCIA_MAGNESIO',
    88,
    'CERRADO',
    'jhon',
    '2026-09-17 11:36',
  ],
  [
    '0223',
    'Orlando Barrera',
    'La Palma',
    'Lote 1',
    'GRANADILLA',
    'FUSARIUM',
    76,
    'EN_REVISION',
    'jhon',
    '2026-09-16 09:03',
  ],
  [
    '0222',
    'Ana Vargas',
    'Santa Rita',
    'Invernadero',
    'GULUPA',
    'RONA',
    62,
    'CERRADO',
    'ana',
    '2026-09-15 17:20',
  ],
  [
    '0221',
    'José Ávila',
    'La Esperanza',
    'Lote 2',
    'GRANADILLA',
    'TRIPS',
    71,
    'CERRADO',
    'jhon',
    '2026-09-13 10:11',
  ],
  [
    '0220',
    'Luz Pérez',
    'Villa Nueva',
    'Lote maracuyá',
    'MARACUYA',
    'FUSARIUM',
    80,
    'CERRADO',
    'ana',
    '2026-09-11 14:48',
  ],
  [
    '0219',
    'Luis Cárdenas',
    'Los Naranjos',
    'Lote bajo',
    'GULUPA',
    'TRIPS',
    76,
    'CERRADO',
    'ana',
    '2026-09-09 08:27',
  ],
  [
    '0218',
    'María Rojas',
    'El Porvenir',
    'Invernadero norte',
    'GULUPA',
    'DEFICIENCIA_MAGNESIO',
    84,
    'CERRADO',
    'ana',
    '2026-09-06 12:05',
  ],
  [
    '0217',
    'Gloria Patiño',
    'Buenavista',
    'Lote 1',
    'MARACUYA',
    'BOTRYTIS',
    66,
    'CERRADO',
    'jhon',
    '2026-09-03 16:32',
  ],
  [
    '0216',
    'Pedro Suárez',
    'La Cabaña',
    'Lote principal',
    'GRANADILLA',
    'TRIPS',
    73,
    'CERRADO',
    'ana',
    '2026-09-01 09:58',
  ],
  ['0245', 'Hernán Fonseca', 'El Mirador', 'Lote gulupa', 'GULUPA', null, 0, 'CREADO', null, null],
  ['0244', 'Ana Vargas', 'Santa Rita', 'Invernadero', 'GULUPA', null, 0, 'CREADO', null, null],
  [
    '0243',
    'Blanca Parra',
    'San Isidro',
    'Lote central',
    'GULUPA',
    null,
    0,
    'EN_ANALISIS',
    null,
    null,
  ],
  [
    '0242',
    'Orlando Barrera',
    'La Palma',
    'Lote 1',
    'GRANADILLA',
    null,
    0,
    'EN_ANALISIS',
    null,
    null,
  ],
  ['0215', 'Jairo Niño', 'El Diviso', 'Lote 1', 'GRANADILLA', null, 0, 'DESCARTADO', null, null],
  [
    '0214',
    'Luz Pérez',
    'Villa Nueva',
    'Lote maracuyá',
    'MARACUYA',
    null,
    0,
    'DESCARTADO',
    null,
    null,
  ],
]

const slug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

function preliminar(categoria: CategoriaDiseno, porcentaje: number): CasoFixture['preliminar'] {
  if (categoria === null) return null
  if (categoria === 'NO_IDENTIFICADA') {
    return { resultado: 'NO_IDENTIFICADO', categoria: null, porcentaje: null }
  }
  return { resultado: 'PRELIMINAR', categoria, porcentaje }
}

export const casos: CasoFixture[] = FILAS.map(
  ([codigo, prod, finca, cultivo, especie, cat, pct, estado, tec, enviado]) => ({
    id: codigo,
    codigo,
    estado,
    productor: { id: `p-${slug(prod)}`, ...PRODUCTORES[prod]! },
    finca: { id: `f-${slug(finca)}`, nombre: finca, vereda: VEREDA_FINCA[finca]! },
    cultivo: { id: `cu-${slug(finca)}-${slug(cultivo)}`, nombre: cultivo },
    especie,
    preliminar: preliminar(cat, pct),
    tecnico: tec ? { ...TECNICOS[tec] } : null,
    enviado_a_panel_en: enviado ? bogota(enviado) : null,
  }),
)
