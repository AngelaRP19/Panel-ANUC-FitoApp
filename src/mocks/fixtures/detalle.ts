// Detalle simulado de los casos (pantalla 6). Los casos #0241, #0239 y #0226 usan los textos de
// los artboards 04, 04b y 04c; el resto se genera a partir de la bandeja. Datos ficticios (P-16).
import type { Categoria, TipoEvidencia } from '@/types/enums'
import { casos, type CasoFixture } from './casos'

const MIN = 60_000
const DIA = 86_400_000
const mas = (iso: string, ms: number) => new Date(new Date(iso).getTime() + ms).toISOString()
const bogota = (f: string) => new Date(`${f.replace(' ', 'T')}:00-05:00`).toISOString()

const COORDENADAS: Record<string, [number, number]> = {
  'El Porvenir': [5.2481, -73.1702],
  'La Cabaña': [5.2533, -73.1655],
  'Los Naranjos': [5.2418, -73.1741],
  Buenavista: [5.2569, -73.1689],
  'La Esperanza': [5.2312, -73.1588],
  'El Recreo': [5.2287, -73.1623],
  'El Mirador': [5.2355, -73.1549],
  'Santa Rita': [5.2264, -73.1572],
  'San Isidro': [5.2741, -73.1812],
  'La Palma': [5.2698, -73.1776],
  'Villa Nueva': [5.2766, -73.1754],
  'El Diviso': [5.2802, -73.1833],
}

const ZONA: Record<Categoria, string> = {
  BOTRYTIS: 'fruto y hojas',
  TRIPS: 'flores y hojas',
  RONA: 'fruto',
  DEFICIENCIA_MAGNESIO: 'hojas',
  FUSARIUM: 'tallo y raíz',
}

const COINCIDE: Record<Categoria, string[]> = {
  BOTRYTIS: [
    'manchas húmedas café en el fruto que se cubren de un polvo gris.',
    'humedad alta en las mañanas dentro del invernadero.',
    'el daño empezó en frutos maduros y flores marchitas.',
  ],
  TRIPS: [
    'insectos pequeños y alargados en las flores.',
    'hojas plateadas con puntos negros en el envés.',
    'flores deformadas que no cuajan.',
  ],
  RONA: [
    'lesiones en relieve en la cáscara del fruto.',
    'costras corchosas en ramas jóvenes.',
    'el daño aparece después de lluvias seguidas.',
  ],
  DEFICIENCIA_MAGNESIO: [
    'amarillamiento entre las venas de las hojas más viejas.',
    'las venas siguen verdes.',
    'el síntoma avanza de abajo hacia arriba en la planta.',
  ],
  FUSARIUM: [
    'marchitez de la planta en las horas de más calor.',
    'tallo oscuro por dentro al cortarlo.',
    'plantas afectadas en un mismo sector del lote.',
  ],
}

const DESCARTA: Record<Categoria, string> = {
  BOTRYTIS: 'no hay moho gris en frutos ni flores.',
  TRIPS: 'no se observan insectos en flores ni en el envés.',
  RONA: 'no hay lesiones en relieve ni costras.',
  DEFICIENCIA_MAGNESIO: 'el amarillamiento no sigue el patrón entre venas.',
  FUSARIUM: 'la planta no está marchita y el tallo no tiene daño.',
}

const PISTA: Record<Categoria, string> = {
  BOTRYTIS:
    'Para verificar Botrytis, abre un fruto afectado: el moho gris también aparece en el interior.',
  TRIPS:
    'Para verificar Trips, sacude una flor sobre una hoja blanca y busca insectos que se muevan.',
  RONA: 'Para verificar Roña, toca la lesión: es seca y corchosa, sin moho.',
  DEFICIENCIA_MAGNESIO:
    'Para verificar la deficiencia, revisa si el síntoma empezó en las hojas de abajo.',
  FUSARIUM: 'Para verificar Fusarium, corta el tallo cerca de la base: el interior se ve café.',
}

const OTRAS: Categoria[] = ['BOTRYTIS', 'TRIPS', 'RONA', 'DEFICIENCIA_MAGNESIO', 'FUSARIUM']

const DESCARTES: Record<Categoria, [Categoria, Categoria]> = {
  BOTRYTIS: ['TRIPS', 'FUSARIUM'],
  TRIPS: ['BOTRYTIS', 'FUSARIUM'],
  RONA: ['TRIPS', 'FUSARIUM'],
  DEFICIENCIA_MAGNESIO: ['TRIPS', 'FUSARIUM'],
  FUSARIUM: ['TRIPS', 'BOTRYTIS'],
}

const NOMBRE: Record<Categoria, string> = {
  BOTRYTIS: 'Botrytis',
  TRIPS: 'Trips',
  RONA: 'Roña',
  DEFICIENCIA_MAGNESIO: 'Deficiencia de magnesio',
  FUSARIUM: 'Fusarium',
}

const TIPOS: TipoEvidencia[] = ['HOJA', 'ENVES', 'FRUTO', 'TALLO']
const PREGUNTA_FOTO: Record<string, string> = {
  HOJA: '«Envíe una foto de una hoja afectada»',
  ENVES: '«Voltee la hoja y envíe una foto del envés»',
  FRUTO: '«Envíe una foto cercana del fruto afectado»',
  TALLO: '«Envíe una foto del tallo cerca de la base»',
}
const DESCRIPCIONES: Record<string, string[]> = {
  HOJA: ['Manchas en la hoja', 'Hoja con bordes secos', 'Hoja amarillenta'],
  ENVES: ['Envés con puntos oscuros', 'Envés de hoja joven'],
  FRUTO: ['Mancha húmeda en el fruto', 'Polvo gris en la cáscara', 'Fruto maduro afectado'],
  TALLO: ['Tallo oscuro en la base', 'Corte del tallo', 'Tallo con lesión'],
}

/** Evidencias por tipo de cada caso: las del diseño o un reparto según la categoría. */
function reparto(c: CasoFixture): Record<string, number> {
  if (c.id === '0241') return { HOJA: 3, ENVES: 2, FRUTO: 3, TALLO: 0 }
  if (c.id === '0226') return { HOJA: 2, ENVES: 1, FRUTO: 0, TALLO: 3 }
  if (c.id === '0239') return { HOJA: 2, ENVES: 2, FRUTO: 3, TALLO: 2 }
  if (!c.preliminar) return { HOJA: 1, ENVES: 0, FRUTO: 0, TALLO: 0 }
  const cat = c.preliminar.categoria
  if (cat === 'FUSARIUM') return { HOJA: 2, ENVES: 1, FRUTO: 0, TALLO: 3 }
  if (cat === 'DEFICIENCIA_MAGNESIO') return { HOJA: 4, ENVES: 2, FRUTO: 0, TALLO: 1 }
  return { HOJA: 2, ENVES: 2, FRUTO: 2, TALLO: 1 }
}

function primerContacto(c: CasoFixture) {
  return c.enviado_a_panel_en
    ? mas(c.enviado_a_panel_en, -33 * MIN)
    : mas(new Date().toISOString(), -2 * 3_600_000)
}

export function evidenciasDe(c: CasoFixture) {
  const inicio = primerContacto(c)
  const lista = []
  let i = 0
  for (const tipo of TIPOS) {
    const n = reparto(c)[tipo] ?? 0
    for (let k = 1; k <= n; k++) {
      i++
      lista.push({
        id: `${c.id}-ev-${i}`,
        tipo,
        numero: k,
        descripcion:
          c.id === '0241' && tipo === 'FRUTO' && k === 2
            ? 'Polvo gris en la cáscara'
            : DESCRIPCIONES[tipo]![(k - 1) % 3]!,
        url: null,
        recibida_en: mas(inicio, (5 + i * 2) * MIN),
        pregunta: PREGUNTA_FOTO[tipo]!,
      })
    }
  }
  return lista
}

const CUESTIONARIO_0241 = [
  ['¿En qué cultivo ve el problema?', 'Gulupa'],
  ['¿En qué parte de la planta ve el daño?', 'En el fruto y en las hojas'],
  [
    '¿Cómo se ve el daño en el fruto?',
    'Manchas húmedas color café que después se llenan de un polvito gris',
  ],
  ['¿Hace cuánto notó los síntomas?', 'Hace unos 8 días'],
  ['¿Qué parte del cultivo está afectada?', 'Menos de la cuarta parte'],
  ['¿El cultivo está en invernadero o a campo abierto?', 'En invernadero'],
  ['¿Ha habido mucha humedad o lluvia en los últimos días?', 'Sí, amanece muy húmedo adentro'],
  ['¿Ve insectos pequeños en flores u hojas?', 'No'],
]
const CUESTIONARIO_0226 = [
  ['¿En qué cultivo ve el problema?', 'Gulupa'],
  ['¿En qué parte de la planta ve el daño?', 'Hojas de abajo y el tallo'],
  ['¿La planta se ve marchita?', 'No sé, un poco en la tarde'],
  ['¿Hace cuánto notó los síntomas?', 'Como un mes'],
  ['¿Cuántas plantas están afectadas?', 'Unas 5 plantas'],
  ['¿Ha abonado el cultivo en los últimos meses?', 'Sí, en julio'],
]

export function cuestionarioDe(c: CasoFixture) {
  const base =
    c.id === '0241'
      ? CUESTIONARIO_0241
      : c.id === '0226'
        ? CUESTIONARIO_0226
        : [
            ['¿En qué cultivo ve el problema?', NOMBRE_ESPECIE[c.especie]!],
            ['¿En qué parte de la planta ve el daño?', zonaDe(c)],
            ['¿Hace cuánto notó los síntomas?', 'Hace unas dos semanas'],
            ['¿Qué parte del cultivo está afectada?', 'Menos de la cuarta parte'],
            [
              '¿Ve insectos pequeños en flores u hojas?',
              c.preliminar?.categoria === 'TRIPS' ? 'Sí, en las flores' : 'No',
            ],
          ]
  const desde = primerContacto(c)
  return {
    desde,
    hasta: mas(desde, (c.id === '0241' ? 29 : 20) * MIN),
    respuestas: base.map(([pregunta, respuesta]) => ({
      pregunta: pregunta!,
      respuesta: respuesta!,
    })),
  }
}

const NOMBRE_ESPECIE: Record<string, string> = {
  GULUPA: 'Gulupa',
  GRANADILLA: 'Granadilla',
  MARACUYA: 'Maracuyá',
}

function zonaDe(c: CasoFixture) {
  if (c.id === '0226') return 'hojas y tallo'
  const cat = c.preliminar?.categoria
  return cat ? ZONA[cat] : 'hojas y tallo'
}

/** Fecha de cierre simulada: 3 días después del envío (#0226: la del artboard 04c). */
export function cerradoEn(c: CasoFixture) {
  if (c.estado !== 'CERRADO' || !c.enviado_a_panel_en) return null
  return c.id === '0226' ? bogota('2026-09-22 10:05') : mas(c.enviado_a_panel_en, 3 * DIA)
}

const LIDER = 'Wilmar Torres'

export function historialDe(c: CasoFixture) {
  const pasos: {
    tipo: string
    titulo: string
    en: string | null
    detalle: string
    pendiente: boolean
  }[] = []
  const inicio = primerContacto(c)
  const evid = evidenciasDe(c).length
  const resp = cuestionarioDe(c).respuestas.length
  pasos.push({
    tipo: 'CREADO',
    titulo: 'Caso creado',
    en: inicio,
    detalle: `${c.productor.nombre} por WhatsApp`,
    pendiente: false,
  })
  if (c.estado === 'CREADO') return pasos
  pasos.push({
    tipo: 'ANALISIS',
    titulo: 'Análisis del chatbot',
    en: mas(inicio, 2 * MIN),
    detalle: `Chatbot · ${resp} respuestas y ${evid} evidencias`,
    pendiente: false,
  })
  if (c.estado === 'EN_ANALISIS' || !c.enviado_a_panel_en) {
    if (c.estado === 'DESCARTADO') {
      pasos.push({
        tipo: 'DESCARTE',
        titulo: 'Caso descartado',
        en: mas(inicio, DIA),
        detalle: `${LIDER} · sin datos suficientes`,
        pendiente: false,
      })
    }
    return pasos
  }
  const p = c.preliminar
  const prelim = !p
    ? 'sin resultado'
    : p.resultado === 'NO_IDENTIFICADO'
      ? 'no identificada'
      : p.resultado === 'AMBIGUO'
        ? `ambigua · ${NOMBRE[p.categoria!]} ${p.porcentaje} % y ${NOMBRE[p.alternativa!.categoria]} ${p.alternativa!.porcentaje} %`
        : `${NOMBRE[p.categoria!]} ${p.porcentaje} %`
  pasos.push({
    tipo: 'ENVIADO',
    titulo: 'Enviado a revisión',
    en: c.enviado_a_panel_en,
    detalle: `Sistema · Identificación preliminar: ${prelim}`,
    pendiente: false,
  })
  if (c.tecnico) {
    pasos.push({
      tipo: 'ASIGNADO',
      titulo: 'Técnico asignado',
      en: mas(c.enviado_a_panel_en, 16 * MIN),
      detalle: `${LIDER} asignó a ${c.tecnico.nombre}`,
      pendiente: false,
    })
  }
  const cierre = cerradoEn(c)
  if (c.estado === 'REGISTRADO' || c.estado === 'CERRADO') {
    const en = cierre ? mas(cierre, -7 * MIN) : mas(c.enviado_a_panel_en, 2 * DIA)
    const resultado = c.id === '0226' ? 'No identificado' : 'Confirmado'
    pasos.push({
      tipo: 'DIAGNOSTICO',
      titulo: `Diagnóstico técnico: ${resultado}`,
      en,
      detalle: c.tecnico?.nombre ?? LIDER,
      pendiente: false,
    })
  } else {
    pasos.push({
      tipo: 'DIAGNOSTICO',
      titulo: 'Diagnóstico técnico',
      en: null,
      detalle: 'Pendiente',
      pendiente: true,
    })
  }
  if (cierre) {
    const vence = new Date(c.vence_en!)
      .toLocaleDateString('es-CO', {
        timeZone: 'America/Bogota',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .replace('.', '')
    pasos.push({
      tipo: 'CIERRE',
      titulo: 'Caso cerrado',
      en: cierre,
      detalle: `${c.tecnico?.nombre ?? LIDER} · Vence conservación: ${vence}`,
      pendiente: false,
    })
    if (c.conservacion_extendida) {
      pasos.push({
        tipo: 'EXTENSION',
        titulo: 'Conservación extendida',
        en: mas(cierre, 30 * DIA),
        detalle: `${LIDER} · El productor pidió segunda visita`,
        pendiente: false,
      })
    }
  } else {
    pasos.push({
      tipo: 'CIERRE',
      titulo: 'Cierre del caso',
      en: null,
      detalle: 'Pendiente · define la fecha de vencimiento de conservación',
      pendiente: true,
    })
  }
  return pasos
}

export function explicacionDe(c: CasoFixture) {
  const p = c.preliminar
  if (!p) return null
  if (p.resultado === 'NO_IDENTIFICADO') {
    return {
      coincide: [],
      descarta: [],
      cercanas: [
        { categoria: 'FUSARIUM' as Categoria, porcentaje: 31 },
        { categoria: 'DEFICIENCIA_MAGNESIO' as Categoria, porcentaje: 24 },
        { categoria: 'RONA' as Categoria, porcentaje: 18 },
      ],
      texto:
        'Los síntomas descritos (hojas amarillas en la parte baja y tallo oscuro en un solo punto) no forman un patrón claro de ninguna categoría. Faltaron fotos del fruto.',
    }
  }
  const cat = p.categoria!
  // Categorías que el análisis descarta para cada sugerencia (Botrytis: Trips y Fusarium, 04).
  const [d1, d2] = DESCARTES[cat]
  const resto = OTRAS.filter(
    (o) => o !== cat && o !== d1 && o !== d2 && o !== p.alternativa?.categoria,
  )
  return {
    coincide: COINCIDE[cat],
    descarta: [d1, d2].map((o) => ({ categoria: o, texto: DESCARTA[o] })),
    cercanas: [
      ...resto.slice(0, 1).map((o) => ({ categoria: o, porcentaje: 21 })),
      { categoria: d2, porcentaje: 9 },
      { categoria: d1, porcentaje: 4 },
    ],
    texto: PISTA[cat],
  }
}

export function detalleDe(c: CasoFixture) {
  const [latitud, longitud] = COORDENADAS[c.finca.nombre] ?? [null, null]
  const ev = evidenciasDe(c)
  const cuest = cuestionarioDe(c)
  const historial = historialDe(c).filter((h) => !h.pendiente)
  const ultimo = historial[historial.length - 1]
  const p = c.preliminar
  const invernadero = /invernadero/i.test(c.cultivo.nombre)
  const especies = c.cultivo.nombre === 'Invernadero norte' ? ['GULUPA', 'GRANADILLA'] : [c.especie]
  const porTipo: Record<string, number> = {}
  for (const e of ev) porTipo[e.tipo] = (porTipo[e.tipo] ?? 0) + 1
  for (const t of TIPOS) porTipo[t] ??= 0

  return {
    ...c,
    productor: {
      ...c.productor,
      casos_ultimo_anio: casos.filter((x) => x.productor.id === c.productor.id).length,
    },
    finca: { ...c.finca, latitud, longitud },
    cultivo: { ...c.cultivo, tipo: invernadero ? 'INVERNADERO' : 'CAMPO_ABIERTO', especies },
    zona_afectada: zonaDe(c),
    preliminar_resumen: !p
      ? null
      : p.resultado === 'AMBIGUO'
        ? 'Los síntomas coinciden en parte con dos categorías fitosanitarias. Ninguna supera a la otra con claridad.'
        : p.resultado === 'NO_IDENTIFICADO'
          ? 'Ninguna categoría fitosanitaria alcanza el mínimo · la más cercana: Fusarium 31 %'
          : `Porcentaje de coincidencia de síntomas. Coinciden 3 síntomas ${c.id === '0241' ? 'del fruto y del ambiente' : 'de lo que describió el productor'}; descarta ${explicacionDe(
              c,
            )!
              .descarta.map((d) => NOMBRE[d.categoria])
              .join(' y ')}.`,
    preliminar_coincidencias:
      p?.resultado === 'AMBIGUO'
        ? [
            {
              categoria: 'BOTRYTIS',
              texto: 'Manchas húmedas en el fruto y humedad alta en las mañanas.',
            },
            {
              categoria: 'RONA',
              texto: 'Lesiones en relieve en la cáscara y costras en ramas jóvenes.',
            },
          ]
        : [],
    preliminar_pista:
      p?.resultado === 'AMBIGUO'
        ? 'Para distinguirlas, revisa las fotos del fruto: en Botrytis el moho gris cubre la lesión; en Roña la lesión es seca, corchosa y sin moho.'
        : null,
    cerrado_en: cerradoEn(c),
    evidencias_resumen: { total: ev.length, maximo: 12, por_tipo: porTipo },
    cuestionario_resumen: {
      respuestas: cuest.respuestas.length,
      desde: cuest.desde,
      hasta: cuest.hasta,
    },
    historial_ultimo: ultimo ? { titulo: ultimo.titulo, en: ultimo.en! } : null,
  }
}
