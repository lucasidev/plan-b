# ADR-0095: The session renews itself in the middleware

- **Estado**: aceptado
- **Fecha**: 2026-09-13

## Contexto

La API emite un access token de 15 minutos y un refresh token de 30 días que guarda en Redis con rotación ([ADR-0023](0023-auth-flow-jwt-cookie-layout-guards.md)). El frontend solo verifica el access token ([`session.ts`](../../frontend/src/lib/session.ts)) y, cuando venció, los guards de layout mandan a Ingresar: nadie llama nunca al refresh, así que la sesión dura 15 minutos aunque el refresh siga vigente (hallazgo L11, [recorrido de Lucía del 2026-09-13](../history/reviews/2026-09-13-lucia-walk.md)).

ADR-0023 prometía el refresh silencioso "al renderizar el layout", y esa forma es imposible por dos razones que aparecieron después: la cookie `planb_refresh` nació con `Path=/api/identity`, así que el navegador solo la manda a esa ruta y el servidor de Next nunca la ve cuando sirve una página; y un Server Component no puede escribir cookies en Next 15, solo un Server Action, un Route Handler o el middleware.

Renovar en un middleware con las cookies rotadas por el backend es el patrón habitual de las capas server-side sobre un backend de tokens (el mismo que usan los adaptadores SSR de Supabase, Auth.js y Clerk): el servidor que sirve la página renueva antes de renderizarla, y el cliente no participa.

## Decisión

1. **La cookie `planb_refresh` pasa a `Path=/`**, con los mismos atributos (httpOnly, Secure, SameSite=Lax, 30 días). Viaja en cada pedido al servidor de Next, que es el mismo origen: sigue sin ser legible desde JavaScript.
2. **`frontend/src/middleware.ts` renueva la sesión** en las rutas con cuenta (`/home`, `/reviews/*`, `/my-profile`, `/settings`, `/help`, `/admin/*`): verifica el access token con la misma clave que `session.ts`; si falta o vence en menos de dos minutos y hay refresh, llama a `POST /api/identity/refresh` del backend con esa cookie, reenvía a la respuesta los `Set-Cookie` rotados que el backend emite, y sigue el mismo pedido con el access token nuevo en la cabecera `Cookie`, así el render ya lo ve. Si el refresh falla, no toca nada y el guard manda a Ingresar como hoy.
3. **El middleware no autoriza.** Los guards de layout y el backend siguen decidiendo quién entra a qué; el middleware solo mantiene viva una sesión que el backend reconoce.
4. **La rotación se reclama de forma atómica en el backend**: Redis consume el refresh token viejo antes de emitir el par nuevo, así que dos pedidos concurrentes no pueden ganar la misma rotación. Dentro de un mismo proceso de Next, los pedidos reales con el mismo token comparten una sola llamada; los prefetch no renuevan porque no deben gastar una rotación. No hay detección de reuso que revoque la cadena entera: un token consumido y uno inventado siguen siendo indistinguibles y responden 401.

## Alternativas consideradas

- **A. Un keep-alive del lado del cliente**, que llame al refresh cada tanto mientras la pestaña está abierta. Descartada: al recargar después del vencimiento, el servidor redirige a Ingresar antes de que corra un solo script; no cubre los Server Actions; y depende de que el cliente esté vivo.
- **B. Un access token largo**. Es lo que la mitigación del stage hizo para la demo (`JWT__AccessTokenMinutes=480`). Descartada como diseño: un token robado viviría horas, y el refresh existe justamente para que el access token sea corto.
- **C. Sesión en el servidor con cookie opaca.** Descartada: rehace ADR-0023 entero por un problema que se resuelve con una línea en la API y un middleware.

## Consecuencias

- El refresh token viaja en cada pedido de página. Mismo origen, httpOnly, SameSite=Lax: no lo lee JavaScript ni lo manda un formulario cruzado.
- Las cookies emitidas con el `Path` viejo no sirven para renovar: quien entró antes de este cambio vuelve a entrar una vez.
- La variable `JWT__AccessTokenMinutes` de la Application API del stage se borra al desplegar esto; el default vuelve a 15 minutos.
- El matcher del middleware excluye lo público, `/api` y los estáticos: una lectura sin cuenta no paga nada.
- Lo que se prueba: el decisor puro y la coordinación de pedidos concurrentes en vitest; el consumo único del refresh viejo contra Redis en integración; y en E2E que una sesión sin `planb_session` y con `planb_refresh` sigue adentro al cargar una página con cuenta, mientras que sin ninguna de las dos va a Ingresar.

## Refs

- [ADR-0023](0023-auth-flow-jwt-cookie-layout-guards.md) (el flujo de auth; el punto 4 remite acá)
- [`frontend/src/lib/session.ts`](../../frontend/src/lib/session.ts) (la verificación del access token que el middleware reutiliza)
- [`SignInEndpoint.cs`](../../backend/modules/identity/src/Planb.Identity.Application/Features/SignIn/SignInEndpoint.cs) (las cookies y su `Path`)
- [`RefreshEndpoint.cs`](../../backend/modules/identity/src/Planb.Identity.Application/Features/Refresh/RefreshEndpoint.cs) (el refresh rota las dos cookies)
