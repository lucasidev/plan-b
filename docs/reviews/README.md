# Revisiones y auditorías

Cada revisión adversarial o auditoría deja acá su registro: qué se miró, cómo, qué se encontró y **qué pasó con cada hallazgo**. Es lo que separa un hallazgo de una opinión: tiene ID, tiene estado y se puede citar desde un ADR, una story o un commit.

## Reglas

- **Un archivo por revisión**, `YYYY-MM-DD-<alcance>.md`, con: alcance, método (qué se leyó, contra qué, con qué lentes o agentes), y una tabla de hallazgos con **ID estable** (una letra por revisión más número: `M03`, `D07`, `Q02`) y **estado**.
- **Los estados**: `Resuelto` (con el commit, ADR o story que lo resolvió), `Cerrado` (una decisión lo cerró), `Pendiente` (espera una decisión de Lucas: está listado en la fila de su story y en el header del [catálogo](../domain/user-stories.md)), `Descartado` (con la razón), `Confirmación` (no era hallazgo: se verificó que estaba bien).
- **Un hallazgo es insumo, no una tarea.** Termina en un ADR, en una story, en un cambio de doc, descartado con razón, o pendiente con dueño. Nunca en un TODO suelto.
- **El registro no se reescribe**: se le cambia el estado a un hallazgo, con el link a lo que lo cambió. Si una revisión posterior contradice a una anterior, la nueva lo dice y linkea.
- **Los ADRs citan hallazgos por ID** ("hallazgo G1 de la revisión del 16"), y las stories que salen de un hallazgo lo nombran en Notas cuando ayuda.

## Índice

| Fecha | Revisión | Alcance | Hallazgos | Abiertos |
|---|---|---|---|---|
| 2026-08-16 | [Auditoría del mapa de producto](2026-08-16-product-map.md) | el canvas recién portado, contra sí mismo, la tesis y el repo | 7 | M04 (los escenarios sin pantalla: se resuelve con las fichas por pantalla), M02 (la lista semilla de frases) |
| 2026-08-16 | [Revisión adversarial del catálogo](2026-08-16-catalog.md) | 75 stories, personas y mapa; tres lentes (personas, adversarios, modelo de datos) | 39 en 8 grupos | los que quedaron sin "→ Decidido" pasaron a D01 a D10 |
| 2026-08-17 | [Estados de los ADRs](2026-08-17-adr-states.md) | los 16 ADRs afectados por el viraje | 3 | ninguno |
| 2026-08-17 | [Propagación de la tesis al catálogo](2026-08-17-catalog-propagation.md) | 75 stories, 22 flujos, 12 personas contra ADR-0064 a 0068; tres revisores en paralelo | 39 reescritas, 19 nuevas, 10 decisiones | **D01 a D10** |
| 2026-08-17 | [Calidad del catálogo contra los estándares](2026-08-17-catalog-quality.md) | 94 stories contra INVEST, 3C, QUS y práctica de AC | 8 | ninguno |
| 2026-08-18 | [Revisión de `docs/domain`](2026-08-18-docs-domain.md) | las 20 entradas de la carpeta | 7 | ninguno |

Las revisiones anteriores al viraje (las que produjeron ADRs hasta 0062, los postmortems operativos) están donde siempre: en el `Contexto` de cada ADR y en [`docs/operations/lessons-learned.md`](../operations/lessons-learned.md).
