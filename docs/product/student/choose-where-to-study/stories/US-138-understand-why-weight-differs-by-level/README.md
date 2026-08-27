# US-138: Entender por qué un dato aparece en una ficha y no en otra

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: T3-6

## Historia

Como quien lee, quiero entender por qué un dato aparece en una ficha y no en otra, porque si algo no está no sé si es que no existe o que todavía no llegamos a mostrarlo.

## Listo cuando

- Cada ficha dice por qué un dato todavía no aparece: porque la cátedra que lo sostiene no llegó al piso de 10 reseñas, o porque la materia o la carrera todavía no la cubre su cobertura.
- Ningún dato se completa con el de otra ficha para disimular lo que falta: lo que no está medido se dice como no medido, nunca como cero ni como igual al nivel de arriba.

## Dónde se resuelve

- [Ficha de cátedra](../../screens/SC-002-chair/README.md): bajo el piso, explica que ya tiene reseñas pero todavía no publica.
- [Ficha de materia](../../screens/SC-007-subject/README.md): "sus cátedras" muestra aparte a la que todavía no pasó el piso, sin sumarla a los números de la materia.
- [Ficha de carrera](../../screens/SC-001-career/README.md): la cobertura explica cuánto está medido, y "qué frena la cursada" solo lista lo que ya pasó el piso.

## Notas

P2; depende de US-134; tema del mapa: T3 · Cuando el catálogo no alcanza. Hasta [ADR-0083](../../../../../decisions/0083-the-ficha-publishes-counts-not-scores.md) esta story explicaba por qué una misma frase pesaba distinto en la cátedra y en la carrera (denominadores distintos de una frase compartida entre niveles). Ese modelo se retiró: ahora cada nivel deriva sus propios conteos, y lo que hace falta explicar es por qué algo todavía no entró a esos conteos, no por qué pesa distinto.
