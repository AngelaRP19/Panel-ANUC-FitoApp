import { http, HttpResponse } from 'msw'
import type { Rol } from '@/types/enums'
import { casos } from '../fixtures/casos'
import { usuarios, type UsuarioFixture } from '../fixtures/usuarios'
import { API, errorApi, noAutenticado, usuarioActual } from './comun'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Casos activos de una cuenta: en revisión y registrados sin cerrar. */
const casosActivos = (id: string) =>
  casos.filter(
    (c) => c.tecnico?.id === id && (c.estado === 'EN_REVISION' || c.estado === 'REGISTRADO'),
  )

const unicaActiva = (u: UsuarioFixture) =>
  u.activo && usuarios.filter((x) => x.rol === u.rol && x.activo).length === 1

function aCuenta(u: UsuarioFixture) {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    celular: u.celular,
    rol: u.rol,
    activo: u.activo,
    casos_activos: casosActivos(u.id).length,
    casos_pendientes: casos.filter((c) => c.tecnico?.id === u.id && c.estado === 'EN_REVISION')
      .length,
    unica_activa_del_rol: unicaActiva(u),
  }
}

function soloLider(request: Request) {
  const u = usuarioActual(request)
  if (!u) return noAutenticado()
  if (u.rol !== 'LIDER_TECNICO') {
    return errorApi(403, 'SOLO_LIDER', 'Esta sección es solo para el líder técnico.')
  }
  return null
}

interface CuerpoCuenta {
  nombre?: string
  correo?: string
  celular?: string
  rol?: Rol
}

export function validar(b: CuerpoCuenta, excluirId?: string) {
  const campos: Record<string, string> = {}
  if (!b.nombre?.trim()) campos.nombre = 'Escribe el nombre completo.'
  if (!b.correo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.correo)) {
    campos.correo = 'Escribe un correo válido, por ejemplo nombre@anuc.org'
  } else if (
    usuarios.some((u) => u.correo.toLowerCase() === b.correo!.toLowerCase() && u.id !== excluirId)
  ) {
    campos.correo = 'Este correo ya está registrado'
  }
  if (!b.celular || !/^\+573\d{9}$/.test(b.celular)) {
    campos.celular = 'Escribe un celular de 10 dígitos que empiece por 3'
  } else if (usuarios.some((u) => u.celular === b.celular && u.id !== excluirId)) {
    campos.celular = 'Este número de celular ya está registrado'
  }
  if (b.rol !== 'LIDER_TECNICO' && b.rol !== 'TECNICO') campos.rol = 'Selecciona el rol.'
  return campos
}

export const usuariosHandlers = [
  // Cuentas del panel. Con `con_carga` devuelve la lista para asignar casos (pantalla 5): solo
  // cuentas de rol TECNICO activas con su carga (D-02: la cuenta de técnico del líder es una
  // más; el rol líder nunca recibe casos). Sin él, la lista paginada de la pantalla Técnicos.
  http.get(`${API}/tecnicos`, ({ request }) => {
    const u = usuarioActual(request)
    if (!u) return noAutenticado()
    const p = new URL(request.url).searchParams
    if (p.get('con_carga')) {
      const lista = usuarios
        .filter((x) => x.activo && x.rol === 'TECNICO')
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((x) => ({
          id: x.id,
          nombre: x.nombre,
          rol: x.rol,
          activos: casosActivos(x.id).length,
          en_revision: casos.filter((c) => c.tecnico?.id === x.id && c.estado === 'EN_REVISION')
            .length,
        }))
      return HttpResponse.json(lista)
    }

    const r = soloLider(request)
    if (r) return r
    const q = normalizar(p.get('q') ?? '').trim()
    const lista = usuarios
      .map(aCuenta)
      .filter((x) => {
        if (q && !normalizar(`${x.nombre} ${x.correo}`).includes(q)) return false
        if (p.get('rol') && x.rol !== p.get('rol')) return false
        if (p.get('estado') === 'activa' && !x.activo) return false
        if (p.get('estado') === 'deshabilitada' && x.activo) return false
        if (p.get('carga') === 'pendientes' && x.casos_pendientes === 0) return false
        if (p.get('carga') === 'sin' && x.casos_activos > 0) return false
        return true
      })
      // Líderes primero; dentro de cada rol, por nombre.
      .sort((a, b) =>
        a.rol === b.rol ? a.nombre.localeCompare(b.nombre) : a.rol === 'LIDER_TECNICO' ? -1 : 1,
      )
    const page = Math.max(1, Number(p.get('page') ?? 1))
    const size = Number(p.get('page_size') ?? 10)
    return HttpResponse.json({
      items: lista.slice((page - 1) * size, page * size),
      total: lista.length,
      page,
      page_size: size,
    })
  }),

  http.get(`${API}/tecnicos/:id`, ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const u = usuarios.find((x) => x.id === params.id)
    return u
      ? HttpResponse.json(aCuenta(u))
      : errorApi(404, 'NO_ENCONTRADO', 'La cuenta no existe.')
  }),

  // Registrar cuenta (RQF01, RQF03): recibe una contraseña temporal por correo (RQF11).
  http.post(`${API}/tecnicos`, async ({ request }) => {
    const r = soloLider(request)
    if (r) return r
    const b = (await request.json()) as CuerpoCuenta
    const campos = validar(b)
    if (Object.keys(campos).length) {
      return errorApi(409, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    const nueva: UsuarioFixture = {
      id: `u-${Date.now()}`,
      nombre: b.nombre!.trim(),
      correo: b.correo!.trim().toLowerCase(),
      celular: b.celular!,
      rol: b.rol!,
      activo: true,
      contrasena: 'temporal1',
      contrasenaTemporal: true,
    }
    usuarios.push(nueva)
    return HttpResponse.json(aCuenta(nueva), { status: 201 })
  }),

  // Editar datos (RQF05). Los datos de otro líder se editan desde su propia cuenta (P-11).
  http.patch(`${API}/tecnicos/:id`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const u = usuarios.find((x) => x.id === params.id)
    if (!u) return errorApi(404, 'NO_ENCONTRADO', 'La cuenta no existe.')
    if (u.rol === 'LIDER_TECNICO') {
      return errorApi(403, 'EDITAR_LIDER', 'Los datos del líder técnico se editan desde Mi cuenta.')
    }
    const b = (await request.json()) as CuerpoCuenta
    const campos = validar({ ...b, rol: b.rol ?? u.rol }, u.id)
    if (Object.keys(campos).length) {
      return errorApi(409, 'VALIDACION', 'Revisa los campos marcados.', campos)
    }
    u.nombre = b.nombre!.trim()
    u.correo = b.correo!.trim().toLowerCase()
    u.celular = b.celular!
    u.rol = b.rol ?? u.rol
    return HttpResponse.json(aCuenta(u))
  }),

  // Activar / desactivar (RQF12, RQF13). No se puede dejar un rol sin cuentas activas.
  // Al desactivar un técnico, sus casos activos vuelven a la bandeja sin técnico.
  http.patch(`${API}/tecnicos/:id/estado`, async ({ request, params }) => {
    const r = soloLider(request)
    if (r) return r
    const u = usuarios.find((x) => x.id === params.id)
    if (!u) return errorApi(404, 'NO_ENCONTRADO', 'La cuenta no existe.')
    const { activo } = (await request.json()) as { activo: boolean }
    if (!activo && unicaActiva(u)) {
      return errorApi(
        409,
        'UNICA_CUENTA_ACTIVA',
        'Es la única cuenta activa de su rol.',
        {},
        {
          rol: u.rol,
        },
      )
    }
    if (!activo) {
      for (const c of casosActivos(u.id)) {
        c.tecnico = null
        c.estado = 'PENDIENTE_REVISION'
      }
    }
    u.activo = activo
    return HttpResponse.json(aCuenta(u))
  }),
]
