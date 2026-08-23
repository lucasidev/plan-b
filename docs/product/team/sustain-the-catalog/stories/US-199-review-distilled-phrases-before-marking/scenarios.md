# US-199: Revisar frases destiladas antes de ofrecerlas

> Los casos de [US-199](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que la destilación propuso la candidata "Tardan semanas en devolver la nota", a partir de tres comentarios de reseñas distintas: "tardaron un mes en devolvernos el primer parcial", "todavía espero la nota del final de julio" y "en la mesa de diciembre recién nos dijeron la nota de agosto".
Cuando quien cura las frases abre la cola de curaduría en Frases.
Entonces ve la candidata con sus tres comentarios de origen, sin la cuenta que escribió cada uno.

**E2.** Dado la misma candidata "Tardan semanas en devolver la nota", sin sujeto ni eje asignados todavía.
Cuando quien cura las frases la aprueba asignándole sujeto "cátedra" y eje "gestión", y confirma "Confirmar y marcar como destilada".
Entonces recién ahí queda disponible para marcarse al reseñar una cátedra, ofrecida como frase destilada.

**E3.** Dado que "Tardan semanas en devolver la nota" ya fue aprobada (sujeto cátedra, eje gestión) y, desde entonces, 3 de las 10 personas que reseñaron la cátedra "Análisis Matemático II, Cátedra Pérez" (UNSTA) la marcaron: 30% en crudo, publicado con su encogimiento en 10,8%.
Cuando alguien abre esa Ficha de cátedra.
Entonces "Tardan semanas en devolver la nota" aparece en la lista de gestión con "3 de 10 voces" (10,8%) y la marca "síntesis", nunca como una cita textual de una reseña puntual.

## Negativos

**N1.** Dado que la candidata "Tardan semanas en devolver la nota" todavía está en la cola de curaduría, sin aprobar ni descartar. Cuando Lucía reseña "Análisis Matemático II, Cátedra Pérez" (UNSTA) y ve las frases disponibles para marcar. Entonces "Tardan semanas en devolver la nota" NO aparece entre las frases que puede marcar: no se ofrece hasta que se apruebe.

**N2.** Dado que quien cura las frases descarta la candidata "Tardan semanas en devolver la nota" en vez de aprobarla. Cuando alguien busca esa candidata después, en Frases o en cualquier ficha pública. Entonces no aparece en ningún lado: no se ofrece nunca, y no queda rastro público de que existió.

## Edge cases

- Cola de curaduría vacía: no hay candidatas esperando desde la última revisión.
- La primera persona que marca una destilada recién aprobada la sostiene sola: 1 de 1 voces, encogida a 20,7%, se publica igual, sin piso.
- Dos frases con el mismo 30% en crudo publican proporciones distintas según cuántas voces las sostienen (3 de 10, encogida a 10,8%, contra 12 de 40, encogida a 18,1%): el encogimiento depende de cuántas voces hay, no solo del porcentaje crudo.
- Una candidata descartada por error no tiene camino de recuperación, porque descartar no deja rastro.
- Cuántos comentarios hacen falta para que la destilación proponga una candidata no está definido (Falta decidir, la épica lo deja abierto).
