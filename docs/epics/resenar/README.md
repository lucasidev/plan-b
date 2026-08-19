# Reseñar

> Épica del grupo **O4 · Que quede registrado (sin que me cueste la cursada)** del [catálogo](../../domain/user-stories.md). **Estado**: borrador escrito el 2026-08-18 (README, [flujo](flujo.md), bocetos de los pasos); revisión adversarial pendiente antes de planificar. Sin sprint asignado.

## Qué es

El acto principal del producto: elegir una materia que cursaste y reseñar esa cursada en menos de cinco minutos, marcando frases y, si querés, escribiendo en tus palabras ([THESIS.md](../../THESIS.md), decisión 4). Es la única puerta por la que un hecho entra al corpus ([ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md)): la reseña lleva la materia y el período, cómo terminó, la cátedra si la recordás, las frases que marcás, el comentario opcional, y las clases sin dar si marcaste que hubo. Incluye reseñar un evento institucional (sin materia) y las preguntas de trayectoria que aparecen de a una: cuándo entraste, la primera vez; y si el período que contás es viejo, si seguís cursando, te recibiste o te fuiste (Mi situación).

## Para quién

**Lucía** (cursa, veinte horas de trabajo: cinco minutos o no lo hace), **Matías** (quiere que quede registrado, no le importa el producto), **Diego** (dejó la carrera: puede reseñar una materia sola aunque ya no curse, y decir cuándo se fue). Y quien no quiere escribir: vota la reseña de otro (T1-1, en la épica Cuidar lo publicado).

## Stories que la componen (por ID; la letra vive en el catálogo)

O4-1 (en menos de cinco minutos, marcando, sin escribir nada obligatorio), O4-2 (una materia sola), O4-4 (nadie sabe que fui yo: qué se publica de una reseña y qué no), O4-5 (el aviso al cerrar el período, por mail), O4-6 (clases sin dar: mediana y rango con voces), O4-7 (quien dejó puede reseñar), O4-8 (en qué año me fui; los cuatro caminos de la pregunta), O4-9 (la reseña de quien dejó suma igual), O4-10 (cómo terminó, en un toque), O4-11 (cuándo entré, una sola vez), O4-12 (el mail anual: ¿te recibiste?), O4-13 (el evento institucional). Pasan por acá y viven en otras épicas: T2-1 (el chequeo previo del comentario), T3-1 (la materia que no está: pendiente de vincular), T3-3 (retomar lo que empecé), T3-5 (la recursada, otro período), O6-2 (no me vuelvan a preguntar lo que ya dije).

## Decisiones que aplica

[ADR-0064](../../decisions/0064-phrases-with-voices-not-scores.md) (la reseña: cursada, frases, comentario, votos; el evento aparte), [ADR-0065](../../decisions/0065-attribution-is-the-axis-not-a-split.md) (cada frase trae su sujeto y su eje: nada se pregunta), [ADR-0067](../../decisions/0067-trajectory-from-declared-facts-by-closed-cohort-and-side-by-side-comparison.md) (cómo terminó; entré una vez; me fui / me recibí por cuatro caminos; el silencio no se infiere), [ADR-0068](../../decisions/0068-comment-publishes-as-testimony-below-the-phrases.md) (el comentario con tope, el chequeo previo con dos salidas, el aviso de la sospecha, publicar con o sin comentario), [ADR-0069](../../decisions/0069-the-marked-plan-is-a-private-preference-not-a-fact.md) (la reseña es la única puerta de un hecho), D02 (clases sin dar), D08 (la pendiente de vincular no cuenta hasta vincularse). El catálogo de frases que se ofrece: [`phrases.md`](../../domain/phrases.md).

## Pantallas que compone

- **Reseñar** (con cuenta): la secuencia de pasos de esta épica; su ficha va en `docs/design/screens/resenar/` cuando se dibuje entera; los bocetos de los pasos que solo existen acá están en [`bocetos/`](bocetos/).
- **Mi situación** (con cuenta): la pregunta de trayectoria, también accesible sola.
- **Avisos** (mail): el aviso al cerrar el período y el reenganche anual.
- Llega desde y vuelve a: [Ficha de cátedra](../../design/screens/ficha-de-catedra/README.md), Ficha de materia, Mi carrera, Mis aportes.

## Bocetos

- [`bocetos/paso-comentario-y-testimonio.html`](bocetos/paso-comentario-y-testimonio.html): el paso del comentario con el chequeo previo y las dos salidas, y cómo se lee después el testimonio (aprobado con ADR-0068).
- Por dibujar: elegir la materia y el período (con la rama de Mi situación), cómo terminó, las frases del sujeto que corresponde (cuántas se ofrecen por vez es una decisión de esta pantalla), la cátedra opcional, las clases sin dar, y el evento institucional.

## Lo que esta épica todavía no resuelve

- **Cuántas frases se ofrecen por vez y en qué orden** (46 en el catálogo semilla; se ofrecen las del sujeto que corresponde). Es diseño del paso de frases.
- **Qué pasa con la reseña a medias** (T3-3: se guarda y se retoma) y **cuánto tiempo**.
- **El evento institucional como pantalla propia o como rama de Reseñar**: el flujo lo dibuja como rama.
