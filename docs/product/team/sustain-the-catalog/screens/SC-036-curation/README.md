# Curaduría (la pantalla)

> Ficha de pantalla, dueña: la épica [Sostener el catálogo](../../README.md). **Estado**: construida el 2026-08-31 y 2026-09-01 (ver [`docs/plan/status.md`](../../../../../plan/status.md), R3), sin ficha propia hasta ahora (hallazgo E02 del [mapa](../../../../../history/reviews/2026-09-07-map.md)); boceto mid-fi nuevo. Backoffice, rol curaduría de frases (editorial, sin persona propia entre las cuatro del equipo). Slug hoy `/admin/curation`.

## Quién la usa

**Quien cura las frases** (el catálogo de requisitos lo nombra como rol distinto del de Sofía, sin persona propia entre las cuatro del equipo): lee lo que la gente escribió en el campo libre para encontrar qué preguntar y no se pregunta, convertirlo en una frase cerrada nueva, o resumirlo en una nota sin nombres sobre una carrera. El flujo entero: [`flow.md`](../../flow.md), sección BO-9.

## Qué stories resuelve

US-199 (dueña compartida con [Frases](../SC-029-phrases/README.md): acá se arma y se publica una frase nueva a partir del campo libre, con su código, su capa, su sujeto y sus opciones; hoy sin la cola de revisión previa que la story pide, publica al instante, ver "Lo que esta ficha deja abierto").

## Qué muestra

1. **El campo libre, sin autor**: cada texto con la materia, la cátedra (o "sin cátedra declarada"), el período y la fecha en que se escribió, paginado; nunca quién lo escribió, porque el dato no sale de la base.
2. **Destilar una pregunta**: un formulario que convierte lo leído en una frase nueva del instrumento: código, capa (contexto de la cursada, qué hizo la cátedra, o qué te pasó a vos), el texto de la pregunta, de qué habla (de la cátedra o de la materia) y sus opciones, cada una con su valencia. Al enviarlo, la frase entra en la versión siguiente del cuestionario y queda disponible para responder de inmediato.
3. **Escribir una nota del equipo**: elegir universidad y carrera, y escribir hasta 1000 caracteres de síntesis; se publica en la ficha de esa carrera, con su fecha y su procedencia ("nota del equipo, leída de comentarios que no se publican"). El selector no ofrece nivel cátedra ni institución: solo carrera.

## Estados

**Sin texto libre todavía**: "Todavía nadie escribió nada. El campo es opcional al reseñar, así que la mayoría de las reseñas no trae texto." **Con texto**: la lista paginada, con "Anteriores" y "Siguientes" cuando hay más de una página.

## Lo que no muestra nunca

Quién escribió cada texto: el dato no viaja desde el backend ([ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md)). Una frase destilada esperando aprobación: hoy no existe ese estado intermedio, se publica directo. Una nota editorial a nivel cátedra: el formulario solo ofrece universidad y carrera.

## Adónde va

Llega desde el nav del backoffice ("Curaduría · Campo libre"), junto a [Frases](../SC-029-phrases/README.md) ("Curaduría · Frases"). Lo que se destila acá alimenta Reseñar (la frase nueva se ofrece para responder) y [Método](../../../../student/take-the-data/screens/SC-021-method/README.md) (publica el catálogo entero); la nota publicada se lee en la [Ficha de carrera](../../../../student/choose-where-to-study/screens/SC-001-career/README.md) de esa carrera.

## Decisiones que aplica

[ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) (el texto libre nunca se publica; alimenta destilar frases nuevas y notas editoriales sin nombres, a nivel carrera o institución y nunca cátedra), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el catálogo de frases versionado: código estable, capa y opciones).

## Lo que esta ficha deja abierto

- **La cola de revisión que pide US-199 no existe**: destilar publica en un solo paso, sin aprobar ni descartar antes de ofrecerla para responder.
- **Si "curar las frases" es un rol aparte** o lo cubre quien ya carga el catálogo: la épica lo nombra distinto sin decidirlo (mismo punto abierto que [Frases](../SC-029-phrases/README.md)).
- **Qué separa esta pantalla de Frases** (`/admin/items`): hoy son dos rutas del mismo grupo de nav ("Curaduría") con responsabilidades que no se solapan en el código (acá se lee el campo libre, se destila y se anotan notas; en Frases se edita el texto de una frase ya publicada), pero el README de la épica describía la lectura del campo libre como si fuera parte de Frases. Se corrigió ahí; falta decidir si conviene fusionar las dos pantallas.
- **Las notas editoriales a nivel institución** que [ADR-0084](../../../../../decisions/0084-free-text-feeds-curation-and-is-never-published.md) permite no tienen selector acá: el formulario solo llega a carrera.
