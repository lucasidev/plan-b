# Dónde estudiarla (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: **el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25** ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)): la misma carrera en las instituciones de la ciudad, comparada solo con datos oficiales medidos igual para todas (el régimen de ingreso al lado del egreso); las señales de reseñas van por institución y no se cruzan; sin piso alcanzado, silencio honesto; el cuerpo de esta ficha sigue esa misma dirección. En el boceto, el rótulo de la pantalla lee "Una carrera en tu ciudad": el nombre de referencia en la documentación sigue siendo Dónde estudiarla, y esa diferencia de copy queda para cuando se concilie. Los bocetos anteriores quedaron en git. Revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-epics-and-screens.md)); **hi-fi en la dirección Boletín** ([ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19). Pública, sin cuenta: se lee sin login, como toda pantalla de esta épica (US-168). Sin slug hoy.

## Quién la usa

**Valentina** (compara antes de decidir cinco años, y no le cree a un número que no diga de dónde sale), **Silvia** (lee cuánto egresa y con qué régimen de ingreso se entra, sin vocabulario académico), y quien lee en general, sin cuenta. El flujo entero: [`flow.md`](../../flow.md).

## Qué stories resuelve

[US-128](../../stories/US-128-compare-the-same-career-side-by-side/README.md) (dueña: la misma carrera canónica lado a lado, dato por dato, sin compuesto ni ganador y sin ordenar por valor), [US-127](../../stories/US-127-see-how-long-it-really-takes/README.md) (dura en la realidad, por institución), [US-133](../../stories/US-133-see-if-it-leads-to-graduation/README.md) (Silvia: cuánto egresa por cohorte y con qué régimen se entra, sin vocabulario académico), [US-134](../../stories/US-134-check-the-coverage-behind-the-card/README.md) (la cobertura de cada oferta a la vista, siempre, nunca oculta), [US-131](../../stories/US-131-see-how-many-voices-support-it/README.md) (cada oferta con sus propias voces), [US-129](../../stories/US-129-attribute-difficulty-to-career-or-institution/README.md) (las señales de cada institución, oficiales y de reseñas, quedan una al lado de la otra para que quien lee arme su propia lectura), [US-171](../../../../guarantees/README.md) (nunca destacada, patrocinada ni ordenada por conveniencia), [US-195](../../../../team/sustain-the-catalog/README.md) (la carrera canónica que se compara la decide el catálogo, nunca el parecido del nombre) y [US-204](../../../../team/sustain-the-catalog/stories/US-204-survive-a-curriculum-reform/README.md) (la reforma de plan en la comparación). La letra de cada una está en su propia carpeta o en el README de su propia épica.

## Qué muestra

- **Encabezado**: la carrera canónica que se compara (la decide el catálogo, no el parecido del nombre: "Ingeniería en Sistemas" puede agrupar una oferta llamada distinto en otra institución) y cuántas instituciones la dictan en la ciudad.
- **Por institución, una tarjeta propia**: el nombre, la unidad académica si aplica, y si es pública o privada; los **datos oficiales** con la misma forma para todas (dura en la realidad, cuánto egresa por cohorte, el año del plan, el régimen para entrar: irrestricto, curso de ingreso, o examen con arancel); al pie, su propio sustento ("según 412 reseñas · 45 % de las materias") y sus propias **señales de reseñas** como chips, con el color de alarma solo en la que se destaca ("3 materias tapón", "trámites: 11 a 20 días", "plan de hace 18 años"). Las señales de una institución no se cruzan ni se promedian con las de otra: cada tarjeta es su propia caja.
- **Sin piso, silencio honesto**: la institución que no junta las 10 reseñas por cátedra que hacen falta no muestra chips inventados: dice cuántas reseñas tiene y que no alcanza para mostrar cómo se cursa ("7 reseñas. No alcanza el piso para mostrar cómo se cursa"), y muestra igual sus datos oficiales, que no dependen de reseñas.
- **Nunca un compuesto ni una tarjeta remarcada**: no hay columna de total ni ganador; el orden es alfabético o por voces. Quien quiere ordenar distinto baja el CSV en [Método](../../../take-the-data/screens/SC-021-method/README.md).

## Estados

- **Una institución con pocas voces**: sus datos oficiales se muestran igual (no dependen de reseñas); sus chips de reseñas no aparecen si no llega al piso, y en su lugar dice cuántas reseñas tiene.
- **Una institución sin datos oficiales todavía**: si el relevamiento no llegó a esa oferta, la tarjeta lo dice en vez de dejar un espacio en blanco.
- **Solo una institución cargada**: la carrera canónica existe en una sola institución todavía; la pantalla dice "no hay con qué comparar todavía" en vez de mostrar una comparación de una sola tarjeta.

## Lo que no muestra nunca

Ningún compuesto ni número único por institución ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); ningún ganador, oferta remarcada ni "recomendado"; ningún orden por valor, destacado o conveniencia ([US-171](../../../../guarantees/README.md)); ningún puntaje 1 a 5; ninguna señal de reseñas cruzada entre instituciones; ningún chip de reseñas para una institución que no llegó al piso; nunca pide cuenta para leer (US-168).

## Adónde va

Llega desde la Ficha de carrera, después de leer sus datos oficiales y qué frena la cursada. Va a: la Ficha de carrera de cada institución comparada, a [Método](../../../take-the-data/screens/SC-021-method/README.md) para bajar el CSV si querés ordenar distinto, y a Reseñar si quien lee quiere aportar a alguna de las ofertas.

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (datos oficiales medidos igual para todas, el régimen de ingreso al lado del egreso, las señales de reseñas por institución sin cruzarse, la carrera canónica la decide el catálogo: US-195), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (cobertura, sin compuesto ni puntaje), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (el piso de 10 reseñas por cátedra).

## Lo que esta ficha deja abierto

- **El layout en celular con más de tres ofertas**: cuántas tarjetas entran y qué pasa con el resto.
- **Ofertas de la misma institución en dos planes** (reforma, US-204): si se comparan como una tarjeta sola o como dos.
- **Cuál de los dos criterios de orden es el default**, alfabético o por voces.
- **Qué chips exactos entran por tarjeta** más allá de los que ya bocetó el ejemplo (tapones, trámites, antigüedad del plan) y de qué instrumento sale cada uno.
