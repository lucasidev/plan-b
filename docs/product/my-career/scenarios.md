# Escenarios de Mi carrera

> Traducción ejecutable del "listo cuando" de cada story, para escribir el test antes que el código. Los números salen de ADR-0075. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## US-143: Saber qué materias se pueden llevar juntas

### Camino feliz

**E1.** Dado que Lucía y otras 22 personas reseñaron Análisis Matemático I y Álgebra I en el mismo período (1C 2025), 23 personas en total, y 6 de esas 23 marcaron en alguna de las dos reseñas que la dejaron.
Cuando Lucía abre la pestaña de co-cursada de Mi carrera para el par Análisis Matemático I, Álgebra I, período 1C 2025.
Entonces ve "23 personas la llevaron juntas" y "6 dejaron una", con esos números exactos para ese período.

### Negativos

**N1.** Dado que Matías marcó en su plan que le falta Álgebra I, y ya reseñó Análisis Matemático I como aprobada, pero nunca reseñó haber cursado las dos materias juntas en ningún período.
Cuando se calcula la co-cursada del par Análisis Matemático I, Álgebra I.
Entonces la marca privada de Matías no suma a ese conteo, ni como que las llevó juntas ni como que dejó una: la co-cursada sale solo de reseñas, nunca del plan marcado.

### Edge cases

- Análisis Matemático I sale del plan cuando la carrera se reforma: la reseña de esa cursada sigue pegada al período y a la materia canónica, y el par Análisis Matemático I, Álgebra I sigue contando en la co-cursada aunque la materia ya no esté en el plan vigente.

## US-144: Filtrar la co-cursada contra mi plan

### Camino feliz

**E1.** Dado que Lucía reseñó Análisis Matemático I con "la aprobé" (hecho) y marcó en su plan que le falta Álgebra II y que está considerando Base de Datos I (preferencia privada).
Cuando entra con su cuenta a Mi carrera y abre la pestaña de co-cursada.
Entonces la co-cursada se filtra a Álgebra II y Base de Datos I: no muestra ningún par con Análisis Matemático I, porque ya la aprobó.

**E2.** Dado que Base de Datos II pide como correlativa tener aprobada Base de Datos I, y Lucía todavía no reseñó Base de Datos I como aprobada.
Cuando Lucía entra a Mi carrera.
Entonces Base de Datos II no aparece entre lo que todavía puede cursar, porque su correlativa no está cumplida, aunque Base de Datos I sí aparece disponible.

### Negativos

**N1.** Dado que Ana no inició sesión.
Cuando intenta abrir Mi carrera.
Entonces no ve ninguna co-cursada filtrada a un plan propio: sin cuenta no se llega a Mi carrera, aunque sí puede leer la co-cursada pública, sin filtrar, desde la Ficha de carrera.

**N2.** Dado que Lucía marcó en su plan que le falta Álgebra II.
Cuando Rocío descarga el CSV agregado, o cualquiera mira la ficha pública de Ingeniería en Sistemas en UNSTA.
Entonces esa marca no aparece en ningún lado: no entra a ningún agregado, no cambia ninguna proporción y no figura en el CSV.

### Edge cases

- Lucía declaró Ingeniería en Sistemas en UNSTA al registrarse, pero el equipo todavía no terminó de cargar el plan de esa carrera: Mi carrera no tiene correlativas resueltas para armar el filtro.

**Falta decidir**: qué pasa con lo que Lucía marcó como que le falta o considera cuando la facultad reforma el plan, si sobrevive a la reforma o se pierde (abierto en la ficha de Mi carrera y en el README de la épica).

## US-145: Armarlo en papel y marcarlo después

### Camino feliz

**E1.** Dado que a Lucía, en Mi carrera, le faltan Álgebra II y Base de Datos I, y la co-cursada de ese par muestra "15 personas la llevaron juntas" y "4 dejaron una" en 1C 2025.
Cuando Lucía revisa esos números para decidir qué anota en papel para el cuatrimestre que viene.
Entonces ve los números de co-cursada y de correlativas de las materias que le faltan, para decidir ella misma, en papel.

**E2.** Dado que Lucía ya decidió en papel que va a cursar Álgebra II este cuatrimestre.
Cuando vuelve a Mi carrera y marca Álgebra II en su plan.
Entonces la marca queda guardada como preferencia privada, lista para filtrar la próxima vez que consulte la co-cursada, sin publicarse ni entrar a ningún agregado.

### Negativos

**N1.** Dado que Lucía tiene marcadas Álgebra II, Base de Datos I y Física II como que le faltan.
Cuando abre Mi carrera para decidir el cuatrimestre que viene.
Entonces el producto no arma ni sugiere ninguna combinación de horario: solo muestra los números de a par, nunca una propuesta armada.

### Edge cases

- Lucía ya reseñó Análisis Matemático I como aprobada (hecho): no puede volver a marcarla a mano como que le falta o la está considerando, porque lo reseñado viene marcado solo y no se toca.
