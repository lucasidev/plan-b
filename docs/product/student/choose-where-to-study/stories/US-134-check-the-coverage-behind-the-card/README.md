# US-134: Saber para cuánta carrera vale un dato

**Épica**: [Elegir dónde estudiar](../../README.md)
**Del mapa**: O1-8

## Historia

Como quien está eligiendo, quiero saber si lo que dice la ficha de la carrera vale para toda la carrera o para tres materias, porque un problema en dos materias no es una carrera rota.

## Listo cuando

- Todo dato derivado muestra su cobertura ("22 de 40 materias con voces") y cada frase derivada dice en cuántas materias aparece.
- La cabecera de carrera e institución aparece solo cuando más de la mitad de las materias canónicas de la carrera tiene voces (sobre todos sus planes: D04).
- Debajo de eso la ficha muestra la cobertura, dice que todavía no derivamos y deja leer materia por materia; nunca un cero ni una cabecera armada con tres materias.

## Dónde se resuelve

- [Ficha de carrera](../../screens/SC-001-career/README.md): el gate de cobertura decide si aparece la cabecera derivada; debajo, la cobertura queda siempre a la vista.
- [Dónde estudiarla](../../screens/SC-008-where-to-study/README.md): cada oferta comparada muestra su propio gate y su propia cobertura antes de la cabecera.

## Notas

P1
