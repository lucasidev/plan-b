# US-221: Entender qué es esto viendo una ficha real

> Los casos de [US-221](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNT) tiene 42 voces reales, de 2023 a 2026, y ya pasó el piso de publicación
Cuando Inicio arma el bloque de la muestra honesta
Entonces muestra esa ficha real, con el texto "Cátedra Pérez, Análisis Matemático II · UNT: de cada 10 que la cursan, llegan 4 · 42 voces", nunca un ejemplo inventado ni un número sin voces detrás.

**E2.** Dado un conjunto de fichas que ya pasaron el piso (por ejemplo Cátedra Pérez con 42 voces y su propia tasa de finalización, y otra cátedra con otra tasa distinta)
Cuando el bloque de la muestra elige qué ficha mostrar, muchas veces seguidas
Entonces la elegida varía entre las que pasaron el piso: no siempre devuelve la de mejor tasa, no siempre la peor, y no siempre la misma institución.

**E3.** Dado que alguien entra a Inicio desde un link que le compartieron, sin saber qué es plan-b
Cuando lee el bloque "qué es plan-b"
Entonces el texto explica el producto sin usar las palabras "instrumento de presión", "convergencia", "piso" ni "Wilson", y desde ese mismo bloque hay salida a Explorar y a Método.

## Negativos

**N1.** Dado que Cátedra Molina tiene 3 reseñas, por debajo del piso de 10
Cuando Inicio arma la muestra honesta
Entonces esa ficha nunca puede salir sorteada: el sorteo excluye a todo lo que no pasó el piso.

## Edge cases

- Si en un momento dado ninguna ficha pasó todavía el piso (producto recién arrancado), qué muestra Inicio no está resuelto en ninguna story ni en la ficha de la pantalla. **Falta decidir**.
- Si solo una ficha pasó el piso, el sorteo siempre devuelve esa única ficha, y eso no cuenta como "elegida por destacada": sigue siendo la única candidata válida.
- Cuánto dura cada ficha en el sorteo (por visita, por día) y si se excluye la que el visitante ya vio: la propia ficha de Inicio lo deja abierto.
