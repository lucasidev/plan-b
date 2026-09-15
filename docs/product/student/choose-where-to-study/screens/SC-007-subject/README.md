# Ficha de materia (la pantalla)

> Ficha de pantalla, dueña: la épica [Elegir dónde estudiar](../../README.md). **Estado**: el boceto [sketch.html](sketch.html) fue rehecho el 2026-08-25 ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md), [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)); revisada el 2026-08-19 ([registro](../../../../../history/reviews/2026-08-19-shared-screens.md)); hi-fi en la dirección Boletín ([ADR-0071](../../../../../decisions/0071-the-visual-language-is-a-bulletin.md)); **reescrita el 2026-09-14 con el catálogo adentro de planb** ([#536](https://github.com/lucasidev/plan-b/issues/536)): adentro del shell, con una conclusión por cátedra dicha en una frase y las cátedras sin reseñas plegadas; **desde el 2026-09-15 sigue la maqueta aprobada**: el año del plan en el eyebrow, las migas con universidad, carrera y materia en el topbar, y el conteo crudo en cómo termina la cursada. Pública, se lee sin cuenta. Slug `/subjects/[id]`. Épicas que la componen: [Elegir dónde estudiar](../../README.md) (los conteos derivados, la dispersión entre cátedras, la ficha vacía), [Reseñar](../../../write-a-review/README.md) (llega desde acá y vuelve) y [Llevarse el dato](../../../take-the-data/README.md) (el CSV y Método salen de lo que esta ficha publica).

## Quién la usa

**Valentina** (compara materias sueltas antes de fijarse en la institución entera), **Lucía** (antes de anotarse: qué cátedra le conviene, cuánto atrasa), **Matías** (vuelve a ver que su cursada quedó adentro de los conteos), **Rocío** (cita un dato de una cátedra en una reunión). Leer no pide cuenta; reseñar sí.

## Qué stories resuelve

[US-131](../../stories/US-131-see-how-many-voices-support-it/README.md) (cada estadística deriva de reseñas contables: "28 reseñas en 3 cátedras"), [US-134](../../stories/US-134-check-the-coverage-behind-the-card/README.md) y [US-138](../../stories/US-138-understand-why-weight-differs-by-level/README.md) (por qué una cátedra tiene conclusión y otra con menos reseñas todavía no: el piso), [US-136](../../stories/US-136-understand-being-the-first-voice/README.md) (vacía: arranca sin nada hasta que alguna cátedra publique), [US-154](../../../write-a-review/README.md) (de "cómo terminó la cursada" sale cuánto llega aprobada o regular), [US-132](../../stories/US-132-search-by-subject-career-or-teacher/README.md) (llega acá desde Buscar), [US-189](../../../care-for-what-is-published/stories/US-189-correct-a-hard-fact-inline/README.md) (corregir un dato del catálogo que la ficha muestra), [US-152](../../../write-a-review/stories/US-152-declare-the-departure-year/README.md) (la tasa de finalización agregada que esta ficha publica) y [US-143](../../stories/US-143-check-which-subjects-to-take-together/README.md) (con qué otras materias se llevó esta, y cómo les fue a los que las llevaron juntas). La letra completa de cada una está en su propia carpeta o en el README de su propia épica.

## Qué muestra

Una materia nunca se reseña directo: se **deriva** sumando las cursadas de todas sus cátedras ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)). Una cátedra por debajo del piso no aporta a ninguno de estos números todavía, aunque la ficha la nombre.

1. **Cabecera**: el eyebrow con el año del plan y la carrera, con link ("Materia · 2º año del plan 2018 · Tecnicatura Universitaria en Desarrollo y Calidad de Software"), el nombre de la materia y la línea de sustento: "28 reseñas en 3 cátedras, de 2024 a 2026. Depende de cuál te toque: acá está cada una por separado." La universidad, la carrera y el código van en las migas del topbar: "Explorar / UNSTA / Tecnicatura Universitaria en Desarrollo y Calidad de Software / 211 · Fundamentos de Control de Calidad".
2. **La tira de números**: reseñas, cátedras (las que juntaron alguna), cuántos llegan al final ("7 de 10") y cuántas materias habilita al aprobarse. Los intentos y si se puede rendir libre no se publican: la reseña de hoy no captura cuántas veces se cursó (queda en Falta decidir).
3. **Sus cátedras**: cada cátedra con reseñas, con el nombre (link a su ficha) y debajo **una conclusión en una frase**: la moda más convergente de lo que hizo la cátedra, dicha en tercera persona con su porcentaje y su denominador ("La cátedra Pérez no dictó muchas de sus clases: lo dice el 56 % de sus 16 reseñas."); bajo el piso, "9 reseñas, todavía sin conclusiones."; y "a cargo de {docente} · última reseña {fecha}". Las cátedras sin ninguna reseña se pliegan en una línea ("3 cátedras más · sin reseñas todavía"). Ordenadas por reseñas, nunca por sus números.
4. **"¿Es la materia o es una cátedra?"**: la dispersión entre las cátedras que la dictan, para lo que varía fuerte entre ellas ("las clases perdidas son de una cátedra: Pérez, con 56 %, contra 14 % y 7 % de las otras dos"). Lo que no varía entre cátedras se dice aparte, como propio de la materia. La sección aparece solo cuando hay una frase que separa a las cátedras o una que todas marcan parejo.
5. **Cómo termina la cursada**: la tasa de finalización agregada de la materia ("De cada 10 que la cursan, llegan 7."), con su barra de dos tramos y el conteo crudo: "Aprobada o regular, 20 de 28 cursadas reseñadas."
6. **Co-cursada**: los pares de materias cursadas juntas y cómo les fue ([US-143](../../stories/US-143-check-which-subjects-to-take-together/README.md)).
7. **A la derecha** (en pantalla ancha; debajo, en celular): las materias del mismo año del plan, con link a su ficha y la actual resaltada.
8. **Sin pie**: Método queda en la barra lateral y Escribir reseña en el topbar.

## Estados

- **Vacía**: la materia está cargada y ninguna de sus cátedras juntó reseñas; dice que arranca vacía ([US-136](../../stories/US-136-understand-being-the-first-voice/README.md)) y las cátedras se pliegan en "N cátedras · sin reseñas todavía".
- **Una sola cátedra con reseñas**: no hay "¿es la materia o es una cátedra?" que mostrar, porque no hay con qué contrastar; la sección no aparece.
- **Alguna cátedra bajo el piso**: se lista con su conteo y "todavía sin conclusiones", y no suma a ninguno de los números derivados ni a la dispersión.

## Lo que no muestra nunca

Ningún puntaje ni escala 1 a 5 ([ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md)); ninguna cátedra remarcada como "mejor" entre las que se comparan; ninguna conclusión ni conteo de una cátedra que todavía no publica; ningún desenlace individual, nunca infiere aprobación o abandono fuera de lo declarado como cómo terminó ([ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md)); ninguna regla del producto en las filas (cuántas faltan para publicar se lee en la ficha de la cátedra).

## Adónde va

Llega desde: la Ficha de carrera (el plan), Mis aportes (tu carrera), Buscar. Va a: la Ficha de cátedra de cada cátedra que la da, la Ficha de carrera, las otras materias del año, Reseñar (con cuenta) y Método (cómo se calcula).

## Decisiones que aplica

[ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) (la materia se deriva sumando cátedras; nunca se reseña directo), [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) (la conclusión por cátedra es su moda literal con su porcentaje y su denominador, nunca un puntaje), [ADR-0082](../../../../../decisions/0082-the-review-captures-the-cursada-in-three-layers.md) (piso de 10 reseñas por cátedra antes de sumar; cómo terminó la cursada, contexto que alimenta la tasa de finalización).

## Lo que esta ficha deja abierto

- **Los intentos y rendir libre**: se publican cuando la reseña capture cuántas veces se cursó (la story nueva de Reseñar, [#533](https://github.com/lucasidev/plan-b/issues/533), R8) y haya fuente para lo de rendir libre.
- **Cuántas cátedras se listan** cuando son muchas, y si "sus cátedras" pagina.
- **El pie de la ficha** con "¿Cómo calculamos esto?", "Bajar los datos" y el llamado a reseñar: la maqueta aprobada no lo tiene en la materia y sí en la cátedra.
- **Acciones inline que no están en el R1 mínimo**: corregir un dato duro (de Cuidar lo publicado) todavía no está bocetado en esta ficha.
