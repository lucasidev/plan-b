# US-133: Saber si termina en un título

> Los casos de [US-133](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Silvia entra a la Ficha de carrera de Ingeniería en Sistemas en UNSTA (nominal 5 años, real 7,5 años de 40 egresados, brecha 2,5 años)
Cuando mira la trayectoria sin hacer clic en nada
Entonces ya lee, escrito en palabras simples, que el plan dice 5 años y a la gente le toma 7,5, una diferencia de 2,5 años, sin tener que abrir ningún acordeón ni saber qué es una cohorte.

**E2.** Dado que la cohorte que entró a Ingeniería en Sistemas en UNSTA entre 2012 y 2016 ya cerró (entró hace más de 1,5 veces la duración nominal de 5 años) y tiene 40 personas que reseñaron acá: 12 se recibieron (18,1%), 18 se fueron (30,7%) y 10 no dijo o sigue (14,2%), todos con encogimiento de ADR-0075
Cuando Silvia mira esa parte de la ficha
Entonces lee las tres proporciones en una sola línea, sin abrir nada.

**Falta decidir**: los tres conteos crudos son una partición y suman 40 de 40, pero encogidos suman 63%, no 100%. ADR-0064 manda encoger cada proporción por separado, y eso es correcto para frases independientes (marcar F01 no excluye marcar F02); acá en cambio recibirse, irse y seguir son excluyentes. O la trayectoria no se encoge como una frase, o Método explica por qué una partición no cierra en 100%. No lo resuelve ninguna story.

**E3.** Dado esos mismos números
Cuando Silvia los lee
Entonces cada uno dice explícitamente que sale "de los que reseñaron acá", nunca "de todos los que cursaron la carrera".

## Negativos

**N1.** Dado que la cohorte que entró en 2023 a Ingeniería en Sistemas en UNSTA todavía no cumplió 1,5 veces la duración nominal
Cuando se arma la ficha
Entonces esa cohorte no publica ni egreso ni abandono todavía: para cerrar este año (2026) tendría que haber entrado en 2018 o antes (2026 menos 1,5 veces los 5 años de duración nominal).

## Edge cases

- Nadie de una cohorte cerrada declaró cómo terminó (ni se recibió ni dijo que se fue): las tres proporciones se publican igual, con "no dijo o sigue" cerca del 100% de esa cohorte, en vez de ocultarse.
- Una cohorte chica (por ejemplo, 8 personas que entraron en 2013): se agrupa con una cohorte contigua y se dice que se agrupó, en vez de publicar una proporción de una cohorte de 8 personas sola (ADR-0067).
- Cómo explicarle a Silvia qué es una "cohorte" sin vocabulario académico: la propia épica lo deja abierto. **Falta decidir**.
