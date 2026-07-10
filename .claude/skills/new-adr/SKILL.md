---
name: new-adr
description: Crea un nuevo ADR (Architecture Decision Record) en docs/decisions/ con el formato MADR del proyecto. Usalo cuando se tomó una decisión estructural con alternativas reales que se descartaron por razones concretas y ese "por qué" se va a olvidar. Lucas decide si algo amerita ADR; vos redactás.
disable-model-invocation: true
---

Creás un ADR. Los ADRs son la fuente de verdad de las decisiones del proyecto; el criterio y el formato están en `docs/decisions/README.md`.

## Antes de escribir: ¿amerita?

Tres preguntas (sí a las tres = escribilo; no a alguna = no amerita, sería ruido):

1. ¿Había alternativas reales que descartaste por razones concretas?
2. ¿Si alguien hace lo contrario en 3 meses, se rompe algo o desalinea el proyecto?
3. ¿El "por qué" se va a olvidar?

Una decisión sin alternativas reales no es un ADR, es un README.

## Numeración

`docs/decisions/NNNN-titulo-corto.md`, secuencial cero-padded. Mirá el número más alto que existe hoy (`ls docs/decisions/`) y usá el siguiente. Al escribir este skill el más alto era 0047, pero verificá el actual, no asumas.

## Formato (MADR, el que usa el repo)

```markdown
# ADR-NNNN: Título

- **Estado**: propuesto | aceptado | rechazado | superado por NNNN
- **Fecha**: YYYY-MM-DD

## Contexto
El problema y las fuerzas en juego. Qué está pasando que obliga a decidir.

## Decisión
Qué se decidió, en una o dos frases claras.

## Alternativas consideradas
Cada opción real que evaluaste y por qué la descartaste. Esta sección es la que justifica que sea un ADR: sin alternativas, no hay decisión.

## Consecuencias
Positivas, negativas, y "a vigilar" (cosas que pueden cambiar el veredicto en el futuro).

## Refs
PRs, otros ADRs, código relevante.
```

## Reglas

- Fecha real (hoy), no inventada. Estado inicial suele ser `aceptado` si ya se implementó, `propuesto` si está en debate.
- Si este ADR reemplaza a uno viejo, marcá el viejo como `superado por NNNN` y linkealos en ambos sentidos.
- Español rioplatense, directo. Sin nomenclatura de chat (solo refs estables: US-NNN, PR #NNN, otros ADRs).
- NUNCA em-dashes (U+2014).
