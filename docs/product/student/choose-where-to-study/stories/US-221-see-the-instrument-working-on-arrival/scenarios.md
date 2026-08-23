# US-221: Entender qué es esto viendo una ficha real

> Los casos de [US-221](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Cátedra Pérez (Análisis Matemático II, Ingeniería en Sistemas, UNSTA) tiene 41 voces reales, de 2022 a 2025, y ya pasa el gate de cobertura de su carrera
Cuando Inicio arma el bloque de la muestra honesta
Entonces muestra esa ficha real, con el texto "Análisis Matemático II · Cátedra Pérez, UNSTA: 6 de cada 10 marcaron alguien fallando · 41 voces", nunca un ejemplo inventado ni un número sin voces detrás.

**E2.** Dado un conjunto de fichas que ya pasan el gate de cobertura (por ejemplo Cátedra Pérez con 41 voces y su "6 de cada 10", e Ingeniería en Sistemas en UTN con 1200 voces y otra proporción distinta)
Cuando el bloque de la muestra elige qué ficha mostrar, muchas veces seguidas
Entonces la elegida varía entre las que pasan el gate: no siempre devuelve la de proporción más alta, no siempre la más baja, y no siempre la misma institución.

**E3.** Dado que alguien entra a Inicio desde un link que le compartieron, sin saber qué es plan-b
Cuando lee el bloque "qué es plan-b"
Entonces el texto explica el producto sin usar las palabras "instrumento de presión", "eje", "encogimiento" ni "Wilson", y desde ese mismo bloque hay salida a Explorar, a Buscar y a Método.

## Negativos

**N1.** Dado que Ingeniería Industrial en UNSTA tiene 20 de 40 materias canónicas con voces (la mitad exacta, no más de la mitad) y todavía no pasa el gate de cobertura
Cuando Inicio arma la muestra honesta
Entonces esa ficha nunca puede salir sorteada: el sorteo excluye a todo lo que no pasa el gate.

## Edge cases

- Si en un momento dado ninguna ficha pasa todavía el gate de cobertura (producto recién arrancado), qué muestra Inicio no está resuelto en ninguna story ni en la ficha de la pantalla. **Falta decidir**.
- Si solo una ficha pasa el gate, el sorteo siempre devuelve esa única ficha, y eso no cuenta como "elegida por destacada": sigue siendo la única candidata válida.
- Cuánto dura cada ficha en el sorteo (por visita, por día) y si se excluye la que el visitante ya vio: la propia ficha de Inicio lo deja abierto.
