# ADR-0043: GitHub App para pushes de bots que disparan workflows

- **Estado**: aceptado
- **Fecha**: 2026-05-18

## Contexto

El workflow `dependabot-bun-lockfile.yml` (introducido por PR #115, ADR informal en el commit message) detecta cuando Dependabot abre un PR de npm en `frontend/` con `package.json` modificado pero `bun.lock` desactualizado, regenera el lockfile con `bun install`, y commitea + pushea al branch del PR. El job de CI siguiente encuentra el lockfile consistente y pasa.

El problema: el workflow usa `secrets.GITHUB_TOKEN` para hacer el push. GitHub Actions tiene una restricción de seguridad documentada explícitamente: **pushes hechos con `GITHUB_TOKEN` NO disparan otros workflows**. Es una protección para prevenir loops infinitos (un workflow que se autodispara podría correr sin parar).

El efecto operativo:

1. Dependabot abre un PR → workflow `pull_request` dispara CI → CI falla por `bun.lock` viejo.
2. Workflow `dependabot-bun-lockfile.yml` (con `pull_request_target`) detecta el fallo → regenera lockfile → pushea con `GITHUB_TOKEN`.
3. **El push del paso 2 NO redispara CI.** Los checks del paso 1 quedan rojos en el PR para siempre.
4. Para mergear, alguien tiene que hacer manualmente `@dependabot recreate` (cierra el branch viejo, abre uno nuevo, dispara CI desde cero) o cerrar/reabrir el PR.

Este ciclo se repitió en **todos los Dependabot PRs de npm desde que aterrizó el workflow** (PRs #92, #108, #109, #112, #113). El workaround `@dependabot recreate` funciona pero es manual y se olvida; los PRs quedan abiertos con CI rojo aunque el lockfile ya esté regenerado correctamente en la rama.

## Decisión

Reemplazar `secrets.GITHUB_TOKEN` por un token generado dinámicamente desde una **GitHub App** dedicada (`planb-ci-bot`) usando `actions/create-github-app-token@v2`. Los pushes hechos con tokens de GitHub Apps **sí disparan workflows downstream** (a diferencia de `GITHUB_TOKEN`), porque GitHub trata cada App como un actor independiente.

Configuración de la App:

- **Nombre**: `planb-ci-bot` (instalada en cuenta personal lucasidev, no en org).
- **Repository permissions mínimas**:
  - `Contents: Read and write` (para pushear lockfile regenerado).
  - `Pull requests: Read and write` (futuro: agregar labels o comentarios desde workflows).
  - `Metadata: Read-only` (auto, no se puede desmarcar).
- **Webhook**: desactivado (no escuchamos eventos, solo generamos tokens).
- **Installation**: limitada al repo `plan-b` (`Only select repositories`).

Secrets del repo `plan-b`:

- `LOCKFILE_BOT_APP_ID`: número del App ID.
- `LOCKFILE_BOT_PRIVATE_KEY`: contenido completo del `.pem` (incluyendo headers).

## Consecuencias

### Positivas

- **Los PRs de Dependabot mergean limpios sin intervención humana.** El workflow regenera lockfile, pushea con App token, CI rerun automático, mergeo se desbloquea.
- **No atado a una persona.** El PAT (alternativa descartada) habría sido emitido por la cuenta personal de Lucas; si se va o expira, el workflow se rompe silencioso. La App es independiente.
- **Permissions granulares y auditables.** La App declara permisos explícitos en su config. Auditable desde Settings de GitHub.
- **Tokens cortos (1 hora).** Cada run del workflow genera un token nuevo con `actions/create-github-app-token@v2`. Si el token leakea, el blast radius es 1 hora.
- **Reusable para futuros workflows automatizados.** Si en un futuro queremos otros workflows que escriban al repo (auto-merge de Dependabot tier 1, auto-fixers de format, scripts de migration), reusan la misma App.

### Negativas

- **Setup inicial manual.** Crear la App requiere clics en Settings de GitHub (no scriptable desde el repo). Documentado en este ADR + en el comentario del workflow para que cualquiera del equipo lo reproduzca si la App se borra.
- **Onboarding de devs nuevos**: alguien que clone el repo y quiera entender por qué los workflows funcionan tiene que leer este ADR para entender de dónde sale el token. Mitigado: el workflow tiene un comment explícito que apunta a ADR-0043.
- **Dependencia externa pequeña**: `actions/create-github-app-token@v2`. Estable, mantenido por GitHub Actions org.

### Neutras

- **`GITHUB_TOKEN` sigue existiendo y se usa en los demás workflows** (CI, label, etc.). La App token solo aplica al workflow lockfile.
- **Path migracional no requerido**: el workflow viejo funciona hasta que pongamos los secrets de la App. Cuando los secrets están, basta cambiar 1 step para que tome el nuevo token.

## Alternativas consideradas

### A. PAT (Personal Access Token) de la cuenta de Lucas

Generar un Fine-grained PAT con scope `Contents: Read/Write` + `Pull Requests: Read/Write` sobre el repo `plan-b`. Guardarlo como secret `LOCKFILE_PUSH_TOKEN`.

**Descartada** porque:
- Atado a una cuenta personal. Si Lucas migra cuentas o el PAT expira (los Fine-grained PATs requieren rotación cada ≤ 12 meses), el workflow se rompe silencioso.
- En contexto del PFI con jurado UNSTA: documentar "este workflow depende del PAT personal de Lucas" es peor para el portfolio que documentar "una GitHub App dedicada con permissions explícitas".
- El effort delta (~5 minutos de setup extra para la App) no justifica el debt de mantenimiento del PAT.

### B. `repository_dispatch` o `workflow_dispatch` post-push

Después del push hecho con `GITHUB_TOKEN`, el workflow dispara un evento custom que sí ejecuta CI.

**Descartada** porque:
- Acopla el workflow lockfile al schema de events: hay que mantener la lista de "workflows que disparar" en dos lugares.
- Necesita configurar `repository_dispatch` triggers en el workflow CI que de otra manera no los necesitaría.
- Sigue pareciendo workaround. La App es la solución industry-standard.

### C. Cambiar el `--frozen-lockfile` del CI

Sacar el flag del comando `bun install` en `ci.yml`. CI ya no falla por lockfile desactualizado.

**Descartada** porque:
- Cambia las garantías del CI. Hoy `--frozen-lockfile` garantiza que el lockfile commiteado matchea exacto con `package.json`; sin eso, un dev podría pushear cambios en `package.json` sin actualizar `bun.lock` y CI no lo detecta. Reproducibilidad de builds se debilita.
- Resuelve el síntoma (CI falla) sin resolver la causa (Dependabot no regenera lockfile).

### D. Aceptar el inconveniente y comentar `@dependabot recreate` manualmente

Status quo.

**Descartada** porque:
- Operacionalmente costoso (1 vez por semana mientras Dependabot esté activo). Multiplicado por la duración del proyecto (≥ 6 meses al PFI), son ~25 intervenciones manuales.
- Se olvida. Los PRs quedan abiertos con CI rojo, dificultando ver el estado real del repo.

## Referencias

- GitHub docs sobre el limit del `GITHUB_TOKEN`: [Triggering a workflow from a workflow](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow).
- `actions/create-github-app-token` README: [github.com/actions/create-github-app-token](https://github.com/actions/create-github-app-token).
- Workflow afectado: `.github/workflows/dependabot-bun-lockfile.yml`.
- ADR relacionado: ninguno directo. Se enlaza con la política de Dependabot documentada en `.github/dependabot.yml`.
