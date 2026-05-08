# ADR-0023: Auth flow (JWT en cookie httpOnly + guards en layouts RSC)

- **Estado**: aceptado
- **Fecha**: 2026-04-23

## Contexto

El backend emite JWT al login exitoso. El frontend necesita:

1. **Guardar el JWT de forma segura** (inaccesible desde JavaScript para evitar XSS).
2. **Validar la sesión** en cada request protegido.
3. **Redireccionar apropiadamente** según estado de auth + role del usuario.
4. **Refrescar el token** antes de expirar sin forzar re-login.
5. **Cerrar sesión** limpiando state local y server-side.

Planb no usa proveedores OAuth externos (no hay SSO institucional estándar disponible; la verificación de docentes se hace manual o via email institucional propio, no delegada a un IdP). Toda la identidad es del backend de planb.

## Decisión

**Patrón: guards en layouts RSC, no middleware Edge.** (Inspirado en un patrón ya validado en otros proyectos Next.js con requerimientos similares: auth server-side, libs Node-only en el auth flow, pocas rutas públicas.) Adaptado para planb:

1. **Almacenamiento**: JWT en cookie **httpOnly, Secure, SameSite=Lax**, encriptada con `iron-session` o equivalente. Refresh token en cookie separada con los mismos atributos.

2. **Validación**: vía helper `getSession()` implementado en `lib/session.ts` que usa `cookies()` de `next/headers` + `jose` para verificar la firma JWT. Devuelve el payload tipado o null.

3. **Guards a nivel de layout por route group** (NO middleware Edge):

```tsx
// app/(member)/layout.tsx (RSC)
export default async function MemberLayout({ children }) {
  const session = await getSession()
  if (!session) redirect('/sign-in?from=' + encodeURIComponent(pathname))
  if (session.role !== 'member') redirect('/sign-in')
  return <>{children}</>
}

// app/(auth)/layout.tsx (RSC)
export default async function AuthLayout({ children }) {
  const session = await getSession()
  if (session) redirect('/dashboard')
  return <>{children}</>
}

// app/(staff)/layout.tsx (RSC)
export default async function StaffLayout({ children }) {
  const session = await getSession()
  if (!session || !['moderator', 'admin', 'university_staff'].includes(session.role)) {
    redirect('/sign-in')
  }
  return <>{children}</>
}
```

4. **Refresh silencioso**: al renderizar el layout, si el access token está a <2 minutos de expirar, el helper llama al endpoint de refresh del backend con el refresh token, y rota las cookies. Todo server-side, sin round-trip al cliente.

5. **Logout**: Server Action que invoca el endpoint de logout del backend (invalida el refresh token server-side) y borra cookies locales via `cookies().delete()`.

6. **Post-response tareas** (ej. logging del login): usar el nuevo `after()` API de Next.js 15 para ejecutar trabajo async después de enviar la respuesta al usuario, sin bloquear la UX.

## Alternativas consideradas

### A. Middleware en Edge runtime

Patrón canónico de Next.js (usado por Clerk, NextAuth default). `middleware.ts` intercepta cada request antes de que llegue a RSC. Redirige según estado de sesión.

Descartada por:

- Edge runtime es un subset de Node. Libs que usamos (`jose` para JWT, `iron-session` para encriptar) funcionan en Edge, pero si mañana agregamos rate limiting con Redis via `ioredis` (cliente Node-only), eso **no** funciona en Edge.
- Para proyectos con pocas rutas públicas, guards en layouts son más simples que un middleware centralizado y evitan el runtime split.
- Debuggear middleware Edge es más difícil (logs limitados, set de APIs distinto).

### B. NextAuth / Auth.js

Librería completa, popular. Maneja cookies, sessions, refresh, OAuth providers.

Descartada porque:

- Overkill para un flujo custom JWT sin OAuth providers. Nos bloqueás en su shape de `Session`, su middleware, sus callbacks.
- Añade ~200KB al bundle por features que no usamos.
- Su customización para JWT-propio es posible pero requiere más código que implementar los ~100 líneas de auth puro.

### C. Auth0 / Clerk / Supabase Auth

Servicios externos. Descartados porque: (1) costo (el proyecto explícitamente no gasta en servicios pagos: ver memoria de contexto), (2) añaden dependencia externa para algo que es corazón del sistema, (3) planb tiene su propia identidad, no hay razón para delegarla.

## Consecuencias

**Positivas:**

- Sin runtime split. Todo corre en Node, con todas las APIs disponibles.
- Guards declarativos por route group, alineados 1:1 con el modelo de actores del sistema.
- JWT en httpOnly cookie = inaccesible desde JS = XSS-resistant.
- Refresh silencioso mantiene sesiones largas sin re-login.
- `after()` API permite logging y analytics post-response sin bloquear UX.

**Negativas:**

- Cada request a una ruta protegida hace verificación JWT server-side (costo CPU mínimo por request).
- Si se agregan muchas rutas públicas distintas (`/forgot-password`, `/reset`, `/verify-email`, `/public-review/<id>`, etc.), la lógica podría empezar a duplicarse. Entonces se podría promover a un middleware compartido, o a helpers: sin volver al middleware Edge necesariamente.

**Security boundary critical:**

> El guard de frontend existe para UX. **La autorización real siempre se verifica en el backend**. Un frontend comprometido no puede escalar privilegios porque el backend valida el JWT y role en cada request.

**Refresh token rotation:**

- Al refreshear, el backend invalida el refresh token viejo y emite uno nuevo.
- Detección de reuso de refresh tokens (el backend detecta si un refresh token ya usado intenta reutilizarse) revoca toda la cadena de la sesión: defensa contra token theft.

**Cuándo revisitar:**

- Si aparecen requirements de SSO institucional (ej. integración con UNSTA campus).
- Si agregamos MFA (TOTP, WebAuthn).
- Si migramos Redis a un store Edge-compatible y el middleware pattern se vuelve viable.
