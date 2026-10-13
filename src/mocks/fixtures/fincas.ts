// Fincas y cultivos del diseño (artboard 09). Los ids coinciden con los de los casos
// (mocks/fixtures/casos.ts) y los productores (mocks/fixtures/productores.ts). Datos ficticios (P-16).
import type { Especie, TipoCultivo, Vereda } from '@/types/enums'

export interface CultivoFixture {
  id: string
  nombre: string
  tipo: TipoCultivo
  especies: Especie[]
}

export interface FincaFixture {
  id: string
  nombre: string
  vereda: Vereda
  latitud: number
  longitud: number
  productor_id: string
  cultivos: CultivoFixture[]
}

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

type Fila = [string, Vereda, number, number, string, [string, TipoCultivo, Especie[]][]]

const I: TipoCultivo = 'INVERNADERO'
const C: TipoCultivo = 'CAMPO_ABIERTO'

// [finca, vereda, latitud, longitud, productor, cultivos]
const FILAS: Fila[] = [
  [
    'El Porvenir',
    'JURACAMBITA',
    5.2481,
    -73.1702,
    'p-maria-rojas',
    [
      ['Invernadero norte', I, ['GULUPA', 'GRANADILLA']],
      ['Lote de abajo', C, ['GULUPA']],
    ],
  ],
  ['Buenavista', 'JURACAMBITA', 5.2562, -73.1745, 'p-gloria-patino', [['Lote 1', C, ['MARACUYA']]]],
  ['El Cedro', 'JURACAMBITA', 5.2445, -73.1765, 'p-ernesto-gomez', [['Lote único', C, ['GULUPA']]]],
  [
    'La Cabaña',
    'JURACAMBITA',
    5.2455,
    -73.1831,
    'p-pedro-suarez',
    [
      ['Lote principal', C, ['GRANADILLA']],
      ['Lote nuevo', C, ['GULUPA']],
    ],
  ],
  ['La Loma', 'JURACAMBITA', 5.2597, -73.185, 'p-martha-ruiz', [['Lote 1', C, ['GULUPA']]]],
  [
    'Los Naranjos',
    'JURACAMBITA',
    5.2523,
    -73.1788,
    'p-luis-cardenas',
    [['Lote bajo', C, ['GULUPA']]],
  ],
  ['El Diviso', 'CENTRO', 5.2956, -73.1668, 'p-jairo-nino', [['Lote 1', C, ['GRANADILLA']]]],
  ['La Palma', 'CENTRO', 5.2789, -73.164, 'p-orlando-barrera', [['Lote 1', C, ['GRANADILLA']]]],
  ['San Isidro', 'CENTRO', 5.2902, -73.1752, 'p-blanca-parra', [['Lote central', C, ['GULUPA']]]],
  [
    'Villa Nueva',
    'CENTRO',
    5.2851,
    -73.1694,
    'p-luz-perez',
    [
      ['Lote maracuyá', C, ['MARACUYA']],
      ['Huerta', C, ['GRANADILLA']],
    ],
  ],
  [
    'El Mirador',
    'SAN_LUIS',
    5.2652,
    -73.1352,
    'p-hernan-fonseca',
    [
      ['Lote granadilla', C, ['GRANADILLA']],
      ['Lote gulupa', C, ['GULUPA']],
    ],
  ],
  [
    'El Recreo',
    'SAN_LUIS',
    5.2768,
    -73.1381,
    'p-rosa-moreno',
    [
      ['Lote alto', C, ['GULUPA']],
      ['Lote de maracuyá', C, ['MARACUYA']],
    ],
  ],
  ['La Esperanza', 'SAN_LUIS', 5.2714, -73.1433, 'p-jose-avila', [['Lote 2', C, ['GRANADILLA']]]],
  ['Santa Rita', 'SAN_LUIS', 5.282, -73.1469, 'p-ana-vargas', [['Invernadero', I, ['GULUPA']]]],
]

function crear(): FincaFixture[] {
  return FILAS.map(([nombre, vereda, latitud, longitud, productor_id, cultivos]) => ({
    id: `f-${slug(nombre)}`,
    nombre,
    vereda,
    latitud,
    longitud,
    productor_id,
    cultivos: cultivos.map(([c, tipo, especies]) => ({
      id: `cu-${slug(nombre)}-${slug(c)}`,
      nombre: c,
      tipo,
      especies: [...especies],
    })),
  }))
}

export const fincas: FincaFixture[] = crear()

/** Restaura las fincas del diseño (pruebas). */
export function reiniciarFincas() {
  fincas.splice(0, fincas.length, ...crear())
}
