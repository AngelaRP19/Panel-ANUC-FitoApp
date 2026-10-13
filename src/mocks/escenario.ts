// Escenarios de la API simulada que se activan desde la URL (solo con VITE_USE_MOCKS=true).
//   ?mock=sin-lider  → el panel aún no tiene líder técnico (pantalla «Primer uso», RQF01)
//   ?mock=normal     → vuelve a los datos del diseño
const CLAVE = 'anuc.mock.escenario'

export type Escenario = 'normal' | 'sin-lider'

let enMemoria: Escenario = 'normal'

export function escenarioActual(): Escenario {
  try {
    return (sessionStorage.getItem(CLAVE) as Escenario | null) ?? enMemoria
  } catch {
    return enMemoria
  }
}

export function fijarEscenario(escenario: Escenario) {
  enMemoria = escenario
  try {
    sessionStorage.setItem(CLAVE, escenario)
  } catch {
    /* solo memoria */
  }
}

/** Lee `?mock=` al arrancar los mocks en el navegador. */
export function escenarioDesdeUrl() {
  const valor = new URLSearchParams(window.location.search).get('mock')
  if (valor === 'sin-lider' || valor === 'normal') fijarEscenario(valor)
}
