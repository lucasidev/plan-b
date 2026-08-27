# US-128: Comparar la misma carrera en varias instituciones

> Los casos de [US-128](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ingeniería en Sistemas está cargada como carrera canónica en UNT (dura en la realidad 8,4 años, egresa 14 % por cohorte, plan 2016, ingreso irrestricto, según 412 reseñas y 45 % de las materias), en UTN (7,1 años, 21 %, plan 2008, curso de ingreso, según 96 reseñas y 18 % de las materias) y en UNSTA (6,2 años, 34 %, plan 2021, examen con arancel, 7 reseñas)
Cuando alguien entra a Dónde estudiarla
Entonces ve las tres tarjetas lado a lado, cada una con sus propios datos oficiales y sus propias señales de reseñas, sin ninguna columna que las combine en un solo número.

**E2.** Dado esas mismas tres ofertas
Cuando se arma la comparación
Entonces el orden es alfabético (UNSTA, UNT, UTN) o por voces (UNT con 412 antes que UTN con 96 antes que UNSTA con 7), nunca por cuál tiene mejor duración o mejor egreso.

**E3.** Dado que alguien quiere ordenar las tres ofertas por su propio egreso en vez de alfabético o por voces
Cuando busca esa opción dentro de Dónde estudiarla
Entonces no existe ahí: tiene que bajar el CSV desde Método para ordenar como quiera.

## Negativos

**N1.** Dado que UNSTA egresa más que las otras dos (34 % contra 14 % y 21 %)
Cuando se muestra la comparación
Entonces ninguna de las tres aparece marcada como "mejor", "recomendada" ni con un ícono de ganador: los datos se leen solos.

## Edge cases

- Solo Ingeniería en Sistemas en UNT está cargada todavía, ninguna otra institución la ofrece en el catálogo: Dónde estudiarla dice que no hay con qué comparar todavía, en vez de mostrar una comparación de una sola tarjeta.
- Ingeniería en Sistemas en una cuarta institución está cargada pero sin ningún dato oficial relevado todavía: su tarjeta lo dice en vez de dejar un espacio en blanco.
- UNSTA, con solo 7 reseñas, no llega al piso: su tarjeta no muestra chips de señales de reseñas y dice "7 reseñas. No alcanza el piso para mostrar cómo se cursa"; sus datos oficiales (6,2 años, 34 %, plan 2021, examen con arancel) se muestran igual, porque no dependen de reseñas.
