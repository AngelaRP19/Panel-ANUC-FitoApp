/** Muestra un teléfono E.164 colombiano (+573001234567) como "+57 300 123 4567". */
export function formatearTelefono(e164: string | null | undefined): string {
  if (!e164) return '—'
  const m = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : e164
}
