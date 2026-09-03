# US-182: Publicar qué no cubrimos todavía

> Los casos de [US-182](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que hay 86 carreras cargadas, 61 en cola y 214 pedidas sin confirmar todavía, y que la carrera Ingeniería en Sistemas de UNSTA tiene voces en 24 de sus 40 materias
Cuando Rocío entra a Método
Entonces ve los tres números (86, 61, 214) y, al entrar a la Ficha de carrera de Ingeniería en Sistemas (UNSTA), la cobertura "24 de 40 materias con voces".

**E2.** Dado que el método declara que los conteos de frases son de quienes reseñaron, que la co-cursada es solo de quien reseñó las dos materias, y que la duración real y el egreso por cohorte son dato oficial con su fuente al lado
Cuando Rocío lee el bloque "Los sesgos declarados" y el bloque de datos oficiales de Método
Entonces encuentra las aclaraciones: que ningún conteo de frases es "la tasa de la carrera", que la co-cursada no sale del plan que alguien marcó para sí, que es privado, y que la duración real y el egreso citan su fuente oficial en vez de salir de una encuesta propia.

**E3.** Dado que 142 cuentas de 9.400 quedaron afuera de todo agregado propio por inconsistencia (por ejemplo, una cuenta con "me recibí" antes que "entré")
Cuando Rocío entra a Método
Entonces ve "142 de 9.400" cuentas afuera por inconsistencia, y esas 142 cuentas no suman ni al numerador ni al denominador de ningún agregado publicado que salga de nuestras propias reseñas (por ejemplo, la tasa de finalización de Análisis Matemático II).

## Negativos

**N1.** Dado que Ana pidió la carrera Ingeniería en Sistemas de Información en UTN, Facultad Regional Tucumán, y todavía no está cargada
Cuando Rocío entra a Método
Entonces esa carrera no figura como cargada: cuenta dentro de las 214 pedidas o de las 61 en cola, nunca aparece con una ficha como si tuviera datos.

**N2.** Dado que Ingeniería en Sistemas de UNSTA todavía no llegó a más de la mitad de sus materias con voces (por ejemplo, 15 de 40)
Cuando alguien entra a esa Ficha de carrera
Entonces no ve la cabecera derivada con las dos proporciones: ve la cobertura (15 de 40) y el aviso de que todavía no se derivó, nunca un número inventado para completar el hueco.

## Edge cases

- Una carrera que ya está cargada pero con cero cursadas reseñadas todavía figura entre las 86 cargadas, con cobertura "0 de N materias": es una medición real (se revisó el plan entero y ninguna tiene voces), no un "sin datos".
- El plan de una carrera suma una materia nueva: la cobertura ("24 de 40") cambia de denominador, no solo de numerador.
- Una carrera con dos planes cargados en la misma institución (por ejemplo, un cambio de plan de estudios) usa un único denominador de cobertura: la unión de sus materias canónicas, no una cobertura por plan.
