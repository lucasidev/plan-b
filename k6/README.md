# k6: cuánto aguanta el stage

Issue #464: cuántos lectores a la vez aguanta el VPS de 2 vCPU del stage antes de que la demo
se ponga lenta, y qué se degrada primero. k6 corre desde cualquier máquina contra una URL: no
hace falta instalarlo, se usa la imagen oficial (`grafana/k6`) vía podman o docker.

## Scripts

- **`read.js`**: perfil de lectura. Cada VU recorre cinco rutas públicas (la entrada, la ficha
  de materia 211, la ficha de Cátedra Pérez, Método y una búsqueda de catálogo) con `sleep(1)`
  entre cada una. Sube a `VUS` en 30s, sostiene 1 minuto, baja a 0 en 15s.
- **`write.js`**: perfil de escritura, contra una cuenta ya sembrada. Mide el sign-in (lo caro
  de un ingreso: bcrypt, cost factor 12) y después una lectura autenticada de Mis aportes, para
  confirmar que la cookie de sesión quedó funcionando. **No publica reseñas**: hacerlo
  contaminaría el corpus del stage. Perfil más chico: sube a `VUS` en 30s, sostiene 30s, baja a
  0 en 10s.

## Cómo correr

Con podman:

```bash
podman run --rm -i -e BASE_URL=https://planb.olisar.com.ar -e VUS=10 \
  grafana/k6:latest run - < k6/read.js
```

Con docker:

```bash
docker run --rm -i -e BASE_URL=https://planb.olisar.com.ar -e VUS=10 \
  grafana/k6:latest run - < k6/read.js
```

`write.js` necesita además `SEED_EMAIL` y `SEED_PASSWORD`, la cuenta sembrada del stage (la
password es la de `personas.json`, pública, pero no se hardcodea en un script commiteado):

```bash
podman run --rm -i -e BASE_URL=https://planb.olisar.com.ar -e VUS=3 \
  -e SEED_EMAIL=lucia.mansilla@gmail.com -e SEED_PASSWORD=<la del stage> \
  grafana/k6:latest run - < k6/write.js
```

**Windows / pwsh**: el `<` de redirección de stdin no funciona igual ahí. Usá la receta
`just load` (abajo), que monta el archivo con `-v` en vez de stdin.

### Con `just`

```
just load read 10 https://planb.olisar.com.ar
just load write 3 https://planb.olisar.com.ar
```

Detecta el runtime (podman si el daemon responde, si no docker) igual que `infra-up`, y
reenvía `SEED_EMAIL`/`SEED_PASSWORD` del entorno del shell si están puestas. Corre el perfil
completo, no una corrida corta: para probar 1 VU durante unos segundos, usá directo el comando
de podman/docker de arriba con `--vus 1 --duration 5s`.

## Variables de entorno

| Variable | Script | Default | Para qué |
|---|---|---|---|
| `BASE_URL` | los dos | `https://planb.olisar.com.ar` | Contra qué ambiente corre. |
| `VUS` | los dos | `10` (read) / `3` (write) | Usuarios virtuales en el pico de cada perfil. |
| `SEED_EMAIL` | write | `lucia.mansilla@gmail.com` | Cuenta sembrada con la que hace sign-in. |
| `SEED_PASSWORD` | write | ninguno | Sin default a propósito: sin ella, `write.js` aborta en `setup()`, antes de pegarle al stage. |

## Qué miden los umbrales

- **`read.js`**: `http_req_failed < 5%` y `http_req_duration` p(95) `< 1.5s` sobre las cinco
  rutas juntas. Cada request lleva un tag `name` (`home`, `subject-ficha`, `chair-ficha`,
  `method`, `search`), para leer en el resumen cuál ruta se degrada primero.
- **`write.js`**: `http_req_failed < 5%` sobre todo, y además `http_req_duration{name:sign-in}`
  p(95) `< 3s` puntual sobre el sign-in (el request caro, separado de la lectura de después).

## Rate limiting del ingreso

Al momento de escribir esto, `SignInEndpoint` (`backend/modules/identity/src/Planb.Identity.Application/Features/SignIn/SignInEndpoint.cs`)
**no** usa `IRateLimiter`: a diferencia de register, forgot-password y resend-verification, el
sign-in no tiene cupo hoy. Si en algún momento se le suma uno, bajar `VUS` de `write.js` para
quedar debajo del cupo, porque si no esta corrida empieza a devolver 429.

## Dónde queda la medición

La corrida real contra el stage (cuántos VUs aguanta antes de degradar, y qué se degrada
primero) se anota en [`docs/engineering/deploy.md`](../docs/engineering/deploy.md), sección
"Carga".

## Secretos

Ninguno vive en este directorio ni en el repo. `SEED_PASSWORD` se pasa por variable de entorno
en el momento de correr, nunca hardcodeada en un script commiteado.
