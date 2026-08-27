# US-226: Revalidar la identidad verificada al año

**Épica**: [Moderar sin romper el producto](../../README.md)
**Del mapa**: ninguno (sale de [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md))

## Historia

Como quien verifica, quiero que toda identidad verificada vuelva a la cola al año de aprobada, porque un cargo no es permanente y una respuesta publicada puede quedar firmada con algo que ya dejó de ser cierto.

## Listo cuando

- Toda identidad verificada, docente o cargo institucional, vence al año de aprobada y vuelve a la cola de Verificaciones para revisarse de nuevo.
- Lo ya publicado con esa verificación no se retira cuando vence: era cierto cuando se publicó.

## Dónde se resuelve

- [Verificaciones](../../screens/SC-032-verifications/README.md): la verificación vencida (docente o cargo institucional) vuelve acá al año de aprobada, con autor y fecha como cualquier otra resolución de la cola.

## Notas

depende de US-210 y US-225 (son las dos identidades que revalida). Pregunta abierta de [ADR-0073](../../../../../decisions/0073-the-team-verifies-who-replies-against-its-own-catalog.md), sin decidir acá: qué pasa con la respuesta ya publicada si la persona no renueva (si el canal vuelve a declararse vacío, o si el cargo se publica con la fecha en que se verificó).
