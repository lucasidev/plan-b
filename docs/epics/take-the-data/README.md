# Llevarse el dato

> Épica del grupo **O8 · Llevarme el dato (para discutirlo afuera)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-19 (README y [flujo](flow.md)) y su pantalla propia con ficha y boceto mid-fi ([Método](screens/method/README.md)); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

Descargar el crudo sin registrarse: dos tablas (frases por sujeto y período con sus voces y su eje; los agregados de trayectoria), agregado y nada más fino que lo publicado, nunca nombre, cuenta ni perfil, sin testimonios en bloque. Junto con Método (la fórmula del encogimiento publicada tal cual, el catálogo de frases entero, los sesgos declarados, qué no cubrimos todavía, cuánto se bajó del corpus y por qué) y, en cada ficha, el texto retirado visible con su categoría y la marca de frase destilada con la fecha de su último reproceso. Es la épica que hace posible que Rocío cite un número sin que se lo puedan desarmar, y que ninguna ficha afirme una causa que el dato no sostiene.

## Para quién

**Rocío** (necesita el crudo, no nuestras conclusiones; nos usa y a la vez nos audita). **Quien lee** (ve el texto retirado y la marca de destilada en cada ficha, O8-5, O8-7).

## Stories

Las de esta épica, con su letra completa: es la única copia de cada una (el [catálogo](../../domain/user-stories.md) es el índice por ID). Al entrar a sprint, la ficha `US-NNN` amplía la fila, no la reemplaza.

| ID | Story | Listo cuando | Notas |
|---|---|---|---|
| O8-1 | Como quien investiga, quiero descargar el crudo sin registrarme, porque ustedes muestran qué pasa y el por qué es trabajo mío. | 1. El CSV sale agregado: una fila por (frase, sujeto, período) con sus voces y su eje.<br>2. Una segunda tabla trae los agregados de trayectoria: por carrera-institución y cohorte; por materia y período; por par y período.<br>3. Lo que se descarga es lo que se publica, ni más fino ni más grueso: nunca nombre, cuenta ni perfil, y los testimonios no se exportan en bloque. | épica: se parte al planificar |
| O8-6 | Como quien investiga, quiero saber cuánto se bajó del corpus y por qué, porque una muestra que no declara su curaduría no se puede citar. | Se publica cuántos textos se bajaron y en qué categoría, sin su contenido; las voces de esas reseñas siguen contando, porque se baja el texto y nunca la voz, y el CSV no lleva testimonios. | par de O8-7 |
| O8-2 | Como quien investiga, quiero saber qué no cubren, porque una muestra sin su sesgo declarado no se puede citar. | 1. Se publica qué carreras están cargadas, en cola y pedidas, y la cobertura de cada plan (materias con voces sobre el total).<br>2. Se publican los sesgos que el método declara: de quienes reseñaron; la duración real, de los que se recibieron; la co-cursada, de quien reseñó las dos.<br>3. Se publica cuántas cuentas quedaron afuera por inconsistencia. |  |
| O8-3 | Como quien investiga, quiero citar un número que no me puedan desarmar, porque del otro lado van a discutir la metodología antes que el dato. | 1. El método es público e incluye la fórmula del encogimiento tal cual y el catálogo entero de frases con sujeto y eje.<br>2. Cada dato publicado muestra sus voces y el período de lo que lo sostiene. |  |
| O8-4 | Como quien investiga, quiero que no interpreten por mí, porque si me dan la conclusión ya no puedo citarlo como fuente. | Las fichas muestran frases con su proporción de voces y las dos proporciones de la cabecera, que son la lectura de los ejes y no un juicio aparte; en ningún lado se afirma una causa. |  |
| O8-5 | Como quien lee, quiero saber que no tienen acuerdos con las instituciones, porque un evaluador que depende del evaluado no me sirve de nada. | La postura está escrita en el método y no hay ninguna institución con trato preferencial. |  |
| O8-7 | Como quien lee, quiero ver que ahí hubo un texto retirado y por qué, porque un hueco sin explicación es indistinguible de censura. | Donde había un testimonio retirado la ficha muestra que se retiró y en qué categoría, sin su contenido, y sus frases siguen contando: se baja el texto, nunca la voz. | depende de BO2-1; par de O8-6 |
| O8-8 | Como quien investiga, quiero saber que la lista se reprocesa y cuál frase es destilada, porque una cita que mañana no se reproduce no me sirve, y una síntesis no es una cita textual. | La ficha declara que la lista se reprocesa a medida que entran reseñas y con qué fecha se está leyendo, y cada frase destilada se ve marcada como destilada (síntesis, no cita de nadie); el CSV lleva la misma marca. | depende de BO1-9 |

## Decisiones que aplica

[ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) (la fórmula de Wilson publicada tal cual en Método), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (el CSV gana la segunda tabla de trayectoria; los chequeos de consistencia por cuenta publicados en el método; todo número "de los que reseñaron"), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el texto no va al CSV ni se exporta en bloque; las bajas se publican contables por categoría), [ADR-0066](../../decisions/0066-derived-cards-sum-voices-and-gate-on-coverage-not-a-floor.md) (cobertura declarada en todo dato derivado), [THESIS.md](../../THESIS.md) ("Posición": sin acuerdos con instituciones; el crudo se descarga sin registro), D09 ([registro del 17](../../reviews/2026-08-17-catalog-propagation.md): la segunda capa de BO6-1, el lector externo, lee el registro ya disociado).

## Pantallas

La que existe solo para esta épica vive acá, con su ficha y su boceto:

- [**Método**](screens/method/README.md) (pública, sin cuenta; compartida con [Elegir dónde estudiar](../choose-where-to-study/README.md)): la fórmula del encogimiento, cómo se derivan las fichas, el catálogo de frases entero, los sesgos declarados, qué no cubrimos, cuánto se bajó y por qué, la política de moderación y réplica, la postura y la descarga del crudo; [boceto mid-fi](screens/method/sketch.html) de sus bloques.

Las que comparte con otras épicas viven en [`docs/design/screens/`](../../design/screens/README.md): la [Ficha de cátedra](../../design/screens/chair/README.md), la Ficha de materia, la Ficha de carrera y la Ficha de institución (cada una con su número con voces y período, el texto retirado con su categoría, la marca de destilada y la fecha del último reproceso).

## Lo que esta épica todavía no resuelve

- **El formato exacto del CSV**: columnas, codificación, si trae el encogimiento ya calculado o solo k y n.
- **Con qué periodicidad se regenera** el crudo.
- **Si Método es una pantalla o varias**: la fórmula, el catálogo de frases, los sesgos, la descarga y la política de moderación que las Restricciones del catálogo piden publicar ahí.
- **Cómo se prueba que ningún cruce del CSV identifica a nadie** (T2-4, en [Reseñar](../write-a-review/README.md)): hace falta una prueba sobre las dos tablas, no alcanza con declarar que no hay piso.
