# US-224: Normalizar el cargo institucional

> Los casos de [US-224](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que en UNSTA el puesto se llama "Departamento de Alumnos", en USPT "Sección Alumnos" y en SIGLO 21 "Secretaría de Alumnos", y el catálogo ya tiene el cargo genérico "Área de alumnos" en su lista corta.
Cuando Sofía carga el cargo de cada institución.
Entonces las tres quedan atadas al mismo cargo genérico "Área de alumnos", y ninguna se publica con su nombre textual original.

**E2.** Dado que alguien responde desde el cargo "Área de alumnos" de UNSTA, cargado a partir del textual "Departamento de Alumnos".
Cuando esa respuesta se publica en la ficha pública.
Entonces se lee "Área de alumnos, UNSTA", nunca "Departamento de Alumnos".

**E3.** Dado que la lista corta de cargos genéricos hoy tiene "Área de alumnos" y "Secretaría académica", y ninguno cubre el puesto de una institución nueva que se está cargando, "Oficina de Becas".
Cuando Sofía no encuentra un cargo genérico que le sirva.
Entonces agrega "Área de becas" como cargo nuevo a la lista corta, ampliándola solo porque ningún cargo existente lo cubría.

## Negativos

**N1.** Dado que la lista corta de cargos genéricos ya tiene "Área de alumnos". Cuando Sofía carga una cuarta institución cuyo puesto se llama "Dirección de Alumnos", el mismo trabajo con otro nombre textual. Entonces Sofía NO crea un cargo genérico nuevo para "Dirección de Alumnos": lo ata al "Área de alumnos" ya existente, porque la lista se amplía solo cuando aparece un cargo que ninguno de los existentes cubre, no cada vez que cambia el nombre textual.

## Edge cases

- El primer día, antes de cargar ninguna institución, la lista corta de cargos genéricos está vacía: se arma al cargar las primeras instituciones, no antes.
- Un cargo textual ambiguo que podría atarse a dos genéricos distintos, por ejemplo "Secretaría General" entre trámites y títulos: a cuál se ata no está definido caso por caso (Falta decidir, la lista concreta se arma recorriendo instituciones reales).
- Un cargo genérico que deja de tener instituciones cargadas debajo: si se retira de la lista o queda igual no está definido (Falta decidir).
