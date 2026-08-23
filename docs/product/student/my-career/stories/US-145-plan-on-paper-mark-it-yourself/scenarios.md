# US-145: Armarlo en papel y marcarlo después

> Los casos de [US-145](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que a Lucía, en Mi carrera, le faltan Álgebra II y Base de Datos I, y la co-cursada de ese par muestra "15 personas la llevaron juntas" y "4 dejaron una" en 1C 2025.
Cuando Lucía revisa esos números para decidir qué anota en papel para el cuatrimestre que viene.
Entonces ve los números de co-cursada y de correlativas de las materias que le faltan, para decidir ella misma, en papel.

**E2.** Dado que Lucía ya decidió en papel que va a cursar Álgebra II este cuatrimestre.
Cuando vuelve a Mi carrera y marca Álgebra II en su plan.
Entonces la marca queda guardada como preferencia privada, lista para filtrar la próxima vez que consulte la co-cursada, sin publicarse ni entrar a ningún agregado.

## Negativos

**N1.** Dado que Lucía tiene marcadas Álgebra II, Base de Datos I y Física II como que le faltan.
Cuando abre Mi carrera para decidir el cuatrimestre que viene.
Entonces el producto no arma ni sugiere ninguna combinación de horario: solo muestra los números de a par, nunca una propuesta armada.

## Edge cases

- Lucía ya reseñó Análisis Matemático I como aprobada (hecho): no puede volver a marcarla a mano como que le falta o la está considerando, porque lo reseñado viene marcado solo y no se toca.
