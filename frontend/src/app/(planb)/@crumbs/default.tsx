/**
 * Fallback de último recurso del slot `@crumbs`. Next lo pide cuando ningún `page.tsx` del slot
 * (una ficha o el catch-all) matchea la URL; en `(planb)` no debería pasar, porque el catch-all
 * (`[...catchAll]`) cubre cualquier segmento. Sin params de ruta acá (es la raíz del slot): no hay
 * con qué armar una miga real, así que no renderiza nada en vez de inventar una.
 */
export default function CrumbsDefault() {
  return null;
}
