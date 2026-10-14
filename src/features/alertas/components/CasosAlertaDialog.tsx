import { Link } from 'react-router'
import { Modal } from '@/components/ui/Modal'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { Table, type Column } from '@/components/ui/Table'
import { CATEGORIA_LABEL, VEREDA_LABEL } from '@/locales/es'
import { PATHS } from '@/routes/paths'
import { formatearFecha } from '@/utils/fechas'
import type { Alerta, CasoAlerta } from '../types'

const lista = (codigos: string[]) => codigos.map((c) => `#${c}`).join(', ')

/**
 * «Casos involucrados» (diseño 06): caso, productor, finca, resultado y envío. El enlace al
 * caso solo aparece si quien consulta puede abrirlo (el técnico, solo los suyos).
 */
export function CasosAlertaDialog({ alerta, onClose }: { alerta: Alerta; onClose: () => void }) {
  const cat = CATEGORIA_LABEL[alerta.categoria]
  const columnas: Column<CasoAlerta>[] = [
    {
      key: 'caso',
      header: 'Caso',
      width: '80px',
      render: (c) =>
        c.enlazable ? (
          <Link to={PATHS.caso(c.id)} className="codigo enlace">
            #{c.codigo}
          </Link>
        ) : (
          <span className="codigo">#{c.codigo}</span>
        ),
    },
    { key: 'productor', header: 'Productor', render: (c) => c.productor_nombre },
    { key: 'finca', header: 'Finca', render: (c) => c.finca_nombre },
    {
      key: 'resultado',
      header: 'Resultado',
      render: (c) => <ResultadoTecnicoBadge resultado={c.resultado_tecnico} />,
    },
    {
      key: 'envio',
      header: 'Envío',
      className: 'text-tinta-secundaria tabular-nums',
      render: (c) => formatearFecha(c.enviado_en),
    },
  ]
  const n = alerta.sin_diagnostico.length
  return (
    <Modal
      open
      onClose={onClose}
      position="top"
      size="lg"
      title="Casos involucrados"
      description={`${alerta.id} · ${cat} · ${VEREDA_LABEL[alerta.vereda]}`}
    >
      <div className="overflow-hidden rounded-[10px] border border-borde">
        <Table
          label={`Casos de la alerta ${alerta.id}`}
          columns={columnas}
          rows={alerta.casos}
          rowKey={(c) => c.id}
        />
      </div>
      {n > 0 && (
        <p className="text-cuerpo-sm text-tinta-terciaria">
          En la misma zona hay {n === 1 ? '1 caso' : `${n} casos`} de {cat} sin diagnóstico técnico
          ({lista(alerta.sin_diagnostico)}). No cuentan para la alerta hasta que se confirmen.
        </p>
      )}
    </Modal>
  )
}
