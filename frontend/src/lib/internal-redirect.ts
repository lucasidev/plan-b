/**
 * Nombre de la cookie que hace de puente entre el registro y la verificación de mail (US-229):
 * el link del mail lo arma el backend sin conocer a dónde volver, así que es lo único que
 * sobrevive ese salto. Vida corta, igual que el link de verificación (24 hs, ver check-inbox).
 */
export const RETURN_TO_COOKIE = 'planb_from';
export const RETURN_TO_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Valida que un destino de "volver a lo que estaba haciendo" sea una ruta interna del producto.
 * Este valor siempre llega desde el cliente (query string, campo oculto de un form, cookie): es
 * entrada no confiable, y ninguna redirección se arma con el valor crudo sin pasar por acá.
 *
 * Devuelve el path (+ query + hash) tal como lo interpreta el browser, o `null` si el destino
 * apunta afuera del producto: un host externo, un scheme distinto, o una URL protocol-relative
 * ("//evil.com") que el browser resuelve como absoluta.
 */
export function sanitizeInternalRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;

  // Un origin fijo, inventado, sirve de vara: si tras resolver `raw` contra él el origin
  // cambió, `raw` estaba describiendo un host distinto (protocol-relative, o un truco de
  // parsing como "/\t/evil.com", donde el browser descarta el tab y lo lee como "//evil.com").
  const OWN_ORIGIN = 'https://planb.internal';
  try {
    const url = new URL(raw, OWN_ORIGIN);
    if (url.origin !== OWN_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
