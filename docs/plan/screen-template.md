# Cómo se escribe una ficha de pantalla

Una pantalla vive en la épica que la hace existir: `docs/product/<épica>/screens/SC-NNN-slug/`, con su `README.md` (la ficha) y su `sketch.html` (el boceto). Nada de estado de gestión: cuándo se construye lo dice [`status.md`](status.md).

## Qué es una pantalla, y qué no

**Una pantalla es una composición**: resuelve 6,3 stories en promedio, y 65 de las 93 aparecen en más de una. Por eso no vive adentro de una story: sería elegir arbitrariamente una de veinte. Y por eso tampoco se parte por story, que sería el corte vertical llevado al absurdo ([ADR-0070](../decisions/0070-product-requirements-are-vertical-by-capability-and-design-is-text.md), alternativa E).

**La hace existir el flujo de su épica.** El recorrido de Reseñar (elegir la materia, marcar frases, el comentario, publicar) es lo que produce sus tres pantallas. Si una pantalla no aparece en ningún paso de ningún flujo, o sobra, o al flujo le falta un paso.

## El identificador

```
SC-NNN-slug-en-ingles/
```

Mismas reglas que las stories, y por las mismas razones: **`SC-NNN` no cambia nunca** (ni al moverse de épica, ni al rediseñarse), **no lleva semántica adentro**, y el **slug se congela al crear**. Si una pantalla se parte en dos, son dos pantallas nuevas y la vieja se marca superada.

## La ficha

Estos headings son el contrato: siempre los mismos, en este orden. Si una sección no aplica, se escribe por qué en una línea, no se omite en silencio.

```markdown
# <Nombre visible en español> (la pantalla)

> Ficha de pantalla, dueña: la épica [<Nombre>](../../README.md). **Estado**: <en qué anda: boceto, revisión, hi-fi>. <Acceso: pública sin cuenta / con cuenta / backoffice y qué rol>. <Slug de la URL hoy, o "sin slug hoy">.

## Quién la usa

<Las personas concretas que llegan acá y con qué en la cabeza. Salen de [personas.md](../../../personas.md).>

## Qué stories resuelve

<Los IDs `US-NNN` con una línea de qué aporta cada una a esta pantalla. La lista tiene que coincidir con las stories que declaran esta pantalla: `check-docs` lo valida en las dos direcciones.>

## Qué muestra

<Lo que la pantalla pone en pantalla, por bloque o por paso. Si el recorrido tiene pasos, van numerados en el orden del flujo.>

## Estados

<Vacía, cargando, con error, sin permiso, sin datos suficientes. El vacío no es un caso borde en este producto: es donde se explica que la primera voz ya se publica.>

## Lo que no muestra nunca

<Lo que esta pantalla tiene prohibido publicar, con el ADR que lo gobierna. Es lo que la hace segura de implementar sin releer la tesis.>

## Adónde va

<Las salidas: a qué otra pantalla lleva cada acción, y qué pasa cuando el usuario abandona.>

## Decisiones que aplica

<Los ADRs que gobiernan esta pantalla, con una línea de qué le impone cada uno.>

## Lo que esta ficha deja abierto

<Lo que todavía no está decidido, para que nadie lo dé por resuelto al implementar.>
```

## Las reglas

- **El nombre visible va en español, la URL en inglés.** "Ficha de cátedra" en el texto; `SC-002-chair` en el path y `/chairs/[id]` en la ruta. El slug de la URL se fija al construirla, no antes.
- **La ficha describe, no decide.** Lo que la pantalla tiene que lograr lo dicen sus stories; la ficha dice cómo se ve y cómo se recorre. Si al escribirla aparece un comportamiento que ninguna story pide, la story falta: se escribe allá.
- **El boceto es texto.** `sketch.html` autocontenido con los tokens del [design system](../product/design-system.md), mid-fi por default y hi-fi para las que definen el producto ([ADR-0071](../decisions/0071-the-visual-language-is-a-bulletin.md)). Ninguna imagen es fuente.
- **Toda pantalla tiene una épica dueña**, y es la que la hace existir. Cuando otra épica le aporta una acción (votar, reportar, replicar), lo dice en su README y la ficha la nombra en "Qué stories resuelve".
- **Los invariantes del producto valen acá también**: gestión alarma y exigencia informa ([ADR-0065](../decisions/0065-attribution-is-the-axis-not-a-split.md)), toda proporción con sus voces y su encogimiento ([ADR-0064](../decisions/0064-phrases-with-voices-not-scores.md)), y los períodos nunca codificados ([ADR-0051](../decisions/0051-academic-vocabulary-with-a-canonical-representation-in-the-ui.md)). Una pantalla que los rompe está mal aunque respete este contrato.
