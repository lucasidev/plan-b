// Noop shim de `server-only` para vitest.
//
// El paquete `server-only` (Vercel) lanza un error si se carga: su propósito es
// hacer `import 'server-only'` fallar en runtime cuando un client component lo
// importa. Para vitest este check es ruido: los tests no son ningún component
// type, importan código server libremente. Aliasamos a este shim vacío via
// `vitest.config.ts > resolve.alias > 'server-only'`.
export {};
