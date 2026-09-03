# Ficha de materia (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: **el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25** ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)): la materia como derivada de sus cátedras, nunca reseñada directo: intentos y qué habilita, la dispersión entre cátedras ("¿es la materia o es una cátedra?") y sus cátedras ordenadas por voces, nunca por sus números; el cuerpo de esta ficha sigue esa misma dirección. Los bocetos anteriores quedaron en git. Revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); **hi-fi en la dirección Boletín** ([ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md), 2026-08-19). Pública, se lee sin cuenta. Slug hoy `/subjects/[id]`. Épicas que la componen: [Elegir dónde estudiar](../../README.md) (los conteos derivados, la dispersión entre cátedras, la ficha vacía), [Reseñar](../../../write-a-review/README.md) (llega desde acá y vuelve) y [Llevarse el dato](../../../take-the-data/README.md) (el CSV y Método salen de lo que esta ficha publica).

## Quién la usa

**Valentina** (compara materias sueltas antes de fijarse en la institución entera), **Lucía** (antes de anotarse: correlativas, cátedras, cuánto atrasa), **Matías** (vuelve a ver que su cursada quedó adentro de los conteos), **Rocío** (cita un dato de intentos o de habilitación en una reunión). Leer no pide cuenta; reseñar sí.

## Qué stories resuelve

[US-131](../../stories/US-131-see-how-many-voices-support-it/README.md) (cada estadística deriva de voces contables: "111 voces en 3 cátedras"), [US-134](../../stories/US-134-check-the-coverage-behind-the-card/README.md) y [US-138](../../stories/US-138-understand-why-weight-differs-by-level/README.md) (por qué esta materia suma solo 3 cátedras y no 4: la cuarta todavía no llega al piso), [US-136](../../stories/US-136-understand-being-the-first-voice/README.md) (vacía: arranca sin nada hasta que alguna cátedra junte las 10 reseñas del piso), [US-154](../../../write-a-review/README.md) (de "cómo terminó la cursada" sale cuánto llega aprobada o regular), [US-132](../../stories/US-132-search-by-subject-career-or-teacher/README.md) (llega acá desde Buscar), [US-189](../../../care-for-what-is-published/stories/US-189-correct-a-hard-fact-inline/README.md) (corregir un dato del catálogo que la ficha muestra), [US-152](../../../write-a-review/stories/US-152-declare-the-departure-year/README.md) (la tasa de finalización agregada que esta ficha publica) y [US-143](../../stories/US-143-check-which-subjects-to-take-together/README.md) (con qué otras materias se llevó esta, y cómo les fue a los que las llevaron juntas). La letra completa de cada una está en su propia carpeta o en el README de su propia épica.

## Qué muestra

Una materia nunca se reseña directo: se **deriva** sumando las cursadas de todas sus cátedras ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)). Una cátedra por debajo del piso de 10 reseñas no aporta a ninguno de estos números todavía.

1. **Identidad**: la materia, la carrera, la unidad académica, la institución y el año del plan; la línea de sustento, "111 voces en 3 cátedras · 2023 a 2026".
2. **Los números que resumen la materia**: cuántas veces se la cursa antes de aprobarla, cuántas materias habilita al aprobarse, cuánto llega a aprobada o regular ("6 de 10") y si se puede rendir libre. Los intentos se publican como **la moda con su cola dicha aparte** ("la mayoría una vez; pero 10 de cada 100 marcaron tres o más"), y nunca como el promedio "2,1" que decía el boceto. La razón no es que [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) prohíba todo promedio, porque no lo hace: acá los intentos son una cantidad real y la aritmética sería válida. Lo que rompe es que la última opción de la frase es **abierta**: quien la cursó cinco veces y quien la cursó tres marcan lo mismo, así que el promedio subestima siempre y por un margen que nadie puede recalcular. Y la distribución sola tampoco alcanzaba: obliga a leer tres números para darse cuenta de lo único que importa, que es a cuántos les costó. Lo de rendir libre todavía no tiene fuente (ver Falta decidir), así que la pantalla no lo muestra en vez de inventarlo. Cuando la materia es la que más traba su carrera, lo dice en una línea ("es la materia que más frena esta carrera: la traba de 2,1 intentos alcanza a las 9 materias que la esperan").
3. **"¿Es la materia o es una cátedra?"**: la dispersión entre las cátedras que la dictan, para lo que varía fuerte entre ellas ("las clases perdidas y el no-se-entiende son de una cátedra: Pérez, con 56 %, contra 14 % y 7 % de las otras dos"). Lo que no varía entre cátedras se dice aparte, como propio de la materia ("el peso del contenido: 73 % lo marca en las tres").
4. **Sus cátedras**: cada una con sus voces y hace cuánto es la última, ordenadas por cantidad de voces y nunca por sus números; la que todavía no llega al piso se lista igual, con su cuenta y cuánto le falta ("Paz (2026): 3 reseñas · con 7 más se publica"), sin sus conteos.
5. **Pie**: "¿Cómo calculamos esto?" (a Método), "Bajar los datos" (el CSV) y el llamado a reseñar.

## Estados

- **Vacía**: la materia está cargada pero ninguna de sus cátedras pasó el piso todavía; dice que arranca vacía ([US-136](../../stories/US-136-understand-being-the-first-voice/README.md)).
- **Una sola cátedra**: no hay "¿es la materia o es una cátedra?" que mostrar todavía, porque no hay con qué contrastar; la sección no aparece.
- **Alguna cátedra bajo el piso**: esa cátedra se lista con su cuenta y cuánto le falta, y no suma a ninguno de los cuatro números de arriba ni a la dispersión entre cátedras.

## Lo que no muestra nunca

Ningún puntaje ni escala 1 a 5 ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); ninguna cátedra remarcada como "mejor" entre las que se comparan; ningún dato de una cátedra que todavía no llega a las 10 reseñas; ningún desenlace individual, nunca infiere aprobación o abandono fuera de lo declarado como cómo terminó ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)).

## Adónde va

Llega desde: la Ficha de carrera (el plan), Buscar. Va a: la Ficha de cátedra de cada cátedra que la da, la Ficha de carrera, Reseñar (con cuenta) y Método (cómo se calcula).

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (la materia se deriva sumando cátedras; nunca se reseña directo), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (piso de 10 reseñas por cátedra antes de sumar; cómo terminó la cursada, contexto que alimenta la tasa de finalización).

## Lo que esta ficha deja abierto

- **De dónde sale "se puede rendir libre"**: si es un dato del catálogo académico, algo que se pregunta, o una frecuencia derivada de las reseñas.
- **Cuántas cátedras se listan** cuando son muchas, y si "sus cátedras" pagina.
- **Si muestra co-cursada propia** (los pares de materias donde participa esta materia) o eso queda solo en la Ficha de carrera.
- **Acciones inline que no están en el R1 mínimo**: corregir un dato duro (de Cuidar lo publicado) todavía no están bocetadas en esta ficha.
