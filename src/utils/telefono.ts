// Celulares colombianos: 10 dígitos que empiezan por 3. Se muestran «313 402 7781» (mono)
// y se envían y guardan en E.164 (+573134027781).

const CELULAR = /^3\d{9}$/

/** Quita espacios, guiones y el prefijo +57 / 57 que el usuario pueda escribir. */
export function limpiarCelular(texto: string): string {
  const digitos = texto.replace(/\D/g, '')
  return digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos
}

/** true si el texto es un celular válido (10 dígitos, empieza por 3). */
export function esCelularValido(texto: string): boolean {
  return CELULAR.test(limpiarCelular(texto))
}

/** «313 402 7781» → «+573134027781». Devuelve null si no es válido. */
export function aE164(texto: string): string | null {
  const celular = limpiarCelular(texto)
  return CELULAR.test(celular) ? `+57${celular}` : null
}

/** «+573134027781» (o «3134027781») → «313 402 7781». Si no se reconoce, se devuelve tal cual. */
export function formatearTelefono(valor: string | null | undefined): string {
  if (!valor) return '—'
  const celular = limpiarCelular(valor)
  const m = /^(\d{3})(\d{3})(\d{4})$/.exec(celular)
  return m ? `${m[1]} ${m[2]} ${m[3]}` : valor
}
