# US-224: Normalizar el cargo institucional

**Épica**: [Sostener el catálogo](../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como quien carga el catálogo, quiero atar el cargo textual de una institución (Departamento de Alumnos, Sección Alumnos, Secretaría de Alumnos) a un cargo genérico de una lista corta, porque publicarlo tal cual hace que la lista crezca con cada institución y deje de servir para comparar.

## Listo cuando

- Cada cargo institucional cargado queda atado a un cargo genérico de la lista corta del catálogo, nunca publicado con el nombre textual de la institución.
- La lista de cargos genéricos se arma al cargar las primeras instituciones, no antes, y se amplía solo cuando aparece un cargo que ninguno de los existentes cubre.

## Dónde se resuelve

- [Catálogo](../screens/SC-027-catalog/README.md): el cargo textual de una institución se ata a un cargo genérico de la lista corta, existente o nuevo si ninguno lo cubre.

## Notas

**Queda abierto**: la lista concreta de cargos (cuáles son) no está definida: se arma al cargar las primeras instituciones, no de escritorio ([ADR-0073](../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md)).

**Alimenta**: la verificación del cargo institucional en [Replicar](../../reply/README.md), que hoy no tiene story propia pese a que dos stories la asumen.
