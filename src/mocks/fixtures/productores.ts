// Productores del diseño (artboard 08). Los ids y las fincas coinciden con los casos de la
// bandeja (mocks/fixtures/casos.ts). Datos ficticios: solo mocks (P-16).
import type { Especie, Vereda } from '@/types/enums'

export interface ProductorFixture {
  id: string
  nombre: string
  /** E.164 */
  celular: string
  activo: boolean
  registrado_en: string
  /** Última consulta por WhatsApp (null: nunca consultó). */
  ultima_consulta_en: string | null
  fincas: { id: string; nombre: string; vereda: Vereda; especies: Especie[] }[]
}

const bogota = (f: string) => new Date(`${f}T08:00:00-05:00`).toISOString()

type Fila = [string, string, string, Vereda, string, Especie[], string, string | null, boolean?]

// [id, nombre, celular, vereda, finca, especies, registrado, última consulta, deshabilitado]
const FILAS: Fila[] = [
  [
    'p-ana-vargas',
    'Ana Beatriz Vargas',
    '+573171458803',
    'SAN_LUIS',
    'Santa Rita',
    ['GULUPA'],
    '2026-03-04',
    '2026-09-24',
  ],
  [
    'p-blanca-parra',
    'Blanca Nieves Parra',
    '+573213901846',
    'CENTRO',
    'San Isidro',
    ['GULUPA'],
    '2026-03-05',
    '2026-09-26',
  ],
  [
    'p-ernesto-gomez',
    'Ernesto Gómez Ruiz',
    '+573225180934',
    'JURACAMBITA',
    'El Cedro',
    ['GULUPA', 'MARACUYA'],
    '2026-08-12',
    null,
  ],
  [
    'p-gloria-patino',
    'Gloria Patiño',
    '+573162745591',
    'JURACAMBITA',
    'Buenavista',
    ['MARACUYA'],
    '2026-03-05',
    '2026-09-26',
  ],
  [
    'p-hernan-fonseca',
    'Hernán Fonseca',
    '+573158023360',
    'SAN_LUIS',
    'El Mirador',
    ['GULUPA', 'GRANADILLA'],
    '2026-03-06',
    '2026-09-25',
  ],
  [
    'p-jairo-nino',
    'Jairo Niño',
    '+573196632018',
    'CENTRO',
    'El Diviso',
    ['GRANADILLA'],
    '2026-04-02',
    '2026-05-10',
    true,
  ],
  [
    'p-jose-avila',
    'José Ávila Mesa',
    '+573129054418',
    'SAN_LUIS',
    'La Esperanza',
    ['GRANADILLA'],
    '2026-03-06',
    '2026-09-27',
  ],
  [
    'p-luis-cardenas',
    'Luis Alberto Cárdenas',
    '+573116402275',
    'JURACAMBITA',
    'Los Naranjos',
    ['GULUPA'],
    '2026-03-04',
    '2026-09-27',
  ],
  [
    'p-luz-perez',
    'Luz Marina Pérez',
    '+573142276081',
    'CENTRO',
    'Villa Nueva',
    ['MARACUYA'],
    '2026-03-09',
    '2026-09-23',
  ],
  [
    'p-maria-rojas',
    'María Rojas Cárdenas',
    '+573104821937',
    'JURACAMBITA',
    'El Porvenir',
    ['GULUPA', 'GRANADILLA'],
    '2026-03-03',
    '2026-09-28',
  ],
  [
    'p-martha-ruiz',
    'Martha Cecilia Ruiz',
    '+573107724165',
    'JURACAMBITA',
    'La Loma',
    ['GULUPA'],
    '2026-05-14',
    '2026-06-02',
  ],
  [
    'p-orlando-barrera',
    'Orlando Barrera',
    '+573189360427',
    'CENTRO',
    'La Palma',
    ['GRANADILLA'],
    '2026-03-10',
    '2026-09-25',
  ],
  [
    'p-pedro-suarez',
    'Pedro Nel Suárez',
    '+573204517732',
    'JURACAMBITA',
    'La Cabaña',
    ['GRANADILLA'],
    '2026-03-03',
    '2026-09-28',
  ],
  [
    'p-rosa-moreno',
    'Rosa Elvira Moreno',
    '+573137189054',
    'SAN_LUIS',
    'El Recreo',
    ['GULUPA', 'MARACUYA'],
    '2026-03-11',
    '2026-09-27',
  ],
]

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

function crear(): ProductorFixture[] {
  return FILAS.map(([id, nombre, celular, vereda, finca, especies, registrado, consulta, off]) => ({
    id,
    nombre,
    celular,
    activo: !off,
    registrado_en: bogota(registrado),
    ultima_consulta_en: consulta ? bogota(consulta) : null,
    fincas: [{ id: `f-${slug(finca)}`, nombre: finca, vereda, especies }],
  }))
}

export const productores: ProductorFixture[] = crear()

/** Restaura los productores del diseño (pruebas). */
export function reiniciarProductores() {
  productores.splice(0, productores.length, ...crear())
}
