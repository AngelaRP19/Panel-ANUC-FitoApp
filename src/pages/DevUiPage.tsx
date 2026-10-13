// Catálogo de componentes (solo desarrollo, ruta /dev/ui). Muestra cada componente en sus
// estados para compararlo con el sistema de diseño «anucfito» y los artboards «Estados».
import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Archive,
  CircleCheck,
  ClipboardList,
  MapPin,
  Search,
  Shuffle,
  CircleHelp,
  SlidersHorizontal,
  UserMinus,
} from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageHeader } from '@/components/layout/PageHeader'
import { Aviso } from '@/components/ui/Aviso'
import { BarraCoincidencia } from '@/components/ui/BarraCoincidencia'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, KpiCard } from '@/components/ui/Card'
import { CategoriaMarca } from '@/components/ui/CategoriaMarca'
import { Checkbox } from '@/components/ui/Checkbox'
import { Chip, FilterChip } from '@/components/ui/Chip'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EstadoAlertaBadge, EstadoCasoBadge, EstadoCuentaBadge } from '@/components/ui/EstadoBadge'
import { fieldDescriptionId, FormField, RequiredLegend } from '@/components/ui/FormField'
import { FotoEvidencia } from '@/components/ui/FotoEvidencia'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { OpcionRadio } from '@/components/ui/OpcionRadio'
import { Pagination } from '@/components/ui/Pagination'
import { ResultadoTecnicoBadge } from '@/components/ui/ResultadoTecnicoBadge'
import { RolBadge } from '@/components/ui/RolBadge'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { Table, type Column } from '@/components/ui/Table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { Tooltip } from '@/components/ui/Tooltip'
import { usePageTitle } from '@/hooks/usePageTitle'
import { MENSAJES } from '@/locales/es'
import { casos, type CasoFixture } from '@/mocks/fixtures/casos'
import { Categoria, EstadoAlerta, EstadoCaso, ResultadoTecnico, Rol } from '@/types/enums'
import { formatearFechaHora } from '@/utils/fechas'
import { formatearCoordenadas } from '@/utils/numeros'
import { formatearTelefono } from '@/utils/telefono'

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="sobretitulo">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

const COLORES = [
  ['verde-950', 'bg-verde-950'],
  ['verde-900', 'bg-verde-900'],
  ['verde-800', 'bg-verde-800'],
  ['verde-700', 'bg-verde-700'],
  ['verde-600', 'bg-verde-600'],
  ['verde-500', 'bg-verde-500'],
  ['verde-400', 'bg-verde-400'],
  ['verde-300', 'bg-verde-300'],
  ['verde-200', 'bg-verde-200'],
  ['verde-100', 'bg-verde-100'],
  ['verde-50', 'bg-verde-50'],
  ['tinta', 'bg-tinta'],
  ['tinta-secundaria', 'bg-tinta-secundaria'],
  ['tinta-terciaria', 'bg-tinta-terciaria'],
  ['borde', 'bg-borde'],
  ['borde-control', 'bg-borde-control'],
  ['info', 'bg-info'],
  ['advertencia', 'bg-advertencia'],
  ['peligro', 'bg-peligro'],
  ['revision', 'bg-revision'],
  ['neutro', 'bg-neutro'],
  ['inactivo', 'bg-inactivo'],
  ['calor-1', 'bg-calor-1'],
  ['calor-2', 'bg-calor-2'],
  ['calor-3', 'bg-calor-3'],
  ['calor-4', 'bg-calor-4'],
] as const

const COLUMNAS: Column<CasoFixture>[] = [
  {
    key: 'caso',
    header: 'Caso',
    width: '88px',
    render: (c) => <span className="codigo font-semibold text-verde-700">#{c.codigo}</span>,
    skeletonWidth: '44px',
  },
  { key: 'prod', header: 'Productor', render: (c) => c.productor.nombre },
  {
    key: 'pre',
    header: 'Preliminar',
    render: (c) =>
      c.preliminar ? (
        <CategoriaMarca categoria={c.preliminar.categoria} porcentaje={c.preliminar.porcentaje} />
      ) : (
        <span className="text-tinta-terciaria">—</span>
      ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (c) => <EstadoCasoBadge estado={c.estado} />,
    skeletonWidth: '120px',
  },
  {
    key: 'envio',
    header: 'Enviado al panel',
    render: (c) => (c.enviado_a_panel_en ? formatearFechaHora(c.enviado_a_panel_en) : 'Sin enviar'),
  },
]

export default function DevUiPage() {
  usePageTitle('Catálogo de componentes')
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [check, setCheck] = useState(true)
  const [interruptor, setInterruptor] = useState(true)
  const [chip, setChip] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [tabla, setTabla] = useState<'datos' | 'cargando' | 'vacio' | 'error'>('datos')
  const [seleccion, setSeleccion] = useState<string | null>('c-0239')
  const filasPagina = casos.slice((pagina - 1) * 5, pagina * 5)

  return (
    <main id="contenido" className="mx-auto flex max-w-300 flex-col gap-10 px-4 py-10 sm:px-8">
      <PageHeader
        title="Catálogo de componentes"
        description="Solo en desarrollo. Sistema de diseño «anucfito»: tokens, componentes y estados."
      />

      <Seccion id="s-color" titulo="Colores (tokens)">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {COLORES.map(([nombre, clase]) => (
            <div key={nombre} className="overflow-hidden rounded-md border border-borde bg-blanco">
              <div className={`h-12 ${clase}`} />
              <p className="px-2 py-1 codigo">{nombre}</p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion id="s-tipo" titulo="Tipografía">
        <Card className="flex flex-col gap-2 p-6">
          <p className="titulo-display">display · Casos pendientes de revisión</p>
          <p className="titulo-h1">h1 · Caso #0241 · Finca El Porvenir</p>
          <p className="titulo-h2">h2 · Resultado del análisis preliminar</p>
          <p className="titulo-h3">h3 · Evidencias fotográficas</p>
          <p className="font-titulos text-kpi font-bold">18</p>
          <p className="text-cuerpo">cuerpo · El productor reporta manchas húmedas en el fruto.</p>
          <p className="text-cuerpo-sm">cuerpo-sm · Vereda Juracambita · Gulupa</p>
          <p className="etiqueta">etiqueta · Resultado técnico</p>
          <p className="sobretitulo">sobretítulo · Estado del caso</p>
          <p className="codigo">
            código · {formatearCoordenadas(5.2481, -73.1702)} · {formatearTelefono('+573134027781')}{' '}
            · #0241 · ALR-012
          </p>
          <p className="text-cuerpo-sm text-tinta-terciaria">
            Fecha: {formatearFechaHora('2026-09-28T14:14:00Z')}
          </p>
        </Card>
      </Seccion>

      <Seccion id="s-botones" titulo="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="text">Texto</Button>
          <Button size="sm">Pequeño</Button>
          <Button size="lg">Ingresar (44 px)</Button>
          <Button variant="secondary">
            <SlidersHorizontal aria-hidden="true" /> Con icono
          </Button>
          <Button disabled>Deshabilitado</Button>
          <Button loading>Guardando…</Button>
          <Tooltip content="Ayuda breve al enfocar o pasar el cursor">
            <Button variant="secondary" size="icon" aria-label="Buscar">
              <Search aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
        <p className="text-nota text-tinta-terciaria">
          Pulsa Tab para ver el foco visible de 2 px (verde-600).
        </p>
      </Seccion>

      <Seccion id="s-campos" titulo="Formularios">
        <Card className="grid gap-5 p-6 md:grid-cols-3">
          <div className="md:col-span-3">
            <RequiredLegend />
          </div>
          <FormField
            label="Correo electrónico"
            htmlFor="d-correo"
            required
            hint={MENSAJES.ayudaCorreo}
          >
            <Input id="d-correo" type="email" aria-describedby={fieldDescriptionId('d-correo')} />
          </FormField>
          <FormField label="Celular" htmlFor="d-cel" required error={MENSAJES.celularDuplicado}>
            <Input
              id="d-cel"
              mono
              defaultValue="310 482 1937"
              invalid
              aria-describedby={fieldDescriptionId('d-cel')}
            />
          </FormField>
          <FormField
            label="Categoría (bloqueada)"
            htmlFor="d-dis"
            hint="Se toma de la alerta confirmada"
          >
            <Input
              id="d-dis"
              defaultValue="Trips"
              disabled
              aria-describedby={fieldDescriptionId('d-dis')}
            />
          </FormField>
          <FormField label="Vereda" htmlFor="d-ver">
            <Select
              id="d-ver"
              placeholder="Todas las veredas"
              options={[
                { value: 'JURACAMBITA', label: 'Juracambita' },
                { value: 'CENTRO', label: 'Centro' },
                { value: 'SAN_LUIS', label: 'San Luis' },
              ]}
            />
          </FormField>
          <FormField label="Descripción" htmlFor="d-desc" hint="Observaciones y recomendación">
            <Textarea id="d-desc" aria-describedby={fieldDescriptionId('d-desc')} />
          </FormField>
          <div className="flex flex-col gap-3">
            <Checkbox checked={check} onCheckedChange={setCheck} label="Gulupa" />
            <Checkbox
              checked="indeterminate"
              onCheckedChange={() => {}}
              label="Selección parcial"
            />
            <Checkbox checked={false} onCheckedChange={() => {}} label="Deshabilitada" disabled />
            <Switch checked={interruptor} onCheckedChange={setInterruptor} label="Activo" />
          </div>
          <fieldset className="flex flex-col gap-2 md:col-span-3">
            <legend className="mb-1.5 etiqueta">
              Resultado <span className="text-peligro">*</span>
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              <OpcionRadio
                name="res"
                defaultChecked
                titulo="Confirmado"
                icono={CircleCheck}
                descripcion="La identificación preliminar (Botrytis) es correcta."
              />
              <OpcionRadio
                name="res"
                titulo="Otra patología"
                icono={Shuffle}
                descripcion="Determinaste otra categoría fitosanitaria."
              />
              <OpcionRadio
                name="res"
                titulo="No identificado"
                icono={CircleHelp}
                descripcion="Tampoco puedes determinar la categoría con esta información."
              />
              <OpcionRadio
                name="res"
                titulo="Requiere visita"
                icono={MapPin}
                descripcion="Necesitas ir a la finca antes de decidir."
              />
            </div>
          </fieldset>
        </Card>
      </Seccion>

      <Seccion id="s-insignias" titulo="Insignias, categorías y coincidencia">
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap gap-2">
            {Object.values(EstadoCaso).map((e) => (
              <EstadoCasoBadge key={e} estado={e} />
            ))}
            <EstadoCasoBadge estado="VALOR_NUEVO_DE_LA_API" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(EstadoAlerta).map((e) => (
              <EstadoAlertaBadge key={e} estado={e} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoCuentaBadge activo />
            <EstadoCuentaBadge activo={false} />
            <RolBadge rol={Rol.LIDER_TECNICO} />
            <RolBadge rol={Rol.TECNICO} />
            {Object.values(ResultadoTecnico).map((r) => (
              <ResultadoTecnicoBadge key={r} resultado={r} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.values(Categoria).map((c) => (
              <CategoriaMarca key={c} categoria={c} nombrarForma />
            ))}
            <CategoriaMarca categoria={null} />
          </div>
          <div className="flex max-w-120 flex-col gap-2">
            <BarraCoincidencia categoria="BOTRYTIS" porcentaje={58} />
            <BarraCoincidencia categoria="RONA" porcentaje={41} alterna />
            <p className="text-nota text-tinta-terciaria">{MENSAJES.avisoPreliminar}</p>
          </div>
        </Card>
      </Seccion>

      <Seccion id="s-avisos" titulo="Avisos">
        <div className="grid gap-3 md:grid-cols-2">
          <Aviso tono="info">{MENSAJES.avisoAlerta}</Aviso>
          <Aviso tono="adv" titulo="2 casos pendientes sin técnico.">
            Asígnalos desde la bandeja.
          </Aviso>
          <Aviso tono="peligro" titulo="No pudimos iniciar sesión." rol="none">
            {MENSAJES.credencialesIncorrectas}
          </Aviso>
          <Aviso tono="ok" titulo="Contraseña actualizada." rol="none">
            Inicia sesión.
          </Aviso>
        </div>
      </Seccion>

      <Seccion id="s-tarjetas" titulo="Tarjetas e indicadores">
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            to="#"
            rotulo="Pendientes de revisión"
            valor={7}
            pie="Sin técnico asignado"
            icon={ClipboardList}
            tono="adv"
            ariaLabel="7 casos pendientes de revisión"
          />
          <KpiCard
            to="#"
            rotulo="En revisión"
            valor={9}
            pie="Con técnico asignado y sin diagnóstico"
            icon={Search}
            tono="revision"
            ariaLabel="9 casos en revisión"
          />
          <KpiCard
            to="#"
            rotulo="Cerrados en septiembre"
            valor={14}
            pie="11 confirmados · 2 otra patología · 1 no identificado"
            icon={CircleCheck}
            tono="ok"
            ariaLabel="14 casos cerrados en septiembre"
          />
          <KpiCard
            to="#"
            rotulo="Próximos a vencer"
            valor={2}
            pie="Fecha de vencimiento de conservación en menos de 15 días"
            icon={Archive}
            tono="neutro"
            ariaLabel="2 casos próximos a vencer"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card labelledBy="d-card">
            <CardHeader
              id="d-card"
              overline="Resultado técnico · decisión humana"
              title="Registrar diagnóstico técnico"
              subtitle="Tarjeta con cabecera"
            />
            <div className="p-6 text-cuerpo-sm">Contenido de la tarjeta.</div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-3 titulo-h3">Evidencias fotográficas</h3>
            <div className="grid grid-cols-4 gap-3">
              <FotoEvidencia
                numero={1}
                caption="Hoja 1"
                alt="Evidencia hoja 1 · caso #0241"
                onOpen={() => toast.info('Visor', 'Se abriría el visor ampliado.')}
              />
              <FotoEvidencia
                numero={2}
                caption="Envés 1"
                alt="Evidencia envés 1 · caso #0241"
                onOpen={() => {}}
              />
              <FotoEvidencia
                numero={3}
                caption="Fruto 2"
                alt="Evidencia fruto 2 · caso #0241"
                onOpen={() => {}}
              />
              <FotoEvidencia vacia caption="Sin fotos" alt="" />
            </div>
          </Card>
        </div>
      </Seccion>

      <Seccion id="s-tabla" titulo="Tabla, pestañas, chips y paginación">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-cuerpo-sm text-tinta-secundaria">Ver estado:</span>
          {(['datos', 'cargando', 'vacio', 'error'] as const).map((t) => (
            <Chip key={t} pressed={tabla === t} onClick={() => setTabla(t)}>
              {t}
            </Chip>
          ))}
        </div>
        <Card className="overflow-hidden">
          <Tabs defaultValue="todos" className="px-4">
            <TabsList aria-label="Estado del caso">
              <TabsTrigger value="todos" count={32}>
                Todos
              </TabsTrigger>
              <TabsTrigger value="pend" count={2}>
                Pendiente de revisión
              </TabsTrigger>
              <TabsTrigger value="rev" count={9}>
                En revisión
              </TabsTrigger>
              <TabsTrigger value="cer" count={14}>
                Cerrado
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <Chip pressed={chip} onClick={() => setChip((v) => !v)}>
              Trips
            </Chip>
            <Chip disabled>Bloqueado</Chip>
            <FilterChip removeLabel="Quitar filtro Vereda: Juracambita" onRemove={() => {}}>
              Vereda: Juracambita
            </FilterChip>
            <Button variant="text" size="sm">
              {MENSAJES.limpiarFiltros}
            </Button>
          </div>
          {tabla === 'error' ? (
            <ErrorState
              title="No se pudo cargar la bandeja"
              description={`${MENSAJES.errorConexionTexto} Lo que escribiste en el diagnóstico no se ha perdido.`}
              onRetry={() => setTabla('datos')}
            />
          ) : (
            <Table
              label="Casos de ejemplo"
              columns={COLUMNAS}
              rows={tabla === 'vacio' ? [] : filasPagina}
              rowKey={(c) => c.id}
              loading={tabla === 'cargando'}
              loadingLabel="Cargando casos"
              selectedKey={seleccion}
              onRowOpen={(c) => setSeleccion(c.id)}
              rowLabel={(c) => `Caso #${c.codigo}, ${c.productor.nombre}. Ver resumen`}
              empty={
                <EmptyState
                  icon={Search}
                  title={MENSAJES.sinResultadosTitulo}
                  message={MENSAJES.sinResultadosTexto}
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setTabla('datos')}>
                      {MENSAJES.limpiarFiltros}
                    </Button>
                  }
                />
              }
            />
          )}
          <Pagination
            page={pagina}
            pageSize={5}
            total={casos.length}
            noun="casos"
            onPageChange={setPagina}
            pageSizeOptions={[5, 10]}
            onPageSizeChange={() => {}}
          />
        </Card>
      </Seccion>

      <Seccion id="s-estados" titulo="Estados de carga">
        <div className="grid gap-4 md:grid-cols-4">
          {[60, 70, 55, 65].map((w) => (
            <Card key={w} className="flex flex-col gap-2.5 p-5">
              <Skeleton style={{ width: `${w}%`, height: 12 }} />
              <Skeleton style={{ width: '40%', height: 32 }} />
              <Skeleton style={{ width: '80%', height: 12 }} />
            </Card>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Spinner etiqueta="Cargando casos" />
          <span className="text-cuerpo-sm text-tinta-terciaria">
            Spinner con texto para lector de pantalla
          </span>
        </div>
      </Seccion>

      <Seccion id="s-ventanas" titulo="Ventanas, avisos de éxito y ayuda">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>
            Abrir resumen (modal)
          </Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            Abrir ficha (panel lateral)
          </Button>
          <Button variant="danger" onClick={() => setConfirmar(true)}>
            <UserMinus aria-hidden="true" /> Confirmación destructiva
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.exito('Diagnóstico guardado', 'Caso #0241 · ya puedes cerrar el caso.')
            }
          >
            Aviso de éxito
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error('No se guardó el diagnóstico', 'Revisa el campo marcado.')}
          >
            Aviso de error
          </Button>
        </div>
        <Breadcrumb items={[{ label: 'Bandeja de casos', to: '#' }, { label: 'Caso #0241' }]} />
      </Seccion>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Caso #0241"
        headerExtra={<EstadoCasoBadge estado="EN_REVISION" />}
        description="Enviado al panel 28 sep 2026 · 09:14 · 6 h en espera"
        size="sm"
        position="top"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModal(false)}>Ver detalle</Button>
          </>
        }
      >
        <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2.5 text-cuerpo-sm">
          <dt className="text-tinta-secundaria">Productor</dt>
          <dd className="font-medium">
            María Rojas Cárdenas
            <small className="block codigo font-normal text-tinta-terciaria">310 482 1937</small>
          </dd>
          <dt className="text-tinta-secundaria">Identificación preliminar</dt>
          <dd>
            <CategoriaMarca categoria="BOTRYTIS" porcentaje={86} />
          </dd>
        </dl>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Wilmar Torres"
        headerExtra={<EstadoCuentaBadge activo />}
        description="Líder técnico · administra todo el panel"
        footer={
          <Button variant="secondary" onClick={() => setDrawer(false)}>
            Editar datos
          </Button>
        }
      >
        <Switch checked={interruptor} onCheckedChange={setInterruptor} label="Cuenta activa" />
      </Drawer>

      <ConfirmDialog
        open={confirmar}
        danger
        icon={AlertTriangle}
        title="¿Descartar la alerta ALR-012?"
        message="La posible concentración de Trips en Juracambita quedará como Descartada y no se enviará ningún mensaje. Esta acción queda en el historial."
        confirmLabel="Descartar alerta"
        onCancel={() => setConfirmar(false)}
        onConfirm={() => setConfirmar(false)}
      >
        <FormField label="Motivo del descarte" htmlFor="d-motivo" required>
          <Textarea id="d-motivo" rows={3} />
        </FormField>
      </ConfirmDialog>
    </main>
  )
}
