/** Descarga un texto como archivo (CSV, etc.) con el nombre indicado. */
export function descargarTexto(texto: string, archivo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // El navegador ya tomó el archivo: se libera la URL en el siguiente ciclo.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** «productores-2026-10-14.csv» */
export function nombreConFecha(base: string, extension: string, fecha = new Date()) {
  const dia = new Date(fecha.getTime() - 5 * 3_600_000).toISOString().slice(0, 10)
  return `${base}-${dia}.${extension}`
}
