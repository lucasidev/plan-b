# US-144: Filtrar la co-cursada contra mi plan

> Los casos de [US-144](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Lucía reseñó Análisis Matemático I con "la aprobé" (hecho) y marcó en su plan que le falta Álgebra II y que está considerando Base de Datos I (preferencia privada).
Cuando entra con su cuenta a Mi carrera y abre la pestaña de co-cursada.
Entonces la co-cursada se filtra a Álgebra II y Base de Datos I: no muestra ningún par con Análisis Matemático I, porque ya la aprobó.

**E2.** Dado que Base de Datos II pide como correlativa tener aprobada Base de Datos I, y Lucía todavía no reseñó Base de Datos I como aprobada.
Cuando Lucía entra a Mi carrera.
Entonces Base de Datos II no aparece entre lo que todavía puede cursar, porque su correlativa no está cumplida, aunque Base de Datos I sí aparece disponible.

## Negativos

**N1.** Dado que Ana no inició sesión.
Cuando intenta abrir Mi carrera.
Entonces no ve ninguna co-cursada filtrada a un plan propio: sin cuenta no se llega a Mi carrera, aunque sí puede leer la co-cursada pública, sin filtrar, desde la Ficha de carrera.

**N2.** Dado que Lucía marcó en su plan que le falta Álgebra II.
Cuando Rocío descarga el CSV agregado, o cualquiera mira la ficha pública de Ingeniería en Sistemas en UNSTA.
Entonces esa marca no aparece en ningún lado: no entra a ningún agregado, no cambia ninguna proporción y no figura en el CSV.

## Edge cases

- Lucía declaró Ingeniería en Sistemas en UNSTA al registrarse, pero el equipo todavía no terminó de cargar el plan de esa carrera: Mi carrera no tiene correlativas resueltas para armar el filtro.

**Falta decidir**: qué pasa con lo que Lucía marcó como que le falta o considera cuando la facultad reforma el plan, si sobrevive a la reforma o se pierde (abierto en la ficha de Mi carrera y en el README de la épica).
