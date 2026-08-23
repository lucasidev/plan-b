# US-185: Sin acuerdos con las instituciones

> Los casos de [US-185](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que UNSTA, UTN y UNT están las tres cargadas en el catálogo
Cuando alguien entra a Método
Entonces lee la postura escrita: que no hay acuerdos con ninguna institución y que ninguna tiene trato preferencial.

**E2.** Dado que UNSTA tiene 563 de 1.340 voces como sujeto, UNT tiene 80 de 205 y UTN tiene 148 de 290
Cuando se calcula la proporción de cada una
Entonces las tres usan el mismo z = 1,96, el mismo denominador (todas las voces de esa institución como sujeto) y el mismo gate de cobertura: ninguna tiene una regla de cálculo distinta.

## Negativos

**N1.** Dado que una institución pidiera un umbral de cobertura más bajo para mostrar antes su cabecera derivada de carrera
Cuando se evalúa ese pedido
Entonces se rechaza: el gate de "más de la mitad de las materias del plan" (ADR-0066) es el mismo para todas, sin excepción por convenio.

## Edge cases

- UNSTA es la institución de origen de este proyecto: sus datos se calculan con las mismas reglas que UTN o UNT, sin ningún trato distinto declarado ni de hecho.
- Una institución con pocas voces (UNT, 80 de 205) se publica igual que una con muchas (UNSTA, 563 de 1.340): ninguna se oculta ni se redondea para parecer mejor.
