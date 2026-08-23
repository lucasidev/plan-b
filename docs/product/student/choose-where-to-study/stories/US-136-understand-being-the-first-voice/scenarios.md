# US-136: Entender la ficha vacía cuando llego primero

> Los casos de [US-136](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Ana busca su facultad y llega a la Ficha de Cátedra Ibáñez (Física II, UNSTA), que todavía no tiene ninguna voz
Cuando entra a esa ficha
Entonces la cabecera no muestra 0% ni "0 de 0": dice que la ficha arranca vacía y que la primera voz ya se publica, sin ningún escalón que desbloquear.

**E2.** Dado que Ingeniería en Sistemas en Siglo 21 está cargada en el catálogo pero ninguna cursada la sostiene todavía
Cuando alguien entra a su Ficha de carrera
Entonces dice que arranca vacía y que la primera voz ya se publica, igual que en la cátedra.

**E3.** Dado que Física II en UNSTA (la materia) todavía no tiene ninguna cursada reseñada en ninguna de sus cátedras
Cuando alguien entra a su Ficha de materia
Entonces dice lo mismo: arranca vacía, la primera voz ya se publica.

## Negativos

**N1.** Dado cualquiera de esas tres fichas vacías
Cuando se muestra
Entonces en ningún caso aparece un botón ni un texto de "desbloquear con más voces", ni una barra de progreso hacia un mínimo: no hay escalera ni piso.

## Edge cases

- Llega la primera voz a Cátedra Ibáñez (una sola persona marca una sola frase): la ficha deja de estar vacía y publica esa proporción con su encogimiento (por ejemplo, 1 de 1, 20,7%, ADR-0075), sin esperar una segunda voz.
- Que Cátedra Ibáñez esté vacía o no es un estado distinto del estado del canal de su titular: que Prof. Paredes nunca haya verificado su identidad ni respondido no hace que la ficha esté "vacía"; son dos cosas separadas (US-176).
