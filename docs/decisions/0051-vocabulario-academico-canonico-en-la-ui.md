# ADR-0051: Vocabulario académico con representación canónica en la UI

- **Estado**: aceptado
- **Fecha**: 2026-07-21

## Contexto

[ADR-0001](0001-multi-universidad-desde-dia-1.md) generalizó `AcademicTerm.kind` a
`bimestral | cuatrimestral | semestral | anual` para soportar calendarios distintos, y descartó
explícitamente la alternativa de atarlo a un solo kind porque SIGLO 21 (bimestral) está en el scope
declarado. El [lenguaje ubicuo](../domain/ubiquitous-language.md) registra esa generalidad como el
motivo del campo.

Esa generalidad se sostenía en el dominio y se perdía en la capa de presentación:

- La query de reseñas pendientes armaba la etiqueta con `CONCAT(year, '·', number, 'c')`. La `'c'`
  de cuatrimestre estaba hardcodeada con la columna `kind` disponible al lado, así que un período
  bimestral se mostraba como "2025·3c". Hoy no se nota porque solo hay una universidad cuatrimestral
  cargada: se manifiesta el día que entra la primera universidad con otro calendario, que es
  justamente el escenario para el que se tomó ADR-0001.
- Sin una fuente única de formato, cada consumidor inventó la suya: "2025-C2" (backoffice, desde
  `AcademicTerm.ComputeLabel`), "2025·2c" (reseñas, desde el SQL), "1c" (simulador) y "1er cuatri"
  (píldoras). Cuatro vocabularios para el mismo dato.
- Los formatos más compactos codificaban la cadencia en una letra (`1c`, `3b`, `1s`) que no está
  explicada en ninguna pantalla ni en el glosario. Una columna llegó a titularse "Cuatr." mientras
  contenía bimestres y semestres: el encabezado mentía para esas filas.

El patrón de fondo se repitió con otras métricas: "no hay dato" convivía como `s/d`, `sin dato`,
`sin datos` y `sin reseñas todavía`, y algunos medidores mostraban `0.0/5` para un valor ausente,
que no se lee como "falta el dato" sino como "materia facilísima".

## Decisión

**El formato de presentación del vocabulario académico vive en el frontend, en una fuente única, y
nunca codifica un concepto del dominio en una abreviatura que el glosario no defina.**

En concreto:

1. Las queries devuelven el período **crudo** (`year`, `number`, `kind`), no una etiqueta armada.
   Formatear no es responsabilidad de la capa de datos.
2. `frontend/src/lib/academic-terms.ts` es la única fuente de formato de períodos y cadencias.
   Ofrece forma larga ("1er cuatrimestre") y corta ("1er cuatri"): la corta **abrevia el sustantivo,
   no lo codifica**. `1c`, `3b` y `1s` quedan fuera de la UI.
3. Los textos de producto que se repiten entre vistas viven en `frontend/src/lib/copy.ts`. Un dato
   ausente se dice `sin datos`, nunca con un cero que se lea como una medición real.

`AcademicTerm.ComputeLabel` ("2025-C2") sigue existiendo y no se toca: es el identificador estable
que se persiste en la columna `label`, no copy para el alumno. Son cosas distintas y ninguna
reemplaza a la otra.

## Alternativas consideradas

### A. Arreglar el `CASE` del SQL para que contemple cada kind
El cambio más chico: reemplazar la `'c'` fija por un `CASE` sobre `kind`. Descartada porque deja la
presentación en la capa de datos y no resuelve la fragmentación: los otros tres formatos siguen
divergiendo, y el próximo consumidor vuelve a inventar el suyo.

### B. Usar la columna `label` persistida como texto de UI
Ya existe y el dominio la computa. Descartada por dos razones: la columna arrastra dos convenciones
(el seeder escribe "2026·1c" y `ComputeLabel` escribe "2025-C2"), y sobre todo porque un
identificador estable y un texto para el alumno tienen ciclos de vida distintos. Cambiar el copy no
debería reescribir filas.

### C. Mantener las abreviaturas y explicarlas con un tooltip
Conserva la densidad visual de las tablas. Descartada porque un tooltip es invisible en touch, que
es donde el alumno usa esto, y porque desplaza el problema en vez de resolverlo: la abreviatura
sigue sin significar nada para quien la lee por primera vez.

## Consecuencias

**Positivas:**
- El día que entre una universidad bimestral o semestral, la UI la representa bien sin tocar
  queries: es lo que ADR-0001 compró y esto termina de pagar.
- Un solo lugar para cambiar cómo se lee un período en todo el producto.
- El vocabulario que ve el alumno es el del glosario, no uno paralelo inventado por cada pantalla.

**Negativas:**
- Los textos largos ocupan más ancho que las abreviaturas en tablas densas. Se acepta: una tabla más
  angosta no vale una columna que nadie puede interpretar.
- El contrato de las queries que exponían período gana campos (`year`, `number`, `kind` en vez de un
  string). Es más verboso en el DTO a cambio de no decidir presentación en SQL.

**Advertencias:**
- Si aparece una query nueva tentada de concatenar la etiqueta en SQL "porque es más cómodo",
  reintroduce exactamente el bug que este ADR cierra.
- Agregar una cadencia nueva al enum obliga a sumarla en `TERM_NOUNS` de `academic-terms.ts`. La
  función degrada a un texto legible si falta, pero eso es una red de seguridad, no el camino feliz.
