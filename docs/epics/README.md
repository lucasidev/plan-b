# Épicas

La unidad vertical de la documentación de producto ([ADR-0070](../decisions/0070-product-docs-group-by-epic-with-stories-as-single-source-and-design-as-text.md)): una épica es lo que una persona viene a hacer, en el sentido de la actividad de un story map (no la épica de portfolio de SAFe). Coinciden con los grupos del mapa de producto: ocho objetivos, cuatro transversales, seis de backoffice. Cada una es una carpeta:

```
docs/epics/<epica>/
├── README.md     qué es, para quién, las stories que la componen (por ID, desde el catálogo), las decisiones que aplica,
│                 las pantallas que compone, su estado y sus sprints
├── flow.md       el o los flujos en mermaid: persona, disparador, pasos, salidas y errores, con las stories que cubre
└── sketches/     los pasos que solo existen para esta épica, en HTML con los tokens del design system
```

Reglas: la **carpeta se nombra en inglés, en kebab-case**, como todo identificador del repo; el nombre visible de la épica es español y va en el texto (ADR-0070, punto 7). La **story es la fuente única** y vive en el [catálogo](../domain/user-stories.md); la épica la cita por ID, nunca la copia. Una **pantalla compartida** vive en [`docs/design/screens/`](../design/screens/README.md) y la épica la linkea. Una épica no es un feature de código: sus stories se implementan en uno o más slices cuando entran a sprint (`US-NNN`, con `-b`/`-f`). El estado de la épica (borrador, revisada, en construcción, construida) está en su README.

## Índice

| Épica | Carpeta | Grupo del mapa | Persona que la pide | Estado |
|---|---|---|---|---|
| [Reseñar](write-a-review/README.md) | `write-a-review/` | O4 · Que quede registrado | Lucía, Matías, Diego | borrador escrito: README, flujo, bocetos de los pasos |
| Elegir dónde estudiar | `choose-where-to-study/` | O1 · Decidir dónde estudiar | Valentina, Silvia | por escribir |
| Pedir una carrera | `request-a-career/` | O2 · Entender el vacío | Ana | por escribir |
| Mi carrera | `my-career/` | O3 · Armar el cuatrimestre | Lucía | por escribir |
| Deshacer | `undo/` | O5 · Poder deshacer | quien ya aportó | por escribir |
| Que no me molesten | `do-not-bother-me/` | O6 · garantía, se verifica en el DoD | quien lee, quien vuelve | garantía: no se construye, se verifica |
| Replicar | `reply/` | O7 · Contestar lo que se publicó | Claudia, Paredes, la institución | por escribir |
| Llevarse el dato | `take-the-data/` | O8 · Llevarme el dato | Rocío | por escribir |
| Cuidar lo publicado | `care-for-what-is-published/` | T1 | quien ya aportó | por escribir |
| Cuando el riesgo es real | `when-the-risk-is-real/` | T2 | quien reseña, quien ya aportó | por escribir |
| Cuando el catálogo no alcanza | `when-the-catalog-falls-short/` | T3 | quien está cursando | por escribir |
| Discrepar | `disagree/` | T4 | quien está cursando | por escribir |
| Sostener el catálogo | `sustain-the-catalog/` | BO1 | Sofía | por escribir |
| Moderar sin romper el producto | `moderate-without-breaking-the-product/` | BO2 | Nahuel, Camila | por escribir |
| Cortar los accesos | `cut-the-access/` | BO3 | Admin | por escribir |
| Cuando la carga no da abasto | `when-the-load-overflows/` | BO4 | Sofía, Nahuel | por escribir |
| Cuando el corpus está bajo ataque | `when-the-corpus-is-under-attack/` | BO5 | Nahuel | por escribir |
| Y quién nos mira a nosotros | `who-watches-us/` | BO6 | Admin | por escribir |
| Avisos | `notices/` | infraestructura transversal (O2-4, O4-5, O4-12, O7-5, BO1-3) | todos | por escribir |

Las épicas de la versión anterior (EPIC-00 a EPIC-11) están en el [ático](../history/domain-v1/epics/) con sus fichas.
