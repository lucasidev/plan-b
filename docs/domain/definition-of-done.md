# Definition of Done (DoD)

Criterios mínimos que toda User Story debe cumplir para considerarse `Done`. Aplica a US, US divididas (`-b` backend, `-f` frontend, `-i` infra, `-t` tooling) y Tasks técnicas estandalone.

Cada AC específica de una US se suma a estos criterios generales, no los reemplaza.

---

## 1. Código

- [ ] Implementación completa de los AC declarados en la US.
- [ ] Sin TODO, FIXME ni `Console.WriteLine` / `console.log` de debug.
- [ ] Sin code smells obvios (variables sin usar, métodos muertos, magic numbers no justificados).
- [ ] Sigue las convenciones del proyecto (ver `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`).

## 2. Tests

- [ ] Unit tests para domain logic crítica (handlers, value objects, aggregates).
- [ ] Integration tests para endpoints (HTTP request → DB real → response).
- [ ] E2E tests para flujos críticos del usuario (registro, login, verify, publicar reseña, simular).
- [ ] Cobertura razonable (no es métrica dura, pero sí evidencia de tests sobre lo importante).

## 3. CI / quality gates

- [ ] `just ci` pasa local (lint + build + tests + format).
- [ ] GitHub Actions verde en el PR.
- [ ] Sin warnings nuevos del compilador (`dotnet build -warnaserror` cuando aplique).
- [ ] Biome / dotnet format sin diff pendiente.

## 4. Documentación

- [ ] ADR creada o actualizada si hay decisión arquitectónica con alternativas reales (ver `docs/decisions/README.md`).
- [ ] README de módulo actualizado si la API pública cambió.
- [ ] Docs de dominio (`ubiquitous-language.md`, `aggregates.md`, `epics.md`, `user-stories.md`) actualizados si introduce términos o reglas nuevas.
- [ ] OpenAPI / contratos del endpoint expuestos y verificables.

## 5. Git workflow

- [ ] Commits siguen Conventional Commits (`type(scope): descripción`).
- [ ] Branch nombrada según convención (`type/scope-description`, ej. `feat/identity-verify`).
- [ ] PR abierta contra `main`, con descripción clara del cambio + link a la US.
- [ ] Mergeada vía Rebase o Squash (nunca Merge commit en Fases 1-5, ver [ADR-0026](../decisions/0026-git-workflow-github-flow-con-rebase.md)).

## 6. Code review

- [ ] Self-review del propio diff antes de pedir review externa (Ing. Copas o pares).
- [ ] Comentarios del review resueltos (atendidos o respondidos con justificación).

## 7. Demo / verificación funcional

- [ ] Para US con UI: probada manualmente en navegador, capturas de los estados clave si suma evidencia.
- [ ] Para US backend: endpoint probado vía Postman / curl o tests de integración que demuestran el contract real.
- [ ] Para US infra/tooling: el cambio se verifica en otra máquina (no solo "funciona en mi laptop").

## 8. Tracking

- [ ] Card de Notion movida a `Done` en el kanban del sprint actual.
- [ ] Sub-tasks (checklist) marcadas como completadas.
- [ ] PR linkeada desde el card cuando aplique.

---

## Excepciones

- Stories de **infra** (`-i`) o **tooling** (`-t`) pueden saltarse criterios de UI/E2E que no aplican.
- Stories del **Sprint 0 (pre-sprint, foundations)** ya están `Done` retroactivamente y se documentan en `STATUS.md`. No re-evaluar contra este DoD.
- Tasks técnicas standalone (sin US padre) cumplen los criterios técnicos pero pueden saltar el formato narrativo de US.

---

Actualizado: 2026-04-25.
