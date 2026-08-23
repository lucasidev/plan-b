# US-128: Comparar la misma carrera en varias instituciones

> Los casos de [US-128](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ingeniería en Sistemas está cargada como carrera canónica en UNSTA (nominal 5 años, real 7,5 años de 40 egresados, brecha 2,5 años, 850 voces, cobertura 22 de 40 materias) y en UTN (nominal 5 años, real 6,5 años de 22 egresados, brecha 1,5 años, 1200 voces, cobertura 30 de 40 materias)
Cuando alguien entra a Dónde estudiarla
Entonces ve las dos ofertas lado a lado, cada una con su nominal, su real, su brecha, su cobertura y su cabecera derivada (las dos pasan el gate porque las dos superan la mitad de sus materias canónicas), sin ninguna columna que las combine en un solo número.

**E2.** Dado esas mismas dos ofertas
Cuando se arma la comparación
Entonces el orden es alfabético (UNSTA antes que UTN) o por voces (UTN con 1200 antes que UNSTA con 850), nunca por cuál tiene la brecha más chica.

**E3.** Dado que alguien quiere ordenar las dos ofertas por su propia brecha en vez de alfabético o por voces
Cuando busca esa opción dentro de Dónde estudiarla
Entonces no existe ahí: tiene que bajar el CSV desde Método para ordenar como quiera.

## Negativos

**N1.** Dado que UTN tiene menos brecha que UNSTA (1,5 contra 2,5 años)
Cuando se muestra la comparación
Entonces ninguna de las dos aparece marcada como "mejor", "recomendada" ni con un ícono de ganador: los números se leen solos.

## Edge cases

- Solo Ingeniería en Sistemas en UNSTA está cargada todavía, ninguna otra institución la ofrece en el catálogo: Dónde estudiarla dice que no hay con qué comparar todavía, en vez de mostrar una comparación de una sola columna.
- Ingeniería en Sistemas en Siglo 21 está cargada pero sin ninguna voz: aparece en la comparación con su duración nominal y "todavía sin voces", sin inventar un cero.
- Contador Público en una tercera institución tiene solo 15 de 40 materias con voces: esa oferta se compara igual, pero sin cabecera derivada, mostrando "todavía no derivamos" con su cobertura al lado.
