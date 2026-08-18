# Revisiones y auditorías

Cada revisión adversarial o auditoría deja acá su registro: qué se miró, cómo, qué se encontró y **qué pasó con cada hallazgo**. Es lo que separa un hallazgo de una opinión: tiene ID, tiene estado y se puede citar desde un ADR, una story o un commit.

## Reglas

- **Dos tipos, una carpeta.** Una **revisión** mira un artefacto buscando la falla (adversarial: el catálogo, el mapa, una ficha de pantalla, un diff); una **auditoría** verifica algo contra una norma o una lista, es repetible y sus hallazgos son no-conformidades. Las dos dejan el mismo registro; el índice dice cuál es cuál y contra qué norma.
- **Un archivo por registro**, `YYYY-MM-DD-<alcance>.md` para las revisiones y `YYYY-MM-DD-audit-<alcance>.md` para las auditorías, con: alcance, método (qué se leyó, contra qué norma o lista, con qué lentes o agentes), y una tabla de hallazgos con **ID estable** (una letra por registro más número: `M03`, `D07`, `Q02`) y **estado**.
- **Los estados**: `Resuelto` (con el commit, ADR o story que lo resolvió), `Cerrado` (una decisión lo cerró), `Pendiente` (espera una decisión de Lucas: está listado en la fila de su story y en el header del [catálogo](../domain/user-stories.md)), `Descartado` (con la razón), `Confirmación` (no era hallazgo: se verificó que estaba bien).
- **Un hallazgo es insumo, no una tarea.** Termina en un ADR, en una story, en un cambio de doc, descartado con razón, o pendiente con dueño. Nunca en un TODO suelto.
- **El registro no se reescribe**: se le cambia el estado a un hallazgo, con el link a lo que lo cambió. Si una revisión posterior contradice a una anterior, la nueva lo dice y linkea.
- **Los ADRs citan hallazgos por ID** ("hallazgo G1 de la revisión del 16"), y las stories que salen de un hallazgo lo nombran en Notas cuando ayuda.

## Índice

| Fecha | Registro | Tipo | Alcance y norma | Hallazgos | Abiertos |
|---|---|---|---|---|---|
| 2026-08-16 | [Auditoría del mapa de producto](2026-08-16-product-map.md) | revisión | el canvas recién portado, contra sí mismo, la tesis y el repo | 7 | M04 (los escenarios sin pantalla: se resuelve con las fichas por pantalla); M02 cerrado con `docs/domain/phrases.md` |
| 2026-08-16 | [Revisión adversarial del catálogo](2026-08-16-catalog.md) | revisión | 75 stories, personas y mapa; tres lentes (personas, adversarios, modelo de datos) | 39 en 8 grupos | ninguno: los que quedaron sin "→ Decidido" pasaron a D01 a D10, todas cerradas |
| 2026-08-17 | [Estados de los ADRs](2026-08-17-adr-states.md) | auditoría | los 16 ADRs afectados por el viraje, contra la regla del README de decisiones (el Estado dice la verdad) | 3 | ninguno |
| 2026-08-17 | [Propagación de la tesis al catálogo](2026-08-17-catalog-propagation.md) | revisión | 75 stories, 22 flujos, 12 personas contra ADR-0064 a 0068; tres revisores en paralelo | 39 reescritas, 19 nuevas, 10 decisiones | ninguno (D01 a D10 cerradas el 2026-08-18) |
| 2026-08-17 | [Calidad del catálogo contra los estándares](2026-08-17-catalog-quality.md) | auditoría | 94 stories contra INVEST, las 3C, QUS y la práctica de criterios de aceptación | 8 | ninguno |
| 2026-08-18 | [Revisión de `docs/domain`](2026-08-18-docs-domain.md) | auditoría | las 20 entradas de la carpeta, contra "describe el producto vigente" y "tiene referencias entrantes" | 7 | ninguno |

Las revisiones anteriores al viraje (las que produjeron ADRs hasta 0062, los postmortems operativos) están donde siempre: en el `Contexto` de cada ADR y en [`docs/operations/lessons-learned.md`](../operations/lessons-learned.md).

## Calendario de auditorías

Las que existen o tienen que existir para este producto, su norma, su cadencia y dónde vive la evidencia. Solo dejan registro acá las que producen hallazgos que hay que trackear; las automáticas que pasan en verde son evidencia en CI y no se registran.

| Auditoría | Norma o lista | Cadencia | Cómo | Evidencia |
|---|---|---|---|---|
| Lint, formato, build, tests, idioma en identificadores | las convenciones del repo (CLAUDE.md, hooks de lefthook, `just ci`) | cada PR | automática | CI verde en el PR |
| Drift docs-código | "el código es la verdad": CLAUDE.md, ADRs, glosario, data-model contra el código | por sprint, y siempre antes de planificar contra los docs | skill `doc-drift` (fan-out por doc, escéptico confirma) | registro acá si hay drift |
| Huecos de tests | la pirámide de [ADR-0036](../decisions/0036-testing-pyramid-cross-stack.md) | por sprint | skill `test-gaps` | registro acá |
| Seguridad | auth por endpoint, SQL parametrizado, secretos, dependencias | antes de cada deploy y ante cambio en identity o moderación | skill `security-audit` | registro acá |
| Accesibilidad y celular | WCAG 2.2 AA en todo lo público (Restricciones del [catálogo](../domain/user-stories.md)) | por pantalla nueva antes de hi-fi, y antes de cada deploy | Lighthouse y lectura manual con lector de pantalla | registro acá |
| Datos personales | Ley 25.326: consentimiento, aviso de privacidad, derechos ARCO, destrucción de constancias | antes del primer deploy y ante cambio en identity o verificación | lista de chequeo escrita en la primera auditoría | registro acá |
| Licencias de lo copiado | la tabla de procedencia de [`.claude/skills/README.md`](../../.claude/skills/README.md) y las dependencias | al copiar algo de terceros | manual | la tabla misma |
| Estados de los ADRs | la regla del [README de decisiones](../decisions/README.md) | cada vez que un ADR nuevo supersede a otro | manual, en el mismo commit | el diff del ADR |
