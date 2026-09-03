# US-157: Reseñar un evento institucional

> **Concepto rebasado el 2026-08-25**: [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) separa "solo se reseña la cursada" del resto: los trámites, el título, las mesas pasan al **instrumento administrativo**, con disparador propio (el perfil o el evento puntual), anclado a cuentas con al menos una cursada reseñada. Ya no existe una rama de "evento institucional, sin materia" dentro del flujo de Reseñar, ni una reseña que vaya directo al sujeto institución.

**Épica**: [Reseñar](../../README.md)
**Del mapa**: O4-13

## Historia

Como quien está cursando, quería reseñar lo que pasó fuera de una cursada, porque el título que tardó ocho meses no es de ninguna materia.

## Listo cuando

- Esto no sobrevive como lo pedía la story: [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md) rechaza explícitamente reseñar la institución de forma directa (bombeable por marketing o por partidarios, sin ancla verificable). La necesidad real (contar un trámite, el título, una mesa) la cubre el instrumento administrativo, con su propio catálogo de frases (ver [`phrases.md`](../../../../phrases.md), sección "El instrumento administrativo"), fuera de esta épica.

## Dónde se resuelve

- No se resuelve dentro de esta épica. El instrumento administrativo que cubre esta necesidad todavía no tiene épica ni pantalla propia asignada ([ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md)).

## Notas

Story rebasada por [ADR-0085](../../../../../decisions/0085-three-instruments-and-official-data.md); se conserva por su ID y para que quede registro de la necesidad que la originó.
