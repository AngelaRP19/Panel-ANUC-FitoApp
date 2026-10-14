// Cuentas del panel tomadas del diseño (artboard 10 · Técnicos). Datos ficticios: solo mocks (P-16).
import type { Rol } from '@/types/enums'

export interface UsuarioFixture {
  id: string
  nombre: string
  correo: string
  /** E.164 */
  celular: string
  rol: Rol
  activo: boolean
  /** Contraseña que acepta el simulador de Cognito (solo desarrollo y pruebas). */
  contrasena: string
  /** true: el primer inicio exige cambiar la contraseña temporal (RQF11). */
  contrasenaTemporal?: boolean
}

/** Contraseña de todas las cuentas de demostración. */
export const CONTRASENA_DEMO = 'demo1234'

function crear(): UsuarioFixture[] {
  return [
    {
      id: 'u-wilmar',
      nombre: 'Wilmar Torres',
      correo: 'lider@anuc.test',
      celular: '+573134027781',
      rol: 'LIDER_TECNICO',
      activo: true,
      contrasena: CONTRASENA_DEMO,
    },
    {
      id: 'u-ana',
      nombre: 'Ana Lucía Becerra',
      correo: 'tecnico@anuc.test',
      celular: '+573112593046',
      rol: 'TECNICO',
      activo: true,
      contrasena: CONTRASENA_DEMO,
    },
    {
      id: 'u-jhon',
      nombre: 'Jhon Fredy Sanabria',
      correo: 'jhon.sanabria@anuc.test',
      celular: '+573207186624',
      rol: 'TECNICO',
      activo: true,
      contrasena: CONTRASENA_DEMO,
      contrasenaTemporal: true,
    },
    {
      id: 'u-diana',
      nombre: 'Diana Marcela Rincón',
      correo: 'diana.rincon@anuc.test',
      celular: '+573154902217',
      rol: 'TECNICO',
      activo: false,
      contrasena: CONTRASENA_DEMO,
    },
  ]
}

export const usuarios: UsuarioFixture[] = crear()

/** Restaura las cuentas del diseño (pruebas: contraseñas, altas, estados). */
export function reiniciarUsuarios() {
  usuarios.splice(0, usuarios.length, ...crear())
}

/** Datos públicos de la cuenta (lo que devuelve GET /me). */
export function aUsuarioMe(u: UsuarioFixture) {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    celular: u.celular,
    rol: u.rol,
    activo: u.activo,
  }
}
