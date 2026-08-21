# US-139: Saber si el vacío es de ustedes

**Épica**: [Pedir una carrera](../README.md)
**Del mapa**: O2-1

## Historia

Como quien no está cubierto, quiero saber si el vacío es de ustedes o de mi facultad, para no sospechar del producto.

## Listo cuando

- La ficha distingue tres estados y ninguno es un cero: "no la cargamos todavía", "cargada y todavía sin voces", y "cargada, con voces, todavía no derivamos la cabecera" con su cobertura a la vista.

## Dónde se resuelve

- [Ficha de carrera](../../choose-where-to-study/screens/SC-001-career/README.md): el estado "no cargada" remite a este vacío, sin existir todavía como ficha.
- [Ficha de cátedra](../../choose-where-to-study/screens/SC-002-chair/README.md): el estado "cargada, sin voces" declara que arranca vacía, nunca un cero.
- [Explorar](../../choose-where-to-study/screens/SC-003-explore/README.md): el vacío en sus tres estados, ninguno un cero.
- [Buscar](../../choose-where-to-study/screens/SC-006-search/README.md): "sin resultados" distingue no cargada todavía de error de tipeo.
- [Pedir](../screens/SC-010-request/README.md): el estado del vacío que trae hasta acá antes de pedir la carga.
