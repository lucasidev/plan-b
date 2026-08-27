# US-133: Saber si termina en un título

> Los casos de [US-133](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Silvia entra a la Ficha de carrera de Ingeniería en Sistemas en UNT, con "egresan por cohorte: 14 %" como dato oficial
Cuando mira el bloque de datos oficiales sin hacer clic en nada
Entonces ya lee, en una línea simple, que de cada camada que entra egresa el 14 %, con su fuente al pie ("Ministerio de Educación (SPU) · serie 2015-2024"), sin tener que abrir ningún acordeón ni saber qué es una cohorte.

**E2.** Dado que Silvia compara Ingeniería en Sistemas en las tres instituciones en Dónde estudiarla (UNT 14 %, UTN 21 %, UNSTA 34 %)
Cuando lee las tres tarjetas
Entonces cada una muestra su propio "egresan por cohorte" con la misma fuente y la misma forma, sin que ninguna aparezca marcada como mejor.

**E3.** Dado que "egresan por cohorte" se muestra en la ficha
Cuando Silvia lo lee
Entonces el número no depende de nada que ella tenga que declarar ni entender: es un dato oficial, con su fuente dicha, no un cálculo sobre reseñas propias.

## Negativos

**N1.** Dado que una carrera todavía no tiene "egresan por cohorte" relevado
Cuando se arma su Ficha de carrera
Entonces el dato no se completa con un cálculo propio ni con un cero: dice que ese dato todavía no está relevado.

## Edge cases

- Cómo explicarle a Silvia qué es una "cohorte" si en algún momento se agrega el detalle metodológico detrás del número: la propia épica lo deja abierto.
- La misma carrera con dos fuentes oficiales que discrepan levemente entre sí (por ejemplo SPU y CONEAU): cuál prevalece, o si se muestran las dos, no está resuelto en esta story. **Falta decidir**.
