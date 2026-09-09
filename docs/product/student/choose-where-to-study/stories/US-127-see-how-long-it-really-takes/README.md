# US-127: Ver cuánto tarda de verdad la carrera

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-1

## Historia

Como quien está eligiendo, quiero ver cuánto tarda de verdad, para no creerle a la duración del plan.

## Listo cuando

- La ficha pone cuánto dura en el papel al lado de cuánto dura en la realidad, cada uno con su fuente y su período dichos ahí mismo.
- Cuando la duración real no está publicada, la ficha lo dice en el lugar donde iría el número, con la fecha en que se buscó y a quién se le pidió. Nunca queda en blanco ni desaparece la fila.
- Ninguno de los dos sale de lo que declaró quien reseñó.
- Se muestran aunque la carrera todavía no tenga ninguna cursada reseñada: no dependen de voces.

## Dónde se resuelve

- [Ficha de carrera](../../screens/SC-001-career/README.md): el bloque de datos oficiales muestra dura en el papel contra dura en la realidad, con su fuente.
- [Dónde estudiarla](../../screens/SC-008-where-to-study/README.md): dura en la realidad se repite por institución, lado a lado, para comparar.

## Notas

Ya no depende de US-155 ni de US-156 (preguntar el año de ingreso o si te recibiste): con [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) la duración real es relevamiento oficial, no un cálculo sobre lo que declaró quien reseñó.

Ninguna fuente pública publica la duración real por carrera: la SPU publica flujos por institución y por disciplina, y la cohorte solo existe en los sistemas de cada universidad ([O01](../../../../../history/reviews/2026-09-07-official-data-sources.md)). Por eso el estado normal de este dato hoy es "no publicado" o "pedido", con su fecha, y no un número.
