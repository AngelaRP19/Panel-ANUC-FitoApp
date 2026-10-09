/**
 * Access token en memoria (nunca en localStorage). El refresh token viaja en
 * cookie HttpOnly y no es accesible desde JS.
 */
let accessToken: string | null = null

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token
  },
  clear: () => {
    accessToken = null
  },
}
