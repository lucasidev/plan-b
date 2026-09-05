# US-171: Que no me vendan nada

> Los casos de [US-171](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Explorar lista carreras y universidades,
Cuando Valentina elige cómo ordenarlas,
Entonces solo puede elegir entre alfabético o por voces (nunca "recomendado" ni "destacado"), y ninguna institución aparece remarcada ni fija arriba de la lista por haber pagado algo.
No construido: Explorar no ofrece elegir el orden; universidades y carreras salen por nombre, y que no exista un destacado lo afirma N2

**E2.** Dado que "Ingeniería en Sistemas" está cargada en dos instituciones, con la Cátedra Pérez de UNSTA mostrando "Casi nunca · 59 %" en "¿Contestaba las preguntas en clase?" sobre 40 voces, y la cátedra equivalente de Siglo 21 mostrando "A veces · 44 %" sobre 62 voces (ADR-0083),
Cuando Valentina abre Dónde estudiarla para compararlas,
Entonces las dos ofertas aparecen ordenadas alfabético o por voces, nunca por cuál moda es más alta o más baja, y ninguna lleva una etiqueta de "mejor opción" ni aparece remarcada.
No construido: la pantalla Dónde estudiarla (SC-008) no está construida

## Negativos

**N1.** Dado que Inicio elige al azar una ficha real para mostrar como muestra, por ejemplo "Análisis Matemático II, Cátedra Pérez, UNSTA: 'Casi nunca · 59 %' en si contestaba las preguntas en clase, 40 voces", cuando se hace ese sorteo, entonces NO depende de cuál cátedra tiene el número más alto, más bajo o más voces: es al azar entre las que pasan el gate de cobertura, nunca por el valor del número.

**N2.** Dado que una institución (UNSTA, Siglo 21, UTN Facultad Regional Tucumán, UNT o USPT) le paga o le propone un acuerdo a plan-b, cuando se renderiza cualquier listado del producto, entonces esa institución NO aparece remarcada, con una marca de "destacado" ni ordenada por delante de las demás por esa razón: no existe ningún mecanismo de eso en el producto.

## Edge cases

- Cómo se audita este orden cuando haya que elegir uno "de verdad" (alfabético, por voces, por cobertura): cualquiera que no sea neutro puede leerse como conveniencia, y esta épica todavía no lo resuelve. **Falta decidir**.
- Empate en voces entre dos ofertas cuando el criterio elegido es "por voces": ninguna fuente fija el desempate. **Falta decidir**.
