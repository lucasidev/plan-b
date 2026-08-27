# Definition of Done (DoD)

Criterios mínimos para dar por terminado el trabajo de una story. Aplica a toda story planificada y, en lo que corresponda, a las tareas técnicas que no tienen story atrás.

El "listo cuando" de la story se suma a estos criterios generales, no los reemplaza.

> **Definition of Ready (DoR)**: pre-sprint, lista de criterios para que una story esté lista para entrar a un sprint. Vive en [`story-template.md`](story-template.md) porque depende del shape de la US, no del shape del código. DoD (este doc) cubre el post-implementación.

---

## 1. Código

- [ ] Cada punto del "listo cuando" de la story, cumplido.
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
- [ ] [Glosario](../product/language.md) actualizado si introduce términos nuevos del negocio.
- [ ] **La story en su épica** ([`docs/product/`](../product/README.md)) actualizada si el trabajo cambió lo que el producto hace o su criterio de aceptación. Se corrige ahí, nunca solo en el plan ([ADR-0072](../decisions/0072-the-story-lives-in-its-epic-and-the-plan-only-references-it.md)).
- [ ] OpenAPI / contratos del endpoint expuestos y verificables.

## 5. Git workflow

- [ ] Commits siguen Conventional Commits (`type(scope): descripción`).
- [ ] Branch nombrada según convención (`type/scope-description`, ej. `feat/identity-verify`).
- [ ] PR abierta contra `main`, con descripción clara del cambio + link a la US.
- [ ] Mergeada vía Rebase o Squash (nunca Merge commit en Fases 1-5, ver [ADR-0026](../decisions/0026-git-workflow-github-flow-with-rebase.md)).

## 6. Code review

- [ ] Self-review del propio diff antes de pedir review externa (Ing. Copas o pares).
- [ ] Comentarios del review resueltos (atendidos o respondidos con justificación).

## 7. Restricciones del producto

- [ ] Cumple las [restricciones del producto](../product/README.md#restricciones-los-requisitos-no-funcionales-del-producto): accesibilidad y celular en lo público, datos personales (Ley 25.326), política de curaduría y respuesta publicada, rendimiento y disponibilidad de lo público. No son criterio de una story: se sostienen en todas.

## 8. Demo / verificación funcional

- [ ] Para US con UI: probada manualmente en navegador, capturas de los estados clave si suma evidencia.
- [ ] Para US backend: endpoint probado vía Postman / curl o tests de integración que demuestran el contract real.
- [ ] Para US infra/tooling: el cambio se verifica en otra máquina (no solo "funciona en mi laptop").

## 9. Tracking

- [ ] `Status: Done` en el header de la ficha `plan/stories/US-NNN.md`, con el sprint y el PR.
- [ ] `plan/backlog.md` y [`plan/status.md`](../plan/status.md) reflejan el cierre (misma PR).
- [ ] Sub-tasks (checklist de la ficha) marcadas como completadas.

---

## Excepciones

- Las **tareas técnicas** (infra, tooling, migraciones) no citan story y pueden saltarse los criterios de UI y E2E que no les aplican.
- US del **Sprint 0 (pre-sprint, foundations)** ya están `Done` retroactivamente y se documentan en [`plan/status.md`](../plan/status.md). No re-evaluar contra este DoD.
- Tareas técnicas standalone (sin requisito que las origine, como una migración de tooling) cumplen los criterios técnicos pero no citan ningún ID de producto.

---

## Refs

- Template + DoR de la ficha de trabajo: [`plan/story-template.md`](story-template.md)
- Cómo se planifica (las tres unidades, la numeración, el Effort): [`plan/README.md`](../plan/README.md)
- Cómo se escribe un requisito y qué tiene que cumplir: [`product/README.md`](../product/README.md)

---

Actualizado: 2026-05-05.
